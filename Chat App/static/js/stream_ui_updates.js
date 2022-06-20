import $ from "jquery";

import render_stream_permission_description from "../templates/stream_settings/stream_permission_description.hbs";
import render_stream_settings_tip from "../templates/stream_settings/stream_settings_tip.hbs";

import * as hash_util from "./hash_util";
import {$t} from "./i18n";
import {page_params} from "./page_params";
import * as stream_data from "./stream_data";
import * as stream_edit from "./stream_edit";
import * as stream_settings_containers from "./stream_settings_containers";
import * as stream_settings_ui from "./stream_settings_ui";

export function initialize_disable_btn_hint_popover(
    $btn_wrapper,
    $popover_btn,
    $disabled_btn,
    hint_text,
) {
    // Disabled button blocks mouse events(hover) from reaching
    // to it's parent div element, so popover don't get triggered.
    // Add css to prevent this.
    $disabled_btn.css("pointer-events", "none");
    $popover_btn.popover({
        placement: "bottom",
        content: $("<div>", {class: "sub_disable_btn_hint"}).text(hint_text).prop("outerHTML"),
        trigger: "manual",
        html: true,
        animation: false,
    });

    $btn_wrapper.on("mouseover", (e) => {
        $popover_btn.popover("show");
        e.stopPropagation();
    });

    $btn_wrapper.on("mouseout", (e) => {
        $popover_btn.popover("hide");
        e.stopPropagation();
    });
}

export function initialize_cant_subscribe_popover(sub) {
    const $button_wrapper = stream_settings_containers
        .get_edit_container(sub)
        .find(".sub_unsub_button_wrapper");
    const $settings_button = stream_settings_ui.settings_button_for_sub(sub);
    initialize_disable_btn_hint_popover(
        $button_wrapper,
        $settings_button,
        $settings_button,
        $t({defaultMessage: "Only stream members can add users to a private stream"}),
    );
}

export function update_toggler_for_sub(sub) {
    if (!hash_util.is_editing_stream(sub.stream_id)) {
        return;
    }
    if (sub.subscribed) {
        stream_edit.toggler.enable_tab("personal_settings");
        stream_edit.toggler.goto(stream_edit.select_tab);
    } else {
        if (stream_edit.select_tab === "personal_settings") {
            // Go to the general settings tab, if the user is not
            // subscribed. Also preserve the previous selected tab,
            // to render next time a stream row is selected.
            stream_edit.toggler.goto("general_settings");
        } else {
            stream_edit.toggler.goto(stream_edit.select_tab);
        }
        stream_edit.toggler.disable_tab("personal_settings");
    }
}

export function update_settings_button_for_sub(sub) {
    // This is for the Subscribe/Unsubscribe button in the right panel.
    const $settings_button = stream_settings_ui.settings_button_for_sub(sub);
    if (sub.subscribed) {
        $settings_button.text($t({defaultMessage: "Unsubscribe"})).removeClass("unsubscribed");
    } else {
        $settings_button.text($t({defaultMessage: "Subscribe"})).addClass("unsubscribed");
    }
    if (stream_data.can_toggle_subscription(sub)) {
        $settings_button.prop("disabled", false);
        $settings_button.popover("destroy");
        $settings_button.css("pointer-events", "");
    } else {
        $settings_button.attr("title", "");
        initialize_cant_subscribe_popover(sub);
        $settings_button.prop("disabled", true);
    }
}

export function update_regular_sub_settings(sub) {
    // These are in the right panel.
    if (!hash_util.is_editing_stream(sub.stream_id)) {
        return;
    }
    const $settings = $(`.subscription_settings[data-stream-id='${CSS.escape(sub.stream_id)}']`);
    if (sub.subscribed) {
        if ($settings.find(".email-address").val().length === 0) {
            // Rerender stream email address, if not.
            $settings.find(".email-address").text(sub.email_address);
            $settings.find(".stream-email-box").show();
        }
        $settings.find(".personal_settings").addClass("in");
    } else {
        $settings.find(".personal_settings").removeClass("in");
        // Clear email address widget
        $settings.find(".email-address").html("");
    }
}

export function update_change_stream_privacy_settings(sub) {
    // This is in the right panel.
    const $stream_privacy_btn = $(".change-stream-privacy");

    if (sub.can_change_stream_permissions) {
        $stream_privacy_btn.show();
    } else {
        $stream_privacy_btn.hide();
    }
}

export function update_permissions_banner(sub) {
    const $settings = $(`.subscription_settings[data-stream-id='${CSS.escape(sub.stream_id)}']`);

    const rendered_tip = render_stream_settings_tip(sub);
    $settings.find(".stream-settings-tip-container").html(rendered_tip);
}

export function update_notification_setting_checkbox(notification_name) {
    // This is in the right panel (Personal settings).
    const $stream_row = $("#manage_streams_container .stream-row.active");
    if (!$stream_row.length) {
        return;
    }
    const stream_id = $stream_row.data("stream-id");
    $(`#${CSS.escape(notification_name)}_${CSS.escape(stream_id)}`).prop(
        "checked",
        stream_data.receives_notifications(stream_id, notification_name),
    );
}

export function update_stream_row_in_settings_tab(sub) {
    // This is in the left panel.
    // This function display/hide stream row in stream settings tab,
    // used to display immediate effect of add/removal subscription event.
    // If user is subscribed to stream, it will show sub row under
    // "Subscribed" tab, otherwise if stream is not public hide
    // stream row under tab.
    if (stream_settings_ui.is_subscribed_stream_tab_active()) {
        const $sub_row = stream_settings_ui.row_for_stream_id(sub.stream_id);
        if (sub.subscribed) {
            $sub_row.removeClass("notdisplayed");
        } else if (sub.invite_only || page_params.is_guest) {
            $sub_row.addClass("notdisplayed");
        }
    }
}

export function update_stream_subscription_type_text(sub) {
    // This is in the right panel.
    const $stream_settings = stream_settings_containers.get_edit_container(sub);
    const template_data = {
        ...sub,
        stream_post_policy_values: stream_data.stream_post_policy_values,
        message_retention_text: stream_edit.get_retention_policy_text_for_subscription_type(sub),
    };
    const html = render_stream_permission_description(template_data);
    if (hash_util.is_editing_stream(sub.stream_id)) {
        $stream_settings.find(".subscription-type-text").expectOne().html(html);
    }
}

export function update_add_subscriptions_elements(sub) {
    if (!hash_util.is_editing_stream(sub.stream_id)) {
        return;
    }

    // We are only concerned with the Subscribers tab for editing streams.
    const $add_subscribers_container = $(".edit_subscribers_for_stream .add_subscribers_container");

    if (page_params.is_guest || page_params.realm_is_zephyr_mirror_realm) {
        // For guest users, we just hide the add_subscribers feature.
        $add_subscribers_container.hide();
        return;
    }

    // Otherwise, we adjust whether the widgets are disabled based on
    // whether this user is authorized to add subscribers.
    const $input_element = $add_subscribers_container.find(".input").expectOne();
    const $button_element = $add_subscribers_container
        .find('button[name="add_subscriber"]')
        .expectOne();
    const allow_user_to_add_subs = sub.can_add_subscribers;

    if (allow_user_to_add_subs) {
        $input_element.prop("disabled", false);
        $button_element.prop("disabled", false);
        $button_element.css("pointer-events", "");
        $input_element.popover("destroy");
    } else {
        $input_element.prop("disabled", true);
        $button_element.prop("disabled", true);

        initialize_disable_btn_hint_popover(
            $add_subscribers_container,
            $input_element,
            $button_element,
            $t({defaultMessage: "Only stream members can add users to a private stream"}),
        );
    }
}
