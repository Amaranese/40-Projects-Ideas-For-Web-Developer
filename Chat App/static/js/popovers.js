import ClipboardJS from "clipboard";
import {add, formatISO, parseISO, set} from "date-fns";
import ConfirmDatePlugin from "flatpickr/dist/plugins/confirmDate/confirmDate";
import $ from "jquery";
import tippy, {hideAll} from "tippy.js";

import render_actions_popover_content from "../templates/actions_popover_content.hbs";
import render_no_arrow_popover from "../templates/no_arrow_popover.hbs";
import render_playground_links_popover_content from "../templates/playground_links_popover_content.hbs";
import render_remind_me_popover_content from "../templates/remind_me_popover_content.hbs";
import render_user_group_info_popover from "../templates/user_group_info_popover.hbs";
import render_user_group_info_popover_content from "../templates/user_group_info_popover_content.hbs";
import render_user_info_popover_content from "../templates/user_info_popover_content.hbs";
import render_user_info_popover_title from "../templates/user_info_popover_title.hbs";

import * as blueslip from "./blueslip";
import * as buddy_data from "./buddy_data";
import * as channel from "./channel";
import * as compose_actions from "./compose_actions";
import * as compose_state from "./compose_state";
import * as compose_ui from "./compose_ui";
import * as condense from "./condense";
import * as dialog_widget from "./dialog_widget";
import * as emoji_picker from "./emoji_picker";
import * as feature_flags from "./feature_flags";
import * as giphy from "./giphy";
import * as hash_util from "./hash_util";
import {$t, $t_html} from "./i18n";
import * as message_edit from "./message_edit";
import * as message_edit_history from "./message_edit_history";
import * as message_lists from "./message_lists";
import * as message_viewport from "./message_viewport";
import * as muted_users from "./muted_users";
import * as muted_users_ui from "./muted_users_ui";
import * as narrow from "./narrow";
import * as narrow_state from "./narrow_state";
import * as overlays from "./overlays";
import {page_params} from "./page_params";
import * as people from "./people";
import * as popover_menus from "./popover_menus";
import * as realm_playground from "./realm_playground";
import * as reminder from "./reminder";
import * as resize from "./resize";
import * as rows from "./rows";
import * as settings_config from "./settings_config";
import * as settings_data from "./settings_data";
import * as settings_users from "./settings_users";
import * as stream_popover from "./stream_popover";
import * as ui_report from "./ui_report";
import * as user_groups from "./user_groups";
import * as user_status from "./user_status";
import * as user_status_ui from "./user_status_ui";
import * as util from "./util";

let $current_actions_popover_elem;
let current_flatpickr_instance;
let $current_message_info_popover_elem;
let $current_user_info_popover_elem;
let $current_playground_links_popover_elem;
let userlist_placement = "right";

let list_of_popovers = [];

export function clear_for_testing() {
    $current_actions_popover_elem = undefined;
    current_flatpickr_instance = undefined;
    $current_message_info_popover_elem = undefined;
    $current_user_info_popover_elem = undefined;
    $current_playground_links_popover_elem = undefined;
    list_of_popovers.length = 0;
    userlist_placement = "right";
}

export function clipboard_enable(arg) {
    // arg is a selector or element
    // We extract this function for testing purpose.
    return new ClipboardJS(arg);
}

export function elem_to_user_id($elem) {
    return Number.parseInt($elem.attr("data-user-id"), 10);
}

// this utilizes the proxy pattern to intercept all calls to $.fn.popover
// and push the $.fn.data($o, "popover") results to an array.
// this is needed so that when we try to unload popovers, we can kill all dead
// ones that no longer have valid parents in the DOM.
const old_popover = $.fn.popover;
$.fn.popover = Object.assign(function (...args) {
    // apply the jQuery object as `this`, and popover function arguments.
    old_popover.apply(this, args);

    // if there is a valid "popover" key in the jQuery data object then
    // push it to the array.
    if (this.data("popover")) {
        list_of_popovers.push(this.data("popover"));
    }
}, old_popover);

function copy_email_handler(e) {
    const $email_el = $(e.trigger.parentElement);
    const $copy_icon = $email_el.find("i");

    // only change the parent element's text back to email
    // and not overwrite the tooltip.
    const email_textnode = $email_el[0].childNodes[2];

    $email_el.addClass("email_copied");
    email_textnode.nodeValue = $t({defaultMessage: "Email copied"});

    setTimeout(() => {
        $email_el.removeClass("email_copied");
        email_textnode.nodeValue = $copy_icon.attr("data-clipboard-text");
    }, 1500);
    e.clearSelection();
}

function init_email_clipboard() {
    /*
        This shows (and enables) the copy-text icon for folks
        who have names that would overflow past the right
        edge of our user mention popup.
    */
    $(".user_popover_email").each(function () {
        if (this.clientWidth < this.scrollWidth) {
            const $email_el = $(this);
            const $copy_email_icon = $email_el.find("i");

            /*
                For deactivated users, the copy-email icon will
                not even be present in the HTML, so we don't do
                anything.  We don't reveal emails for deactivated
                users.
            */
            if ($copy_email_icon[0]) {
                $copy_email_icon.removeClass("hide_copy_icon");
                const copy_email_clipboard = clipboard_enable($copy_email_icon[0]);
                copy_email_clipboard.on("success", copy_email_handler);
            }
        }
    });
}

function init_email_tooltip(user) {
    /*
        This displays the email tooltip for folks
        who have names that would overflow past the right
        edge of our user mention popup.
    */

    $(".user_popover_email").each(function () {
        if (this.clientWidth < this.scrollWidth) {
            tippy(this, {
                placement: "bottom",
                content: people.get_visible_email(user),
                interactive: true,
            });
        }
    });
}

function load_medium_avatar(user, $elt) {
    const user_avatar_url = people.medium_avatar_url_for_person(user);
    const sender_avatar_medium = new Image();

    sender_avatar_medium.src = user_avatar_url;
    $(sender_avatar_medium).on("load", function () {
        $elt.css("background-image", "url(" + $(this).attr("src") + ")");
    });
}

function calculate_info_popover_placement(size, $elt) {
    const ypos = $elt.offset().top;

    if (!(ypos + size / 2 < message_viewport.height() && ypos > size / 2)) {
        if (ypos + size < message_viewport.height()) {
            return "bottom";
        } else if (ypos > size) {
            return "top";
        }
    }

    return undefined;
}

function render_user_info_popover(
    user,
    popover_element,
    is_sender_popover,
    has_message_context,
    private_msg_class,
    template_class,
    popover_placement,
) {
    const is_me = people.is_my_user_id(user.user_id);

    let can_set_away = false;
    let can_revoke_away = false;

    if (is_me) {
        if (user_status.is_away(user.user_id)) {
            can_revoke_away = true;
        } else {
            can_set_away = true;
        }
    }

    const muting_allowed = !is_me && !user.is_bot;
    const is_active = people.is_active_user_for_popover(user.user_id);
    const is_muted = muted_users.is_user_muted(user.user_id);
    const status_text = user_status.get_status_text(user.user_id);
    const status_emoji_info = user_status.get_status_emoji(user.user_id);

    const spectator_view = page_params.is_spectator;
    let date_joined;
    if (spectator_view) {
        const dateFormat = new Intl.DateTimeFormat("default", {dateStyle: "long"});
        date_joined = dateFormat.format(parseISO(user.date_joined));
    }

    const args = {
        can_revoke_away,
        can_set_away,
        can_mute: muting_allowed && !is_muted,
        can_manage_user: page_params.is_admin && !is_me,
        can_send_private_message:
            is_active &&
            !is_me &&
            page_params.realm_private_message_policy !==
                settings_config.private_message_policy_values.disabled.code,
        can_unmute: muting_allowed && is_muted,
        has_message_context,
        is_active,
        is_bot: user.is_bot,
        is_me,
        is_sender_popover,
        pm_with_url: hash_util.pm_with_url(user.email),
        user_circle_class: buddy_data.get_user_circle_class(user.user_id),
        private_message_class: private_msg_class,
        sent_by_uri: hash_util.by_sender_url(user.email),
        show_email: settings_data.show_email(),
        show_user_profile: !user.is_bot,
        user_email: people.get_visible_email(user),
        user_full_name: user.full_name,
        user_id: user.user_id,
        user_last_seen_time_status: buddy_data.user_last_seen_time_status(user.user_id),
        user_time: people.get_user_time(user.user_id),
        user_type: people.get_user_type(user.user_id),
        status_content_available: Boolean(status_text || status_emoji_info),
        status_text,
        status_emoji_info,
        user_mention_syntax: people.get_mention_syntax(user.full_name, user.user_id),
        date_joined,
        spectator_view,
    };

    if (user.is_bot) {
        const is_system_bot = user.is_system_bot;
        const bot_owner_id = user.bot_owner_id;
        if (is_system_bot) {
            args.is_system_bot = is_system_bot;
        } else if (bot_owner_id) {
            const bot_owner = people.get_by_user_id(bot_owner_id);
            args.bot_owner = bot_owner;
        }
    }

    popover_element.popover({
        content: render_user_info_popover_content(args),
        // TODO: Determine whether `fixed` should be applied
        // unconditionally.  Right now, we only do it for the user
        // sidebar version of the popover.
        fixed: template_class === "user_popover",
        placement: popover_placement,
        template: render_no_arrow_popover({class: template_class}),
        title: render_user_info_popover_title({
            // See the load_medium_avatar comment for important background.
            user_avatar: people.small_avatar_url_for_person(user),
            user_is_guest: user.is_guest,
        }),
        html: true,
        trigger: "manual",
        top_offset: $("#userlist-title").offset().top + 15,
        fix_positions: true,
    });
    popover_element.popover("show");

    init_email_clipboard();
    init_email_tooltip(user);

    // Note: We pass the normal-size avatar in initial rendering, and
    // then query the server to replace it with the medium-size
    // avatar.  The purpose of this double-fetch approach is to take
    // advantage of the fact that the browser should already have the
    // low-resolution image cached and thus display a low-resolution
    // avatar rather than a blank area during the network delay for
    // fetching the medium-size one.
    load_medium_avatar(user, $(".popover-avatar"));
}

// exporting for testability
export const _test_calculate_info_popover_placement = calculate_info_popover_placement;

// element is the target element to pop off of
// user is the user whose profile to show
// message is the message containing it, which should be selected
function show_user_info_popover_for_message(element, user, message) {
    const $last_popover_elem = $current_message_info_popover_elem;
    hide_all();
    if ($last_popover_elem !== undefined && $last_popover_elem.get()[0] === element) {
        // We want it to be the case that a user can dismiss a popover
        // by clicking on the same element that caused the popover.
        return;
    }
    message_lists.current.select_id(message.id);
    const $elt = $(element);
    if ($elt.data("popover") === undefined) {
        if (user === undefined) {
            // This is never supposed to happen, not even for deactivated
            // users, so we'll need to debug this error if it occurs.
            blueslip.error("Bad sender in message" + message.sender_id);
            return;
        }

        const is_sender_popover = message.sender_id === user.user_id;
        render_user_info_popover(
            user,
            $elt,
            is_sender_popover,
            true,
            "respond_personal_button",
            "message-info-popover",
            "right",
        );

        $current_message_info_popover_elem = $elt;
    }
}

export function show_user_info_popover(element, user) {
    const $last_popover_elem = $current_user_info_popover_elem;
    hide_all();
    if ($last_popover_elem !== undefined && $last_popover_elem.get()[0] === element) {
        return;
    }
    const $elt = $(element);
    render_user_info_popover(
        user,
        $elt,
        false,
        false,
        "compose_private_message",
        "user-info-popover",
        "right",
    );
    $current_user_info_popover_elem = $elt;
}

function get_user_info_popover_for_message_items() {
    if (!$current_message_info_popover_elem) {
        blueslip.error("Trying to get menu items when action popover is closed.");
        return undefined;
    }

    const popover_data = $current_message_info_popover_elem.data("popover");
    if (!popover_data) {
        blueslip.error("Cannot find popover data for actions menu.");
        return undefined;
    }

    return $("li:not(.divider):visible a", popover_data.$tip);
}

function get_user_info_popover_items() {
    const $popover_elt = $("div.user-info-popover");
    if (!$current_user_info_popover_elem || !$popover_elt.length) {
        blueslip.error("Trying to get menu items when action popover is closed.");
        return undefined;
    }

    if ($popover_elt.length >= 2) {
        blueslip.error("More than one user info popovers cannot be opened at same time.");
        return undefined;
    }

    return $("li:not(.divider):visible a", $popover_elt);
}

function fetch_group_members(member_ids) {
    return member_ids
        .map((m) => people.get_by_user_id(m))
        .filter((m) => m !== undefined)
        .map((p) => ({
            ...p,
            user_circle_class: buddy_data.get_user_circle_class(p.user_id),
            is_active: people.is_active_user_for_popover(p.user_id),
            user_last_seen_time_status: buddy_data.user_last_seen_time_status(p.user_id),
        }));
}

function sort_group_members(members) {
    return members.sort((a, b) => util.strcmp(a.full_name, b.fullname));
}

// exporting these functions for testing purposes
export const _test_fetch_group_members = fetch_group_members;

export const _test_sort_group_members = sort_group_members;

// element is the target element to pop off of
// user is the user whose profile to show
// message is the message containing it, which should be selected
function show_user_group_info_popover(element, group, message) {
    const $last_popover_elem = $current_message_info_popover_elem;
    // hardcoded pixel height of the popover
    // note that the actual size varies (in group size), but this is about as big as it gets
    const popover_size = 390;
    hide_all();
    if ($last_popover_elem !== undefined && $last_popover_elem.get()[0] === element) {
        // We want it to be the case that a user can dismiss a popover
        // by clicking on the same element that caused the popover.
        return;
    }
    message_lists.current.select_id(message.id);
    const $elt = $(element);
    if ($elt.data("popover") === undefined) {
        const args = {
            group_name: group.name,
            group_description: group.description,
            members: sort_group_members(fetch_group_members(Array.from(group.members))),
        };
        $elt.popover({
            placement: calculate_info_popover_placement(popover_size, $elt),
            template: render_user_group_info_popover({class: "message-info-popover"}),
            content: render_user_group_info_popover_content(args),
            html: true,
            trigger: "manual",
        });
        $elt.popover("show");
        $current_message_info_popover_elem = $elt;
    }
}

export function toggle_actions_popover(element, id) {
    const $last_popover_elem = $current_actions_popover_elem;
    hide_all();
    if ($last_popover_elem !== undefined && $last_popover_elem.get()[0] === element) {
        // We want it to be the case that a user can dismiss a popover
        // by clicking on the same element that caused the popover.
        return;
    }

    $(element).closest(".message_row").toggleClass("has_popover has_actions_popover");
    message_lists.current.select_id(id);
    const not_spectator = !page_params.is_spectator;
    const $elt = $(element);
    if ($elt.data("popover") === undefined) {
        const message = message_lists.current.get(id);
        const message_container = message_lists.current.view.message_containers.get(message.id);
        const should_display_hide_option =
            muted_users.is_user_muted(message.sender_id) &&
            !message_container.is_hidden &&
            not_spectator;
        const editability = message_edit.get_editability(message);
        let use_edit_icon;
        let editability_menu_item;
        if (editability === message_edit.editability_types.FULL) {
            use_edit_icon = true;
            editability_menu_item = $t({defaultMessage: "Edit"});
        } else if (editability === message_edit.editability_types.TOPIC_ONLY) {
            use_edit_icon = false;
            editability_menu_item = $t({defaultMessage: "View source / Move message"});
        } else {
            use_edit_icon = false;
            editability_menu_item = $t({defaultMessage: "View source"});
        }

        const should_display_edit_history_option =
            message.edit_history &&
            message.edit_history.some(
                (entry) =>
                    entry.prev_content !== undefined ||
                    entry.prev_stream !== undefined ||
                    entry.prev_topic !== undefined,
            ) &&
            page_params.realm_allow_edit_history &&
            not_spectator;

        // Disabling this for /me messages is a temporary workaround
        // for the fact that we don't have a styling for how that
        // should look.  See also condense.js.
        const should_display_collapse =
            !message.locally_echoed &&
            !message.is_me_message &&
            !message.collapsed &&
            not_spectator;
        const should_display_uncollapse =
            !message.locally_echoed && !message.is_me_message && message.collapsed;

        const should_display_edit_and_view_source =
            message.content !== "<p>(deleted)</p>" ||
            editability === message_edit.editability_types.FULL ||
            editability === message_edit.editability_types.TOPIC_ONLY;
        const should_display_quote_and_reply =
            message.content !== "<p>(deleted)</p>" && not_spectator;

        const conversation_time_uri = hash_util.by_conversation_and_time_url(message);

        const should_display_delete_option =
            message_edit.get_deletability(message) && not_spectator;
        const args = {
            message_id: message.id,
            historical: message.historical,
            stream_id: message.stream_id,
            use_edit_icon,
            editability_menu_item,
            should_display_collapse,
            should_display_uncollapse,
            should_display_add_reaction_option: message.sent_by_me,
            should_display_edit_history_option,
            should_display_hide_option,
            conversation_time_uri,
            narrowed: narrow_state.active(),
            should_display_delete_option,
            should_display_reminder_option: feature_flags.reminders_in_message_action_menu,
            should_display_edit_and_view_source,
            should_display_quote_and_reply,
        };

        const ypos = $elt.offset().top;
        $elt.popover({
            // Popover height with 7 items in it is ~190 px
            placement: message_viewport.height() - ypos < 220 ? "top" : "bottom",
            title: "",
            content: render_actions_popover_content(args),
            html: true,
            trigger: "manual",
        });
        $elt.popover("show");
        $current_actions_popover_elem = $elt;
    }
}

export function render_actions_remind_popover(element, id) {
    hide_all();
    $(element).closest(".message_row").toggleClass("has_popover has_actions_popover");
    message_lists.current.select_id(id);
    const $elt = $(element);
    if ($elt.data("popover") === undefined) {
        const message = message_lists.current.get(id);
        const args = {
            message,
        };
        const ypos = $elt.offset().top;
        $elt.popover({
            // Popover height with 7 items in it is ~190 px
            placement: message_viewport.height() - ypos < 220 ? "top" : "bottom",
            title: "",
            content: render_remind_me_popover_content(args),
            html: true,
            trigger: "manual",
        });
        $elt.popover("show");
        current_flatpickr_instance = $(
            `.remind.custom[data-message-id="${CSS.escape(message.id)}"]`,
        ).flatpickr({
            enableTime: true,
            clickOpens: false,
            defaultDate: "today",
            minDate: "today",
            plugins: [new ConfirmDatePlugin({})],
        });
        $current_actions_popover_elem = $elt;
    }
}

function get_action_menu_menu_items() {
    if (!$current_actions_popover_elem) {
        blueslip.error("Trying to get menu items when action popover is closed.");
        return undefined;
    }

    const popover_data = $current_actions_popover_elem.data("popover");
    if (!popover_data) {
        blueslip.error("Cannot find popover data for actions menu.");
        return undefined;
    }

    return $("li:not(.divider):visible a", popover_data.$tip);
}

export function focus_first_popover_item($items) {
    if (!$items) {
        return;
    }

    $items.eq(0).expectOne().trigger("focus");
}

export function popover_items_handle_keyboard(key, $items) {
    if (!$items) {
        return;
    }

    let index = $items.index($items.filter(":focus"));

    if (key === "enter" && index >= 0 && index < $items.length) {
        $items[index].click();
        return;
    }
    if (index === -1) {
        index = 0;
    } else if ((key === "down_arrow" || key === "vim_down") && index < $items.length - 1) {
        index += 1;
    } else if ((key === "up_arrow" || key === "vim_up") && index > 0) {
        index -= 1;
    }
    $items.eq(index).trigger("focus");
}

function focus_first_action_popover_item() {
    // For now I recommend only calling this when the user opens the menu with a hotkey.
    // Our popup menus act kind of funny when you mix keyboard and mouse.
    const $items = get_action_menu_menu_items();
    focus_first_popover_item($items);
}

export function open_message_menu(message) {
    if (message.locally_echoed) {
        // Don't open the popup for locally echoed messages for now.
        // It creates bugs with things like keyboard handlers when
        // we get the server response.
        return true;
    }

    const message_id = message.id;
    toggle_actions_popover($(".selected_message .actions_hover")[0], message_id);
    if ($current_actions_popover_elem) {
        focus_first_action_popover_item();
    }
    return true;
}

export function actions_menu_handle_keyboard(key) {
    const $items = get_action_menu_menu_items();
    popover_items_handle_keyboard(key, $items);
}

export function actions_popped() {
    return $current_actions_popover_elem !== undefined;
}

export function hide_actions_popover() {
    if (actions_popped()) {
        $(".has_popover").removeClass("has_popover has_actions_popover");
        $current_actions_popover_elem.popover("destroy");
        $current_actions_popover_elem = undefined;
    }
    if (current_flatpickr_instance !== undefined) {
        current_flatpickr_instance.destroy();
        current_flatpickr_instance = undefined;
    }
}

export function message_info_popped() {
    return $current_message_info_popover_elem !== undefined;
}

export function hide_message_info_popover() {
    if (message_info_popped()) {
        $current_message_info_popover_elem.popover("destroy");
        $current_message_info_popover_elem = undefined;
    }
}

export function user_info_popped() {
    return $current_user_info_popover_elem !== undefined;
}

export function hide_user_info_popover() {
    if (user_info_popped()) {
        $current_user_info_popover_elem.popover("destroy");
        $current_user_info_popover_elem = undefined;
    }
}

export function hide_userlist_sidebar() {
    $(".app-main .column-right").removeClass("expanded");
}

export function hide_pm_list_sidebar() {
    $(".app-main .column-left").removeClass("expanded");
}

export function show_userlist_sidebar() {
    $(".app-main .column-right").addClass("expanded");
    resize.resize_page_components();
}

export function show_pm_list_sidebar() {
    $(".app-main .column-left").addClass("expanded");
    resize.resize_page_components();
}

let current_user_sidebar_user_id;
let current_user_sidebar_popover;

export function user_sidebar_popped() {
    return current_user_sidebar_popover !== undefined;
}

export function hide_user_sidebar_popover() {
    if (user_sidebar_popped()) {
        // this hide_* method looks different from all the others since
        // the presence list may be redrawn. Due to funkiness with jQuery's .data()
        // this would confuse $.popover("destroy"), which looks at the .data() attached
        // to a certain element. We thus save off the .data("popover") in the
        // show_user_sidebar_popover and inject it here before calling destroy.
        $("#user_presences").data("popover", current_user_sidebar_popover);
        $("#user_presences").popover("destroy");
        current_user_sidebar_user_id = undefined;
        current_user_sidebar_popover = undefined;
    }
}

function hide_all_user_info_popovers() {
    hide_message_info_popover();
    hide_user_sidebar_popover();
    hide_user_info_popover();
}

function focus_user_info_popover_item() {
    // For now I recommend only calling this when the user opens the menu with a hotkey.
    // Our popup menus act kind of funny when you mix keyboard and mouse.
    const $items = get_user_info_popover_for_message_items();
    focus_first_popover_item($items);
}

function get_user_sidebar_popover_items() {
    if (!current_user_sidebar_popover) {
        blueslip.error("Trying to get menu items when user sidebar popover is closed.");
        return undefined;
    }

    return $("li:not(.divider):visible > a", current_user_sidebar_popover.$tip);
}

export function user_sidebar_popover_handle_keyboard(key) {
    const $items = get_user_sidebar_popover_items();
    popover_items_handle_keyboard(key, $items);
}

export function user_info_popover_for_message_handle_keyboard(key) {
    const $items = get_user_info_popover_for_message_items();
    popover_items_handle_keyboard(key, $items);
}

export function user_info_popover_handle_keyboard(key) {
    const $items = get_user_info_popover_items();
    popover_items_handle_keyboard(key, $items);
}

export function show_sender_info() {
    const $message = $(".selected_message");
    const $sender = $message.find(".sender_info_hover");

    const message = message_lists.current.get(rows.id($message));
    const user = people.get_by_user_id(message.sender_id);
    show_user_info_popover_for_message($sender[0], user, message);
    if ($current_message_info_popover_elem && !page_params.is_spectator) {
        focus_user_info_popover_item();
    }
}

// On mobile web, opening the keyboard can trigger a resize event
// (which in turn can trigger a scroll event).  This will have the
// side effect of closing popovers, which we don't want.  So we
// suppress the first hide from scrolling after a resize using this
// variable.
let suppress_scroll_hide = false;

export function set_suppress_scroll_hide() {
    suppress_scroll_hide = true;
}

// Playground_info contains all the data we need to generate a popover of
// playground links for each code block. The element is the target element
// to pop off of.
export function toggle_playground_link_popover(element, playground_info) {
    const $last_popover_elem = $current_playground_links_popover_elem;
    hide_all();
    if ($last_popover_elem !== undefined && $last_popover_elem.get()[0] === element) {
        // We want it to be the case that a user can dismiss a popover
        // by clicking on the same element that caused the popover.
        return;
    }
    const $elt = $(element);
    if ($elt.data("popover") === undefined) {
        const ypos = $elt.offset().top;
        $elt.popover({
            // It's unlikely we'll have more than 3-4 playground links
            // for one language, so it should be OK to hardcode 120 here.
            placement: message_viewport.height() - ypos < 120 ? "top" : "bottom",
            title: "",
            content: render_playground_links_popover_content({playground_info}),
            html: true,
            trigger: "manual",
        });
        $elt.popover("show");
        $current_playground_links_popover_elem = $elt;
    }
}

export function hide_playground_links_popover() {
    if ($current_playground_links_popover_elem !== undefined) {
        $current_playground_links_popover_elem.popover("destroy");
        $current_playground_links_popover_elem = undefined;
    }
}

export function register_click_handlers() {
    $("#main_div").on("click", ".actions_hover", function (e) {
        const $row = $(this).closest(".message_row");
        e.stopPropagation();
        toggle_actions_popover(this, rows.id($row));
    });

    $("#main_div").on(
        "click",
        ".sender_name, .sender_name-in-status, .inline_profile_picture",
        function (e) {
            const $row = $(this).closest(".message_row");
            e.stopPropagation();
            const message = message_lists.current.get(rows.id($row));
            const user = people.get_by_user_id(message.sender_id);
            show_user_info_popover_for_message(this, user, message);
        },
    );

    $("#main_div").on("click", ".user-mention", function (e) {
        const id_string = $(this).attr("data-user-id");
        // We fallback to email to handle legacy Markdown that was rendered
        // before we cut over to using data-user-id
        const email = $(this).attr("data-user-email");
        if (id_string === "*" || email === "*") {
            return;
        }
        const $row = $(this).closest(".message_row");
        e.stopPropagation();
        const message = message_lists.current.get(rows.id($row));
        let user;
        if (id_string) {
            const user_id = Number.parseInt(id_string, 10);
            user = people.get_by_user_id(user_id);
        } else {
            user = people.get_by_email(email);
        }
        show_user_info_popover_for_message(this, user, message);
    });

    $("#main_div").on("click", ".user-group-mention", function (e) {
        const user_group_id = Number.parseInt($(this).attr("data-user-group-id"), 10);
        const $row = $(this).closest(".message_row");
        e.stopPropagation();
        const message = message_lists.current.get(rows.id($row));
        try {
            const group = user_groups.get_user_group_from_id(user_group_id);
            show_user_group_info_popover(this, group, message);
        } catch {
            // This user group has likely been deleted.
            blueslip.info("Unable to find user group in message" + message.sender_id);
        }
    });

    $("#main_div, #preview_content, #message-history").on(
        "click",
        ".code_external_link",
        function (e) {
            const $view_in_playground_button = $(this);
            const $codehilite_div = $(this).closest(".codehilite");
            e.stopPropagation();
            const playground_info = realm_playground.get_playground_info_for_languages(
                $codehilite_div.data("code-language"),
            );
            // We do the code extraction here and set the target href combining the url_prefix
            // and the extracted code. Depending on whether the language has multiple playground
            // links configured, a popover is show.
            const extracted_code = $codehilite_div.find("code").text();
            if (playground_info.length === 1) {
                const url_prefix = playground_info[0].url_prefix;
                $view_in_playground_button.attr(
                    "href",
                    url_prefix + encodeURIComponent(extracted_code),
                );
            } else {
                for (const $playground of playground_info) {
                    $playground.playground_url =
                        $playground.url_prefix + encodeURIComponent(extracted_code);
                }
                toggle_playground_link_popover(this, playground_info);
            }
        },
    );

    $("body").on("click", ".popover_playground_link", (e) => {
        hide_playground_links_popover();
        e.stopPropagation();
    });

    $("body").on("click", ".info_popover_actions .narrow_to_private_messages", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        const email = people.get_by_user_id(user_id).email;
        hide_all();
        if (overlays.settings_open()) {
            overlays.close_overlay("settings");
        }
        narrow.by("pm-with", email, {trigger: "user sidebar popover"});
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".info_popover_actions .narrow_to_messages_sent", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        const email = people.get_by_user_id(user_id).email;
        hide_all();
        if (overlays.settings_open()) {
            overlays.close_overlay("settings");
        }
        narrow.by("sender", email, {trigger: "user sidebar popover"});
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".user_popover .mention_user", (e) => {
        if (!compose_state.composing()) {
            compose_actions.start("stream", {trigger: "sidebar user actions"});
        }
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        const name = people.get_by_user_id(user_id).full_name;
        const mention = people.get_mention_syntax(name, user_id);
        compose_ui.insert_syntax_and_focus(mention);
        hide_user_sidebar_popover();
        hide_userlist_sidebar();
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".message-info-popover .mention_user", (e) => {
        if (!compose_state.composing()) {
            compose_actions.respond_to_message({trigger: "user sidebar popover"});
        }
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        const name = people.get_by_user_id(user_id).full_name;
        const mention = people.get_mention_syntax(name, user_id);
        compose_ui.insert_syntax_and_focus(mention);
        hide_message_info_popover();
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".info_popover_actions .clear_status", (e) => {
        e.preventDefault();
        const me = elem_to_user_id($(e.target).parents("ul"));
        user_status.server_update({
            user_id: me,
            status_text: "",
            emoji_name: "",
            emoji_code: "",
            success() {
                $(".info_popover_actions #status_message").html("");
            },
        });
    });

    $("body").on("click", ".view_user_profile", (e) => {
        const user_id = Number.parseInt($(e.target).attr("data-user-id"), 10);
        const user = people.get_by_user_id(user_id);
        show_user_info_popover(e.target, user);
        e.stopPropagation();
        e.preventDefault();
    });

    /* These click handlers are implemented as just deep links to the
     * relevant part of the Zulip UI, so we don't want preventDefault,
     * but we do want to close the modal when you click them. */

    $("body").on("click", ".set_away_status", (e) => {
        hide_all();
        user_status.server_set_away();
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".revoke_away_status", (e) => {
        hide_all();
        user_status.server_revoke_away();
        e.stopPropagation();
        e.preventDefault();
    });

    function open_user_status_modal(e) {
        hide_all();

        user_status_ui.open_user_status_modal();

        e.stopPropagation();
        e.preventDefault();
    }

    $("body").on("click", ".update_status_text", open_user_status_modal);

    // Clicking on one's own status emoji should open the user status modal.
    $("#user_presences").on(
        "click",
        ".user_sidebar_entry_me .status_emoji",
        open_user_status_modal,
    );

    $("body").on("click", ".info_popover_actions .sidebar-popover-mute-user", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        hide_all_user_info_popovers();
        e.stopPropagation();
        e.preventDefault();
        muted_users_ui.confirm_mute_user(user_id);
    });

    $("body").on("click", ".info_popover_actions .sidebar-popover-unmute-user", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        hide_all_user_info_popovers();
        muted_users_ui.unmute_user(user_id);
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".info_popover_actions .sidebar-popover-reactivate-user", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        hide_all();
        e.stopPropagation();
        e.preventDefault();
        function handle_confirm() {
            const url = "/json/users/" + encodeURIComponent(user_id) + "/reactivate";
            channel.post({
                url,
                success() {
                    dialog_widget.close_modal();
                },
                error(xhr) {
                    ui_report.error($t_html({defaultMessage: "Failed"}), xhr, $("#dialog_error"));
                    dialog_widget.hide_dialog_spinner();
                },
            });
        }
        settings_users.confirm_reactivation(user_id, handle_confirm, true);
    });

    $("#user_presences").on("click", ".user-list-sidebar-menu-icon", function (e) {
        e.stopPropagation();

        // use email of currently selected user, rather than some elem comparison,
        // as the presence list may be redrawn with new elements.
        const $target = $(this).closest("li");
        const user_id = elem_to_user_id($target.find("a"));

        if (current_user_sidebar_user_id === user_id) {
            // If the popover is already shown, clicking again should toggle it.
            // We don't want to hide the sidebars on smaller browser windows.
            hide_all_except_sidebars();
            return;
        }
        hide_all();

        if (userlist_placement === "right") {
            show_userlist_sidebar();
        } else {
            // Maintain the same behavior when displaying with the streamlist.
            stream_popover.show_streamlist_sidebar();
        }

        const user = people.get_by_user_id(user_id);
        const popover_placement = userlist_placement === "left" ? "right" : "left";

        render_user_info_popover(
            user,
            $target,
            false,
            false,
            "compose_private_message",
            "user_popover",
            popover_placement,
        );

        current_user_sidebar_user_id = user.user_id;
        current_user_sidebar_popover = $target.data("popover");
    });

    $("body").on("click", ".respond_button", (e) => {
        // Arguably, we should fetch the message ID to respond to from
        // e.target, but that should always be the current selected
        // message in the current message list (and
        // compose_actions.respond_to_message doesn't take a message
        // argument).
        compose_actions.quote_and_reply({trigger: "popover respond"});
        hide_actions_popover();
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".reminder_button", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        render_actions_remind_popover($(".selected_message .actions_hover")[0], message_id);
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".remind.custom", (e) => {
        $(e.currentTarget)[0]._flatpickr.toggle();
        e.stopPropagation();
        e.preventDefault();
    });

    function reminder_click_handler(datestr, e) {
        const message_id = $(".remind.custom").data("message-id");
        reminder.do_set_reminder_for_message(message_id, datestr);
        hide_all();
        e.stopPropagation();
        e.preventDefault();
    }

    $("body").on("click", ".remind.in_20m", (e) => {
        const datestr = formatISO(add(new Date(), {minutes: 20}));
        reminder_click_handler(datestr, e);
    });

    $("body").on("click", ".remind.in_1h", (e) => {
        const datestr = formatISO(add(new Date(), {hours: 1}));
        reminder_click_handler(datestr, e);
    });

    $("body").on("click", ".remind.in_3h", (e) => {
        const datestr = formatISO(add(new Date(), {hours: 3}));
        reminder_click_handler(datestr, e);
    });

    $("body").on("click", ".remind.tomo", (e) => {
        const datestr = formatISO(
            set(add(new Date(), {days: 1}), {hours: 9, minutes: 0, seconds: 0}),
        );
        reminder_click_handler(datestr, e);
    });

    $("body").on("click", ".remind.nxtw", (e) => {
        const datestr = formatISO(
            set(add(new Date(), {weeks: 1}), {hours: 9, minutes: 0, seconds: 0}),
        );
        reminder_click_handler(datestr, e);
    });

    $("body").on("click", ".flatpickr-calendar", (e) => {
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".flatpickr-confirm", (e) => {
        if ($(".remind.custom")[0]) {
            const datestr = $(".remind.custom")[0].value;
            reminder_click_handler(datestr, e);
        }
    });

    $("body").on("click", ".respond_personal_button, .compose_private_message", (e) => {
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        const email = people.get_by_user_id(user_id).email;
        compose_actions.start("private", {
            trigger: "popover send private",
            private_message_recipient: email,
        });
        hide_all();
        if (overlays.settings_open()) {
            overlays.close_overlay("settings");
        }
        e.stopPropagation();
        e.preventDefault();
    });
    $("body").on("click", ".popover_toggle_collapse", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        const $row = message_lists.current.get_row(message_id);
        const message = message_lists.current.get(rows.id($row));

        hide_actions_popover();

        if ($row) {
            if (message.collapsed) {
                condense.uncollapse($row);
            } else {
                condense.collapse($row);
            }
        }

        e.stopPropagation();
        e.preventDefault();
    });
    $("body").on("click", ".popover_edit_message", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        const $row = message_lists.current.get_row(message_id);
        hide_actions_popover();
        message_edit.start($row);
        e.stopPropagation();
        e.preventDefault();
    });
    $("body").on("click", ".rehide_muted_user_message", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        const $row = message_lists.current.get_row(message_id);
        const message = message_lists.current.get(rows.id($row));
        const message_container = message_lists.current.view.message_containers.get(message.id);

        hide_actions_popover();

        if ($row && !message_container.is_hidden) {
            message_lists.current.view.hide_revealed_message(message_id);
        }

        e.stopPropagation();
        e.preventDefault();
    });
    $("body").on("click", ".view_edit_history", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        const $row = message_lists.current.get_row(message_id);
        const message = message_lists.current.get(rows.id($row));

        hide_actions_popover();
        message_edit_history.show_history(message);
        $("#message-history-cancel").trigger("focus");
        e.stopPropagation();
        e.preventDefault();
    });

    $("body").on("click", ".delete_message", (e) => {
        const message_id = $(e.currentTarget).data("message-id");
        hide_actions_popover();
        message_edit.delete_message(message_id);
        e.stopPropagation();
        e.preventDefault();
    });

    clipboard_enable(".copy_link").on("success", (e) => {
        hide_actions_popover();
        // e.trigger returns the DOM element triggering the copy action
        const message_id = e.trigger.dataset.messageId;
        const $row = $(`[zid='${CSS.escape(message_id)}']`);
        $row.find(".alert-msg")
            .text($t({defaultMessage: "Copied!"}))
            .css("display", "block")
            .delay(1000)
            .fadeOut(300);

        setTimeout(() => {
            // The Clipboard library works by focusing to a hidden textarea.
            // We unfocus this so keyboard shortcuts, etc., will work again.
            $(":focus").trigger("blur");
        }, 0);
    });

    clipboard_enable(".copy_mention_syntax");

    $("body").on("click", ".copy_mention_syntax", (e) => {
        hide_all();
        e.stopPropagation();
        e.preventDefault();
    });

    {
        let last_scroll = 0;

        $(".app").on("scroll", () => {
            if (suppress_scroll_hide) {
                suppress_scroll_hide = false;
                return;
            }

            const date = Date.now();

            // only run `popovers.hide_all()` if the last scroll was more
            // than 250ms ago.
            if (date - last_scroll > 250) {
                hide_all();
            }

            // update the scroll time on every event to make sure it doesn't
            // retrigger `hide_all` while still scrolling.
            last_scroll = date;
        });
    }

    $("body").on("click", ".sidebar-popover-manage-user", (e) => {
        hide_all();
        const user_id = elem_to_user_id($(e.target).parents("ul"));
        settings_users.show_edit_user_info_modal(user_id, true);
    });
}

export function any_active() {
    // True if any popover (that this module manages) is currently shown.
    // Expanded sidebars on mobile view count as popovers as well.
    return (
        popover_menus.any_active() ||
        actions_popped() ||
        user_sidebar_popped() ||
        stream_popover.stream_popped() ||
        stream_popover.topic_popped() ||
        message_info_popped() ||
        user_info_popped() ||
        emoji_picker.reactions_popped() ||
        $("[class^='column-'].expanded").length
    );
}

// This function will hide all true popovers (the streamlist and
// userlist sidebars use the popover infrastructure, but doesn't work
// like a popover structurally).
export function hide_all_except_sidebars(opts) {
    $(".has_popover").removeClass("has_popover has_actions_popover has_emoji_popover");
    if (!opts || !opts.not_hide_tippy_instances) {
        hideAll();
    } else if (opts.exclude_tippy_instance) {
        hideAll({exclude: opts.exclude_tippy_instance});
    }
    hide_actions_popover();
    emoji_picker.hide_emoji_popover();
    giphy.hide_giphy_popover();
    stream_popover.hide_stream_popover();
    stream_popover.hide_topic_popover();
    stream_popover.hide_all_messages_popover();
    stream_popover.hide_starred_messages_popover();
    stream_popover.hide_drafts_popover();
    hide_all_user_info_popovers();
    hide_playground_links_popover();

    // look through all the popovers that have been added and removed.
    for (const $o of list_of_popovers) {
        if (!document.body.contains($o.$element[0]) && $o.$tip) {
            $o.$tip.remove();
        }
    }
    list_of_popovers = [];
}

// This function will hide all the popovers, including the mobile web
// or narrow window sidebars.
export function hide_all(not_hide_tippy_instances) {
    hide_userlist_sidebar();
    stream_popover.hide_streamlist_sidebar();
    hide_all_except_sidebars({
        exclude_tippy_instance: undefined,
        not_hide_tippy_instances,
    });
}

export function set_userlist_placement(placement) {
    userlist_placement = placement || "right";
}

export function compute_placement(
    $elt,
    popover_height,
    popover_width,
    prefer_vertical_positioning,
) {
    const client_rect = $elt.get(0).getBoundingClientRect();
    const distance_from_top = client_rect.top;
    const distance_from_bottom = message_viewport.height() - client_rect.bottom;
    const distance_from_left = client_rect.left;
    const distance_from_right = message_viewport.width() - client_rect.right;

    const elt_will_fit_horizontally =
        distance_from_left + $elt.width() / 2 > popover_width / 2 &&
        distance_from_right + $elt.width() / 2 > popover_width / 2;

    const elt_will_fit_vertically =
        distance_from_bottom + $elt.height() / 2 > popover_height / 2 &&
        distance_from_top + $elt.height() / 2 > popover_height / 2;

    // default to placing the popover in the center of the screen
    let placement = "viewport_center";

    // prioritize left/right over top/bottom
    if (distance_from_top > popover_height && elt_will_fit_horizontally) {
        placement = "top";
    }
    if (distance_from_bottom > popover_height && elt_will_fit_horizontally) {
        placement = "bottom";
    }

    if (prefer_vertical_positioning && placement !== "viewport_center") {
        // If vertical positioning is preferred and the popover fits in
        // either top or bottom position then return.
        return placement;
    }

    if (distance_from_left > popover_width && elt_will_fit_vertically) {
        placement = "left";
    }
    if (distance_from_right > popover_width && elt_will_fit_vertically) {
        placement = "right";
    }

    return placement;
}
