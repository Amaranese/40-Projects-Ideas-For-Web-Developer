"use strict";

const {strict: assert} = require("assert");

const {mock_esm, set_global, with_field, zrequire} = require("../zjsunit/namespace");
const {make_stub} = require("../zjsunit/stub");
const {run_test} = require("../zjsunit/test");
const blueslip = require("../zjsunit/zblueslip");
const $ = require("../zjsunit/zjquery");
const {
    page_params,
    realm_user_settings_defaults,
    user_settings,
} = require("../zjsunit/zpage_params");

const noop = () => {};

const events = require("./lib/events");

const event_fixtures = events.fixtures;
const test_message = events.test_message;
const test_user = events.test_user;
const typing_person1 = events.typing_person1;

set_global("setTimeout", (func) => func());

const activity = mock_esm("../../static/js/activity");
const alert_words_ui = mock_esm("../../static/js/alert_words_ui");
const attachments_ui = mock_esm("../../static/js/attachments_ui");
const bot_data = mock_esm("../../static/js/bot_data");
const composebox_typeahead = mock_esm("../../static/js/composebox_typeahead");
const dark_theme = mock_esm("../../static/js/dark_theme");
const emoji_picker = mock_esm("../../static/js/emoji_picker");
const hotspots = mock_esm("../../static/js/hotspots");
const linkifiers = mock_esm("../../static/js/linkifiers");
const message_edit = mock_esm("../../static/js/message_edit");
const message_events = mock_esm("../../static/js/message_events");
const message_list = mock_esm("../../static/js/message_list");
const message_lists = mock_esm("../../static/js/message_lists");
const muted_topics_ui = mock_esm("../../static/js/muted_topics_ui");
const muted_users_ui = mock_esm("../../static/js/muted_users_ui");
const notifications = mock_esm("../../static/js/notifications");
const reactions = mock_esm("../../static/js/reactions");
const realm_icon = mock_esm("../../static/js/realm_icon");
const realm_logo = mock_esm("../../static/js/realm_logo");
const realm_playground = mock_esm("../../static/js/realm_playground");
const reload = mock_esm("../../static/js/reload");
const scroll_bar = mock_esm("../../static/js/scroll_bar");
const settings_account = mock_esm("../../static/js/settings_account");
const settings_bots = mock_esm("../../static/js/settings_bots");
const settings_display = mock_esm("../../static/js/settings_display");
const settings_emoji = mock_esm("../../static/js/settings_emoji");
const settings_exports = mock_esm("../../static/js/settings_exports");
const settings_invites = mock_esm("../../static/js/settings_invites");
const settings_linkifiers = mock_esm("../../static/js/settings_linkifiers");
const settings_playgrounds = mock_esm("../../static/js/settings_playgrounds");
const settings_notifications = mock_esm("../../static/js/settings_notifications");
const settings_org = mock_esm("../../static/js/settings_org");
const settings_profile_fields = mock_esm("../../static/js/settings_profile_fields");
const settings_realm_user_settings_defaults = mock_esm(
    "../../static/js/settings_realm_user_settings_defaults",
);
const settings_streams = mock_esm("../../static/js/settings_streams");
const settings_user_groups = mock_esm("../../static/js/settings_user_groups");
const settings_users = mock_esm("../../static/js/settings_users");
const stream_data = mock_esm("../../static/js/stream_data");
const stream_events = mock_esm("../../static/js/stream_events");
const stream_settings_ui = mock_esm("../../static/js/stream_settings_ui");
const submessage = mock_esm("../../static/js/submessage");
const typing_events = mock_esm("../../static/js/typing_events");
const ui = mock_esm("../../static/js/ui");
const unread_ops = mock_esm("../../static/js/unread_ops");
const user_events = mock_esm("../../static/js/user_events");
const user_groups = mock_esm("../../static/js/user_groups");
mock_esm("../../static/js/giphy");

const electron_bridge = set_global("electron_bridge", {});

message_lists.current = {};
message_lists.home = {};

// page_params is highly coupled to dispatching now

page_params.test_suite = false;
page_params.is_admin = true;
page_params.realm_description = "already set description";

// For data-oriented modules, just use them, don't stub them.
const alert_words = zrequire("alert_words");
const emoji = zrequire("emoji");
const stream_topic_history = zrequire("stream_topic_history");
const stream_list = zrequire("stream_list");
const message_helper = zrequire("message_helper");
const message_store = zrequire("message_store");
const people = zrequire("people");
const starred_messages = zrequire("starred_messages");
const user_status = zrequire("user_status");
const compose_pm_pill = zrequire("compose_pm_pill");

const server_events_dispatch = zrequire("server_events_dispatch");

function dispatch(ev) {
    server_events_dispatch.dispatch_normal_event(ev);
}

people.init();
people.add_active_user(test_user);

message_helper.process_new_message(test_message);

const realm_emoji = {};
const emoji_codes = zrequire("../generated/emoji/emoji_codes.json");

emoji.initialize({realm_emoji, emoji_codes});

function assert_same(actual, expected) {
    // This helper prevents us from getting false positives
    // where actual and expected are both undefined.
    assert.notEqual(expected, undefined);
    assert.deepEqual(actual, expected);
}

run_test("alert_words", ({override}) => {
    alert_words.initialize({alert_words: []});
    assert.ok(!alert_words.has_alert_word("fire"));
    assert.ok(!alert_words.has_alert_word("lunch"));

    override(alert_words_ui, "rerender_alert_words_ui", noop);
    const event = event_fixtures.alert_words;
    dispatch(event);

    assert.deepEqual(alert_words.get_word_list(), [{word: "fire"}, {word: "lunch"}]);
    assert.ok(alert_words.has_alert_word("fire"));
    assert.ok(alert_words.has_alert_word("lunch"));
});

run_test("attachments", ({override}) => {
    const event = event_fixtures.attachment__add;
    const stub = make_stub();
    // attachments_ui is hard to test deeply
    override(attachments_ui, "update_attachments", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    assert_same(stub.get_args("event").event, event);
});

run_test("user groups", ({override}) => {
    let event = event_fixtures.user_group__add;
    override(settings_user_groups, "reload", noop);
    {
        const stub = make_stub();
        override(user_groups, "add", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group");
        assert_same(args.group, event.group);
    }

    event = event_fixtures.user_group__remove;
    {
        const stub = make_stub();
        override(user_groups, "get_user_group_from_id", stub.f);
        override(user_groups, "remove", noop);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group_id");
        assert_same(args.group_id, event.group_id);
    }

    event = event_fixtures.user_group__add_members;
    {
        const stub = make_stub();
        override(user_groups, "add_members", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group_id", "user_ids");
        assert_same(args.group_id, event.group_id);
        assert_same(args.user_ids, event.user_ids);
    }

    event = event_fixtures.user_group__add_subgroups;
    {
        const stub = make_stub();
        override(user_groups, "add_subgroups", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group_id", "direct_subgroup_ids");
        assert_same(args.group_id, event.group_id);
        assert_same(args.direct_subgroup_ids, event.direct_subgroup_ids);
    }

    event = event_fixtures.user_group__remove_members;
    {
        const stub = make_stub();
        override(user_groups, "remove_members", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group_id", "user_ids");
        assert_same(args.group_id, event.group_id);
        assert_same(args.user_ids, event.user_ids);
    }

    event = event_fixtures.user_group__remove_subgroups;
    {
        const stub = make_stub();
        override(user_groups, "remove_subgroups", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("group_id", "direct_subgroup_ids");
        assert_same(args.group_id, event.group_id);
        assert_same(args.direct_subgroup_ids, event.direct_subgroup_ids);
    }

    event = event_fixtures.user_group__update;
    {
        const stub = make_stub();
        override(user_groups, "update", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("event");
        assert_same(args.event.group_id, event.group_id);
        assert_same(args.event.data.name, event.data.name);
        assert_same(args.event.data.description, event.data.description);
    }
});

run_test("custom profile fields", ({override}) => {
    const event = event_fixtures.custom_profile_fields;
    override(settings_profile_fields, "populate_profile_fields", noop);
    override(settings_account, "add_custom_profile_fields_to_settings", noop);
    dispatch(event);
    assert_same(page_params.custom_profile_fields, event.fields);
});

run_test("default_streams", ({override}) => {
    const event = event_fixtures.default_streams;
    override(settings_streams, "update_default_streams_table", noop);
    const stub = make_stub();
    override(stream_data, "set_realm_default_streams", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("realm_default_streams");
    assert_same(args.realm_default_streams, event.default_streams);
});

run_test("hotspots", ({override}) => {
    page_params.hotspots = [];
    const event = event_fixtures.hotspots;
    override(hotspots, "load_new", noop);
    dispatch(event);
    assert_same(page_params.hotspots, event.hotspots);
});

run_test("invites_changed", ({override}) => {
    $.create("#admin-invites-list", {children: ["stub"]});
    const event = event_fixtures.invites_changed;
    const stub = make_stub();
    override(settings_invites, "set_up", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
});

run_test("muted_topics", ({override}) => {
    const event = event_fixtures.muted_topics;

    const stub = make_stub();
    override(muted_topics_ui, "handle_topic_updates", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("muted_topics");
    assert_same(args.muted_topics, event.muted_topics);
});

run_test("muted_users", ({override}) => {
    const event = event_fixtures.muted_users;

    const stub = make_stub();
    override(muted_users_ui, "handle_user_updates", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("muted_users");
    assert_same(args.muted_users, event.muted_users);
});

run_test("presence", ({override}) => {
    const event = event_fixtures.presence;

    const stub = make_stub();
    override(activity, "update_presence_info", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("user_id", "presence", "server_time");
    assert_same(args.user_id, event.user_id);
    assert_same(args.presence, event.presence);
    assert_same(args.server_time, event.server_timestamp);
});

run_test("reaction", ({override}) => {
    let event = event_fixtures.reaction__add;
    {
        const stub = make_stub();
        override(reactions, "add_reaction", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("event");
        assert_same(args.event.emoji_name, event.emoji_name);
        assert_same(args.event.message_id, event.message_id);
    }

    event = event_fixtures.reaction__remove;
    {
        const stub = make_stub();
        override(reactions, "remove_reaction", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("event");
        assert_same(args.event.emoji_name, event.emoji_name);
        assert_same(args.event.message_id, event.message_id);
    }
});

run_test("realm settings", ({override}) => {
    page_params.is_admin = true;

    override(settings_org, "sync_realm_settings", noop);
    override(settings_bots, "update_bot_permissions_ui", noop);
    override(notifications, "redraw_title", noop);

    function test_electron_dispatch(event, fake_send_event) {
        let called = false;

        with_field(electron_bridge, "send_event", fake_send_event, () => {
            dispatch(event);
            called = true;
        });

        assert.ok(called);
    }

    // realm
    function test_realm_boolean(event, parameter_name) {
        page_params[parameter_name] = true;
        event = {...event};
        event.value = false;
        dispatch(event);
        assert.equal(page_params[parameter_name], false);
        event = {...event};
        event.value = true;
        dispatch(event);
        assert.equal(page_params[parameter_name], true);
    }

    function test_realm_integer(event, parameter_name) {
        page_params[parameter_name] = 1;
        event = {...event};
        event.value = 2;
        dispatch(event);
        assert.equal(page_params[parameter_name], 2);

        event = {...event};
        event.value = 3;
        dispatch(event);
        assert.equal(page_params[parameter_name], 3);

        event = {...event};
        event.value = 1;
        dispatch(event);
        assert.equal(page_params[parameter_name], 1);
    }

    let update_called = false;
    let event = event_fixtures.realm__update__create_private_stream_policy;
    stream_settings_ui.update_stream_privacy_choices = (property) => {
        assert_same(property, "create_private_stream_policy");
        update_called = true;
    };
    test_realm_integer(event, "realm_create_private_stream_policy");

    update_called = false;
    event = event_fixtures.realm__update__create_public_stream_policy;
    stream_settings_ui.update_stream_privacy_choices = (property) => {
        assert_same(property, "create_public_stream_policy");
        update_called = true;
    };
    test_realm_integer(event, "realm_create_public_stream_policy");

    update_called = false;
    event = event_fixtures.realm__update__create_web_public_stream_policy;
    stream_settings_ui.update_stream_privacy_choices = (property) => {
        assert_same(property, "create_web_public_stream_policy");
        update_called = true;
    };
    dispatch(event);
    assert_same(page_params.realm_create_web_public_stream_policy, 2);
    assert_same(update_called, true);

    event = event_fixtures.realm__update__invite_to_stream_policy;
    test_realm_integer(event, "realm_invite_to_stream_policy");

    event = event_fixtures.realm__update__bot_creation_policy;
    test_realm_integer(event, "realm_bot_creation_policy");

    event = event_fixtures.realm__update__invite_required;
    test_realm_boolean(event, "realm_invite_required");

    event = event_fixtures.realm__update__invite_to_realm_policy;
    test_realm_integer(event, "realm_invite_to_realm_policy");

    event = event_fixtures.realm__update__want_advertise_in_communities_directory;
    test_realm_boolean(event, "realm_want_advertise_in_communities_directory");

    event = event_fixtures.realm__update__name;

    test_electron_dispatch(event, (key, val) => {
        assert_same(key, "realm_name");
        assert_same(val, "new_realm_name");
    });
    assert_same(page_params.realm_name, "new_realm_name");

    event = event_fixtures.realm__update__org_type;
    dispatch(event);
    assert_same(page_params.realm_org_type, 50);

    event = event_fixtures.realm__update__emails_restricted_to_domains;
    test_realm_boolean(event, "realm_emails_restricted_to_domains");

    event = event_fixtures.realm__update__disallow_disposable_email_addresses;
    test_realm_boolean(event, "realm_disallow_disposable_email_addresses");

    event = event_fixtures.realm__update__email_addresses_visibility;
    dispatch(event);
    assert_same(page_params.realm_email_address_visibility, 3);

    event = event_fixtures.realm__update__notifications_stream_id;
    dispatch(event);
    assert_same(page_params.realm_notifications_stream_id, 42);
    page_params.realm_notifications_stream_id = -1; // make sure to reset for future tests

    event = event_fixtures.realm__update__signup_notifications_stream_id;
    dispatch(event);
    assert_same(page_params.realm_signup_notifications_stream_id, 41);
    page_params.realm_signup_notifications_stream_id = -1; // make sure to reset for future tests

    event = event_fixtures.realm__update__default_code_block_language;
    dispatch(event);
    assert_same(page_params.realm_default_code_block_language, "javascript");

    update_called = false;
    stream_settings_ui.update_stream_privacy_choices = (property) => {
        assert_same(property, "create_web_public_stream_policy");
        update_called = true;
    };
    event = event_fixtures.realm__update__enable_spectator_access;
    dispatch(event);
    assert_same(page_params.realm_enable_spectator_access, true);
    assert_same(update_called, true);

    event = event_fixtures.realm__update_dict__default;
    page_params.realm_allow_message_editing = false;
    page_params.realm_message_content_edit_limit_seconds = 0;
    override(settings_org, "populate_auth_methods", noop);
    override(message_edit, "update_message_topic_editing_pencil", noop);
    dispatch(event);
    assert_same(page_params.realm_allow_message_editing, true);
    assert_same(page_params.realm_message_content_edit_limit_seconds, 5);
    assert_same(page_params.realm_authentication_methods, {Google: true});

    event = event_fixtures.realm__update_dict__icon;
    override(realm_icon, "rerender", noop);

    test_electron_dispatch(event, (key, val) => {
        assert_same(key, "realm_icon_url");
        assert_same(val, "icon.png");
    });

    assert_same(page_params.realm_icon_url, "icon.png");
    assert_same(page_params.realm_icon_source, "U");

    override(realm_logo, "render", noop);

    event = event_fixtures.realm__update_dict__logo;
    dispatch(event);
    assert_same(page_params.realm_logo_url, "logo.png");
    assert_same(page_params.realm_logo_source, "U");

    event = event_fixtures.realm__update_dict__night_logo;
    dispatch(event);
    assert_same(page_params.realm_night_logo_url, "night_logo.png");
    assert_same(page_params.realm_night_logo_source, "U");

    event = event_fixtures.realm__deactivated;
    set_global("location", {});
    dispatch(event);
    assert_same(window.location.href, "/accounts/deactivated/");
});

run_test("realm_bot add", ({override}) => {
    const event = event_fixtures.realm_bot__add;
    const bot_stub = make_stub();
    const admin_stub = make_stub();
    override(bot_data, "add", bot_stub.f);
    override(settings_bots, "render_bots", () => {});
    override(settings_users, "update_bot_data", admin_stub.f);
    dispatch(event);

    assert.equal(bot_stub.num_calls, 1);
    assert.equal(admin_stub.num_calls, 1);
    const args = bot_stub.get_args("bot");
    assert_same(args.bot, event.bot);
    admin_stub.get_args("update_user_id", "update_bot_data");
});

run_test("realm_bot remove", ({override}) => {
    const event = event_fixtures.realm_bot__remove;
    const bot_stub = make_stub();
    const admin_stub = make_stub();
    override(bot_data, "deactivate", bot_stub.f);
    override(settings_bots, "render_bots", () => {});
    override(settings_users, "update_bot_data", admin_stub.f);
    dispatch(event);

    assert.equal(bot_stub.num_calls, 1);
    assert.equal(admin_stub.num_calls, 1);
    const args = bot_stub.get_args("user_id");
    assert_same(args.user_id, event.bot.user_id);
    admin_stub.get_args("update_user_id", "update_bot_data");
});

run_test("realm_bot delete", ({override}) => {
    const event = event_fixtures.realm_bot__delete;
    const bot_stub = make_stub();
    const admin_stub = make_stub();
    override(bot_data, "del", bot_stub.f);
    override(settings_bots, "render_bots", () => {});
    override(settings_users, "redraw_bots_list", admin_stub.f);

    dispatch(event);
    assert.equal(bot_stub.num_calls, 1);
    const args = bot_stub.get_args("user_id");
    assert_same(args.user_id, event.bot.user_id);

    assert.equal(admin_stub.num_calls, 1);
});

run_test("realm_bot update", ({override}) => {
    const event = event_fixtures.realm_bot__update;
    const bot_stub = make_stub();
    const admin_stub = make_stub();
    override(bot_data, "update", bot_stub.f);
    override(settings_bots, "render_bots", () => {});
    override(settings_users, "update_bot_data", admin_stub.f);

    dispatch(event);

    assert.equal(bot_stub.num_calls, 1);
    assert.equal(admin_stub.num_calls, 1);
    let args = bot_stub.get_args("user_id", "bot");
    assert_same(args.user_id, event.bot.user_id);
    assert_same(args.bot, event.bot);

    args = admin_stub.get_args("update_user_id", "update_bot_data");
    assert_same(args.update_user_id, event.bot.user_id);
});

run_test("realm_emoji", ({override}) => {
    const event = event_fixtures.realm_emoji__update;

    const ui_func_names = [
        [settings_emoji, "populate_emoji"],
        [emoji_picker, "rebuild_catalog"],
        [composebox_typeahead, "update_emoji_data"],
    ];

    const ui_stubs = [];

    for (const [module, func_name] of ui_func_names) {
        const ui_stub = make_stub();
        override(module, func_name, ui_stub.f);
        ui_stubs.push(ui_stub);
    }

    // Make sure we start with nothing...
    emoji.update_emojis([]);
    assert.equal(emoji.get_realm_emoji_url("spain"), undefined);

    dispatch(event);

    // Now emoji.js knows about the spain emoji.
    assert_same(emoji.get_realm_emoji_url("spain"), "/some/path/to/spain.gif");

    // Make sure our UI modules all got dispatched the same simple way.
    for (const stub of ui_stubs) {
        assert.equal(stub.num_calls, 1);
        assert.equal(stub.last_call_args.length, 0);
    }
});

run_test("realm_linkifiers", ({override}) => {
    const event = event_fixtures.realm_linkifiers;
    page_params.realm_linkifiers = [];
    override(settings_linkifiers, "populate_linkifiers", noop);
    override(linkifiers, "update_linkifier_rules", noop);
    dispatch(event);
    assert_same(page_params.realm_linkifiers, event.realm_linkifiers);
});

run_test("realm_playgrounds", ({override}) => {
    const event = event_fixtures.realm_playgrounds;
    page_params.realm_playgrounds = [];
    override(settings_playgrounds, "populate_playgrounds", noop);
    override(realm_playground, "update_playgrounds", noop);
    dispatch(event);
    assert_same(page_params.realm_playgrounds, event.realm_playgrounds);
});

run_test("realm_domains", ({override}) => {
    let event = event_fixtures.realm_domains__add;
    page_params.realm_domains = [];
    override(settings_org, "populate_realm_domains", noop);
    dispatch(event);
    assert_same(page_params.realm_domains, [event.realm_domain]);

    override(settings_org, "populate_realm_domains", noop);
    event = event_fixtures.realm_domains__change;
    dispatch(event);
    assert_same(page_params.realm_domains, [event.realm_domain]);

    override(settings_org, "populate_realm_domains", noop);
    event = event_fixtures.realm_domains__remove;
    dispatch(event);
    assert_same(page_params.realm_domains, []);
});

run_test("realm_user", ({override}) => {
    let event = event_fixtures.realm_user__add;
    dispatch({...event});
    const added_person = people.get_by_user_id(event.person.user_id);
    // sanity check a few individual fields
    assert.equal(added_person.full_name, "Test User");
    assert.equal(added_person.timezone, "America/New_York");

    // ...but really the whole struct gets copied without any
    // manipulation
    assert.deepEqual(added_person, event.person);

    assert.ok(people.is_active_user_for_popover(event.person.user_id));

    event = event_fixtures.realm_user__remove;
    override(stream_events, "remove_deactivated_user_from_all_streams", noop);
    override(settings_users, "update_view_on_deactivate", noop);
    dispatch(event);

    // We don't actually remove the person, we just deactivate them.
    const removed_person = people.get_by_user_id(event.person.user_id);
    assert.equal(removed_person.full_name, "Test User");
    assert.ok(!people.is_active_user_for_popover(event.person.user_id));

    event = event_fixtures.realm_user__update;
    const stub = make_stub();
    override(user_events, "update_person", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("person");
    assert_same(args.person, event.person);
});

run_test("restart", ({override}) => {
    const event = event_fixtures.restart;
    const stub = make_stub();
    override(reload, "initiate", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("options");
    assert.equal(args.options.save_pointer, true);
    assert.equal(args.options.immediate, true);
});

run_test("submessage", ({override}) => {
    const event = event_fixtures.submessage;
    const stub = make_stub();
    override(submessage, "handle_event", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const submsg = stub.get_args("submsg").submsg;
    assert_same(submsg, {
        id: 99,
        sender_id: 42,
        msg_type: "stream",
        message_id: 56,
        content: "test",
    });
});

// For subscriptions, see dispatch_subs.js

run_test("typing", ({override}) => {
    // Simulate that we are not typing.
    page_params.user_id = typing_person1.user_id + 1;

    let event = event_fixtures.typing__start;
    {
        const stub = make_stub();
        override(typing_events, "display_notification", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("event");
        assert_same(args.event.sender.user_id, typing_person1.user_id);
    }

    event = event_fixtures.typing__stop;
    {
        const stub = make_stub();
        override(typing_events, "hide_notification", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("event");
        assert_same(args.event.sender.user_id, typing_person1.user_id);
    }

    // Get line coverage--we ignore our own typing events.
    page_params.user_id = typing_person1.user_id;
    event = event_fixtures.typing__start;
    dispatch(event);
});

run_test("user_settings", ({override, override_rewire}) => {
    settings_display.set_default_language_name = () => {};
    let event = event_fixtures.user_settings__default_language;
    user_settings.default_language = "en";
    override(settings_display, "update_page", noop);
    dispatch(event);
    assert_same(user_settings.default_language, "fr");

    event = event_fixtures.user_settings__left_side_userlist;
    user_settings.left_side_userlist = false;
    dispatch(event);
    assert_same(user_settings.left_side_userlist, true);

    event = event_fixtures.user_settings__escape_navigates_to_default_view;
    user_settings.escape_navigates_to_default_view = false;
    let toggled = [];
    $("#go-to-default-view-hotkey-help").toggleClass = (cls) => {
        toggled.push(cls);
    };
    dispatch(event);
    assert_same(user_settings.escape_navigates_to_default_view, true);
    assert_same(toggled, ["notdisplayed"]);

    // We alias message_list.narrowed to message_lists.current
    // to make sure we get line coverage on re-rendering
    // the current message list.  The actual code tests
    // that these two objects are equal.  It is possible
    // we want a better strategy for that, or at least
    // a helper.
    message_list.narrowed = message_lists.current;

    let called = false;
    message_lists.current.rerender = () => {
        called = true;
    };

    override(message_lists.home, "rerender", noop);
    event = event_fixtures.user_settings__twenty_four_hour_time;
    user_settings.twenty_four_hour_time = false;
    dispatch(event);
    assert_same(user_settings.twenty_four_hour_time, true);
    assert_same(called, true);

    event = event_fixtures.user_settings__translate_emoticons;
    user_settings.translate_emoticons = false;
    dispatch(event);
    assert_same(user_settings.translate_emoticons, true);

    event = event_fixtures.user_settings__display_emoji_reaction_users;
    user_settings.display_emoji_reaction_users = false;
    dispatch(event);
    assert_same(user_settings.display_emoji_reaction_users, true);

    event = event_fixtures.user_settings__high_contrast_mode;
    user_settings.high_contrast_mode = false;
    toggled = [];
    $("body").toggleClass = (cls) => {
        toggled.push(cls);
    };
    dispatch(event);
    assert_same(user_settings.high_contrast_mode, true);
    assert_same(toggled, ["high-contrast"]);

    event = event_fixtures.user_settings__dense_mode;
    user_settings.dense_mode = false;
    toggled = [];
    dispatch(event);
    assert_same(user_settings.dense_mode, true);
    assert_same(toggled, ["less_dense_mode", "more_dense_mode"]);

    $("body").fadeOut = (secs) => {
        assert_same(secs, 300);
    };
    $("body").fadeIn = (secs) => {
        assert_same(secs, 300);
    };

    override(realm_logo, "render", noop);

    {
        const stub = make_stub();
        event = event_fixtures.user_settings__color_scheme_dark;
        user_settings.color_scheme = 1;
        override(dark_theme, "enable", stub.f); // automatically checks if called
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        assert.equal(user_settings.color_scheme, 2);
    }

    {
        const stub = make_stub();
        event = event_fixtures.user_settings__color_scheme_light;
        user_settings.color_scheme = 1;
        override(dark_theme, "disable", stub.f); // automatically checks if called
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        assert.equal(user_settings.color_scheme, 3);
    }

    {
        event = event_fixtures.user_settings__default_view_recent_topics;
        user_settings.default_view = "all_messages";
        dispatch(event);
        assert.equal(user_settings.default_view, "recent_topics");
    }

    {
        event = event_fixtures.user_settings__default_view_all_messages;
        user_settings.default_view = "recent_topics";
        dispatch(event);
        assert.equal(user_settings.default_view, "all_messages");
    }

    {
        const stub = make_stub();
        event = event_fixtures.user_settings__color_scheme_automatic;
        user_settings.color_scheme = 2;
        override(dark_theme, "default_preference_checker", stub.f); // automatically checks if called
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        assert.equal(user_settings.color_scheme, 1);
    }

    {
        const stub = make_stub();
        event = event_fixtures.user_settings__emojiset;
        called = false;
        override(settings_display, "report_emojiset_change", stub.f);
        override(activity, "build_user_sidebar", noop);
        user_settings.emojiset = "text";
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        assert_same(called, true);
        assert_same(user_settings.emojiset, "google");
    }

    override_rewire(starred_messages, "rerender_ui", noop);
    event = event_fixtures.user_settings__starred_message_counts;
    user_settings.starred_message_counts = false;
    dispatch(event);
    assert_same(user_settings.starred_message_counts, true);

    override(scroll_bar, "set_layout_width", noop);
    event = event_fixtures.user_settings__fluid_layout_width;
    user_settings.fluid_layout_width = false;
    dispatch(event);
    assert_same(user_settings.fluid_layout_width, true);

    {
        const stub = make_stub();
        event = event_fixtures.user_settings__demote_inactive_streams;
        override(stream_data, "set_filter_out_inactives", noop);
        override_rewire(stream_list, "update_streams_sidebar", stub.f);
        user_settings.demote_inactive_streams = 1;
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        assert_same(user_settings.demote_inactive_streams, 2);
    }

    event = event_fixtures.user_settings__enter_sends;
    user_settings.enter_sends = false;
    dispatch(event);
    assert_same(user_settings.enter_sends, true);

    event = event_fixtures.user_settings__presence_enabled;
    user_settings.presence_enabled = true;
    override(activity, "redraw_user", noop);
    dispatch(event);
    assert_same(user_settings.presence_enabled, false);

    {
        event = event_fixtures.user_settings__enable_stream_audible_notifications;
        const stub = make_stub();
        override(notifications, "handle_global_notification_updates", stub.f);
        override(settings_notifications, "update_page", noop);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("name", "setting");
        assert_same(args.name, event.property);
        assert_same(args.setting, event.value);
    }
});

run_test("update_message (read)", ({override}) => {
    const event = event_fixtures.update_message_flags__read;

    const stub = make_stub();
    override(unread_ops, "process_read_messages_event", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("message_ids");
    assert_same(args.message_ids, [999]);
});

run_test("update_message (unread)", ({override}) => {
    const event = event_fixtures.update_message_flags__read_remove;

    const stub = make_stub();
    override(unread_ops, "process_unread_messages_event", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const {args} = stub.get_args("args");
    assert.deepEqual(args, {
        message_ids: event.messages,
        message_details: event.message_details,
    });
});

run_test("update_message (add star)", ({override, override_rewire}) => {
    override_rewire(starred_messages, "rerender_ui", noop);

    const event = event_fixtures.update_message_flags__starred_add;
    const stub = make_stub();
    override(ui, "update_starred_view", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("message_id", "new_value");
    assert_same(args.message_id, test_message.id);
    assert_same(args.new_value, true); // for 'add'
    const msg = message_store.get(test_message.id);
    assert.equal(msg.starred, true);
});

run_test("update_message (remove star)", ({override, override_rewire}) => {
    override_rewire(starred_messages, "rerender_ui", noop);
    const event = event_fixtures.update_message_flags__starred_remove;
    const stub = make_stub();
    override(ui, "update_starred_view", stub.f);
    dispatch(event);
    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("message_id", "new_value");
    assert_same(args.message_id, test_message.id);
    assert_same(args.new_value, false);
    const msg = message_store.get(test_message.id);
    assert.equal(msg.starred, false);
});

run_test("update_message (wrong data)", ({override_rewire}) => {
    override_rewire(starred_messages, "rerender_ui", noop);
    const event = {
        ...event_fixtures.update_message_flags__starred_add,
        messages: [0], // message does not exist
    };
    dispatch(event);
    // update_starred_view never gets invoked, early return is successful
});

run_test("delete_message", ({override, override_rewire}) => {
    const event = event_fixtures.delete_message;

    override_rewire(stream_list, "update_streams_sidebar", noop);

    const message_events_stub = make_stub();
    override(message_events, "remove_messages", message_events_stub.f);

    const unread_ops_stub = make_stub();
    override(unread_ops, "process_read_messages_event", unread_ops_stub.f);

    const stream_topic_history_stub = make_stub();
    override_rewire(stream_topic_history, "remove_messages", stream_topic_history_stub.f);

    dispatch(event);

    let args;

    args = message_events_stub.get_args("message_ids");
    assert_same(args.message_ids, [1337]);

    args = unread_ops_stub.get_args("message_ids");
    assert_same(args.message_ids, [1337]);

    args = stream_topic_history_stub.get_args("opts");
    assert_same(args.opts.stream_id, 99);
    assert_same(args.opts.topic_name, "topic1");
    assert_same(args.opts.num_messages, 1);
    assert_same(args.opts.max_removed_msg_id, 1337);
});

run_test("user_status", ({override, override_rewire}) => {
    let event = event_fixtures.user_status__set_away;
    {
        const stub = make_stub();
        override(activity, "on_set_away", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("user_id");
        assert_same(args.user_id, 55);
    }

    event = event_fixtures.user_status__revoke_away;
    {
        const stub = make_stub();
        override(activity, "on_revoke_away", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("user_id");
        assert_same(args.user_id, 63);
    }

    event = event_fixtures.user_status__set_status_emoji;
    {
        const stub = make_stub();
        override(activity, "redraw_user", stub.f);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("user_id");
        assert_same(args.user_id, test_user.user_id);
        const emoji_info = user_status.get_status_emoji(test_user.user_id);
        assert.deepEqual(emoji_info, {
            emoji_name: "smiley",
            emoji_code: "1f603",
            reaction_type: "unicode_emoji",
            // Extra parameters that were added by `emoji.get_emoji_details_by_name`
            emoji_alt_code: false,
        });
    }

    event = event_fixtures.user_status__set_status_text;
    {
        const stub = make_stub();
        override(activity, "redraw_user", stub.f);
        override_rewire(compose_pm_pill, "get_user_ids", () => [event.user_id]);
        dispatch(event);
        assert.equal(stub.num_calls, 1);
        const args = stub.get_args("user_id");
        assert_same(args.user_id, test_user.user_id);
        const status_text = user_status.get_status_text(test_user.user_id);
        assert.equal(status_text, "out to lunch");
    }
});

run_test("realm_export", ({override}) => {
    const event = event_fixtures.realm_export;
    const stub = make_stub();
    override(settings_exports, "populate_exports_table", stub.f);
    dispatch(event);

    assert.equal(stub.num_calls, 1);
    const args = stub.get_args("exports");
    assert.equal(args.exports, event.exports);
});

run_test("server_event_dispatch_op_errors", ({override}) => {
    blueslip.expect("error", "Unexpected event type subscription/other");
    server_events_dispatch.dispatch_normal_event({type: "subscription", op: "other"});
    blueslip.expect("error", "Unexpected event type reaction/other");
    server_events_dispatch.dispatch_normal_event({type: "reaction", op: "other"});
    blueslip.expect("error", "Unexpected event type realm/update_dict/other");
    server_events_dispatch.dispatch_normal_event({
        type: "realm",
        op: "update_dict",
        property: "other",
    });
    blueslip.expect("error", "Unexpected event type realm_bot/other");
    server_events_dispatch.dispatch_normal_event({type: "realm_bot", op: "other"});
    blueslip.expect("error", "Unexpected event type realm_domains/other");
    server_events_dispatch.dispatch_normal_event({type: "realm_domains", op: "other"});
    blueslip.expect("error", "Unexpected event type realm_user/other");
    server_events_dispatch.dispatch_normal_event({type: "realm_user", op: "other"});
    blueslip.expect("error", "Unexpected event type stream/other");
    server_events_dispatch.dispatch_normal_event({type: "stream", op: "other"});
    blueslip.expect("error", "Unexpected event type typing/other");
    server_events_dispatch.dispatch_normal_event({
        type: "typing",
        sender: {user_id: 5},
        op: "other",
    });
    override(settings_user_groups, "reload", noop);
    blueslip.expect("error", "Unexpected event type user_group/other");
    server_events_dispatch.dispatch_normal_event({type: "user_group", op: "other"});
});

run_test("realm_user_settings_defaults", ({override}) => {
    let event = event_fixtures.realm_user_settings_defaults__emojiset;
    realm_user_settings_defaults.emojiset = "text";
    override(settings_realm_user_settings_defaults, "update_page", noop);
    dispatch(event);
    assert_same(realm_user_settings_defaults.emojiset, "google");

    event = event_fixtures.realm_user_settings_defaults__notification_sound;
    realm_user_settings_defaults.notification_sound = "zulip";
    let called = false;
    notifications.update_notification_sound_source = () => {
        called = true;
    };
    dispatch(event);
    assert_same(realm_user_settings_defaults.notification_sound, "ding");
    assert_same(called, true);
});
