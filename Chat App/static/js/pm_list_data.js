import * as buddy_data from "./buddy_data";
import * as hash_util from "./hash_util";
import * as narrow_state from "./narrow_state";
import * as people from "./people";
import * as pm_conversations from "./pm_conversations";
import * as unread from "./unread";
import * as user_status from "./user_status";

// Maximum number of conversation threads to show in default view.
const max_conversations_to_show = 5;

// Maximum number of conversation threads to show in default view with unreads.
const max_conversations_to_show_with_unreads = 8;

export function get_active_user_ids_string() {
    const filter = narrow_state.filter();

    if (!filter) {
        return undefined;
    }

    const emails = filter.operands("pm-with")[0];

    if (!emails) {
        return undefined;
    }

    return people.emails_strings_to_user_ids_string(emails);
}

export function get_conversations() {
    const private_messages = pm_conversations.recent.get();
    const display_objects = [];

    // The user_ids_string for the current view, if any.
    const active_user_ids_string = get_active_user_ids_string();

    for (const conversation of private_messages) {
        const user_ids_string = conversation.user_ids_string;
        const reply_to = people.user_ids_string_to_emails_string(user_ids_string);
        const recipients_string = people.get_recipients(user_ids_string);

        const num_unread = unread.num_unread_for_person(user_ids_string);
        const is_group = user_ids_string.includes(",");
        const is_active = user_ids_string === active_user_ids_string;

        let user_circle_class;
        let status_emoji_info;

        if (!is_group) {
            const user_id = Number.parseInt(user_ids_string, 10);
            user_circle_class = buddy_data.get_user_circle_class(user_id);
            const recipient_user_obj = people.get_by_user_id(user_id);

            if (recipient_user_obj.is_bot) {
                // Bots do not have status emoji, and are modeled as
                // always present. We may want to use this space for a
                // bot icon in the future.
                user_circle_class = "user_circle_green";
            } else {
                status_emoji_info = user_status.get_status_emoji(user_id);
            }
        }

        const display_object = {
            recipients: recipients_string,
            user_ids_string,
            unread: num_unread,
            is_zero: num_unread === 0,
            is_active,
            url: hash_util.pm_with_url(reply_to),
            status_emoji_info,
            user_circle_class,
            is_group,
        };
        display_objects.push(display_object);
    }

    return display_objects;
}

export function is_all_privates() {
    const filter = narrow_state.filter();

    if (!filter) {
        return false;
    }

    return filter.operands("is").includes("private");
}

// Designed to closely match topic_list_data.get_list_info().
export function get_list_info(zoomed) {
    const conversations = get_conversations();

    if (zoomed || conversations.length <= max_conversations_to_show) {
        return {
            conversations_to_be_shown: conversations,
            more_conversations_unread_count: 0,
        };
    }

    const conversations_to_be_shown = [];
    let more_conversations_unread_count = 0;
    for (const [idx, conversation] of conversations.entries()) {
        function should_show_conversation(conversation) {
            // We always show the active conversation; see the similar
            // comment in topic_list_data.js.
            if (conversation.is_active) {
                return true;
            }

            // We don't need to filter muted users here, because
            // pm_conversations.js takes care of this for us.

            // We include the most recent max_conversations_to_show
            // conversations, regardless of whether they have unread
            // messages.
            if (idx < max_conversations_to_show) {
                return true;
            }

            // We include older conversations with unread messages up
            // until max_conversations_to_show_with_unreads total
            // topics have been included.
            if (
                conversation.unread > 0 &&
                conversations_to_be_shown.length < max_conversations_to_show_with_unreads
            ) {
                return true;
            }

            // Otherwise, this conversation should only be visible in
            // the unzoomed view.
            return false;
        }

        if (should_show_conversation(conversation)) {
            conversations_to_be_shown.push(conversation);
        } else {
            more_conversations_unread_count += conversation.unread;
        }
    }

    return {
        conversations_to_be_shown,
        more_conversations_unread_count,
    };
}
