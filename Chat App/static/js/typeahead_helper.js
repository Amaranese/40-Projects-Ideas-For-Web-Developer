import Handlebars from "handlebars/runtime";
import _ from "lodash";

import pygments_data from "../generated/pygments_data.json";
import * as typeahead from "../shared/js/typeahead";
import render_typeahead_list_item from "../templates/typeahead_list_item.hbs";

import * as buddy_data from "./buddy_data";
import * as compose_state from "./compose_state";
import * as people from "./people";
import * as pm_conversations from "./pm_conversations";
import * as recent_senders from "./recent_senders";
import * as settings_data from "./settings_data";
import * as stream_data from "./stream_data";
import * as user_groups from "./user_groups";
import * as user_status from "./user_status";
import * as util from "./util";
// Returns an array of private message recipients, removing empty elements.
// For example, "a,,b, " => ["a", "b"]
export function get_cleaned_pm_recipients(query_string) {
    let recipients = util.extract_pm_recipients(query_string);
    recipients = recipients.filter((elem) => elem.match(/\S/));
    return recipients;
}

export function build_highlight_regex(query) {
    const regex = new RegExp("(" + _.escapeRegExp(query) + ")", "ig");
    return regex;
}

export function highlight_with_escaping_and_regex(regex, item) {
    // We need to assemble this manually (as opposed to doing 'join') because we need to
    // (1) escape all the pieces and (2) the regex is case-insensitive, and we need
    // to know the case of the content we're replacing (you can't just use a bolded
    // version of 'query')

    const pieces = item.split(regex);
    let result = "";

    for (const piece of pieces) {
        if (regex.test(piece)) {
            result += "<strong>" + Handlebars.Utils.escapeExpression(piece) + "</strong>";
        } else {
            result += Handlebars.Utils.escapeExpression(piece);
        }
    }

    return result;
}

export function make_query_highlighter(query) {
    let i;
    query = query.toLowerCase();

    const regex = build_highlight_regex(query);

    return function (phrase) {
        let result = "";
        const parts = phrase.split(" ");
        for (i = 0; i < parts.length; i += 1) {
            if (i > 0) {
                result += " ";
            }
            result += highlight_with_escaping_and_regex(regex, parts[i]);
        }
        return result;
    };
}

export function render_typeahead_item(args) {
    args.has_image = args.img_src !== undefined;
    args.has_status = args.status_emoji_info !== undefined;
    args.has_secondary = args.secondary !== undefined;
    return render_typeahead_list_item(args);
}

export function render_person(person) {
    const user_circle_class = buddy_data.get_user_circle_class(person.user_id);
    if (person.special_item_text) {
        return render_typeahead_item({
            primary: person.special_item_text,
            is_person: true,
        });
    }

    const avatar_url = people.small_avatar_url_for_person(person);

    const status_emoji_info = user_status.get_status_emoji(person.user_id);

    const typeahead_arguments = {
        primary: person.full_name,
        img_src: avatar_url,
        user_circle_class,
        is_person: true,
        status_emoji_info,
    };

    typeahead_arguments.secondary = settings_data.email_for_user_settings(person);
    return render_typeahead_item(typeahead_arguments);
}

export function render_user_group(user_group) {
    return render_typeahead_item({
        primary: user_group.name,
        secondary: user_group.description,
        is_user_group: true,
    });
}

export function render_person_or_user_group(item) {
    if (user_groups.is_user_group(item)) {
        return render_user_group(item);
    }

    return render_person(item);
}

export function render_stream(stream) {
    let desc = stream.description;
    const short_desc = desc.slice(0, 35);

    if (desc !== short_desc) {
        desc = short_desc + "...";
    }

    return render_typeahead_item({
        primary: stream.name,
        secondary: desc,
        is_unsubscribed: !stream.subscribed,
    });
}

export function render_emoji(item) {
    const args = {
        is_emoji: true,
        primary: item.emoji_name.replace(/_/g, " "),
    };

    if (item.emoji_url) {
        args.img_src = item.emoji_url;
    } else {
        args.emoji_code = item.emoji_code;
    }

    return render_typeahead_item(args);
}

export function sorter(query, objs, get_item) {
    const results = typeahead.triage(query, objs, get_item);
    return results.matches.concat(results.rest);
}

export function compare_by_pms(user_a, user_b) {
    const count_a = people.get_recipient_count(user_a);
    const count_b = people.get_recipient_count(user_b);

    if (count_a > count_b) {
        return -1;
    } else if (count_a < count_b) {
        return 1;
    }

    if (!user_a.is_bot && user_b.is_bot) {
        return -1;
    } else if (user_a.is_bot && !user_b.is_bot) {
        return 1;
    }

    // We use alpha sort as a tiebreaker, which might be helpful for
    // new users.
    if (user_a.full_name < user_b.full_name) {
        return -1;
    } else if (user_a === user_b) {
        return 0;
    }
    return 1;
}

export function compare_people_for_relevance(
    person_a,
    person_b,
    tertiary_compare,
    current_stream_id,
) {
    // give preference to "all", "everyone" or "stream"
    // We use is_broadcast for a quick check.  It will
    // true for all/everyone/stream and undefined (falsy)
    // for actual people.
    if (compose_state.get_message_type() !== "private") {
        if (person_a.is_broadcast) {
            if (person_b.is_broadcast) {
                return person_a.idx - person_b.idx;
            }
            return -1;
        } else if (person_b.is_broadcast) {
            return 1;
        }
    } else {
        if (person_a.is_broadcast) {
            if (person_b.is_broadcast) {
                return person_a.idx - person_b.idx;
            }
            return 1;
        } else if (person_b.is_broadcast) {
            return -1;
        }
    }

    // Now handle actual people users.

    // give preference to subscribed users first
    if (current_stream_id !== undefined) {
        const a_is_sub = stream_data.is_user_subscribed(current_stream_id, person_a.user_id);
        const b_is_sub = stream_data.is_user_subscribed(current_stream_id, person_b.user_id);

        if (a_is_sub && !b_is_sub) {
            return -1;
        } else if (!a_is_sub && b_is_sub) {
            return 1;
        }
    }

    // give preference to pm partners if both (are)/(are not) subscribers
    const a_is_partner = pm_conversations.is_partner(person_a.user_id);
    const b_is_partner = pm_conversations.is_partner(person_b.user_id);

    if (a_is_partner && !b_is_partner) {
        return -1;
    } else if (!a_is_partner && b_is_partner) {
        return 1;
    }

    return tertiary_compare(person_a, person_b);
}

export function sort_people_for_relevance(objs, current_stream_name, current_topic) {
    // If sorting for recipientbox typeahead or compose state is private, then current_stream = ""
    let current_stream = false;
    if (current_stream_name) {
        current_stream = stream_data.get_sub(current_stream_name);
    }
    if (!current_stream) {
        objs.sort((person_a, person_b) =>
            compare_people_for_relevance(person_a, person_b, compare_by_pms),
        );
    } else {
        const stream_id = current_stream.stream_id;

        objs.sort((person_a, person_b) =>
            compare_people_for_relevance(
                person_a,
                person_b,
                (user_a, user_b) =>
                    recent_senders.compare_by_recency(user_a, user_b, stream_id, current_topic),
                current_stream.stream_id,
            ),
        );
    }

    return objs;
}

export function compare_by_popularity(lang_a, lang_b) {
    const diff = pygments_data.langs[lang_b].priority - pygments_data.langs[lang_a].priority;
    if (diff !== 0) {
        return diff;
    }
    return util.strcmp(lang_a, lang_b);
}

function retain_unique_language_aliases(matches) {
    // We make the typeahead a little more nicer but only showing one alias per language.
    // For example if the user searches for prefix "j", then the typeahead list should contain
    // "javascript" only, and not "js" and "javascript".
    const seen_aliases = new Set();
    const unique_aliases = [];
    for (const lang of matches) {
        // The matched list is already sorted based on popularity and has exact matches
        // at the top, so we don't need to worry about sorting again.
        const canonical_name = pygments_data.langs[lang]?.pretty_name ?? lang;
        if (!seen_aliases.has(canonical_name)) {
            seen_aliases.add(canonical_name);
            unique_aliases.push(lang);
        }
    }
    return unique_aliases;
}

export function sort_languages(matches, query) {
    const results = typeahead.triage(query, matches);

    // Languages that start with the query
    results.matches = results.matches.sort(compare_by_popularity);

    // Push exact matches to top.
    const match_index = results.matches.indexOf(query);
    if (match_index > -1) {
        results.matches.splice(match_index, 1);
        results.matches.unshift(query);
    }

    // Languages that have the query somewhere in their name
    results.rest = results.rest.sort(compare_by_popularity);
    return retain_unique_language_aliases(results.matches.concat(results.rest));
}

export function sort_recipients({
    users,
    query,
    current_stream,
    current_topic,
    groups = [],
    max_num_items = 20,
}) {
    function sort_relevance(items) {
        return sort_people_for_relevance(items, current_stream, current_topic);
    }

    const users_name_results = typeahead.triage(query, users, (p) => p.full_name);

    const email_results = typeahead.triage(query, users_name_results.rest, (p) => p.email);

    const groups_results = typeahead.triage(query, groups, (g) => g.name);

    const best_users = () => sort_relevance(users_name_results.matches);
    const best_groups = () => groups_results.matches;
    const ok_users = () => sort_relevance(email_results.matches);
    const worst_users = () => sort_relevance(email_results.rest);
    const worst_groups = () => groups_results.rest;

    const getters = [best_users, best_groups, ok_users, worst_users, worst_groups];

    /*
        The following optimization is important for large realms.
        If we know we're only showing 5 suggestions, and we
        get 5 matches from `best_users`, then we want to avoid
        calling the expensive sorts for `ok_users` and `worst_users`,
        since they just get dropped.
    */

    let items = [];

    for (const getter of getters) {
        if (items.length < max_num_items) {
            items = items.concat(getter());
        }
    }

    return items.slice(0, max_num_items);
}

function slash_command_comparator(slash_command_a, slash_command_b) {
    if (slash_command_a.name < slash_command_b.name) {
        return -1;
    } else if (slash_command_a.name > slash_command_b.name) {
        return 1;
    }
    /* istanbul ignore next */
    return 0;
}

export function sort_slash_commands(matches, query) {
    // We will likely want to in the future make this sort the
    // just-`/` commands by something approximating usefulness.
    const results = typeahead.triage(query, matches, (x) => x.name);

    results.matches = results.matches.sort(slash_command_comparator);
    results.rest = results.rest.sort(slash_command_comparator);
    return results.matches.concat(results.rest);
}

// Gives stream a score from 0 to 3 based on its activity
function activity_score(sub) {
    let stream_score = 0;
    if (!sub.subscribed) {
        stream_score = -1;
    } else {
        if (sub.pin_to_top) {
            stream_score += 2;
        }
        // Note: A pinned stream may accumulate a 3rd point if it is active
        if (stream_data.is_active(sub)) {
            stream_score += 1;
        }
    }
    return stream_score;
}

// Sort streams by ranking them by activity. If activity is equal,
// as defined bv activity_score, decide based on our weekly traffic
// stats.
export function compare_by_activity(stream_a, stream_b) {
    let diff = activity_score(stream_b) - activity_score(stream_a);
    if (diff !== 0) {
        return diff;
    }
    diff = (stream_b.stream_weekly_traffic || 0) - (stream_a.stream_weekly_traffic || 0);
    if (diff !== 0) {
        return diff;
    }
    return util.strcmp(stream_a.name, stream_b.name);
}

export function sort_streams(matches, query) {
    const name_results = typeahead.triage(query, matches, (x) => x.name);

    const desc_results = typeahead.triage(query, name_results.rest, (x) => x.description);

    // Streams that start with the query.
    name_results.matches = name_results.matches.sort(compare_by_activity);
    // Streams with descriptions that start with the query.
    desc_results.matches = desc_results.matches.sort(compare_by_activity);
    // Streams with names and descriptions that don't start with the query.
    desc_results.rest = desc_results.rest.sort(compare_by_activity);

    return name_results.matches.concat(desc_results.matches.concat(desc_results.rest));
}
