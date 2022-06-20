from typing import Any, Dict, List, Optional, Union

from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.views.decorators.http import require_safe

from confirmation.models import Confirmation, ConfirmationKeyException, get_object_from_key
from zerver.actions.create_realm import do_change_realm_subdomain
from zerver.actions.realm_settings import (
    do_change_realm_org_type,
    do_deactivate_realm,
    do_reactivate_realm,
    do_set_realm_authentication_methods,
    do_set_realm_message_editing,
    do_set_realm_notifications_stream,
    do_set_realm_property,
    do_set_realm_signup_notifications_stream,
    do_set_realm_user_default_setting,
)
from zerver.decorator import require_realm_admin, require_realm_owner
from zerver.forms import check_subdomain_available as check_subdomain
from zerver.lib.exceptions import JsonableError, OrganizationOwnerRequired
from zerver.lib.i18n import get_available_language_codes
from zerver.lib.message import parse_message_content_delete_limit
from zerver.lib.request import REQ, has_request_variables
from zerver.lib.response import json_success
from zerver.lib.retention import parse_message_retention_days
from zerver.lib.streams import access_stream_by_id
from zerver.lib.validator import (
    check_bool,
    check_capped_string,
    check_dict,
    check_int,
    check_int_in,
    check_string_in,
    check_string_or_int,
    to_non_negative_int,
)
from zerver.models import Realm, RealmUserDefault, UserProfile
from zerver.views.user_settings import check_settings_values

ORG_TYPE_IDS: List[int] = [t["id"] for t in Realm.ORG_TYPES.values()]


@require_realm_admin
@has_request_variables
def update_realm(
    request: HttpRequest,
    user_profile: UserProfile,
    name: Optional[str] = REQ(
        str_validator=check_capped_string(Realm.MAX_REALM_NAME_LENGTH), default=None
    ),
    description: Optional[str] = REQ(
        str_validator=check_capped_string(Realm.MAX_REALM_DESCRIPTION_LENGTH), default=None
    ),
    emails_restricted_to_domains: Optional[bool] = REQ(json_validator=check_bool, default=None),
    disallow_disposable_email_addresses: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    invite_required: Optional[bool] = REQ(json_validator=check_bool, default=None),
    invite_to_realm_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.INVITE_TO_REALM_POLICY_TYPES), default=None
    ),
    name_changes_disabled: Optional[bool] = REQ(json_validator=check_bool, default=None),
    email_changes_disabled: Optional[bool] = REQ(json_validator=check_bool, default=None),
    avatar_changes_disabled: Optional[bool] = REQ(json_validator=check_bool, default=None),
    inline_image_preview: Optional[bool] = REQ(json_validator=check_bool, default=None),
    inline_url_embed_preview: Optional[bool] = REQ(json_validator=check_bool, default=None),
    add_custom_emoji_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    delete_own_message_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_MESSAGE_POLICY_TYPES), default=None
    ),
    message_content_delete_limit_seconds_raw: Optional[Union[int, str]] = REQ(
        "message_content_delete_limit_seconds", json_validator=check_string_or_int, default=None
    ),
    allow_message_editing: Optional[bool] = REQ(json_validator=check_bool, default=None),
    edit_topic_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_MESSAGE_POLICY_TYPES), default=None
    ),
    mandatory_topics: Optional[bool] = REQ(json_validator=check_bool, default=None),
    message_content_edit_limit_seconds: Optional[int] = REQ(
        converter=to_non_negative_int, default=None
    ),
    allow_edit_history: Optional[bool] = REQ(json_validator=check_bool, default=None),
    default_language: Optional[str] = REQ(default=None),
    waiting_period_threshold: Optional[int] = REQ(converter=to_non_negative_int, default=None),
    authentication_methods: Optional[Dict[str, Any]] = REQ(
        json_validator=check_dict([]), default=None
    ),
    notifications_stream_id: Optional[int] = REQ(json_validator=check_int, default=None),
    signup_notifications_stream_id: Optional[int] = REQ(json_validator=check_int, default=None),
    message_retention_days_raw: Optional[Union[int, str]] = REQ(
        "message_retention_days", json_validator=check_string_or_int, default=None
    ),
    send_welcome_emails: Optional[bool] = REQ(json_validator=check_bool, default=None),
    digest_emails_enabled: Optional[bool] = REQ(json_validator=check_bool, default=None),
    message_content_allowed_in_email_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    bot_creation_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.BOT_CREATION_POLICY_TYPES), default=None
    ),
    create_public_stream_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    create_private_stream_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    create_web_public_stream_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.CREATE_WEB_PUBLIC_STREAM_POLICY_TYPES), default=None
    ),
    invite_to_stream_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    move_messages_between_streams_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    user_group_edit_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.COMMON_POLICY_TYPES), default=None
    ),
    private_message_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.PRIVATE_MESSAGE_POLICY_TYPES), default=None
    ),
    wildcard_mention_policy: Optional[int] = REQ(
        json_validator=check_int_in(Realm.WILDCARD_MENTION_POLICY_TYPES), default=None
    ),
    email_address_visibility: Optional[int] = REQ(
        json_validator=check_int_in(Realm.EMAIL_ADDRESS_VISIBILITY_TYPES), default=None
    ),
    video_chat_provider: Optional[int] = REQ(json_validator=check_int, default=None),
    giphy_rating: Optional[int] = REQ(json_validator=check_int, default=None),
    default_code_block_language: Optional[str] = REQ(default=None),
    digest_weekday: Optional[int] = REQ(
        json_validator=check_int_in(Realm.DIGEST_WEEKDAY_VALUES), default=None
    ),
    string_id: Optional[str] = REQ(
        str_validator=check_capped_string(Realm.MAX_REALM_SUBDOMAIN_LENGTH),
        default=None,
    ),
    org_type: Optional[int] = REQ(json_validator=check_int_in(ORG_TYPE_IDS), default=None),
    enable_spectator_access: Optional[bool] = REQ(json_validator=check_bool, default=None),
    want_advertise_in_communities_directory: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
) -> HttpResponse:
    realm = user_profile.realm

    # Additional validation/error checking beyond types go here, so
    # the entire request can succeed or fail atomically.
    if default_language is not None and default_language not in get_available_language_codes():
        raise JsonableError(_("Invalid language '{}'").format(default_language))
    if authentication_methods is not None:
        if not user_profile.is_realm_owner:
            raise OrganizationOwnerRequired()
        if True not in list(authentication_methods.values()):
            raise JsonableError(_("At least one authentication method must be enabled."))
    if video_chat_provider is not None and video_chat_provider not in {
        p["id"] for p in Realm.VIDEO_CHAT_PROVIDERS.values()
    }:
        raise JsonableError(_("Invalid video_chat_provider {}").format(video_chat_provider))
    if giphy_rating is not None and giphy_rating not in {
        p["id"] for p in Realm.GIPHY_RATING_OPTIONS.values()
    }:
        raise JsonableError(_("Invalid giphy_rating {}").format(giphy_rating))

    message_retention_days: Optional[int] = None
    if message_retention_days_raw is not None:
        if not user_profile.is_realm_owner:
            raise OrganizationOwnerRequired()
        realm.ensure_not_on_limited_plan()
        message_retention_days = parse_message_retention_days(
            message_retention_days_raw, Realm.MESSAGE_RETENTION_SPECIAL_VALUES_MAP
        )

    if invite_to_realm_policy is not None and not user_profile.is_realm_owner:
        raise OrganizationOwnerRequired()

    data: Dict[str, Any] = {}

    message_content_delete_limit_seconds: Optional[int] = None
    if message_content_delete_limit_seconds_raw is not None:
        message_content_delete_limit_seconds = parse_message_content_delete_limit(
            message_content_delete_limit_seconds_raw,
            Realm.MESSAGE_CONTENT_DELETE_LIMIT_SPECIAL_VALUES_MAP,
        )
        do_set_realm_property(
            realm,
            "message_content_delete_limit_seconds",
            message_content_delete_limit_seconds,
            acting_user=user_profile,
        )
        data["message_content_delete_limit_seconds"] = message_content_delete_limit_seconds

    # The user of `locals()` here is a bit of a code smell, but it's
    # restricted to the elements present in realm.property_types.
    #
    # TODO: It should be possible to deduplicate this function up
    # further by some more advanced usage of the
    # `REQ/has_request_variables` extraction.
    req_vars = {k: v for k, v in list(locals().items()) if k in realm.property_types}

    for k, v in list(req_vars.items()):
        if v is not None and getattr(realm, k) != v:
            do_set_realm_property(realm, k, v, acting_user=user_profile)
            if isinstance(v, str):
                data[k] = "updated"
            else:
                data[k] = v

    # The following realm properties do not fit the pattern above
    # authentication_methods is not supported by the do_set_realm_property
    # framework because of its bitfield.
    if authentication_methods is not None and (
        realm.authentication_methods_dict() != authentication_methods
    ):
        do_set_realm_authentication_methods(realm, authentication_methods, acting_user=user_profile)
        data["authentication_methods"] = authentication_methods
    # The message_editing settings are coupled to each other, and thus don't fit
    # into the do_set_realm_property framework.
    if (
        (allow_message_editing is not None and realm.allow_message_editing != allow_message_editing)
        or (
            message_content_edit_limit_seconds is not None
            and realm.message_content_edit_limit_seconds != message_content_edit_limit_seconds
        )
        or (edit_topic_policy is not None and realm.edit_topic_policy != edit_topic_policy)
    ):
        if allow_message_editing is None:
            allow_message_editing = realm.allow_message_editing
        if message_content_edit_limit_seconds is None:
            message_content_edit_limit_seconds = realm.message_content_edit_limit_seconds
        if edit_topic_policy is None:
            edit_topic_policy = realm.edit_topic_policy
        do_set_realm_message_editing(
            realm,
            allow_message_editing,
            message_content_edit_limit_seconds,
            edit_topic_policy,
            acting_user=user_profile,
        )
        data["allow_message_editing"] = allow_message_editing
        data["message_content_edit_limit_seconds"] = message_content_edit_limit_seconds
        data["edit_topic_policy"] = edit_topic_policy

    # Realm.notifications_stream and Realm.signup_notifications_stream are not boolean,
    # str or integer field, and thus doesn't fit into the do_set_realm_property framework.
    if notifications_stream_id is not None:
        if realm.notifications_stream is None or (
            realm.notifications_stream.id != notifications_stream_id
        ):
            new_notifications_stream = None
            if notifications_stream_id >= 0:
                (new_notifications_stream, sub) = access_stream_by_id(
                    user_profile, notifications_stream_id
                )
            do_set_realm_notifications_stream(
                realm, new_notifications_stream, notifications_stream_id, acting_user=user_profile
            )
            data["notifications_stream_id"] = notifications_stream_id

    if signup_notifications_stream_id is not None:
        if realm.signup_notifications_stream is None or (
            realm.signup_notifications_stream.id != signup_notifications_stream_id
        ):
            new_signup_notifications_stream = None
            if signup_notifications_stream_id >= 0:
                (new_signup_notifications_stream, sub) = access_stream_by_id(
                    user_profile, signup_notifications_stream_id
                )
            do_set_realm_signup_notifications_stream(
                realm,
                new_signup_notifications_stream,
                signup_notifications_stream_id,
                acting_user=user_profile,
            )
            data["signup_notifications_stream_id"] = signup_notifications_stream_id

    if default_code_block_language is not None:
        # Migrate '', used in the API to encode the default/None behavior of this feature.
        if default_code_block_language == "":
            data["default_code_block_language"] = None
        else:
            data["default_code_block_language"] = default_code_block_language

    if string_id is not None:
        if not user_profile.is_realm_owner:
            raise OrganizationOwnerRequired()

        if realm.demo_organization_scheduled_deletion_date is None:
            raise JsonableError(_("Must be a demo organization."))

        try:
            check_subdomain(string_id)
        except ValidationError as err:
            raise JsonableError(str(err.message))

        do_change_realm_subdomain(realm, string_id, acting_user=user_profile)
        data["realm_uri"] = realm.uri

    if org_type is not None:
        do_change_realm_org_type(realm, org_type, acting_user=user_profile)
        data["org_type"] = org_type

    return json_success(request, data)


@require_realm_owner
@has_request_variables
def deactivate_realm(request: HttpRequest, user: UserProfile) -> HttpResponse:
    realm = user.realm
    do_deactivate_realm(realm, acting_user=user)
    return json_success(request)


@require_safe
def check_subdomain_available(request: HttpRequest, subdomain: str) -> HttpResponse:
    try:
        check_subdomain(subdomain)
        return json_success(request, data={"msg": "available"})
    except ValidationError as e:
        return json_success(request, data={"msg": e.message})


def realm_reactivation(request: HttpRequest, confirmation_key: str) -> HttpResponse:
    try:
        realm = get_object_from_key(confirmation_key, [Confirmation.REALM_REACTIVATION])
    except ConfirmationKeyException:
        return render(request, "zerver/realm_reactivation_link_error.html")
    do_reactivate_realm(realm)
    context = {"realm": realm}
    return render(request, "zerver/realm_reactivation.html", context)


emojiset_choices = {emojiset["key"] for emojiset in RealmUserDefault.emojiset_choices()}
default_view_options = ["recent_topics", "all_messages"]


@require_realm_admin
@has_request_variables
def update_realm_user_settings_defaults(
    request: HttpRequest,
    user_profile: UserProfile,
    dense_mode: Optional[bool] = REQ(json_validator=check_bool, default=None),
    starred_message_counts: Optional[bool] = REQ(json_validator=check_bool, default=None),
    fluid_layout_width: Optional[bool] = REQ(json_validator=check_bool, default=None),
    high_contrast_mode: Optional[bool] = REQ(json_validator=check_bool, default=None),
    color_scheme: Optional[int] = REQ(
        json_validator=check_int_in(UserProfile.COLOR_SCHEME_CHOICES), default=None
    ),
    translate_emoticons: Optional[bool] = REQ(json_validator=check_bool, default=None),
    display_emoji_reaction_users: Optional[bool] = REQ(json_validator=check_bool, default=None),
    default_view: Optional[str] = REQ(
        str_validator=check_string_in(default_view_options), default=None
    ),
    escape_navigates_to_default_view: Optional[bool] = REQ(json_validator=check_bool, default=None),
    left_side_userlist: Optional[bool] = REQ(json_validator=check_bool, default=None),
    emojiset: Optional[str] = REQ(str_validator=check_string_in(emojiset_choices), default=None),
    demote_inactive_streams: Optional[int] = REQ(
        json_validator=check_int_in(UserProfile.DEMOTE_STREAMS_CHOICES), default=None
    ),
    enable_stream_desktop_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    enable_stream_email_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    enable_stream_push_notifications: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enable_stream_audible_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    wildcard_mentions_notify: Optional[bool] = REQ(json_validator=check_bool, default=None),
    notification_sound: Optional[str] = REQ(default=None),
    enable_desktop_notifications: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enable_sounds: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enable_offline_email_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    enable_offline_push_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    enable_online_push_notifications: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enable_digest_emails: Optional[bool] = REQ(json_validator=check_bool, default=None),
    # enable_login_emails is not included here, because we don't want
    # security-related settings to be controlled by organization administrators.
    # enable_marketing_emails is not included here, since we don't at
    # present allow organizations to customize this. (The user's selection
    # in the signup form takes precedence over RealmUserDefault).
    #
    # We may want to change this model in the future, since some SSO signups
    # do not offer an opportunity to prompt the user at all during signup.
    message_content_in_email_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    pm_content_in_desktop_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    desktop_icon_count_display: Optional[int] = REQ(
        json_validator=check_int_in(UserProfile.DESKTOP_ICON_COUNT_DISPLAY_CHOICES), default=None
    ),
    realm_name_in_notifications: Optional[bool] = REQ(json_validator=check_bool, default=None),
    presence_enabled: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enter_sends: Optional[bool] = REQ(json_validator=check_bool, default=None),
    enable_drafts_synchronization: Optional[bool] = REQ(json_validator=check_bool, default=None),
    email_notifications_batching_period_seconds: Optional[int] = REQ(
        json_validator=check_int, default=None
    ),
    twenty_four_hour_time: Optional[bool] = REQ(json_validator=check_bool, default=None),
    send_stream_typing_notifications: Optional[bool] = REQ(json_validator=check_bool, default=None),
    send_private_typing_notifications: Optional[bool] = REQ(
        json_validator=check_bool, default=None
    ),
    send_read_receipts: Optional[bool] = REQ(json_validator=check_bool, default=None),
) -> HttpResponse:
    if notification_sound is not None or email_notifications_batching_period_seconds is not None:
        check_settings_values(notification_sound, email_notifications_batching_period_seconds)

    realm_user_default = RealmUserDefault.objects.get(realm=user_profile.realm)
    request_settings = {
        k: v for k, v in list(locals().items()) if (k in RealmUserDefault.property_types)
    }
    for k, v in list(request_settings.items()):
        if v is not None and getattr(realm_user_default, k) != v:
            do_set_realm_user_default_setting(realm_user_default, k, v, acting_user=user_profile)

    # TODO: Extract `ignored_parameters_unsupported` to be a common feature of the REQ framework.
    from zerver.lib.request import RequestNotes

    request_notes = RequestNotes.get_notes(request)
    for req_var in request.POST:
        if req_var not in request_notes.processed_parameters:
            request_notes.ignored_parameters.add(req_var)

    result: Dict[str, Any] = {}
    if len(request_notes.ignored_parameters) > 0:
        result["ignored_parameters_unsupported"] = list(request_notes.ignored_parameters)

    return json_success(request, data=result)
