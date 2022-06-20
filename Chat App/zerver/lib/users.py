import re
import unicodedata
from collections import defaultdict
from typing import Any, Dict, List, Optional, Sequence, TypedDict, Union, cast

import dateutil.parser as date_parser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.query import QuerySet
from django.forms.models import model_to_dict
from django.utils.translation import gettext as _
from zulip_bots.custom_exceptions import ConfigValidationError

from zerver.lib.avatar import avatar_url, get_avatar_field
from zerver.lib.cache import (
    bulk_cached_fetch,
    realm_user_dict_fields,
    user_profile_by_id_cache_key,
    user_profile_cache_key_id,
)
from zerver.lib.exceptions import (
    JsonableError,
    OrganizationAdministratorRequired,
    OrganizationOwnerRequired,
)
from zerver.lib.timezone import canonicalize_timezone
from zerver.lib.types import ProfileDataElementValue
from zerver.models import (
    CustomProfileField,
    CustomProfileFieldValue,
    Realm,
    Service,
    UserProfile,
    get_realm_user_dicts,
    get_user,
    get_user_profile_by_id_in_realm,
)


def check_full_name(full_name_raw: str) -> str:
    full_name = full_name_raw.strip()
    if len(full_name) > UserProfile.MAX_NAME_LENGTH:
        raise JsonableError(_("Name too long!"))
    if len(full_name) < UserProfile.MIN_NAME_LENGTH:
        raise JsonableError(_("Name too short!"))
    for character in full_name:
        if unicodedata.category(character)[0] == "C" or character in UserProfile.NAME_INVALID_CHARS:
            raise JsonableError(_("Invalid characters in name!"))
    # Names ending with e.g. `|15` could be ambiguous for
    # sloppily-written parsers of our Markdown syntax for mentioning
    # users with ambiguous names, and likely have no real use, so we
    # ban them.
    if re.search(r"\|\d+$", full_name_raw):
        raise JsonableError(_("Invalid format!"))
    return full_name


# NOTE: We don't try to absolutely prevent 2 bots from having the same
# name (e.g. you can get there by reactivating a deactivated bot after
# making a new bot with the same name).  This is just a check designed
# to make it unlikely to happen by accident.
def check_bot_name_available(realm_id: int, full_name: str) -> None:
    dup_exists = UserProfile.objects.filter(
        realm_id=realm_id,
        full_name=full_name.strip(),
        is_active=True,
    ).exists()

    if dup_exists:
        raise JsonableError(_("Name is already in use!"))


def check_short_name(short_name_raw: str) -> str:
    short_name = short_name_raw.strip()
    if len(short_name) == 0:
        raise JsonableError(_("Bad name or username"))
    return short_name


def check_valid_bot_config(bot_type: int, service_name: str, config_data: Dict[str, str]) -> None:
    if bot_type == UserProfile.INCOMING_WEBHOOK_BOT:
        from zerver.lib.integrations import WEBHOOK_INTEGRATIONS

        config_options = None
        for integration in WEBHOOK_INTEGRATIONS:
            if integration.name == service_name:
                # key: validator
                config_options = {c[1]: c[2] for c in integration.config_options}
                break
        if not config_options:
            raise JsonableError(_("Invalid integration '{}'.").format(service_name))

        missing_keys = set(config_options.keys()) - set(config_data.keys())
        if missing_keys:
            raise JsonableError(
                _("Missing configuration parameters: {}").format(
                    missing_keys,
                )
            )

        for key, validator in config_options.items():
            value = config_data[key]
            error = validator(key, value)
            if error:
                raise JsonableError(_("Invalid {} value {} ({})").format(key, value, error))

    elif bot_type == UserProfile.EMBEDDED_BOT:
        try:
            from zerver.lib.bot_lib import get_bot_handler

            bot_handler = get_bot_handler(service_name)
            if hasattr(bot_handler, "validate_config"):
                bot_handler.validate_config(config_data)
        except ConfigValidationError:
            # The exception provides a specific error message, but that
            # message is not tagged translatable, because it is
            # triggered in the external zulip_bots package.
            # TODO: Think of some clever way to provide a more specific
            # error message.
            raise JsonableError(_("Invalid configuration data!"))


# Adds an outgoing webhook or embedded bot service.
def add_service(
    name: str,
    user_profile: UserProfile,
    base_url: Optional[str] = None,
    interface: Optional[int] = None,
    token: Optional[str] = None,
) -> None:
    Service.objects.create(
        name=name, user_profile=user_profile, base_url=base_url, interface=interface, token=token
    )


def check_bot_creation_policy(user_profile: UserProfile, bot_type: int) -> None:
    # Realm administrators can always add bot
    if user_profile.is_realm_admin:
        return

    if user_profile.realm.bot_creation_policy == Realm.BOT_CREATION_EVERYONE:
        return
    if user_profile.realm.bot_creation_policy == Realm.BOT_CREATION_ADMINS_ONLY:
        raise OrganizationAdministratorRequired()
    if (
        user_profile.realm.bot_creation_policy == Realm.BOT_CREATION_LIMIT_GENERIC_BOTS
        and bot_type == UserProfile.DEFAULT_BOT
    ):
        raise OrganizationAdministratorRequired()


def check_valid_bot_type(user_profile: UserProfile, bot_type: int) -> None:
    if bot_type not in user_profile.allowed_bot_types:
        raise JsonableError(_("Invalid bot type"))


def check_valid_interface_type(interface_type: Optional[int]) -> None:
    if interface_type not in Service.ALLOWED_INTERFACE_TYPES:
        raise JsonableError(_("Invalid interface type"))


def is_administrator_role(role: int) -> bool:
    return role in {UserProfile.ROLE_REALM_ADMINISTRATOR, UserProfile.ROLE_REALM_OWNER}


def bulk_get_users(
    emails: List[str], realm: Optional[Realm], base_query: "QuerySet[UserProfile]" = None
) -> Dict[str, UserProfile]:
    if base_query is None:
        assert realm is not None
        query = UserProfile.objects.filter(realm=realm, is_active=True)
        realm_id = realm.id
    else:
        # WARNING: Currently, this code path only really supports one
        # version of `base_query` being used (because otherwise,
        # they'll share the cache, which can screw up the filtering).
        # If you're using this flow, you'll need to re-do any filters
        # in base_query in the code itself; base_query is just a perf
        # optimization.
        query = base_query
        realm_id = 0

    def fetch_users_by_email(emails: List[str]) -> List[UserProfile]:
        # This should be just
        #
        # UserProfile.objects.select_related("realm").filter(email__iexact__in=emails,
        #                                                    realm=realm)
        #
        # But chaining __in and __iexact doesn't work with Django's
        # ORM, so we have the following hack to construct the relevant where clause
        where_clause = "upper(zerver_userprofile.email::text) IN (SELECT upper(email) FROM unnest(%s) AS email)"
        return query.select_related("realm").extra(where=[where_clause], params=(emails,))

    def user_to_email(user_profile: UserProfile) -> str:
        return user_profile.email.lower()

    return bulk_cached_fetch(
        # Use a separate cache key to protect us from conflicts with
        # the get_user cache.
        lambda email: "bulk_get_users:" + user_profile_cache_key_id(email, realm_id),
        fetch_users_by_email,
        [email.lower() for email in emails],
        id_fetcher=user_to_email,
    )


def get_user_id(user: UserProfile) -> int:
    return user.id


def user_ids_to_users(user_ids: Sequence[int], realm: Realm) -> List[UserProfile]:
    # TODO: Consider adding a flag to control whether deactivated
    # users should be included.

    def fetch_users_by_id(user_ids: List[int]) -> List[UserProfile]:
        return list(UserProfile.objects.filter(id__in=user_ids).select_related())

    user_profiles_by_id: Dict[int, UserProfile] = bulk_cached_fetch(
        cache_key_function=user_profile_by_id_cache_key,
        query_function=fetch_users_by_id,
        object_ids=user_ids,
        id_fetcher=get_user_id,
    )

    found_user_ids = user_profiles_by_id.keys()
    missed_user_ids = [user_id for user_id in user_ids if user_id not in found_user_ids]
    if missed_user_ids:
        raise JsonableError(_("Invalid user ID: {}").format(missed_user_ids[0]))

    user_profiles = list(user_profiles_by_id.values())
    for user_profile in user_profiles:
        if user_profile.realm != realm:
            raise JsonableError(_("Invalid user ID: {}").format(user_profile.id))
    return user_profiles


def access_bot_by_id(user_profile: UserProfile, user_id: int) -> UserProfile:
    try:
        target = get_user_profile_by_id_in_realm(user_id, user_profile.realm)
    except UserProfile.DoesNotExist:
        raise JsonableError(_("No such bot"))
    if not target.is_bot:
        raise JsonableError(_("No such bot"))
    if not user_profile.can_admin_user(target):
        raise JsonableError(_("Insufficient permission"))

    if target.can_create_users and not user_profile.is_realm_owner:
        # Organizations owners are required to administer a bot with
        # the can_create_users permission. User creation via the API
        # is a permission not available even to organization owners by
        # default, because it can be abused to send spam. Requiring an
        # owner is intended to ensure organizational responsibility
        # for use of this permission.
        raise OrganizationOwnerRequired()

    return target


def access_user_common(
    target: UserProfile,
    user_profile: UserProfile,
    allow_deactivated: bool,
    allow_bots: bool,
    for_admin: bool,
) -> UserProfile:
    if target.is_bot and not allow_bots:
        raise JsonableError(_("No such user"))
    if not target.is_active and not allow_deactivated:
        raise JsonableError(_("User is deactivated"))
    if not for_admin:
        # Administrative access is not required just to read a user.
        return target
    if not user_profile.can_admin_user(target):
        raise JsonableError(_("Insufficient permission"))
    return target


def access_user_by_id(
    user_profile: UserProfile,
    target_user_id: int,
    *,
    allow_deactivated: bool = False,
    allow_bots: bool = False,
    for_admin: bool,
) -> UserProfile:
    """Master function for accessing another user by ID in API code;
    verifies the user ID is in the same realm, and if requested checks
    for administrative privileges, with flags for various special
    cases.
    """
    try:
        target = get_user_profile_by_id_in_realm(target_user_id, user_profile.realm)
    except UserProfile.DoesNotExist:
        raise JsonableError(_("No such user"))

    return access_user_common(target, user_profile, allow_deactivated, allow_bots, for_admin)


def access_user_by_email(
    user_profile: UserProfile,
    email: str,
    *,
    allow_deactivated: bool = False,
    allow_bots: bool = False,
    for_admin: bool,
) -> UserProfile:

    try:
        target = get_user(email, user_profile.realm)
    except UserProfile.DoesNotExist:
        raise JsonableError(_("No such user"))

    return access_user_common(target, user_profile, allow_deactivated, allow_bots, for_admin)


class Accounts(TypedDict):
    realm_name: str
    realm_id: int
    full_name: str
    avatar: Optional[str]


def get_accounts_for_email(email: str) -> List[Accounts]:
    profiles = (
        UserProfile.objects.select_related("realm")
        .filter(
            delivery_email__iexact=email.strip(),
            is_active=True,
            realm__deactivated=False,
            is_bot=False,
        )
        .order_by("date_joined")
    )
    accounts: List[Accounts] = []
    for profile in profiles:
        accounts.append(
            dict(
                realm_name=profile.realm.name,
                realm_id=profile.realm.id,
                full_name=profile.full_name,
                avatar=avatar_url(profile),
            )
        )
    return accounts


def get_api_key(user_profile: UserProfile) -> str:
    return user_profile.api_key


def get_all_api_keys(user_profile: UserProfile) -> List[str]:
    # Users can only have one API key for now
    return [user_profile.api_key]


def validate_user_custom_profile_field(
    realm_id: int, field: CustomProfileField, value: ProfileDataElementValue
) -> ProfileDataElementValue:
    validators = CustomProfileField.FIELD_VALIDATORS
    field_type = field.field_type
    var_name = f"{field.name}"
    if field_type in validators:
        validator = validators[field_type]
        return validator(var_name, value)
    elif field_type == CustomProfileField.SELECT:
        choice_field_validator = CustomProfileField.SELECT_FIELD_VALIDATORS[field_type]
        field_data = field.field_data
        # Put an assertion so that mypy doesn't complain.
        assert field_data is not None
        return choice_field_validator(var_name, field_data, value)
    elif field_type == CustomProfileField.USER:
        user_field_validator = CustomProfileField.USER_FIELD_VALIDATORS[field_type]
        return user_field_validator(realm_id, value, False)
    else:
        raise AssertionError("Invalid field type")


def validate_user_custom_profile_data(
    realm_id: int, profile_data: List[Dict[str, Union[int, ProfileDataElementValue]]]
) -> None:
    # This function validate all custom field values according to their field type.
    for item in profile_data:
        field_id = item["id"]
        try:
            field = CustomProfileField.objects.get(id=field_id)
        except CustomProfileField.DoesNotExist:
            raise JsonableError(_("Field id {id} not found.").format(id=field_id))

        try:
            validate_user_custom_profile_field(
                realm_id, field, cast(ProfileDataElementValue, item["value"])
            )
        except ValidationError as error:
            raise JsonableError(error.message)


def can_access_delivery_email(
    user_profile: UserProfile, target_user_id: int, email_address_visibility: int
) -> bool:
    if target_user_id == user_profile.id:
        return True

    if email_address_visibility == Realm.EMAIL_ADDRESS_VISIBILITY_ADMINS:
        return user_profile.is_realm_admin

    if email_address_visibility == Realm.EMAIL_ADDRESS_VISIBILITY_MODERATORS:
        return user_profile.is_realm_admin or user_profile.is_moderator

    return False


def format_user_row(
    realm: Realm,
    acting_user: Optional[UserProfile],
    row: Dict[str, Any],
    client_gravatar: bool,
    user_avatar_url_field_optional: bool,
    custom_profile_field_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Formats a user row returned by a database fetch using
    .values(*realm_user_dict_fields) into a dictionary representation
    of that user for API delivery to clients.  The acting_user
    argument is used for permissions checks.
    """

    is_admin = is_administrator_role(row["role"])
    is_owner = row["role"] == UserProfile.ROLE_REALM_OWNER
    is_guest = row["role"] == UserProfile.ROLE_GUEST
    is_bot = row["is_bot"]
    result = dict(
        email=row["email"],
        user_id=row["id"],
        avatar_version=row["avatar_version"],
        is_admin=is_admin,
        is_owner=is_owner,
        is_guest=is_guest,
        is_billing_admin=row["is_billing_admin"],
        role=row["role"],
        is_bot=is_bot,
        full_name=row["full_name"],
        timezone=canonicalize_timezone(row["timezone"]),
        is_active=row["is_active"],
        date_joined=row["date_joined"].isoformat(),
    )

    if acting_user is None:
        # Remove data about other users which are not useful to spectators
        # or can reveal personal information about a user.
        # Only send day level precision date_joined data to spectators.
        del result["is_billing_admin"]
        del result["timezone"]
        result["date_joined"] = str(date_parser.parse(result["date_joined"]).date())

    # Zulip clients that support using `GET /avatar/{user_id}` as a
    # fallback if we didn't send an avatar URL in the user object pass
    # user_avatar_url_field_optional in client_capabilities.
    #
    # This is a major network performance optimization for
    # organizations with 10,000s of users where we would otherwise
    # send avatar URLs in the payload (either because most users have
    # uploaded avatars or because EMAIL_ADDRESS_VISIBILITY_ADMINS
    # prevents the older client_gravatar optimization from helping).
    # The performance impact is large largely because the hashes in
    # avatar URLs structurally cannot compress well.
    #
    # The user_avatar_url_field_optional gives the server sole
    # discretion in deciding for which users we want to send the
    # avatar URL (Which saves clients an RTT at the cost of some
    # bandwidth).  At present, the server looks at `long_term_idle` to
    # decide which users to include avatars for, piggy-backing on a
    # different optimization for organizations with 10,000s of users.
    include_avatar_url = not user_avatar_url_field_optional or not row["long_term_idle"]
    if include_avatar_url:
        result["avatar_url"] = get_avatar_field(
            user_id=row["id"],
            realm_id=realm.id,
            email=row["delivery_email"],
            avatar_source=row["avatar_source"],
            avatar_version=row["avatar_version"],
            medium=False,
            client_gravatar=client_gravatar,
        )

    if acting_user is not None and can_access_delivery_email(
        acting_user, row["id"], realm.email_address_visibility
    ):
        result["delivery_email"] = row["delivery_email"]

    if is_bot:
        result["bot_type"] = row["bot_type"]
        if row["email"] in settings.CROSS_REALM_BOT_EMAILS:
            result["is_system_bot"] = True

        # Note that bot_owner_id can be None with legacy data.
        result["bot_owner_id"] = row["bot_owner_id"]
    elif custom_profile_field_data is not None:
        result["profile_data"] = custom_profile_field_data
    return result


def user_profile_to_user_row(user_profile: UserProfile) -> Dict[str, Any]:
    # What we're trying to do is simulate the user_profile having been
    # fetched from a QuerySet using `.values(*realm_user_dict_fields)`
    # even though we fetched UserProfile objects.  This is messier
    # than it seems.
    #
    # What we'd like to do is just call model_to_dict(user,
    # fields=realm_user_dict_fields).  The problem with this is
    # that model_to_dict has a different convention than
    # `.values()` in its handling of foreign keys, naming them as
    # e.g. `bot_owner`, not `bot_owner_id`; we work around that
    # here.
    #
    # This could be potentially simplified in the future by
    # changing realm_user_dict_fields to name the bot owner with
    # the less readable `bot_owner` (instead of `bot_owner_id`).
    user_row = model_to_dict(user_profile, fields=[*realm_user_dict_fields, "bot_owner"])
    user_row["bot_owner_id"] = user_row["bot_owner"]
    del user_row["bot_owner"]
    return user_row


def get_cross_realm_dicts() -> List[Dict[str, Any]]:
    users = bulk_get_users(
        list(settings.CROSS_REALM_BOT_EMAILS),
        None,
        base_query=UserProfile.objects.filter(realm__string_id=settings.SYSTEM_BOT_REALM),
    ).values()
    result = []
    for user in users:
        # Important: We filter here, is addition to in
        # `base_query`, because of how bulk_get_users shares its
        # cache with other UserProfile caches.
        if user.realm.string_id != settings.SYSTEM_BOT_REALM:  # nocoverage
            continue
        user_row = user_profile_to_user_row(user)
        # Because we want to avoid clients being exposed to the
        # implementation detail that these bots are self-owned, we
        # just set bot_owner_id=None.
        user_row["bot_owner_id"] = None

        result.append(
            format_user_row(
                user.realm,
                acting_user=user,
                row=user_row,
                client_gravatar=False,
                user_avatar_url_field_optional=False,
                custom_profile_field_data=None,
            )
        )

    return result


def get_custom_profile_field_values(
    custom_profile_field_values: List[CustomProfileFieldValue],
) -> Dict[int, Dict[str, Any]]:
    profiles_by_user_id: Dict[int, Dict[str, Any]] = defaultdict(dict)
    for profile_field in custom_profile_field_values:
        user_id = profile_field.user_profile_id
        if profile_field.field.is_renderable():
            profiles_by_user_id[user_id][str(profile_field.field_id)] = {
                "value": profile_field.value,
                "rendered_value": profile_field.rendered_value,
            }
        else:
            profiles_by_user_id[user_id][str(profile_field.field_id)] = {
                "value": profile_field.value,
            }
    return profiles_by_user_id


def get_raw_user_data(
    realm: Realm,
    acting_user: Optional[UserProfile],
    *,
    target_user: Optional[UserProfile] = None,
    client_gravatar: bool,
    user_avatar_url_field_optional: bool,
    include_custom_profile_fields: bool = True,
) -> Dict[int, Dict[str, str]]:
    """Fetches data about the target user(s) appropriate for sending to
    acting_user via the standard format for the Zulip API.  If
    target_user is None, we fetch all users in the realm.
    """
    profiles_by_user_id = None
    custom_profile_field_data = None
    # target_user is an optional parameter which is passed when user data of a specific user
    # is required. It is 'None' otherwise.
    if target_user is not None:
        user_dicts = [user_profile_to_user_row(target_user)]
    else:
        user_dicts = get_realm_user_dicts(realm.id)

    if include_custom_profile_fields:
        base_query = CustomProfileFieldValue.objects.select_related("field")
        # TODO: Consider optimizing this query away with caching.
        if target_user is not None:
            custom_profile_field_values = base_query.filter(user_profile=target_user)
        else:
            custom_profile_field_values = base_query.filter(field__realm_id=realm.id)
        profiles_by_user_id = get_custom_profile_field_values(custom_profile_field_values)

    result = {}
    for row in user_dicts:
        if profiles_by_user_id is not None:
            custom_profile_field_data = profiles_by_user_id.get(row["id"], {})

        result[row["id"]] = format_user_row(
            realm,
            acting_user=acting_user,
            row=row,
            client_gravatar=client_gravatar,
            user_avatar_url_field_optional=user_avatar_url_field_optional,
            custom_profile_field_data=custom_profile_field_data,
        )
    return result


def get_active_bots_owned_by_user(user_profile: UserProfile) -> QuerySet:
    return UserProfile.objects.filter(is_bot=True, is_active=True, bot_owner=user_profile)
