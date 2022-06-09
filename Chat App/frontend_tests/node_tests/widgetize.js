"use strict";

const {strict: assert} = require("assert");

const {mock_esm, set_global, zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const blueslip = require("../zjsunit/zblueslip");
const $ = require("../zjsunit/zjquery");

const sample_events = [
    {
        data: {
            option: "First option",
            idx: 1,
            type: "new_option",
        },
        sender_id: 101,
    },
    {
        data: {
            option: "Second option",
            idx: 1,
            type: "new_option",
        },
        sender_id: 102,
    },
    {
        data: {
            option: "Third option",
            idx: 1,
            type: "new_option",
        },
        sender_id: 102,
    },
];

let events;
let $widget_elem;
let is_event_handled;
let is_widget_activated;

const fake_poll_widget = {
    activate(data) {
        is_widget_activated = true;
        $widget_elem = data.$elem;
        assert.ok($widget_elem.hasClass("widget-content"));
        $widget_elem.handle_events = (e) => {
            is_event_handled = true;
            assert.notDeepStrictEqual(e, events);
            events.shift();
            assert.deepStrictEqual(e, events);
        };
        data.callback("test_data");
    },
};

const message_lists = mock_esm("../../static/js/message_lists", {current: {}});
const narrow_state = mock_esm("../../static/js/narrow_state");
mock_esm("../../static/js/poll_widget", fake_poll_widget);

set_global("document", "document-stub");

const widgetize = zrequire("widgetize");

function test(label, f) {
    run_test(label, ({override}) => {
        events = [...sample_events];
        $widget_elem = undefined;
        is_event_handled = false;
        is_widget_activated = false;
        widgetize.clear_for_testing();
        f({override});
    });
}

test("activate", ({override}) => {
    // Both widgetize.activate and widgetize.handle_event are tested
    // here to use the "caching" of widgets
    const $row = $.create("<stub message row>");
    $row.attr("id", "zhome2909");
    const $message_content = $.create("#zhome2909");
    $row.set_find_results(".message_content", $message_content);

    let narrow_active;
    override(narrow_state, "active", () => narrow_active);

    const opts = {
        events: events.slice(),
        extra_data: "",
        message: {
            id: 2001,
        },
        post_to_server: (data) => {
            assert.equal(data.msg_type, "widget");
            assert.equal(data.data, "test_data");
        },
        $row,
        widget_type: "poll",
    };

    let is_widget_elem_inserted;

    $message_content.append = ($elem) => {
        is_widget_elem_inserted = true;
        assert.equal($elem, $widget_elem);
        assert.ok($elem.hasClass("widget-content"));
    };

    is_widget_elem_inserted = false;
    is_widget_activated = false;
    is_event_handled = false;
    assert.ok(!widgetize.widget_contents.has(opts.message.id));

    $message_content.set_find_results(".widget-content", false);
    widgetize.activate(opts);

    assert.ok(is_widget_elem_inserted);
    assert.ok(is_widget_activated);
    assert.ok(is_event_handled);
    assert.equal(widgetize.widget_contents.get(opts.message.id), $widget_elem);

    is_widget_elem_inserted = false;
    is_widget_activated = false;
    is_event_handled = false;

    $message_content.set_find_results(".widget-content", false);
    widgetize.activate(opts);

    assert.ok(is_widget_elem_inserted);
    assert.ok(!is_widget_activated);
    assert.ok(!is_event_handled);

    narrow_active = true;
    is_widget_elem_inserted = false;
    is_widget_activated = false;
    is_event_handled = false;

    $message_content.set_find_results(".widget-content", false);
    widgetize.activate(opts);

    assert.ok(!is_widget_elem_inserted);
    assert.ok(!is_widget_activated);
    assert.ok(!is_event_handled);

    blueslip.expect("warn", "unknown widget_type");
    narrow_active = false;
    is_widget_elem_inserted = false;
    is_widget_activated = false;
    is_event_handled = false;
    opts.widget_type = "invalid_widget";

    widgetize.activate(opts);
    assert.ok(!is_widget_elem_inserted);
    assert.ok(!is_widget_activated);
    assert.ok(!is_event_handled);
    assert.equal(blueslip.get_test_logs("warn")[0].more_info, "invalid_widget");

    opts.widget_type = "tictactoe";

    widgetize.activate(opts);
    assert.ok(!is_widget_elem_inserted);
    assert.ok(!is_widget_activated);
    assert.ok(!is_event_handled);

    /* Testing widgetize.handle_events */
    const post_activate_event = {
        data: {
            idx: 1,
            type: "new_option",
        },
        message_id: 2001,
        sender_id: 102,
    };
    $widget_elem.handle_events = (e) => {
        is_event_handled = true;
        assert.deepEqual(e, [post_activate_event]);
    };
    is_event_handled = false;
    widgetize.handle_event(post_activate_event);
    assert.ok(is_event_handled);

    is_event_handled = false;
    post_activate_event.message_id = 1000;
    widgetize.handle_event(post_activate_event);
    assert.ok(!is_event_handled);

    /* Test narrow change message update */
    override(message_lists.current, "get", (idx) => {
        assert.equal(idx, 2001);
        return {};
    });
    override(message_lists.current, "get_row", (idx) => {
        assert.equal(idx, 2001);
        return $row;
    });
    widgetize.set_widgets_for_list();
});
