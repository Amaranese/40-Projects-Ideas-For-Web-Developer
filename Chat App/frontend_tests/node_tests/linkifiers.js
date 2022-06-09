"use strict";

const {strict: assert} = require("assert");

const {zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const blueslip = require("../zjsunit/zblueslip");

const linkifiers = zrequire("linkifiers");

linkifiers.initialize([]);

function get_linkifier_regexes() {
    return Array.from(linkifiers.get_linkifier_map().keys());
}

run_test("python_to_js_linkifier", () => {
    // The only way to reach python_to_js_linkifier is indirectly, hence the call
    // to update_linkifier_rules.
    linkifiers.update_linkifier_rules([
        {
            pattern: "/a(?im)a/g",
            url_format: "http://example1.example.com",
            id: 10,
        },
        {
            pattern: "/a(?L)a/g",
            url_format: "http://example2.example.com",
            id: 20,
        },
    ]);
    let actual_value = get_linkifier_regexes();
    let expected_value = [/\/aa\/g(?!\w)/gim, /\/aa\/g(?!\w)/g];
    assert.deepEqual(actual_value, expected_value);
    // Test case with multiple replacements.
    linkifiers.update_linkifier_rules([
        {
            pattern: "#cf(?P<contest>\\d+)(?P<problem>[A-Z][\\dA-Z]*)",
            url_format: "http://example3.example.com",
            id: 30,
        },
    ]);
    actual_value = get_linkifier_regexes();
    expected_value = [/#cf(\d+)([A-Z][\dA-Z]*)(?!\w)/g];
    assert.deepEqual(actual_value, expected_value);
    // Test incorrect syntax.
    blueslip.expect(
        "error",
        "python_to_js_linkifier: Invalid regular expression: /!@#@(!#&((!&(@#((?!\\w)/: Unterminated group",
    );
    linkifiers.update_linkifier_rules([
        {
            pattern: "!@#@(!#&((!&(@#(",
            url_format: "http://example4.example.com",
            id: 40,
        },
    ]);
    actual_value = get_linkifier_regexes();
    expected_value = [];
    assert.deepEqual(actual_value, expected_value);
});
