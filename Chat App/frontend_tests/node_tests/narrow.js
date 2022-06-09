"use strict";

const {strict: assert} = require("assert");

const {with_function_call_disallowed_rewire, zrequire, mock_esm} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");
const {page_params} = require("../zjsunit/zpage_params");

const hash_util = zrequire("hash_util");
const compose_state = zrequire("compose_state");
const narrow_banner = zrequire("narrow_banner");
const narrow_state = zrequire("narrow_state");
const people = zrequire("people");
const stream_data = zrequire("stream_data");
const {Filter} = zrequire("../js/filter");
const narrow = zrequire("narrow");

mock_esm("../../static/js/spectators", {
    login_to_access: () => {},
});

function empty_narrow_html(title, html, search_data) {
    const opts = {
        title,
        html,
        search_data,
    };
    return require("../../static/templates/empty_feed_notice.hbs")(opts);
}

function set_filter(operators) {
    operators = operators.map((op) => ({
        operator: op[0],
        operand: op[1],
    }));
    narrow_state.set_current_filter(new Filter(operators));
}

const me = {
    email: "me@example.com",
    user_id: 5,
    full_name: "Me Myself",
};

const alice = {
    email: "alice@example.com",
    user_id: 23,
    full_name: "Alice Smith",
};

const ray = {
    email: "ray@example.com",
    user_id: 22,
    full_name: "Raymond",
};

function hide_all_empty_narrow_messages() {
    const all_empty_narrow_messages = [
        ".empty_feed_notice",
        "#empty_narrow_message",
        "#nonsubbed_private_nonexistent_stream_narrow_message",
        "#nonsubbed_stream_narrow_message",
        "#empty_star_narrow_message",
        "#empty_narrow_all_mentioned",
        "#empty_narrow_all_private_message",
        "#no_unread_narrow_message",
        "#non_existing_user",
        "#non_existing_users",
        "#empty_narrow_private_message",
        "#empty_narrow_self_private_message",
        "#empty_narrow_multi_private_message",
        "#empty_narrow_group_private_message",
        "#silent_user",
        "#empty_search_narrow_message",
        "#empty_narrow_resolved_topics",
    ];
    for (const selector of all_empty_narrow_messages) {
        $(selector).hide();
    }
}

run_test("empty_narrow_html", ({mock_template}) => {
    mock_template("empty_feed_notice.hbs", true, (data, html) => html);

    let actual_html = empty_narrow_html("This is a title", "<h1> This is the html </h1>");
    assert.equal(
        actual_html,
        `<div class="empty_feed_notice">
    <h4> This is a title </h4>
    <h1> This is the html </h1>
</div>
`,
    );

    const search_data_with_all_search_types = {
        topic_query: "test",
        stream_query: "new",
        has_stop_word: true,
        query_words: [
            {query_word: "search", is_stop_word: false},
            {query_word: "a", is_stop_word: true},
        ],
    };
    actual_html = empty_narrow_html(
        "This is a title",
        undefined,
        search_data_with_all_search_types,
    );
    assert.equal(
        actual_html,
        `<div class="empty_feed_notice">
    <h4> This is a title </h4>
    <div>
        Some common words were excluded from your search. <br/>You searched for:
        <span>stream: new</span>
        <span>topic: test</span>
            <span>search</span>
            <del>a</del>
    </div>
</div>
`,
    );

    const search_data_with_stream_without_stop_words = {
        has_stop_word: false,
        stream_query: "hello world",
        query_words: [{query_word: "searchA", is_stop_word: false}],
    };
    actual_html = empty_narrow_html(
        "This is a title",
        undefined,
        search_data_with_stream_without_stop_words,
    );
    assert.equal(
        actual_html,
        `<div class="empty_feed_notice">
    <h4> This is a title </h4>
    <div>
        You searched for:
        <span>stream: hello world</span>
            <span>searchA</span>
    </div>
</div>
`,
    );

    const search_data_with_topic_without_stop_words = {
        has_stop_word: false,
        topic_query: "hello",
        query_words: [{query_word: "searchB", is_stop_word: false}],
    };
    actual_html = empty_narrow_html(
        "This is a title",
        undefined,
        search_data_with_topic_without_stop_words,
    );
    assert.equal(
        actual_html,
        `<div class="empty_feed_notice">
    <h4> This is a title </h4>
    <div>
        You searched for:
        <span>topic: hello</span>
            <span>searchB</span>
    </div>
</div>
`,
    );
});

run_test("uris", () => {
    people.add_active_user(ray);
    people.add_active_user(alice);
    people.add_active_user(me);
    people.initialize_current_user(me.user_id);

    let url = hash_util.pm_with_url(ray.email);
    assert.equal(url, "#narrow/pm-with/22-ray");

    url = hash_util.huddle_with_url("22,23");
    assert.equal(url, "#narrow/pm-with/22,23-group");

    url = hash_util.by_sender_url(ray.email);
    assert.equal(url, "#narrow/sender/22-ray");

    let emails = hash_util.decode_operand("pm-with", "22,23-group");
    assert.equal(emails, "alice@example.com,ray@example.com");

    emails = hash_util.decode_operand("pm-with", "5,22,23-group");
    assert.equal(emails, "alice@example.com,ray@example.com");

    emails = hash_util.decode_operand("pm-with", "5-group");
    assert.equal(emails, "me@example.com");
});

run_test("show_empty_narrow_message", ({mock_template}) => {
    page_params.stop_words = [];

    mock_template("empty_feed_notice.hbs", true, (data, html) => html);

    narrow_state.reset_current_filter();
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: Nothing's been sent here yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_stream">start the conversation</a>?',
        ),
    );

    // for non-existent or private stream
    set_filter([["stream", "Foo"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: This stream does not exist or is private."),
    );

    // for non-subbed public stream
    stream_data.add_sub({name: "ROME", stream_id: 99});
    set_filter([["stream", "Rome"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You aren't subscribed to this stream and nobody has talked about that yet!",
            'translated HTML: <button class="button white rounded stream_sub_unsub_button sea-green" type="button" name="subscription">Subscribe</button>',
        ),
    );

    // for non-web-public stream for spectator
    page_params.is_spectator = true;
    set_filter([["stream", "Rome"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "",
            'translated HTML: This is not a <a href="/help/public-access-option">publicly accessible</a> conversation.',
        ),
    );

    set_filter([
        ["stream", "Rome"],
        ["topic", "foo"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "",
            'translated HTML: This is not a <a href="/help/public-access-option">publicly accessible</a> conversation.',
        ),
    );

    // for web-public stream for spectator
    stream_data.add_sub({name: "web-public-stream", stream_id: 1231, is_web_public: true});
    set_filter([
        ["stream", "web-public-stream"],
        ["topic", "foo"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: Nothing's been sent here yet!", ""),
    );
    page_params.is_spectator = false;

    set_filter([["is", "starred"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You haven't starred anything yet!",
            'translated HTML: Learn more about starring messages <a href="/help/star-a-message">here</a>.',
        ),
    );

    set_filter([["is", "mentioned"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You haven't been mentioned yet!",
            'translated HTML: Learn more about mentions <a href="/help/mention-a-user-or-group">here</a>.',
        ),
    );

    set_filter([["is", "private"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You have no private messages yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_private">start the conversation</a>?',
        ),
    );

    set_filter([["is", "unread"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: You have no unread messages!"),
    );

    set_filter([["is", "resolved"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: No topics are marked as resolved."),
    );

    set_filter([["pm-with", ["Yo"]]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: This user does not exist!"),
    );

    people.add_active_user(alice);
    set_filter([["pm-with", ["alice@example.com", "Yo"]]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: One or more of these users do not exist!"),
    );

    set_filter([["pm-with", "alice@example.com"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You have no private messages with this person yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_private">start the conversation</a>?',
        ),
    );

    people.add_active_user(me);
    people.initialize_current_user(me.user_id);
    set_filter([["pm-with", me.email]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You have not sent any private messages to yourself yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_private">start a conversation with yourself</a>?',
        ),
    );

    set_filter([["pm-with", me.email + "," + alice.email]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You have no private messages with these people yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_private">start the conversation</a>?',
        ),
    );

    set_filter([["group-pm-with", "alice@example.com"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: You have no group private messages with this person yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_private">start the conversation</a>?',
        ),
    );

    set_filter([["sender", "ray@example.com"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: You haven't received any messages sent by this user yet!"),
    );

    set_filter([["sender", "sinwar@example.com"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: This user does not exist!"),
    );

    set_filter([
        ["sender", "alice@example.com"],
        ["stream", "Rome"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: Nothing's been sent here yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_stream">start the conversation</a>?',
        ),
    );

    set_filter([["is", "invalid"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: Nothing's been sent here yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_stream">start the conversation</a>?',
        ),
    );

    const my_stream = {
        name: "my stream",
        stream_id: 103,
    };
    stream_data.add_sub(my_stream);
    stream_data.subscribe_myself(my_stream);

    set_filter([["stream", "my stream"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: Nothing's been sent here yet!",
            'translated HTML: Why not <a href="#" class="empty_feed_compose_stream">start the conversation</a>?',
        ),
    );

    set_filter([["stream", ""]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: This stream does not exist or is private."),
    );
});

run_test("show_empty_narrow_message_with_search", ({mock_template}) => {
    page_params.stop_words = [];

    mock_template("empty_feed_notice.hbs", true, (data, html) => html);

    narrow_state.reset_current_filter();
    set_filter([["search", "grail"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.match($(".empty_feed_notice_main").html(), /<span>grail<\/span>/);
});

run_test("hide_empty_narrow_message", () => {
    narrow_banner.hide_empty_narrow_message();
    assert.equal($(".empty_feed_notice").text(), "never-been-set");
});

run_test("show_search_stopwords", ({mock_template}) => {
    page_params.stop_words = ["what", "about"];

    mock_template("empty_feed_notice.hbs", true, (data, html) => html);

    const expected_search_data = {
        has_stop_word: true,
        query_words: [
            {query_word: "what", is_stop_word: true},
            {query_word: "about", is_stop_word: true},
            {query_word: "grail", is_stop_word: false},
        ],
    };
    narrow_state.reset_current_filter();
    set_filter([["search", "what about grail"]]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: No search results", undefined, expected_search_data),
    );

    const expected_stream_search_data = {
        has_stop_word: true,
        stream_query: "streamA",
        query_words: [
            {query_word: "what", is_stop_word: true},
            {query_word: "about", is_stop_word: true},
            {query_word: "grail", is_stop_word: false},
        ],
    };
    set_filter([
        ["stream", "streamA"],
        ["search", "what about grail"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html("translated: No search results", undefined, expected_stream_search_data),
    );

    const expected_stream_topic_search_data = {
        has_stop_word: true,
        stream_query: "streamA",
        topic_query: "topicA",
        query_words: [
            {query_word: "what", is_stop_word: true},
            {query_word: "about", is_stop_word: true},
            {query_word: "grail", is_stop_word: false},
        ],
    };
    set_filter([
        ["stream", "streamA"],
        ["topic", "topicA"],
        ["search", "what about grail"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: No search results",
            undefined,
            expected_stream_topic_search_data,
        ),
    );
});

run_test("show_invalid_narrow_message", ({mock_template}) => {
    narrow_state.reset_current_filter();
    mock_template("empty_feed_notice.hbs", true, (data, html) => html);

    stream_data.add_sub({name: "streamA", stream_id: 88});
    stream_data.add_sub({name: "streamB", stream_id: 77});

    set_filter([
        ["stream", "streamA"],
        ["stream", "streamB"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: No search results",
            "translated HTML: <p>You are searching for messages that belong to more than one stream, which is not possible.</p>",
        ),
    );

    set_filter([
        ["topic", "topicA"],
        ["topic", "topicB"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: No search results",
            "translated HTML: <p>You are searching for messages that belong to more than one topic, which is not possible.</p>",
        ),
    );

    people.add_active_user(ray);
    people.add_active_user(alice);

    set_filter([
        ["sender", "alice@example.com"],
        ["sender", "ray@example.com"],
    ]);
    hide_all_empty_narrow_messages();
    narrow_banner.show_empty_narrow_message();
    assert.equal(
        $(".empty_feed_notice_main").html(),
        empty_narrow_html(
            "translated: No search results",
            "translated HTML: <p>You are searching for messages that are sent by more than one person, which is not possible.</p>",
        ),
    );
});

run_test("narrow_to_compose_target errors", () => {
    function test() {
        with_function_call_disallowed_rewire(narrow, "activate", () => {
            narrow.to_compose_target();
        });
    }

    // No-op when not composing.
    compose_state.set_message_type(false);
    test();

    // No-op when empty stream.
    compose_state.set_message_type("stream");
    compose_state.stream_name("");
    test();
});

run_test("narrow_to_compose_target streams", ({override_rewire}) => {
    const args = {called: false};
    override_rewire(narrow, "activate", (operators, opts) => {
        args.operators = operators;
        args.opts = opts;
        args.called = true;
    });

    compose_state.set_message_type("stream");
    stream_data.add_sub({name: "ROME", stream_id: 99});
    compose_state.stream_name("ROME");

    // Test with existing topic
    compose_state.topic("one");
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.equal(args.opts.trigger, "narrow_to_compose_target");
    assert.deepEqual(args.operators, [
        {operator: "stream", operand: "ROME"},
        {operator: "topic", operand: "one"},
    ]);

    // Test with new topic
    compose_state.topic("four");
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [
        {operator: "stream", operand: "ROME"},
        {operator: "topic", operand: "four"},
    ]);

    // Test with blank topic
    compose_state.topic("");
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "stream", operand: "ROME"}]);

    // Test with no topic
    compose_state.topic(undefined);
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "stream", operand: "ROME"}]);
});

run_test("narrow_to_compose_target PMs", ({override_rewire}) => {
    const args = {called: false};
    override_rewire(narrow, "activate", (operators, opts) => {
        args.operators = operators;
        args.opts = opts;
        args.called = true;
    });

    let emails;
    override_rewire(compose_state, "private_message_recipient", () => emails);

    compose_state.set_message_type("private");
    people.add_active_user(ray);
    people.add_active_user(alice);
    people.add_active_user(me);

    // Test with valid person
    emails = "alice@example.com";
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "pm-with", operand: "alice@example.com"}]);

    // Test with valid persons
    emails = "alice@example.com,ray@example.com";
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [
        {operator: "pm-with", operand: "alice@example.com,ray@example.com"},
    ]);

    // Test with some invalid persons
    emails = "alice@example.com,random,ray@example.com";
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "is", operand: "private"}]);

    // Test with all invalid persons
    emails = "alice,random,ray";
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "is", operand: "private"}]);

    // Test with no persons
    emails = "";
    args.called = false;
    narrow.to_compose_target();
    assert.equal(args.called, true);
    assert.deepEqual(args.operators, [{operator: "is", operand: "private"}]);
});
