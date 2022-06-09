"use strict";

// Setup
const {strict: assert} = require("assert");

const {mock_esm, set_global, zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");

mock_esm("../../static/js/recent_topics_util", {
    is_visible: () => false,
});

// Mocking and stubbing things
set_global("document", "document-stub");
const message_lists = mock_esm("../../static/js/message_lists");

// Code we're actually using/testing
const compose_closed_ui = zrequire("compose_closed_ui");
const {Filter} = zrequire("filter");
const {MessageList} = zrequire("message_list");

// Helper test function
function test_reply_label(expected_label) {
    const label = $(".compose_reply_button_label").text();
    const prepend_text_length = "translated: Message ".length;
    assert.equal(
        label.slice(prepend_text_length),
        expected_label,
        "'" + label.slice(prepend_text_length),
        Number("' did not match '") + expected_label + "'",
    );
}

run_test("reply_label", () => {
    // Mocking up a test message list
    const filter = new Filter();
    const list = new MessageList({
        filter,
    });
    message_lists.current = list;
    list.add_messages([
        {
            id: 0,
            stream: "first_stream",
            topic: "first_topic",
        },
        {
            id: 1,
            stream: "first_stream",
            topic: "second_topic",
        },
        {
            id: 2,
            stream: "second_stream",
            topic: "third_topic",
        },
        {
            id: 3,
            stream: "second_stream",
            topic: "second_topic",
        },
        {
            id: 4,
            display_reply_to: "some user",
        },
        {
            id: 5,
            display_reply_to: "some user, other user",
        },
    ]);

    const expected_labels = [
        "#first_stream > first_topic",
        "#first_stream > second_topic",
        "#second_stream > third_topic",
        "#second_stream > second_topic",
        "some user",
        "some user, other user",
    ];

    // Initialize the code we're testing.
    compose_closed_ui.initialize();

    // Run the tests!
    let first = true;
    for (const expected_label of expected_labels) {
        if (first) {
            list.select_id(list.first().id);
            first = false;
        } else {
            list.select_id(list.next());
        }
        test_reply_label(expected_label);
    }
});

run_test("test_custom_message_input", () => {
    compose_closed_ui.update_reply_recipient_label({
        stream: "stream test",
        topic: "topic test",
    });
    test_reply_label("#stream test > topic test");
});

run_test("empty_narrow", () => {
    message_lists.current.empty = () => true;
    compose_closed_ui.update_reply_recipient_label();
    const label = $(".compose_reply_button_label").text();
    assert.equal(label, "translated: Compose message");
});
