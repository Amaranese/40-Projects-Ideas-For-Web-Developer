from collections import defaultdict
from dataclasses import asdict, dataclass, field
from typing import List, Optional, Set

from django.db.models import F
from django.utils.timezone import now as timezone_now
from django.utils.translation import gettext as _

from analytics.lib.counts import COUNT_STATS, do_increment_logging_stat
from zerver.actions.create_user import create_historical_user_messages
from zerver.lib.exceptions import JsonableError
from zerver.lib.message import access_message, format_unread_message_details, get_raw_unread_data
from zerver.lib.queue import queue_json_publish
from zerver.lib.topic import filter_by_topic_name_via_message
from zerver.lib.utils import log_statsd_event
from zerver.models import Message, UserMessage, UserProfile
from zerver.tornado.django_api import send_event


@dataclass
class ReadMessagesEvent:
    messages: List[int]
    all: bool
    type: str = field(default="update_message_flags", init=False)
    op: str = field(default="add", init=False)
    operation: str = field(default="add", init=False)
    flag: str = field(default="read", init=False)


def do_mark_all_as_read(user_profile: UserProfile) -> int:
    log_statsd_event("bankruptcy")

    # First, we clear mobile push notifications.  This is safer in the
    # event that the below logic times out and we're killed.
    all_push_message_ids = (
        UserMessage.objects.filter(
            user_profile=user_profile,
        )
        .extra(
            where=[UserMessage.where_active_push_notification()],
        )
        .values_list("message_id", flat=True)[0:10000]
    )
    do_clear_mobile_push_notifications_for_ids([user_profile.id], all_push_message_ids)

    msgs = UserMessage.objects.filter(user_profile=user_profile).extra(
        where=[UserMessage.where_unread()],
    )

    count = msgs.update(
        flags=F("flags").bitor(UserMessage.flags.read),
    )

    event = asdict(
        ReadMessagesEvent(
            messages=[],  # we don't send messages, since the client reloads anyway
            all=True,
        )
    )
    event_time = timezone_now()

    send_event(user_profile.realm, event, [user_profile.id])

    do_increment_logging_stat(
        user_profile, COUNT_STATS["messages_read::hour"], None, event_time, increment=count
    )
    do_increment_logging_stat(
        user_profile,
        COUNT_STATS["messages_read_interactions::hour"],
        None,
        event_time,
        increment=min(1, count),
    )

    return count


def do_mark_stream_messages_as_read(
    user_profile: UserProfile, stream_recipient_id: int, topic_name: Optional[str] = None
) -> int:
    log_statsd_event("mark_stream_as_read")

    msgs = UserMessage.objects.filter(
        user_profile=user_profile,
    )

    msgs = msgs.filter(message__recipient_id=stream_recipient_id)

    if topic_name:
        msgs = filter_by_topic_name_via_message(
            query=msgs,
            topic_name=topic_name,
        )

    msgs = msgs.extra(
        where=[UserMessage.where_unread()],
    )

    message_ids = list(msgs.values_list("message_id", flat=True))

    if len(message_ids) == 0:
        return 0

    count = msgs.update(
        flags=F("flags").bitor(UserMessage.flags.read),
    )

    event = asdict(
        ReadMessagesEvent(
            messages=message_ids,
            all=False,
        )
    )
    event_time = timezone_now()

    send_event(user_profile.realm, event, [user_profile.id])
    do_clear_mobile_push_notifications_for_ids([user_profile.id], message_ids)

    do_increment_logging_stat(
        user_profile, COUNT_STATS["messages_read::hour"], None, event_time, increment=count
    )
    do_increment_logging_stat(
        user_profile,
        COUNT_STATS["messages_read_interactions::hour"],
        None,
        event_time,
        increment=min(1, count),
    )
    return count


def do_mark_muted_user_messages_as_read(
    user_profile: UserProfile,
    muted_user: UserProfile,
) -> int:
    messages = UserMessage.objects.filter(
        user_profile=user_profile, message__sender=muted_user
    ).extra(where=[UserMessage.where_unread()])

    message_ids = list(messages.values_list("message_id", flat=True))

    if len(message_ids) == 0:
        return 0

    count = messages.update(
        flags=F("flags").bitor(UserMessage.flags.read),
    )

    event = asdict(
        ReadMessagesEvent(
            messages=message_ids,
            all=False,
        )
    )
    event_time = timezone_now()

    send_event(user_profile.realm, event, [user_profile.id])
    do_clear_mobile_push_notifications_for_ids([user_profile.id], message_ids)

    do_increment_logging_stat(
        user_profile, COUNT_STATS["messages_read::hour"], None, event_time, increment=count
    )
    do_increment_logging_stat(
        user_profile,
        COUNT_STATS["messages_read_interactions::hour"],
        None,
        event_time,
        increment=min(1, count),
    )
    return count


def do_update_mobile_push_notification(
    message: Message,
    prior_mention_user_ids: Set[int],
    mentions_user_ids: Set[int],
    stream_push_user_ids: Set[int],
) -> None:
    # Called during the message edit code path to remove mobile push
    # notifications for users who are no longer mentioned following
    # the edit.  See #15428 for details.
    #
    # A perfect implementation would also support updating the message
    # in a sent notification if a message was edited to mention a
    # group rather than a user (or vice versa), though it is likely
    # not worth the effort to do such a change.
    if not message.is_stream_message():
        return

    remove_notify_users = prior_mention_user_ids - mentions_user_ids - stream_push_user_ids
    do_clear_mobile_push_notifications_for_ids(list(remove_notify_users), [message.id])


def do_clear_mobile_push_notifications_for_ids(
    user_profile_ids: List[int], message_ids: List[int]
) -> None:
    if len(message_ids) == 0:
        return

    # This function supports clearing notifications for several users
    # only for the message-edit use case where we'll have a single message_id.
    assert len(user_profile_ids) == 1 or len(message_ids) == 1

    messages_by_user = defaultdict(list)
    notifications_to_update = list(
        UserMessage.objects.filter(
            message_id__in=message_ids,
            user_profile_id__in=user_profile_ids,
        )
        .extra(
            where=[UserMessage.where_active_push_notification()],
        )
        .values_list("user_profile_id", "message_id")
    )

    for (user_id, message_id) in notifications_to_update:
        messages_by_user[user_id].append(message_id)

    for (user_profile_id, event_message_ids) in messages_by_user.items():
        queue_json_publish(
            "missedmessage_mobile_notifications",
            {
                "type": "remove",
                "user_profile_id": user_profile_id,
                "message_ids": event_message_ids,
            },
        )


def do_update_message_flags(
    user_profile: UserProfile, operation: str, flag: str, messages: List[int]
) -> int:
    valid_flags = [item for item in UserMessage.flags if item not in UserMessage.NON_API_FLAGS]
    if flag not in valid_flags:
        raise JsonableError(_("Invalid flag: '{}'").format(flag))
    if flag in UserMessage.NON_EDITABLE_FLAGS:
        raise JsonableError(_("Flag not editable: '{}'").format(flag))
    if operation not in ("add", "remove"):
        raise JsonableError(_("Invalid message flag operation: '{}'").format(operation))
    flagattr = getattr(UserMessage.flags, flag)

    msgs = UserMessage.objects.filter(user_profile=user_profile, message_id__in=messages)
    um_message_ids = {um.message_id for um in msgs}
    historical_message_ids = list(set(messages) - um_message_ids)

    # Users can mutate flags for messages that don't have a UserMessage yet.
    # First, validate that the user is even allowed to access these message_ids.
    for message_id in historical_message_ids:
        access_message(user_profile, message_id)

    # And then create historical UserMessage records.  See the called function for more context.
    create_historical_user_messages(user_id=user_profile.id, message_ids=historical_message_ids)

    if operation == "add":
        count = msgs.update(flags=F("flags").bitor(flagattr))
    elif operation == "remove":
        count = msgs.update(flags=F("flags").bitand(~flagattr))

    event = {
        "type": "update_message_flags",
        "op": operation,
        "operation": operation,
        "flag": flag,
        "messages": messages,
        "all": False,
    }

    if flag == "read" and operation == "remove":
        # When removing the read flag (i.e. marking messages as
        # unread), extend the event with an additional object with
        # details on the messages required to update the client's
        # `unread_msgs` data structure.
        raw_unread_data = get_raw_unread_data(user_profile, messages)
        event["message_details"] = format_unread_message_details(user_profile.id, raw_unread_data)

    send_event(user_profile.realm, event, [user_profile.id])

    if flag == "read" and operation == "add":
        event_time = timezone_now()
        do_clear_mobile_push_notifications_for_ids([user_profile.id], messages)

        do_increment_logging_stat(
            user_profile, COUNT_STATS["messages_read::hour"], None, event_time, increment=count
        )
        do_increment_logging_stat(
            user_profile,
            COUNT_STATS["messages_read_interactions::hour"],
            None,
            event_time,
            increment=min(1, count),
        )

    return count
