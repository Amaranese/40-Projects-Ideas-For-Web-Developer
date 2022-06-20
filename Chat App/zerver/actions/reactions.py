from typing import Any, Dict, Optional

from django.db import transaction
from django.utils.translation import gettext as _

from zerver.actions.create_user import create_historical_user_messages
from zerver.lib.emoji import check_emoji_request, emoji_name_to_emoji_code
from zerver.lib.exceptions import JsonableError
from zerver.lib.message import access_message, update_to_dict_cache
from zerver.lib.stream_subscription import subscriber_ids_with_stream_history_access
from zerver.models import Message, Reaction, Recipient, Stream, UserMessage, UserProfile
from zerver.tornado.django_api import send_event


def notify_reaction_update(
    user_profile: UserProfile, message: Message, reaction: Reaction, op: str
) -> None:
    user_dict = {
        "user_id": user_profile.id,
        "email": user_profile.email,
        "full_name": user_profile.full_name,
    }

    event: Dict[str, Any] = {
        "type": "reaction",
        "op": op,
        "user_id": user_profile.id,
        # TODO: We plan to remove this redundant user_dict object once
        # clients are updated to support accessing use user_id.  See
        # https://github.com/zulip/zulip/pull/14711 for details.
        "user": user_dict,
        "message_id": message.id,
        "emoji_name": reaction.emoji_name,
        "emoji_code": reaction.emoji_code,
        "reaction_type": reaction.reaction_type,
    }

    # Update the cached message since new reaction is added.
    update_to_dict_cache([message])

    # Recipients for message update events, including reactions, are
    # everyone who got the original message, plus subscribers of
    # streams with the access to stream's full history.
    #
    # This means reactions won't live-update in preview narrows for a
    # stream the user isn't yet subscribed to; this is the right
    # performance tradeoff to avoid sending every reaction to public
    # stream messages to all users.
    #
    # To ensure that reactions do live-update for any user who has
    # actually participated in reacting to a message, we add a
    # "historical" UserMessage row for any user who reacts to message,
    # subscribing them to future notifications, even if they are not
    # subscribed to the stream.
    user_ids = set(
        UserMessage.objects.filter(message=message.id).values_list("user_profile_id", flat=True)
    )
    if message.recipient.type == Recipient.STREAM:
        stream_id = message.recipient.type_id
        stream = Stream.objects.get(id=stream_id)
        user_ids |= subscriber_ids_with_stream_history_access(stream)

    transaction.on_commit(lambda: send_event(user_profile.realm, event, list(user_ids)))


def do_add_reaction(
    user_profile: UserProfile,
    message: Message,
    emoji_name: str,
    emoji_code: str,
    reaction_type: str,
) -> None:
    """Should be called while holding a SELECT FOR UPDATE lock
    (e.g. via access_message(..., lock_message=True)) on the
    Message row, to prevent race conditions.
    """

    reaction = Reaction(
        user_profile=user_profile,
        message=message,
        emoji_name=emoji_name,
        emoji_code=emoji_code,
        reaction_type=reaction_type,
    )

    reaction.save()

    notify_reaction_update(user_profile, message, reaction, "add")


def check_add_reaction(
    user_profile: UserProfile,
    message_id: int,
    emoji_name: str,
    emoji_code: Optional[str],
    reaction_type: Optional[str],
) -> None:
    message, user_message = access_message(user_profile, message_id, lock_message=True)

    if emoji_code is None:
        # The emoji_code argument is only required for rare corner
        # cases discussed in the long block comment below.  For simple
        # API clients, we allow specifying just the name, and just
        # look up the code using the current name->code mapping.
        emoji_code = emoji_name_to_emoji_code(message.sender.realm, emoji_name)[0]

    if reaction_type is None:
        reaction_type = emoji_name_to_emoji_code(message.sender.realm, emoji_name)[1]

    if Reaction.objects.filter(
        user_profile=user_profile,
        message=message,
        emoji_code=emoji_code,
        reaction_type=reaction_type,
    ).exists():
        raise JsonableError(_("Reaction already exists."))

    query = Reaction.objects.filter(
        message=message, emoji_code=emoji_code, reaction_type=reaction_type
    )
    if query.exists():
        # If another user has already reacted to this message with
        # same emoji code, we treat the new reaction as a vote for the
        # existing reaction.  So the emoji name used by that earlier
        # reaction takes precedence over whatever was passed in this
        # request.  This is necessary to avoid a message having 2
        # "different" emoji reactions with the same emoji code (and
        # thus same image) on the same message, which looks ugly.
        #
        # In this "voting for an existing reaction" case, we shouldn't
        # check whether the emoji code and emoji name match, since
        # it's possible that the (emoji_type, emoji_name, emoji_code)
        # triple for this existing reaction may not pass validation
        # now (e.g. because it is for a realm emoji that has been
        # since deactivated).  We still want to allow users to add a
        # vote any old reaction they see in the UI even if that is a
        # deactivated custom emoji, so we just use the emoji name from
        # the existing reaction with no further validation.
        reaction = query.first()
        assert reaction is not None
        emoji_name = reaction.emoji_name
    else:
        # Otherwise, use the name provided in this request, but verify
        # it is valid in the user's realm (e.g. not a deactivated
        # realm emoji).
        check_emoji_request(user_profile.realm, emoji_name, emoji_code, reaction_type)

    if user_message is None:
        # See called function for more context.
        create_historical_user_messages(user_id=user_profile.id, message_ids=[message.id])

    do_add_reaction(user_profile, message, emoji_name, emoji_code, reaction_type)


def do_remove_reaction(
    user_profile: UserProfile, message: Message, emoji_code: str, reaction_type: str
) -> None:
    """Should be called while holding a SELECT FOR UPDATE lock
    (e.g. via access_message(..., lock_message=True)) on the
    Message row, to prevent race conditions.
    """
    reaction = Reaction.objects.filter(
        user_profile=user_profile,
        message=message,
        emoji_code=emoji_code,
        reaction_type=reaction_type,
    ).get()
    reaction.delete()

    notify_reaction_update(user_profile, message, reaction, "remove")
