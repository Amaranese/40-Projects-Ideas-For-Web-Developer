from typing import Any, Dict, List

from django.db import transaction
from django.utils.translation import gettext as _

from zerver.lib.exceptions import JsonableError
from zerver.lib.types import APIStreamDict
from zerver.models import (
    DefaultStream,
    DefaultStreamGroup,
    Realm,
    Stream,
    active_non_guest_user_ids,
    get_default_stream_groups,
)
from zerver.tornado.django_api import send_event


def check_default_stream_group_name(group_name: str) -> None:
    if group_name.strip() == "":
        raise JsonableError(_("Invalid default stream group name '{}'").format(group_name))
    if len(group_name) > DefaultStreamGroup.MAX_NAME_LENGTH:
        raise JsonableError(
            _("Default stream group name too long (limit: {} characters)").format(
                DefaultStreamGroup.MAX_NAME_LENGTH,
            )
        )
    for i in group_name:
        if ord(i) == 0:
            raise JsonableError(
                _("Default stream group name '{}' contains NULL (0x00) characters.").format(
                    group_name,
                )
            )


def lookup_default_stream_groups(
    default_stream_group_names: List[str], realm: Realm
) -> List[DefaultStreamGroup]:
    default_stream_groups = []
    for group_name in default_stream_group_names:
        try:
            default_stream_group = DefaultStreamGroup.objects.get(name=group_name, realm=realm)
        except DefaultStreamGroup.DoesNotExist:
            raise JsonableError(_("Invalid default stream group {}").format(group_name))
        default_stream_groups.append(default_stream_group)
    return default_stream_groups


def notify_default_streams(realm: Realm) -> None:
    event = dict(
        type="default_streams",
        default_streams=streams_to_dicts_sorted(get_default_streams_for_realm(realm.id)),
    )
    transaction.on_commit(lambda: send_event(realm, event, active_non_guest_user_ids(realm.id)))


def notify_default_stream_groups(realm: Realm) -> None:
    event = dict(
        type="default_stream_groups",
        default_stream_groups=default_stream_groups_to_dicts_sorted(
            get_default_stream_groups(realm)
        ),
    )
    transaction.on_commit(lambda: send_event(realm, event, active_non_guest_user_ids(realm.id)))


def do_add_default_stream(stream: Stream) -> None:
    realm_id = stream.realm_id
    stream_id = stream.id
    if not DefaultStream.objects.filter(realm_id=realm_id, stream_id=stream_id).exists():
        DefaultStream.objects.create(realm_id=realm_id, stream_id=stream_id)
        notify_default_streams(stream.realm)


@transaction.atomic(savepoint=False)
def do_remove_default_stream(stream: Stream) -> None:
    realm_id = stream.realm_id
    stream_id = stream.id
    DefaultStream.objects.filter(realm_id=realm_id, stream_id=stream_id).delete()
    notify_default_streams(stream.realm)


def do_create_default_stream_group(
    realm: Realm, group_name: str, description: str, streams: List[Stream]
) -> None:
    default_streams = get_default_streams_for_realm(realm.id)
    for stream in streams:
        if stream in default_streams:
            raise JsonableError(
                _(
                    "'{stream_name}' is a default stream and cannot be added to '{group_name}'",
                ).format(stream_name=stream.name, group_name=group_name)
            )

    check_default_stream_group_name(group_name)
    (group, created) = DefaultStreamGroup.objects.get_or_create(
        name=group_name, realm=realm, description=description
    )
    if not created:
        raise JsonableError(
            _(
                "Default stream group '{group_name}' already exists",
            ).format(group_name=group_name)
        )

    group.streams.set(streams)
    notify_default_stream_groups(realm)


def do_add_streams_to_default_stream_group(
    realm: Realm, group: DefaultStreamGroup, streams: List[Stream]
) -> None:
    default_streams = get_default_streams_for_realm(realm.id)
    for stream in streams:
        if stream in default_streams:
            raise JsonableError(
                _(
                    "'{stream_name}' is a default stream and cannot be added to '{group_name}'",
                ).format(stream_name=stream.name, group_name=group.name)
            )
        if stream in group.streams.all():
            raise JsonableError(
                _(
                    "Stream '{stream_name}' is already present in default stream group '{group_name}'",
                ).format(stream_name=stream.name, group_name=group.name)
            )
        group.streams.add(stream)

    group.save()
    notify_default_stream_groups(realm)


def do_remove_streams_from_default_stream_group(
    realm: Realm, group: DefaultStreamGroup, streams: List[Stream]
) -> None:
    for stream in streams:
        if stream not in group.streams.all():
            raise JsonableError(
                _(
                    "Stream '{stream_name}' is not present in default stream group '{group_name}'",
                ).format(stream_name=stream.name, group_name=group.name)
            )
        group.streams.remove(stream)

    group.save()
    notify_default_stream_groups(realm)


def do_change_default_stream_group_name(
    realm: Realm, group: DefaultStreamGroup, new_group_name: str
) -> None:
    if group.name == new_group_name:
        raise JsonableError(
            _("This default stream group is already named '{}'").format(new_group_name)
        )

    if DefaultStreamGroup.objects.filter(name=new_group_name, realm=realm).exists():
        raise JsonableError(_("Default stream group '{}' already exists").format(new_group_name))

    group.name = new_group_name
    group.save()
    notify_default_stream_groups(realm)


def do_change_default_stream_group_description(
    realm: Realm, group: DefaultStreamGroup, new_description: str
) -> None:
    group.description = new_description
    group.save()
    notify_default_stream_groups(realm)


def do_remove_default_stream_group(realm: Realm, group: DefaultStreamGroup) -> None:
    group.delete()
    notify_default_stream_groups(realm)


def get_default_streams_for_realm(realm_id: int) -> List[Stream]:
    return [
        default.stream
        for default in DefaultStream.objects.select_related().filter(realm_id=realm_id)
    ]


# returns default streams in JSON serializable format
def streams_to_dicts_sorted(streams: List[Stream]) -> List[APIStreamDict]:
    return sorted((stream.to_dict() for stream in streams), key=lambda elt: elt["name"])


def default_stream_groups_to_dicts_sorted(groups: List[DefaultStreamGroup]) -> List[Dict[str, Any]]:
    return sorted((group.to_dict() for group in groups), key=lambda elt: elt["name"])
