"use strict";

const {strict: assert} = require("assert");

const {zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");

const narrow_state = zrequire("narrow_state");
const pm_list = zrequire("pm_list");

run_test("update_dom_with_unread_counts", () => {
    let counts;

    // simulate an active narrow
    narrow_state.set_current_filter("stub");
    assert.equal(narrow_state.active(), true);

    const $total_count = $.create("total-count-stub");
    const $private_li = $(".top_left_private_messages .private_messages_header");
    $private_li.set_find_results(".unread_count", $total_count);

    counts = {
        private_message_count: 10,
    };

    pm_list.update_dom_with_unread_counts(counts);
    assert.equal($total_count.text(), "10");
    assert.ok($total_count.visible());

    counts = {
        private_message_count: 0,
    };

    pm_list.update_dom_with_unread_counts(counts);
    assert.equal($total_count.text(), "");
    assert.ok(!$total_count.visible());
});
