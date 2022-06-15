import $ from "jquery";

import * as resolved_topic from "../shared/js/resolved_topic";
import render_compose_all_everyone from "../templates/compose_all_everyone.hbs";
import render_compose_announce from "../templates/compose_announce.hbs";
import render_compose_invite_users from "../templates/compose_invite_users.hbs";
import render_compose_not_subscribed from "../templates/compose_not_subscribed.hbs";
import render_compose_private_stream_alert from "../templates/compose_private_stream_alert.hbs";
import render_compose_resolved_topic from "../templates/compose_resolved_topic.hbs";

import * as channel from "./channel";
import * as compose_error from "./compose_error";
import * as compose_pm_pill from "./compose_pm_pill";
import * as compose_state from "./compose_state";
import * as compose_ui from "./compose_ui";
import {$t_html} from "./i18n";
import {page_params} from "./page_params";
import * as peer_data from "./peer_data";
import * as people from "./people";
import * as settings_config from "./settings_config";
import * as settings_data from "./settings_data";
import * as stream_data from "./stream_data";
import {user_settings} from "./user_settings";
import * as util from "./util";

let user_acknowledged_all_everyone = false;
let user_acknowledged_announce = false;
let wildcard_mention;

export const announce_warn_threshold = 60;
export let wildcard_mention_large_stream_threshold = 15;

export function needs_subscribe_warning(user_id, stream_id) {
    // This returns true if all of these conditions are met:
    //  * the user is valid
    //  * the user is not already subscribed to the stream
    //  * the user has no back-door way to see stream messages
    //    (i.e. bots on public/private streams)
    //
    //  You can think of this as roughly answering "is there an
    //  actionable way to subscribe the user and do they actually
    //  need it?".
    //
    //  We expect the caller to already have verified that we're
    //  sending to a valid stream and trying to mention the user.

    const user = people.get_by_user_id(user_id);

    if (!user) {
        return false;
    }

    if (user.is_bot) {
        // Bots may receive messages on public/private streams even if they are
        // not subscribed.
        return false;
    }

    if (stream_data.is_user_subscribed(stream_id, user_id)) {
        // If our user is already subscribed
        return false;
    }

    return true;
}

export function warn_if_private_stream_is_linked(linked_stream) {
    // For PMs, we currently don't warn about links to private
    // streams, since you are specifically sharing the existence of
    // the private stream with someone.  One could imagine changing
    // this policy if user feedback suggested it was useful.
    if (compose_state.get_message_type() !== "stream") {
        return;
    }

    const compose_stream = stream_data.get_sub(compose_state.stream_name());
    if (compose_stream === undefined) {
        // We have an invalid stream name, don't warn about this here as
        // we show an error to the user when they try to send the message.
        return;
    }

    // If the stream we're linking to is not invite-only, then it's
    // public, and there is no need to warn about it, since all
    // members can already see all the public streams.
    //
    // Theoretically, we could still do a warning if there are any
    // guest users subscribed to the stream we're posting to; we may
    // change this policy if user feedback suggests it'd be an
    // improvement.
    if (!linked_stream.invite_only) {
        return;
    }

    // Don't warn if subscribers list of current compose_stream is
    // a subset of linked_stream's subscribers list, because
    // everyone will be subscribed to the linked stream and so
    // knows it exists.  (But always warn Zephyr users, since
    // we may not know their stream's subscribers.)
    if (
        peer_data.is_subscriber_subset(compose_stream.stream_id, linked_stream.stream_id) &&
        !page_params.realm_is_zephyr_mirror_realm
    ) {
        return;
    }

    const stream_name = linked_stream.name;

    const $warning_area = $("#compose_private_stream_alert");
    const context = {stream_name};
    const new_row = render_compose_private_stream_alert(context);

    $warning_area.append(new_row);
    $warning_area.show();
}

export function warn_if_mentioning_unsubscribed_user(mentioned) {
    if (compose_state.get_message_type() !== "stream") {
        return;
    }

    // Disable for Zephyr mirroring realms, since we never have subscriber lists there
    if (page_params.realm_is_zephyr_mirror_realm) {
        return;
    }

    const user_id = mentioned.user_id;

    if (mentioned.is_broadcast) {
        return; // don't check if @all/@everyone/@stream
    }

    const stream_name = compose_state.stream_name();

    if (!stream_name) {
        return;
    }

    const sub = stream_data.get_sub(stream_name);

    if (!sub) {
        return;
    }

    if (needs_subscribe_warning(user_id, sub.stream_id)) {
        const $error_area = $("#compose_invite_users");
        const $existing_invites_area = $("#compose_invite_users .compose_invite_user");

        const existing_invites = Array.from($($existing_invites_area), (user_row) =>
            Number.parseInt($(user_row).data("user-id"), 10),
        );

        if (!existing_invites.includes(user_id)) {
            const context = {
                user_id,
                stream_id: sub.stream_id,
                name: mentioned.full_name,
                can_subscribe_other_users: settings_data.user_can_subscribe_other_users(),
            };

            const new_row = render_compose_invite_users(context);
            $error_area.append(new_row);
        }

        $error_area.show();
    }
}

export function clear_topic_resolved_warning() {
    $("#compose_resolved_topic").hide();
    $("#compose_resolved_topic").empty();
    $("#compose-send-status").hide();
}

export function warn_if_topic_resolved(topic_changed) {
    // This function is called with topic_changed=false on every
    // keypress when typing a message, so it should not do anything
    // expensive in that case.
    //
    // Pass topic_changed=true if this function was called in response
    // to a topic being edited.
    const topic_name = compose_state.topic();

    if (!topic_changed && !resolved_topic.is_resolved(topic_name)) {
        // The resolved topic warning will only ever appear when
        // composing to a resolve topic, so we return early without
        // inspecting additional fields in this case.
        return;
    }

    const stream_name = compose_state.stream_name();
    const message_content = compose_state.message_content();
    const sub = stream_data.get_sub(stream_name);
    const $resolved_notice_area = $("#compose_resolved_topic");

    if (sub && message_content !== "" && resolved_topic.is_resolved(topic_name)) {
        if ($resolved_notice_area.html()) {
            // Error is already displayed; no action required.
            return;
        }

        const context = {
            stream_id: sub.stream_id,
            topic_name,
            can_move_topic: settings_data.user_can_move_messages_between_streams(),
        };

        const new_row = render_compose_resolved_topic(context);
        $resolved_notice_area.append(new_row);

        $resolved_notice_area.show();
    } else {
        // Only clear the notice if already displayed.
        if ($resolved_notice_area.html()) {
            clear_topic_resolved_warning();
        }
    }
}

function show_all_everyone_warnings(stream_id) {
    const stream_count = peer_data.get_subscriber_count(stream_id) || 0;

    const all_everyone_template = render_compose_all_everyone({
        count: stream_count,
        mention: wildcard_mention,
    });
    const $error_area_all_everyone = $("#compose-all-everyone");

    // only show one error for any number of @all or @everyone mentions
    if (!$error_area_all_everyone.is(":visible")) {
        $error_area_all_everyone.append(all_everyone_template);
    }

    $error_area_all_everyone.show();
    user_acknowledged_all_everyone = false;
}

export function clear_all_everyone_warnings() {
    $("#compose-all-everyone").hide();
    $("#compose-all-everyone").empty();
    $("#compose-send-status").hide();
}

function show_announce_warnings(stream_id) {
    const stream_count = peer_data.get_subscriber_count(stream_id) || 0;

    const announce_template = render_compose_announce({count: stream_count});
    const $error_area_announce = $("#compose-announce");

    if (!$error_area_announce.is(":visible")) {
        $error_area_announce.append(announce_template);
    }

    $error_area_announce.show();
    user_acknowledged_announce = false;
}

export function clear_announce_warnings() {
    $("#compose-announce").hide();
    $("#compose-announce").empty();
    $("#compose-send-status").hide();
}

export function set_user_acknowledged_all_everyone_flag(value) {
    user_acknowledged_all_everyone = value;
}

export function set_user_acknowledged_announce_flag(value) {
    user_acknowledged_announce = value;
}

export function get_invalid_recipient_emails() {
    const private_recipients = util.extract_pm_recipients(
        compose_state.private_message_recipient(),
    );
    const invalid_recipients = private_recipients.filter(
        (email) => !people.is_valid_email_for_compose(email),
    );

    return invalid_recipients;
}

function check_unsubscribed_stream_for_send(stream_name, autosubscribe) {
    let result;
    if (!autosubscribe) {
        return "not-subscribed";
    }

    // In the rare circumstance of the autosubscribe option, we
    // *Synchronously* try to subscribe to the stream before sending
    // the message.  This is deprecated and we hope to remove it; see
    // #4650.
    channel.post({
        url: "/json/subscriptions/exists",
        data: {stream: stream_name, autosubscribe: true},
        async: false,
        success(data) {
            if (data.subscribed) {
                result = "subscribed";
            } else {
                result = "not-subscribed";
            }
        },
        error(xhr) {
            if (xhr.status === 404) {
                result = "does-not-exist";
            } else {
                result = "error";
            }
        },
    });
    return result;
}

export function wildcard_mention_allowed() {
    if (
        page_params.realm_wildcard_mention_policy ===
        settings_config.wildcard_mention_policy_values.by_everyone.code
    ) {
        return true;
    }
    if (
        page_params.realm_wildcard_mention_policy ===
        settings_config.wildcard_mention_policy_values.nobody.code
    ) {
        return false;
    }
    if (
        page_params.realm_wildcard_mention_policy ===
        settings_config.wildcard_mention_policy_values.by_stream_admins_only.code
    ) {
        // TODO: Check the user's stream-level role once stream-level admins exist.
        return page_params.is_admin;
    }

    if (
        page_params.realm_wildcard_mention_policy ===
        settings_config.wildcard_mention_policy_values.by_moderators_only.code
    ) {
        return page_params.is_admin || page_params.is_moderator;
    }
    // TODO: Uncomment when we add support for stream-level administrators.
    // if (
    //     page_params.realm_wildcard_mention_policy ===
    //     settings_config.wildcard_mention_policy_values.by_admins_only.code
    // ) {
    //     return page_params.is_admin;
    // }
    if (
        page_params.realm_wildcard_mention_policy ===
        settings_config.wildcard_mention_policy_values.by_full_members.code
    ) {
        if (page_params.is_admin) {
            return true;
        }
        const person = people.get_by_user_id(page_params.user_id);
        const current_datetime = new Date(Date.now());
        const person_date_joined = new Date(person.date_joined);
        const days = (current_datetime - person_date_joined) / 1000 / 86400;

        return days >= page_params.realm_waiting_period_threshold && !page_params.is_guest;
    }
    return !page_params.is_guest;
}

export function set_wildcard_mention_large_stream_threshold(value) {
    wildcard_mention_large_stream_threshold = value;
}

function validate_stream_message_mentions(stream_id) {
    const stream_count = peer_data.get_subscriber_count(stream_id) || 0;

    // If the user is attempting to do a wildcard mention in a large
    // stream, check if they permission to do so.
    if (wildcard_mention !== null && stream_count > wildcard_mention_large_stream_threshold) {
        if (!wildcard_mention_allowed()) {
            compose_error.show(
                $t_html({
                    defaultMessage:
                        "You do not have permission to use wildcard mentions in this stream.",
                }),
            );
            return false;
        }

        if (
            user_acknowledged_all_everyone === undefined ||
            user_acknowledged_all_everyone === false
        ) {
            // user has not seen a warning message yet if undefined
            show_all_everyone_warnings(stream_id);

            $("#compose-send-button").prop("disabled", false);
            compose_ui.hide_compose_spinner();
            return false;
        }
    } else {
        // the message no longer contains @all or @everyone
        clear_all_everyone_warnings();
    }
    // at this point, the user has either acknowledged the warning or removed @all / @everyone
    user_acknowledged_all_everyone = undefined;

    return true;
}

function validate_stream_message_announce(sub) {
    const stream_count = peer_data.get_subscriber_count(sub.stream_id) || 0;

    if (sub.name === "announce" && stream_count > announce_warn_threshold) {
        if (user_acknowledged_announce === undefined || user_acknowledged_announce === false) {
            // user has not seen a warning message yet if undefined
            show_announce_warnings(sub.stream_id);

            $("#compose-send-button").prop("disabled", false);
            compose_ui.hide_compose_spinner();
            return false;
        }
    } else {
        clear_announce_warnings();
    }
    // at this point, the user has acknowledged the warning
    user_acknowledged_announce = undefined;

    return true;
}

function validate_stream_message_post_policy(sub) {
    if (page_params.is_admin) {
        return true;
    }

    const stream_post_permission_type = stream_data.stream_post_policy_values;
    const stream_post_policy = sub.stream_post_policy;

    if (stream_post_policy === stream_post_permission_type.admins.code) {
        compose_error.show(
            $t_html({
                defaultMessage: "Only organization admins are allowed to post to this stream.",
            }),
        );
        return false;
    }

    if (page_params.is_moderator) {
        return true;
    }

    if (stream_post_policy === stream_post_permission_type.moderators.code) {
        compose_error.show(
            $t_html({
                defaultMessage:
                    "Only organization admins and moderators are allowed to post to this stream.",
            }),
        );
        return false;
    }

    if (page_params.is_guest && stream_post_policy !== stream_post_permission_type.everyone.code) {
        compose_error.show(
            $t_html({defaultMessage: "Guests are not allowed to post to this stream."}),
        );
        return false;
    }

    const person = people.get_by_user_id(page_params.user_id);
    const current_datetime = new Date(Date.now());
    const person_date_joined = new Date(person.date_joined);
    const days = (current_datetime - person_date_joined) / 1000 / 86400;
    let error_html;
    if (
        stream_post_policy === stream_post_permission_type.non_new_members.code &&
        days < page_params.realm_waiting_period_threshold
    ) {
        error_html = $t_html(
            {
                defaultMessage:
                    "New members are not allowed to post to this stream.<br />Permission will be granted in {days} days.",
            },
            {days},
        );
        compose_error.show(error_html);
        return false;
    }
    return true;
}

export function validation_error(error_type, stream_name) {
    let response;

    switch (error_type) {
        case "does-not-exist":
            response = $t_html(
                {
                    defaultMessage:
                        "<p>The stream <b>{stream_name}</b> does not exist.</p><p>Manage your subscriptions <z-link>on your Streams page</z-link>.</p>",
                },
                {
                    stream_name,
                    "z-link": (content_html) => `<a href='#streams/all'>${content_html}</a>`,
                },
            );
            compose_error.show(response, $("#stream_message_recipient_stream"));
            return false;
        case "error":
            compose_error.show(
                $t_html({defaultMessage: "Error checking subscription"}),
                $("#stream_message_recipient_stream"),
            );
            return false;
        case "not-subscribed": {
            const sub = stream_data.get_sub(stream_name);
            const new_row = render_compose_not_subscribed({
                should_display_sub_button: stream_data.can_toggle_subscription(sub),
            });
            compose_error.show_not_subscribed(new_row, $("#stream_message_recipient_stream"));
            return false;
        }
    }
    return true;
}

export function validate_stream_message_address_info(stream_name) {
    if (stream_data.is_subscribed_by_name(stream_name)) {
        return true;
    }
    const autosubscribe = page_params.narrow_stream !== undefined;
    const error_type = check_unsubscribed_stream_for_send(stream_name, autosubscribe);
    return validation_error(error_type, stream_name);
}

function validate_stream_message() {
    const stream_name = compose_state.stream_name();
    if (stream_name === "") {
        compose_error.show(
            $t_html({defaultMessage: "Please specify a stream"}),
            $("#stream_message_recipient_stream"),
        );
        return false;
    }

    if (page_params.realm_mandatory_topics) {
        const topic = compose_state.topic();
        // TODO: We plan to migrate the empty topic to only using the
        // `""` representation for i18n reasons, but have not yet done so.
        if (topic === "" || topic === "(no topic)") {
            compose_error.show(
                $t_html({defaultMessage: "Topics are required in this organization"}),
                $("#stream_message_recipient_topic"),
            );
            return false;
        }
    }

    const sub = stream_data.get_sub(stream_name);
    if (!sub) {
        return validation_error("does-not-exist", stream_name);
    }

    if (!validate_stream_message_post_policy(sub)) {
        return false;
    }

    /* Note: This is a global and thus accessible in the functions
       below; it's important that we update this state here before
       proceeding with further validation. */
    wildcard_mention = util.find_wildcard_mentions(compose_state.message_content());

    // If both `@all` is mentioned and it's in `#announce`, just validate
    // for `@all`. Users shouldn't have to hit "yes" more than once.
    if (wildcard_mention !== null && stream_name === "announce") {
        if (
            !validate_stream_message_address_info(stream_name) ||
            !validate_stream_message_mentions(sub.stream_id)
        ) {
            return false;
        }
        // If either criteria isn't met, just do the normal validation.
    } else {
        if (
            !validate_stream_message_address_info(stream_name) ||
            !validate_stream_message_mentions(sub.stream_id) ||
            !validate_stream_message_announce(sub)
        ) {
            return false;
        }
    }

    return true;
}

// The function checks whether the recipients are users of the realm or cross realm users (bots
// for now)
function validate_private_message() {
    const user_ids = compose_pm_pill.get_user_ids();

    if (
        page_params.realm_private_message_policy === 2 && // Frontend check for for PRIVATE_MESSAGE_POLICY_DISABLED
        (user_ids.length !== 1 || !people.get_by_user_id(user_ids[0]).is_bot)
    ) {
        // Unless we're composing to a bot
        compose_error.show(
            $t_html({defaultMessage: "Private messages are disabled in this organization."}),
            $("#private_message_recipient"),
        );
        return false;
    }

    if (compose_state.private_message_recipient().length === 0) {
        compose_error.show(
            $t_html({defaultMessage: "Please specify at least one valid recipient"}),
            $("#private_message_recipient"),
        );
        return false;
    } else if (page_params.realm_is_zephyr_mirror_realm) {
        // For Zephyr mirroring realms, the frontend doesn't know which users exist
        return true;
    }

    const invalid_recipients = get_invalid_recipient_emails();

    let context = {};
    if (invalid_recipients.length === 1) {
        context = {recipient: invalid_recipients.join(",")};
        compose_error.show(
            $t_html({defaultMessage: "The recipient {recipient} is not valid"}, context),
            $("#private_message_recipient"),
        );
        return false;
    } else if (invalid_recipients.length > 1) {
        context = {recipients: invalid_recipients.join(",")};
        compose_error.show(
            $t_html({defaultMessage: "The recipients {recipients} are not valid"}, context),
            $("#private_message_recipient"),
        );
        return false;
    }

    for (const user_id of user_ids) {
        if (!people.is_person_active(user_id)) {
            context = {full_name: people.get_by_user_id(user_id).full_name};
            compose_error.show(
                $t_html(
                    {defaultMessage: "You cannot send messages to deactivated users."},
                    context,
                ),
                $("#private_message_recipient"),
            );

            return false;
        }
    }

    return true;
}

export function check_overflow_text() {
    // This function is called when typing every character in the
    // compose box, so it's important that it not doing anything
    // expensive.
    const text = compose_state.message_content();
    const max_length = page_params.max_message_length;
    const $indicator = $("#compose_limit_indicator");

    if (text.length > max_length) {
        $indicator.addClass("over_limit");
        $("#compose-textarea").addClass("over_limit");
        $indicator.text(text.length + "/" + max_length);
        compose_error.show(
            $t_html(
                {
                    defaultMessage:
                        "Message length shouldn't be greater than {max_length} characters.",
                },
                {max_length},
            ),
        );
        $("#compose-send-button").prop("disabled", true);
    } else if (text.length > 0.9 * max_length) {
        $indicator.removeClass("over_limit");
        $("#compose-textarea").removeClass("over_limit");
        $indicator.text(text.length + "/" + max_length);

        $("#compose-send-button").prop("disabled", false);
        if ($("#compose-send-status").hasClass("alert-error")) {
            $("#compose-send-status").stop(true).fadeOut();
        }
    } else {
        $indicator.text("");
        $("#compose-textarea").removeClass("over_limit");

        $("#compose-send-button").prop("disabled", false);
        if ($("#compose-send-status").hasClass("alert-error")) {
            $("#compose-send-status").stop(true).fadeOut();
        }
    }
}

export function warn_for_text_overflow_when_tries_to_send() {
    if (compose_state.message_content().length > page_params.max_message_length) {
        $("#compose-textarea").addClass("flash");
        setTimeout(() => $("#compose-textarea").removeClass("flash"), 1500);
        return false;
    }
    return true;
}

export function validate() {
    const message_content = compose_state.message_content();
    if (/^\s*$/.test(message_content)) {
        // Avoid showing an error message when "enter sends" is enabled,
        // as it is more likely that the user has hit "Enter" accidentally.
        if (!user_settings.enter_sends) {
            compose_error.show(
                $t_html({defaultMessage: "You have nothing to send!"}),
                $("#compose-textarea"),
            );
        }
        return false;
    }

    if ($("#zephyr-mirror-error").is(":visible")) {
        compose_error.show(
            $t_html({
                defaultMessage:
                    "You need to be running Zephyr mirroring in order to send messages!",
            }),
        );
        return false;
    }
    if (!warn_for_text_overflow_when_tries_to_send()) {
        return false;
    }

    if (compose_state.get_message_type() === "private") {
        return validate_private_message();
    }
    return validate_stream_message();
}
