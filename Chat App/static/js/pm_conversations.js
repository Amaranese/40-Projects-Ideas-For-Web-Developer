import {FoldDict} from "./fold_dict";
import * as muted_users from "./muted_users";
import * as people from "./people";

const partners = new Set();

export function set_partner(user_id) {
    partners.add(user_id);
}

export function is_partner(user_id) {
    return partners.has(user_id);
}

function filter_muted_pms(conversation) {
    // We hide muted users from the top left corner, as well as those huddles
    // in which all participants are muted.
    const recipients = conversation.user_ids_string.split(",").map((id) => Number.parseInt(id, 10));

    if (recipients.every((id) => muted_users.is_user_muted(id))) {
        return false;
    }

    return true;
}

class RecentPrivateMessages {
    // This data structure keeps track of the sets of users you've had
    // recent conversations with, sorted by time (implemented via
    // `message_id` sorting, since that's how we time-sort messages).
    recent_message_ids = new FoldDict(); // key is user_ids_string
    recent_private_messages = [];

    insert(user_ids, message_id) {
        if (user_ids.length === 0) {
            // The server sends [] for self-PMs.
            user_ids = [people.my_current_user_id()];
        }
        user_ids.sort((a, b) => a - b);

        const user_ids_string = user_ids.join(",");
        let conversation = this.recent_message_ids.get(user_ids_string);

        if (conversation === undefined) {
            // This is a new user, so create a new object.
            conversation = {
                user_ids_string,
                max_message_id: message_id,
            };
            this.recent_message_ids.set(user_ids_string, conversation);

            // Optimistically insert the new message at the front, since that
            // is usually where it belongs, but we'll re-sort.
            this.recent_private_messages.unshift(conversation);
        } else {
            if (conversation.max_message_id >= message_id) {
                // don't backdate our conversation.  This is the
                // common code path after initialization when
                // processing old messages, since we'll already have
                // the latest message_id for the conversation from
                // initialization.
                return;
            }

            // update our latest message_id
            conversation.max_message_id = message_id;
        }

        this.recent_private_messages.sort((a, b) => b.max_message_id - a.max_message_id);
    }

    get() {
        // returns array of structs with user_ids_string and
        // message_id
        return this.recent_private_messages.filter((pm) => filter_muted_pms(pm));
    }

    get_strings() {
        // returns array of structs with user_ids_string and
        // message_id
        return this.recent_private_messages
            .filter((pm) => filter_muted_pms(pm))
            .map((conversation) => conversation.user_ids_string);
    }

    initialize(params) {
        for (const conversation of params.recent_private_conversations) {
            this.insert(conversation.user_ids, conversation.max_message_id);
        }
    }
}

export let recent = new RecentPrivateMessages();

export function process_message(message) {
    const user_ids = people.pm_with_user_ids(message);
    if (!user_ids) {
        return;
    }

    for (const user_id of user_ids) {
        set_partner(user_id);
    }

    recent.insert(user_ids, message.id);
}

export function clear_for_testing() {
    recent = new RecentPrivateMessages();
    partners.clear();
}
