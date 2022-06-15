import $ from "jquery";
import _ from "lodash";

import * as blueslip from "./blueslip";
import * as buddy_data from "./buddy_data";
import {buddy_list} from "./buddy_list";
import * as channel from "./channel";
import * as keydown_util from "./keydown_util";
import {ListCursor} from "./list_cursor";
import * as narrow from "./narrow";
import {page_params} from "./page_params";
import * as people from "./people";
import * as pm_list from "./pm_list";
import * as popovers from "./popovers";
import * as presence from "./presence";
import * as ui_util from "./ui_util";
import {UserSearch} from "./user_search";
import * as user_status from "./user_status";
import * as watchdog from "./watchdog";

export let user_cursor;
export let user_filter;

/*
    Helpers for detecting user activity and managing user idle states
*/

/* Broadcast "idle" to server after 5 minutes of local inactivity */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
/* Time between keep-alive pings */
const ACTIVE_PING_INTERVAL_MS = 50 * 1000;

/* Keep in sync with views.py:update_active_status_backend() */
export const ACTIVE = "active";

export const IDLE = "idle";

// When you open Zulip in a new browser window, client_is_active
// should be true.  When a server-initiated reload happens, however,
// it should be initialized to false.  We handle this with a check for
// whether the window is focused at initialization time.
export let client_is_active = document.hasFocus && document.hasFocus();

// new_user_input is a more strict version of client_is_active used
// primarily for analytics.  We initialize this to true, to count new
// page loads, but set it to false in the onload function in reload.js
// if this was a server-initiated-reload to avoid counting a
// server-initiated reload as user activity.
export let new_user_input = true;

export function set_new_user_input(value) {
    new_user_input = value;
}

function get_pm_list_item(user_id) {
    return buddy_list.find_li({
        key: user_id,
    });
}

function set_pm_count(user_ids_string, count) {
    const $pm_li = get_pm_list_item(user_ids_string);
    ui_util.update_unread_count_in_dom($pm_li, count);
}

export function update_dom_with_unread_counts(counts) {
    // counts is just a data object that gets calculated elsewhere
    // Our job is to update some DOM elements.

    for (const [user_ids_string, count] of counts.pm_count) {
        // TODO: just use user_ids_string in our markup
        const is_pm = !user_ids_string.includes(",");
        if (is_pm) {
            set_pm_count(user_ids_string, count);
        }
    }
}

export function clear_for_testing() {
    user_cursor = undefined;
    user_filter = undefined;
    client_is_active = false;
}

export function mark_client_idle() {
    // When we become idle, we don't immediately send anything to the
    // server; instead, we wait for our next periodic update, since
    // this data is fundamentally not timely.
    client_is_active = false;
}

export function redraw_user(user_id) {
    if (page_params.realm_presence_disabled) {
        return;
    }

    const filter_text = get_filter_text();

    if (!buddy_data.matches_filter(filter_text, user_id)) {
        return;
    }

    const info = buddy_data.get_item(user_id);

    buddy_list.insert_or_move({
        key: user_id,
        item: info,
    });
}

export function searching() {
    return user_filter && user_filter.searching();
}

export function build_user_sidebar() {
    if (page_params.realm_presence_disabled) {
        return undefined;
    }

    const filter_text = get_filter_text();

    const user_ids = buddy_data.get_filtered_and_sorted_user_ids(filter_text);

    blueslip.measure_time("buddy_list.populate", () => {
        buddy_list.populate({keys: user_ids});
    });

    return user_ids; // for testing
}

function do_update_users_for_search() {
    // Hide all the popovers but not userlist sidebar
    // when the user is searching.
    popovers.hide_all_except_sidebars();
    build_user_sidebar();
    user_cursor.reset();
}

const update_users_for_search = _.throttle(do_update_users_for_search, 50);

export function compute_active_status() {
    // The overall algorithm intent for the `status` field is to send
    // `ACTIVE` (aka green circle) if we know the user is at their
    // computer, and IDLE (aka orange circle) if the user might not
    // be:
    //
    // * For the web app, we just know whether this window has focus.
    // * For the electron desktop app, we also know whether the
    //   user is active or idle elsewhere on their system.
    //
    // The check for `get_idle_on_system === undefined` is feature
    // detection; older desktop app releases never set that property.
    if (
        window.electron_bridge !== undefined &&
        window.electron_bridge.get_idle_on_system !== undefined
    ) {
        if (window.electron_bridge.get_idle_on_system()) {
            return IDLE;
        }
        return ACTIVE;
    }

    if (client_is_active) {
        return ACTIVE;
    }
    return IDLE;
}

export function send_presence_to_server(want_redraw) {
    // Zulip has 2 data feeds coming from the server to the client:
    // The server_events data, and this presence feed.  Data from
    // server_events is nicely serialized, but if we've been offline
    // and not running for a while (e.g. due to suspend), we can end
    // up with inconsistent state where users appear in presence that
    // don't appear in people.js.  We handle this in 2 stages.  First,
    // here, we trigger an extra run of the clock-jump check that
    // detects whether this device just resumed from suspend.  This
    // ensures that watchdog.suspect_offline is always up-to-date
    // before we initiate a presence request.
    //
    // If we did just resume, it will also trigger an immediate
    // server_events request to the server (the success handler to
    // which will clear suspect_offline and potentially trigger a
    // reload if the device was offline for more than
    // DEFAULT_EVENT_QUEUE_TIMEOUT_SECS).
    if (page_params.is_spectator) {
        return;
    }

    watchdog.check_for_unsuspend();

    channel.post({
        url: "/json/users/me/presence",
        data: {
            status: compute_active_status(),
            ping_only: !want_redraw,
            new_user_input,
            slim_presence: true,
        },
        idempotent: true,
        success(data) {
            // Update Zephyr mirror activity warning
            if (data.zephyr_mirror_active === false) {
                $("#zephyr-mirror-error").addClass("show");
            } else {
                $("#zephyr-mirror-error").removeClass("show");
            }

            new_user_input = false;

            if (want_redraw) {
                presence.set_info(data.presences, data.server_timestamp);
                redraw();
            }
        },
    });
}

export function mark_client_active() {
    // exported for testing
    if (!client_is_active) {
        client_is_active = true;
        send_presence_to_server(false);
    }
}

export function initialize() {
    $("html").on("mousemove", () => {
        new_user_input = true;
    });

    $(window).on("focus", mark_client_active);
    $(window).idle({
        idle: DEFAULT_IDLE_TIMEOUT_MS,
        onIdle: mark_client_idle,
        onActive: mark_client_active,
        keepTracking: true,
    });

    set_cursor_and_filter();

    build_user_sidebar();

    buddy_list.start_scroll_handler();

    // Let the server know we're here, but pass "false" for
    // want_redraw, since we just got all this info in page_params.
    send_presence_to_server(false);

    function get_full_presence_list_update() {
        send_presence_to_server(true);
    }

    setInterval(get_full_presence_list_update, ACTIVE_PING_INTERVAL_MS);
}

export function update_presence_info(user_id, info, server_time) {
    presence.update_info_from_event(user_id, info, server_time);
    redraw_user(user_id);
    pm_list.update_private_messages();
}

export function on_set_away(user_id) {
    user_status.set_away(user_id);
    redraw_user(user_id);
    pm_list.update_private_messages();
}

export function on_revoke_away(user_id) {
    user_status.revoke_away(user_id);
    redraw_user(user_id);
    pm_list.update_private_messages();
}

export function redraw() {
    build_user_sidebar();
    user_cursor.redraw();
    pm_list.update_private_messages();
}

export function reset_users() {
    // Call this when we're leaving the search widget.
    build_user_sidebar();
    user_cursor.clear();
}

export function narrow_for_user(opts) {
    const user_id = buddy_list.get_key_from_li({$li: opts.$li});
    return narrow_for_user_id({user_id});
}

export function narrow_for_user_id(opts) {
    const person = people.get_by_user_id(opts.user_id);
    const email = person.email;

    narrow.by("pm-with", email, {trigger: "sidebar"});
    user_filter.clear_and_hide_search();
}

function keydown_enter_key() {
    const user_id = user_cursor.get_key();
    if (user_id === undefined) {
        return;
    }

    narrow_for_user_id({user_id});
    popovers.hide_all();
}

export function set_cursor_and_filter() {
    user_cursor = new ListCursor({
        list: buddy_list,
        highlight_class: "highlighted_user",
    });

    user_filter = new UserSearch({
        update_list: update_users_for_search,
        reset_items: reset_users,
        on_focus: () => user_cursor.reset(),
    });

    const $input = user_filter.input_field();

    $input.on("blur", () => user_cursor.clear());

    keydown_util.handle({
        $elem: $input,
        handlers: {
            Enter() {
                keydown_enter_key();
                return true;
            },
            ArrowUp() {
                user_cursor.prev();
                return true;
            },
            ArrowDown() {
                user_cursor.next();
                return true;
            },
        },
    });
}

export function initiate_search() {
    if (user_filter) {
        user_filter.initiate_search();
    }
}

export function escape_search() {
    if (user_filter) {
        user_filter.escape_search();
    }
}

export function get_filter_text() {
    if (!user_filter) {
        // This may be overly defensive, but there may be
        // situations where get called before everything is
        // fully initialized.  The empty string is a fine
        // default here.
        blueslip.warn("get_filter_text() is called before initialization");
        return "";
    }

    return user_filter.text();
}
