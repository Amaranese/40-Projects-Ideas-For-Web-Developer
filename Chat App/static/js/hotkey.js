import $ from "jquery";

import * as activity from "./activity";
import * as browser_history from "./browser_history";
import * as common from "./common";
import * as compose from "./compose";
import * as compose_actions from "./compose_actions";
import * as compose_state from "./compose_state";
import * as condense from "./condense";
import * as copy_and_paste from "./copy_and_paste";
import * as deprecated_feature_notice from "./deprecated_feature_notice";
import * as drafts from "./drafts";
import * as emoji from "./emoji";
import * as emoji_picker from "./emoji_picker";
import * as feedback_widget from "./feedback_widget";
import * as gear_menu from "./gear_menu";
import * as giphy from "./giphy";
import * as hashchange from "./hashchange";
import * as hotspots from "./hotspots";
import * as lightbox from "./lightbox";
import * as list_util from "./list_util";
import * as message_edit from "./message_edit";
import * as message_flags from "./message_flags";
import * as message_lists from "./message_lists";
import * as message_view_header from "./message_view_header";
import * as muted_topics_ui from "./muted_topics_ui";
import * as narrow from "./narrow";
import * as navigate from "./navigate";
import * as overlays from "./overlays";
import {page_params} from "./page_params";
import * as popovers from "./popovers";
import * as reactions from "./reactions";
import * as recent_topics_ui from "./recent_topics_ui";
import * as recent_topics_util from "./recent_topics_util";
import * as search from "./search";
import * as settings_data from "./settings_data";
import * as spectators from "./spectators";
import * as stream_list from "./stream_list";
import * as stream_popover from "./stream_popover";
import * as stream_settings_ui from "./stream_settings_ui";
import * as topic_zoom from "./topic_zoom";
import * as ui from "./ui";
import {user_settings} from "./user_settings";

function do_narrow_action(action) {
    action(message_lists.current.selected_id(), {trigger: "hotkey"});
    return true;
}

// For message actions and user profile menu.
const menu_dropdown_hotkeys = new Set(["down_arrow", "up_arrow", "vim_up", "vim_down", "enter"]);

// Note that multiple keys can map to the same event_name, which
// we'll do in cases where they have the exact same semantics.
// DON'T FORGET: update keyboard_shortcuts.html

// The `message_view_only` property is a convenient and performant way
// to express a common case of which hotkeys do something in which
// views.  It is set for hotkeys (like `Ctrl + S`) that only have an effect
// in the main message view with a selected message.
// `message_view_only` hotkeys, as a group, are not processed if any
// overlays are open (e.g. settings, streams, etc.).

const keydown_shift_mappings = {
    // these can be triggered by Shift + key only
    9: {name: "shift_tab", message_view_only: false}, // Tab
    32: {name: "shift_spacebar", message_view_only: true}, // space bar
    37: {name: "left_arrow", message_view_only: false}, // left arrow
    39: {name: "right_arrow", message_view_only: false}, // right arrow
    38: {name: "up_arrow", message_view_only: false}, // up arrow
    40: {name: "down_arrow", message_view_only: false}, // down arrow
};

const keydown_unshift_mappings = {
    // these can be triggered by key only (without Shift)
    9: {name: "tab", message_view_only: false}, // Tab
    27: {name: "escape", message_view_only: false}, // Esc
    32: {name: "spacebar", message_view_only: true}, // space bar
    33: {name: "page_up", message_view_only: true}, // PgUp
    34: {name: "page_down", message_view_only: true}, // PgDn
    35: {name: "end", message_view_only: true}, // End
    36: {name: "home", message_view_only: true}, // Home
    37: {name: "left_arrow", message_view_only: false}, // left arrow
    39: {name: "right_arrow", message_view_only: false}, // right arrow
    38: {name: "up_arrow", message_view_only: false}, // up arrow
    40: {name: "down_arrow", message_view_only: false}, // down arrow
};

const keydown_ctrl_mappings = {
    219: {name: "escape", message_view_only: false}, // '['
};

const keydown_cmd_or_ctrl_mappings = {
    67: {name: "copy_with_c", message_view_only: false}, // 'C'
    75: {name: "search_with_k", message_view_only: false}, // 'K'
    83: {name: "star_message", message_view_only: true}, // 'S'
    190: {name: "narrow_to_compose_target", message_view_only: true}, // '.'
};

const keydown_either_mappings = {
    // these can be triggered by key or Shift + key
    // Note that codes for letters are still case sensitive!
    //
    // We may want to revisit both of these.  For Backspace, we don't
    // have any specific mapping behavior; we are just trying to disable
    // the normal browser features for certain OSes when we are in the
    // compose box, and the little bit of Backspace-related code here is
    // dubious, but may apply to Shift-Backspace.
    // For Enter, there is some possibly that Shift-Enter is intended to
    // have special behavior for folks that are used to Shift-Enter behavior
    // in other apps, but that's also slightly dubious.
    8: {name: "backspace", message_view_only: true}, // Backspace
    13: {name: "enter", message_view_only: false}, // Enter
    46: {name: "delete", message_view_only: false}, // Delete
};

const keypress_mappings = {
    42: {name: "star_deprecated", message_view_only: true}, // '*'
    43: {name: "thumbs_up_emoji", message_view_only: true}, // '+'
    45: {name: "toggle_message_collapse", message_view_only: true}, // '-'
    47: {name: "search", message_view_only: false}, // '/'
    58: {name: "toggle_reactions_popover", message_view_only: true}, // ':'
    62: {name: "compose_quote_reply", message_view_only: true}, // '>'
    63: {name: "show_shortcuts", message_view_only: false}, // '?'
    64: {name: "compose_reply_with_mention", message_view_only: true}, // '@'
    65: {name: "stream_cycle_backward", message_view_only: true}, // 'A'
    67: {name: "C_deprecated", message_view_only: true}, // 'C'
    68: {name: "stream_cycle_forward", message_view_only: true}, // 'D'
    71: {name: "G_end", message_view_only: true}, // 'G'
    74: {name: "vim_page_down", message_view_only: true}, // 'J'
    75: {name: "vim_page_up", message_view_only: true}, // 'K'
    77: {name: "toggle_topic_mute", message_view_only: true}, // 'M'
    80: {name: "narrow_private", message_view_only: true}, // 'P'
    82: {name: "respond_to_author", message_view_only: true}, // 'R'
    83: {name: "narrow_by_topic", message_view_only: true}, // 'S'
    86: {name: "view_selected_stream", message_view_only: false}, // 'V'
    97: {name: "all_messages", message_view_only: true}, // 'a'
    99: {name: "compose", message_view_only: true}, // 'c'
    100: {name: "open_drafts", message_view_only: true}, // 'd'
    101: {name: "edit_message", message_view_only: true}, // 'e'
    103: {name: "gear_menu", message_view_only: true}, // 'g'
    104: {name: "vim_left", message_view_only: true}, // 'h'
    105: {name: "message_actions", message_view_only: true}, // 'i'
    106: {name: "vim_down", message_view_only: true}, // 'j'
    107: {name: "vim_up", message_view_only: true}, // 'k'
    108: {name: "vim_right", message_view_only: true}, // 'l'
    110: {name: "n_key", message_view_only: false}, // 'n'
    112: {name: "p_key", message_view_only: false}, // 'p'
    113: {name: "query_streams", message_view_only: true}, // 'q'
    114: {name: "reply_message", message_view_only: true}, // 'r'
    115: {name: "narrow_by_recipient", message_view_only: true}, // 's'
    116: {name: "open_recent_topics", message_view_only: true}, // 't'
    117: {name: "show_sender_info", message_view_only: true}, // 'u'
    118: {name: "show_lightbox", message_view_only: true}, // 'v'
    119: {name: "query_users", message_view_only: true}, // 'w'
    120: {name: "compose_private_message", message_view_only: true}, // 'x'
};

export function get_keydown_hotkey(e) {
    if (e.altKey) {
        return undefined;
    }

    let hotkey;

    if (e.ctrlKey && !e.shiftKey) {
        hotkey = keydown_ctrl_mappings[e.which];
        if (hotkey) {
            return hotkey;
        }
    }

    const isCmdOrCtrl = common.has_mac_keyboard() ? e.metaKey : e.ctrlKey;
    if (isCmdOrCtrl && !e.shiftKey) {
        hotkey = keydown_cmd_or_ctrl_mappings[e.which];
        if (hotkey) {
            return hotkey;
        }
        return undefined;
    } else if (e.metaKey || e.ctrlKey) {
        return undefined;
    }

    if (e.shiftKey) {
        hotkey = keydown_shift_mappings[e.which];
        if (hotkey) {
            return hotkey;
        }
    }

    if (!e.shiftKey) {
        hotkey = keydown_unshift_mappings[e.which];
        if (hotkey) {
            return hotkey;
        }
    }

    return keydown_either_mappings[e.which];
}

export function get_keypress_hotkey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) {
        return undefined;
    }

    return keypress_mappings[e.which];
}

export function processing_text() {
    const $focused_elt = $(":focus");
    return (
        $focused_elt.is("input") ||
        $focused_elt.is("select") ||
        $focused_elt.is("textarea") ||
        $focused_elt.parents(".pill-container").length >= 1 ||
        $focused_elt.attr("id") === "compose-send-button"
    );
}

export function in_content_editable_widget(e) {
    return $(e.target).is(".editable-section");
}

// Returns true if we handled it, false if the browser should.
export function process_escape_key(e) {
    if (
        recent_topics_util.is_in_focus() &&
        // This will return false if `e.target` is not
        // any of the recent topics elements by design.
        recent_topics_ui.change_focused_element($(e.target), "escape")
    ) {
        // Recent topics uses escape to switch focus from RT search / filters to topics table.
        // If focus is already on the table it returns false.
        return true;
    }

    if (feedback_widget.is_open()) {
        feedback_widget.dismiss();
        return true;
    }

    if (popovers.any_active()) {
        popovers.hide_all();
        return true;
    }

    if (overlays.is_modal_open()) {
        overlays.close_active_modal();
        return true;
    }

    if (overlays.is_active()) {
        overlays.close_active();
        return true;
    }

    if (gear_menu.is_open()) {
        gear_menu.close();
        return true;
    }

    if (processing_text()) {
        if (activity.searching()) {
            activity.escape_search();
            return true;
        }

        if (stream_list.searching()) {
            stream_list.escape_search();
            return true;
        }

        // Emoji picker goes before compose so compose emoji picker is closed properly.
        if (emoji_picker.reactions_popped()) {
            emoji_picker.hide_emoji_popover();
            return true;
        }

        if (giphy.is_popped_from_edit_messsage()) {
            giphy.focus_current_edit_message();
            // Hide after setting focus so that `edit_message_id` is
            // still set in giphy.
            giphy.hide_giphy_popover();
            return true;
        }

        if (compose_state.composing()) {
            // Check if the giphy popover was open using compose box.
            // Hide GIPHY popover if it's open.
            if (!giphy.is_popped_from_edit_messsage() && giphy.hide_giphy_popover()) {
                $("#compose-textarea").trigger("focus");
                return true;
            }

            // Check for errors in compose box; close errors if they exist
            if ($("#compose-send-status").css("display") !== "none") {
                $("#compose-send-status").hide();
                return true;
            }

            // If the user hit the Esc key, cancel the current compose
            compose_actions.cancel();
            return true;
        }

        if ($("#searchbox").has(":focus")) {
            $("input:focus,textarea:focus").trigger("blur");
            if (page_params.search_pills_enabled) {
                $("#searchbox .pill").trigger("blur");
                $("#searchbox #search_query").trigger("blur");
            } else {
                message_view_header.exit_search();
            }
            return true;
        }

        // We pressed Esc and something was focused, and the composebox
        // wasn't open. In that case, we should blur the input.
        $("input:focus,textarea:focus").trigger("blur");
        return true;
    }

    if (compose_state.composing()) {
        compose_actions.cancel();
        return true;
    }

    if (topic_zoom.is_zoomed_in()) {
        topic_zoom.zoom_out();
        return true;
    }

    /* The Ctrl+[ hotkey navigates to the default view
     * unconditionally; Esc's behavior depends on a setting. */
    if (user_settings.escape_navigates_to_default_view || e.which === 219) {
        hashchange.set_hash_to_default_view();
        return true;
    }

    return false;
}

function handle_popover_events(event_name) {
    if (popovers.actions_popped()) {
        popovers.actions_menu_handle_keyboard(event_name);
        return true;
    }

    if (popovers.message_info_popped()) {
        popovers.user_info_popover_for_message_handle_keyboard(event_name);
        return true;
    }

    if (popovers.user_info_popped()) {
        popovers.user_info_popover_handle_keyboard(event_name);
        return true;
    }

    if (popovers.user_sidebar_popped()) {
        popovers.user_sidebar_popover_handle_keyboard(event_name);
        return true;
    }

    if (stream_popover.stream_popped()) {
        stream_popover.stream_sidebar_menu_handle_keyboard(event_name);
        return true;
    }

    if (stream_popover.topic_popped()) {
        stream_popover.topic_sidebar_menu_handle_keyboard(event_name);
        return true;
    }

    if (stream_popover.all_messages_popped()) {
        stream_popover.all_messages_sidebar_menu_handle_keyboard(event_name);
        return true;
    }

    if (stream_popover.starred_messages_popped()) {
        stream_popover.starred_messages_sidebar_menu_handle_keyboard(event_name);
        return true;
    }
    return false;
}

// Returns true if we handled it, false if the browser should.
export function process_enter_key(e) {
    if ($(".dropdown.open").length && $(e.target).attr("role") === "menuitem") {
        // on #gear-menu li a[tabindex] elements, force a click and prevent default.
        // this is because these links do not have an href and so don't force a
        // default action.
        e.target.click();
        return true;
    }

    if (hotspots.is_open()) {
        $(e.target).find(".hotspot.overlay.show .hotspot-confirm").trigger("click");
        return false;
    }

    if (emoji_picker.reactions_popped()) {
        return emoji_picker.navigate("enter", e);
    }

    if (handle_popover_events("enter")) {
        return true;
    }

    if (overlays.settings_open()) {
        // On the settings page just let the browser handle
        // the Enter key for things like submitting forms.
        return false;
    }

    if (overlays.streams_open()) {
        return false;
    }

    if (processing_text()) {
        if (stream_list.searching()) {
            // This is sort of funny behavior, but I think
            // the intention is that we want it super easy
            // to close stream search.
            stream_list.clear_and_hide_search();
            return true;
        }

        return false;
    }

    // This handles when pressing Enter while looking at drafts.
    // It restores draft that is focused.
    if (overlays.drafts_open()) {
        drafts.drafts_handle_events(e, "enter");
        return true;
    }

    if ($(e.target).attr("role") === "button") {
        e.target.click();
        return true;
    }

    // All custom logic for overlays/modals is above; if we're in a
    // modal at this point, let the browser handle the event.
    if (overlays.is_modal_open()) {
        return false;
    }

    // If we're on a button or a link and have pressed Enter, let the
    // browser handle the keypress
    //
    // This is subtle and here's why: Suppose you have the focus on a
    // stream name in your left sidebar. j and k will still move your
    // cursor up and down, but Enter won't reply -- it'll just trigger
    // the link on the sidebar! So you keep pressing Enter over and
    // over again. Until you click somewhere or press r.
    if ($("a:focus,button:focus").length > 0) {
        return false;
    }

    if ($("#preview_message_area").is(":visible")) {
        compose.enter_with_preview_open();
        return true;
    }

    // If we got this far, then we're presumably in the message
    // view, so in that case "Enter" is the hotkey to respond to a message.
    // Note that "r" has same effect, but that is handled in process_hotkey().
    compose_actions.respond_to_message({trigger: "hotkey enter"});
    return true;
}

export function process_tab_key() {
    // Returns true if we handled it, false if the browser should.
    // TODO: See if browsers like Safari can now handle tabbing correctly
    // without our intervention.

    let $message_edit_form;

    const $focused_message_edit_content = $(".message_edit_content:focus");
    if ($focused_message_edit_content.length > 0) {
        $message_edit_form = $focused_message_edit_content.closest(".message_edit_form");
        // Open message edit forms either have a save button or a close button, but not both.
        $message_edit_form.find(".message_edit_save,.message_edit_close").trigger("focus");
        return true;
    }

    const $focused_message_edit_save = $(".message_edit_save:focus");
    if ($focused_message_edit_save.length > 0) {
        $message_edit_form = $focused_message_edit_save.closest(".message_edit_form");
        $message_edit_form.find(".message_edit_cancel").trigger("focus");
        return true;
    }

    if (emoji_picker.reactions_popped()) {
        return emoji_picker.navigate("tab");
    }

    return false;
}

export function process_shift_tab_key() {
    // Returns true if we handled it, false if the browser should.
    // TODO: See if browsers like Safari can now handle tabbing correctly
    // without our intervention.

    if ($("#compose-send-button").is(":focus")) {
        // Shift-Tab: go back to content textarea and restore
        // cursor position.
        ui.restore_compose_cursor();
        return true;
    }

    // Shift-Tabbing from the edit message cancel button takes you to save.
    if ($(".message_edit_cancel:focus").length > 0) {
        $(".message_edit_save").trigger("focus");
        return true;
    }

    // Shift-Tabbing from the edit message save button takes you to the content.
    const $focused_message_edit_save = $(".message_edit_save:focus");
    if ($focused_message_edit_save.length > 0) {
        $focused_message_edit_save
            .closest(".message_edit_form")
            .find(".message_edit_content")
            .trigger("focus");
        return true;
    }

    // Shift-Tabbing from emoji catalog/search results takes you back to search textbox.
    if (emoji_picker.reactions_popped()) {
        return emoji_picker.navigate("shift_tab");
    }

    return false;
}

// Process a keydown or keypress event.
//
// Returns true if we handled it, false if the browser should.
export function process_hotkey(e, hotkey) {
    const event_name = hotkey.name;

    // This block needs to be before the `Tab` handler.
    switch (event_name) {
        case "up_arrow":
        case "down_arrow":
        case "left_arrow":
        case "right_arrow":
        case "vim_up":
        case "vim_down":
        case "vim_left":
        case "vim_right":
        case "tab":
        case "shift_tab":
        case "open_recent_topics":
            if (recent_topics_util.is_in_focus()) {
                return recent_topics_ui.change_focused_element($(e.target), event_name);
            }
    }

    // We handle the most complex keys in their own functions.
    switch (event_name) {
        case "escape":
            return process_escape_key(e);
        case "enter":
            return process_enter_key(e);
        case "tab":
            return process_tab_key();
        case "shift_tab":
            return process_shift_tab_key();
    }

    // This block needs to be before the open modals check, because
    // the "user status" modal can show the emoji picker.
    if (emoji_picker.reactions_popped()) {
        return emoji_picker.navigate(event_name);
    }

    if (overlays.is_modal_open()) {
        return false;
    }

    // TODO: break out specific handlers for up_arrow,
    //       down_arrow, and backspace
    switch (event_name) {
        case "up_arrow":
        case "down_arrow":
        case "vim_up":
        case "vim_down":
        case "backspace":
        case "delete":
            if (overlays.drafts_open()) {
                drafts.drafts_handle_events(e, event_name);
                return true;
            }
    }

    if (hotkey.message_view_only && overlays.is_active()) {
        if (processing_text()) {
            return false;
        }
        if (event_name === "narrow_by_topic" && overlays.streams_open()) {
            stream_settings_ui.keyboard_sub();
            return true;
        }
        if (event_name === "show_lightbox" && overlays.lightbox_open()) {
            overlays.close_overlay("lightbox");
            return true;
        }
        if (event_name === "open_drafts" && overlays.drafts_open()) {
            overlays.close_overlay("drafts");
            return true;
        }
        return false;
    }

    if (hotkey.message_view_only && gear_menu.is_open()) {
        return false;
    }

    if (overlays.settings_open() && !popovers.user_info_popped()) {
        return false;
    }

    if (hotspots.is_open()) {
        return false;
    }

    if (overlays.info_overlay_open()) {
        if (event_name === "show_shortcuts") {
            overlays.close_active();
            return true;
        }
        return false;
    }

    if ((event_name === "up_arrow" || event_name === "down_arrow") && overlays.streams_open()) {
        return stream_settings_ui.switch_rows(event_name);
    }

    if (event_name === "up_arrow" && list_util.inside_list(e)) {
        list_util.go_up(e);
        return true;
    }

    if (event_name === "down_arrow" && list_util.inside_list(e)) {
        list_util.go_down(e);
        return true;
    }

    if (menu_dropdown_hotkeys.has(event_name) && handle_popover_events(event_name)) {
        return true;
    }

    // The next two sections date back to 00445c84 and are Mac/Chrome-specific,
    // and they should possibly be eliminated in favor of keeping standard
    // browser behavior.
    if (event_name === "backspace" && $("#compose-send-button").is(":focus")) {
        // Ignore Backspace; don't navigate back a page.
        return true;
    }

    if (event_name === "narrow_to_compose_target") {
        narrow.to_compose_target();
        return true;
    }

    // Process hotkeys specially when in an input, select, textarea, or send button
    if (processing_text()) {
        // Note that there is special handling for Enter/Esc too, but
        // we handle this in other functions.

        if (event_name === "left_arrow" && compose_state.focus_in_empty_compose()) {
            message_edit.edit_last_sent_message();
            return true;
        }

        if (
            (event_name === "up_arrow" ||
                event_name === "down_arrow" ||
                event_name === "page_up" ||
                event_name === "page_down" ||
                event_name === "home" ||
                event_name === "end") &&
            compose_state.focus_in_empty_compose()
        ) {
            compose_actions.cancel();
            // don't return, as we still want it to be picked up by the code below
        } else {
            switch (event_name) {
                case "page_up":
                    $(":focus").caret(0).animate({scrollTop: 0}, "fast");
                    return true;
                case "page_down": {
                    // so that it always goes to the end of the text box.
                    const height = $(":focus")[0].scrollHeight;
                    $(":focus")
                        .caret(Number.POSITIVE_INFINITY)
                        .animate({scrollTop: height}, "fast");
                    return true;
                }
                case "search_with_k":
                    // Do nothing; this allows one to use Ctrl+K inside compose.
                    break;
                case "star_message":
                    // Do nothing; this allows one to use Ctrl+S inside compose.
                    break;
                default:
                    // Let the browser handle the key normally.
                    return false;
            }
        }
    }

    if (event_name === "left_arrow") {
        if (overlays.lightbox_open()) {
            lightbox.prev();
            return true;
        } else if (overlays.streams_open()) {
            stream_settings_ui.toggle_view(event_name);
            return true;
        }

        message_edit.edit_last_sent_message();
        return true;
    }

    if (event_name === "right_arrow") {
        if (overlays.lightbox_open()) {
            lightbox.next();
            return true;
        } else if (overlays.streams_open()) {
            stream_settings_ui.toggle_view(event_name);
            return true;
        }
    }

    // Prevent navigation in the background when the overlays are active.
    if (overlays.is_overlay_or_modal_open()) {
        if (event_name === "view_selected_stream" && overlays.streams_open()) {
            stream_settings_ui.view_stream();
            return true;
        }
        if (
            event_name === "n_key" &&
            overlays.streams_open() &&
            (settings_data.user_can_create_private_streams() ||
                settings_data.user_can_create_public_streams() ||
                settings_data.user_can_create_web_public_streams())
        ) {
            stream_settings_ui.open_create_stream();
            return true;
        }
        return false;
    }

    // Shortcuts that don't require a message
    switch (event_name) {
        case "narrow_private":
            return do_narrow_action((target, opts) => {
                narrow.by("is", "private", opts);
            });
        case "query_streams":
            stream_list.initiate_search();
            return true;
        case "query_users":
            activity.initiate_search();
            return true;
        case "search":
        case "search_with_k":
            search.initiate_search();
            return true;
        case "gear_menu":
            gear_menu.open();
            return true;
        case "show_shortcuts": // Show keyboard shortcuts page
            browser_history.go_to_location("keyboard-shortcuts");
            return true;
        case "stream_cycle_backward":
            narrow.stream_cycle_backward();
            return true;
        case "stream_cycle_forward":
            narrow.stream_cycle_forward();
            return true;
        case "n_key":
            narrow.narrow_to_next_topic();
            return true;
        case "p_key":
            narrow.narrow_to_next_pm_string();
            return true;
        case "open_recent_topics":
            browser_history.go_to_location("#recent_topics");
            return true;
        case "all_messages":
            browser_history.go_to_location("#all_messages");
            return true;
    }

    // Shortcuts that are useful with an empty message feed, like opening compose.
    switch (event_name) {
        case "reply_message": // 'r': respond to message
            // Note that you can "Enter" to respond to messages as well,
            // but that is handled in process_enter_key().
            compose_actions.respond_to_message({trigger: "hotkey"});
            return true;
        case "compose": // 'c': compose
            if (!compose_state.composing()) {
                compose_actions.start("stream", {trigger: "compose_hotkey"});
            }
            return true;
        case "compose_private_message":
            if (!compose_state.composing()) {
                compose_actions.start("private", {trigger: "compose_hotkey"});
            }
            return true;
        case "open_drafts":
            browser_history.go_to_location("drafts");
            return true;
        case "C_deprecated":
            deprecated_feature_notice.maybe_show_deprecation_notice("C");
            return true;
        case "star_deprecated":
            deprecated_feature_notice.maybe_show_deprecation_notice("*");
            return true;
    }

    // We don't want hotkeys below this to work when recent topics is
    // open. These involve hotkeys that can only be performed on a message.
    if (recent_topics_util.is_visible()) {
        return false;
    }

    if (message_lists.current.empty()) {
        return false;
    }

    // Shortcuts for navigation and other applications that require a
    // nonempty message feed but do not depend on the selected message.
    switch (event_name) {
        case "down_arrow":
        case "vim_down":
            navigate.down(true); // with_centering
            return true;
        case "up_arrow":
        case "vim_up":
            navigate.up();
            return true;
        case "home":
            navigate.to_home();
            return true;
        case "end":
        case "G_end":
            navigate.to_end();
            return true;
        case "page_up":
        case "vim_page_up":
        case "shift_spacebar":
            navigate.page_up();
            return true;
        case "page_down":
        case "vim_page_down":
        case "spacebar":
            navigate.page_down();
            return true;
        case "copy_with_c":
            copy_and_paste.copy_handler();
            return true;
    }

    if (
        // Allow UI only features for spectators which they can perform.
        page_params.is_spectator &&
        !["narrow_by_topic", "narrow_by_recipient", "show_lightbox", "show_sender_info"].includes(
            event_name,
        )
    ) {
        spectators.login_to_access();
        return true;
    }

    const msg = message_lists.current.selected_message();
    // Shortcuts that operate on a message
    switch (event_name) {
        case "message_actions":
            return popovers.open_message_menu(msg);
        case "star_message":
            message_flags.toggle_starred_and_update_server(msg);
            return true;
        case "narrow_by_recipient":
            return do_narrow_action(narrow.by_recipient);
        case "narrow_by_topic":
            return do_narrow_action(narrow.by_topic);
        case "respond_to_author": // 'R': respond to author
            compose_actions.respond_to_message({reply_type: "personal", trigger: "hotkey pm"});
            return true;
        case "compose_reply_with_mention": // '@': respond to message with mention to author
            compose_actions.reply_with_mention({trigger: "hotkey"});
            return true;
        case "show_lightbox":
            lightbox.show_from_selected_message();
            return true;
        case "show_sender_info":
            popovers.show_sender_info();
            return true;
        case "toggle_reactions_popover": // ':': open reactions to message
            reactions.open_reactions_popover();
            return true;
        case "thumbs_up_emoji": {
            // '+': reacts with thumbs up emoji on selected message
            // Use canonical name.
            const thumbs_up_emoji_code = "1f44d";
            const canonical_name = emoji.get_emoji_name(thumbs_up_emoji_code);
            reactions.toggle_emoji_reaction(msg.id, canonical_name);
            return true;
        }
        case "toggle_topic_mute":
            muted_topics_ui.toggle_topic_mute(msg);
            return true;
        case "toggle_message_collapse":
            condense.toggle_collapse(msg);
            return true;
        case "compose_quote_reply": // > : respond to selected message with quote
            compose_actions.quote_and_reply({trigger: "hotkey"});
            return true;
        case "edit_message": {
            const $row = message_lists.current.get_row(msg.id);
            message_edit.start($row);
            return true;
        }
    }

    return false;
}

/* We register both a keydown and a keypress function because
   we want to intercept PgUp/PgDn, Esc, etc, and process them
   as they happen on the keyboard. However, if we processed
   letters/numbers in keydown, we wouldn't know what the case of
   the letters were.

   We want case-sensitive hotkeys (such as in the case of r vs R)
   so we bail in .keydown if the event is a letter or number and
   instead just let keypress go for it. */

export function process_keydown(e) {
    activity.set_new_user_input(true);
    const hotkey = get_keydown_hotkey(e);
    if (!hotkey) {
        return false;
    }
    return process_hotkey(e, hotkey);
}

$(document).on("keydown", (e) => {
    if (process_keydown(e)) {
        e.preventDefault();
    }
});

export function process_keypress(e) {
    const hotkey = get_keypress_hotkey(e);
    if (!hotkey) {
        return false;
    }
    return process_hotkey(e, hotkey);
}

$(document).on("keypress", (e) => {
    if (process_keypress(e)) {
        e.preventDefault();
    }
});
