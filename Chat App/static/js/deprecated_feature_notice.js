import * as blueslip from "./blueslip";
import * as common from "./common";
import * as dialog_widget from "./dialog_widget";
import {$t_html} from "./i18n";
import {localstorage} from "./localstorage";

export function get_hotkey_deprecation_notice(originalHotkey, replacementHotkey) {
    return $t_html(
        {
            defaultMessage:
                'We\'ve replaced the "{originalHotkey}" hotkey with "{replacementHotkey}" to make this common shortcut easier to trigger.',
        },
        {originalHotkey, replacementHotkey},
    );
}

let shown_deprecation_notices = [];

export function maybe_show_deprecation_notice(key) {
    let message;
    const isCmdOrCtrl = common.has_mac_keyboard() ? "Cmd" : "Ctrl";
    if (key === "C") {
        message = get_hotkey_deprecation_notice("C", "x");
    } else if (key === "*") {
        message = get_hotkey_deprecation_notice("*", isCmdOrCtrl + " + s");
    } else {
        blueslip.error("Unexpected deprecation notice for hotkey:", key);
        return;
    }

    // Here we handle the tracking for showing deprecation notices,
    // whether or not local storage is available.
    if (localstorage.supported()) {
        const notices_from_storage = JSON.parse(localStorage.getItem("shown_deprecation_notices"));
        if (notices_from_storage !== null) {
            shown_deprecation_notices = notices_from_storage;
        } else {
            shown_deprecation_notices = [];
        }
    }

    if (!shown_deprecation_notices.includes(key)) {
        dialog_widget.launch({
            html_heading: $t_html({defaultMessage: "Deprecation notice"}),
            html_body: message,
            html_submit_button: $t_html({defaultMessage: "Got it"}),
            on_click: () => {},
            close_on_submit: true,
            focus_submit_on_open: true,
            single_footer_button: true,
        });

        shown_deprecation_notices.push(key);
        if (localstorage.supported()) {
            localStorage.setItem(
                "shown_deprecation_notices",
                JSON.stringify(shown_deprecation_notices),
            );
        }
    }
}
