"use strict";

const {strict: assert} = require("assert");

const {add} = require("date-fns");
const MockDate = require("mockdate");

const {$t} = require("../zjsunit/i18n");
const {zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");
const {user_settings} = require("../zjsunit/zpage_params");

user_settings.twenty_four_hour_time = true;

const timerender = zrequire("timerender");

function get_date(time_ISO, DOW) {
    const time = new Date(time_ISO);
    // DOW helps the test reader to know the DOW of the current date being tested.
    assert.equal(new Intl.DateTimeFormat("en-US", {weekday: "long"}).format(time), DOW);
    return time;
}

const date_2017 = get_date("2017-05-18T07:12:53.000Z", "Thursday");

// Check there is no UTC offset.
assert.equal(timerender.get_tz_with_UTC_offset(date_2017.getTime()), "UTC");

const date_2017_PM = get_date("2017-05-18T21:12:53.000Z", "Thursday");

const date_2019 = get_date("2019-04-12T17:52:53.000Z", "Friday");

const date_2021 = get_date("2021-01-27T01:53:08.000Z", "Wednesday");

const date_2025 = get_date("2025-03-03T12:10:00.000Z", "Monday");

run_test("get_tz_with_UTC_offset", () => {
    let time = date_2019;

    assert.equal(timerender.get_tz_with_UTC_offset(time), "UTC");
    const previous_env_tz = process.env.TZ;

    // Test the GMT[+-]x:y logic.
    process.env.TZ = "Asia/Kolkata";
    assert.equal(timerender.get_tz_with_UTC_offset(time), "(UTC+05:30)");

    process.env.TZ = "America/Los_Angeles";
    assert.equal(timerender.get_tz_with_UTC_offset(time), "PDT (UTC-07:00)");

    time = date_2025;

    assert.equal(timerender.get_tz_with_UTC_offset(time), "PST (UTC-08:00)");

    process.env.TZ = previous_env_tz;
});

run_test("render_now_returns_today", () => {
    const today = date_2019;

    const expected = {
        time_str: $t({defaultMessage: "Today"}),
        formal_time_str: "Friday, April 12, 2019",
        needs_update: true,
    };
    const actual = timerender.render_now(today, today);
    assert.equal(actual.time_str, expected.time_str);
    assert.equal(actual.formal_time_str, expected.formal_time_str);
    assert.equal(actual.needs_update, expected.needs_update);
});

run_test("render_now_returns_yesterday", () => {
    const today = date_2019;

    const yesterday = add(today, {days: -1});
    const expected = {
        time_str: $t({defaultMessage: "Yesterday"}),
        formal_time_str: "Thursday, April 11, 2019",
        needs_update: true,
    };
    const actual = timerender.render_now(yesterday, today);
    assert.equal(actual.time_str, expected.time_str);
    assert.equal(actual.formal_time_str, expected.formal_time_str);
    assert.equal(actual.needs_update, expected.needs_update);
});

run_test("render_now_returns_year", () => {
    const today = date_2019;

    const year_ago = add(today, {years: -1});
    const expected = {
        time_str: "Apr 12, 2018",
        formal_time_str: "Thursday, April 12, 2018",
        needs_update: false,
    };
    const actual = timerender.render_now(year_ago, today);
    assert.equal(actual.time_str, expected.time_str);
    assert.equal(actual.formal_time_str, expected.formal_time_str);
    assert.equal(actual.needs_update, expected.needs_update);
});

run_test("render_now_returns_month_and_day", () => {
    const today = date_2019;

    const three_months_ago = add(today, {months: -3});
    const expected = {
        time_str: "Jan 12",
        formal_time_str: "Saturday, January 12, 2019",
        needs_update: false,
    };
    const actual = timerender.render_now(three_months_ago, today);
    assert.equal(actual.time_str, expected.time_str);
    assert.equal(actual.formal_time_str, expected.formal_time_str);
    assert.equal(actual.needs_update, expected.needs_update);
});

run_test("format_time_modern", () => {
    const today = date_2021;

    const few_minutes_in_future = add(today, {minutes: 30});
    const weeks_in_future = add(today, {days: 20});
    const less_than_24_hours_ago = add(today, {hours: -23});
    const twenty_four_hours_ago = add(today, {hours: -24});
    const more_than_24_hours_ago = add(today, {hours: -25});
    const less_than_a_week_ago = add(today, {days: -6});
    const one_week_ago = add(today, {days: -7});
    const less_than_6_months_ago = add(today, {months: -3});
    const more_than_6_months_ago = add(today, {months: -9});
    const previous_year_but_less_than_6_months = add(today, {months: -1});

    assert.equal(timerender.format_time_modern(few_minutes_in_future, today), "Jan 27, 2021");
    assert.equal(timerender.format_time_modern(weeks_in_future, today), "Feb 16, 2021");
    assert.equal(timerender.format_time_modern(less_than_24_hours_ago, today), "2:53 AM");
    assert.equal(
        timerender.format_time_modern(twenty_four_hours_ago, today),
        "translated: Yesterday",
    );
    assert.equal(
        timerender.format_time_modern(more_than_24_hours_ago, today),
        "translated: Yesterday",
    );
    assert.equal(timerender.format_time_modern(less_than_a_week_ago, today), "Thursday");
    assert.equal(timerender.format_time_modern(one_week_ago, today), "Jan 20");
    assert.equal(
        timerender.format_time_modern(previous_year_but_less_than_6_months, today),
        "Dec 27",
    );
    assert.equal(timerender.format_time_modern(less_than_6_months_ago, today), "Oct 27");
    assert.equal(timerender.format_time_modern(more_than_6_months_ago, today), "Apr 27, 2020");
});

run_test("format_time_modern_different_timezones", () => {
    const utc_tz = process.env.TZ;

    // Day is yesterday in UTC+0 but is 2 days ago in local timezone hence DOW is returned.
    let today = date_2017_PM;
    let yesterday = add(date_2017, {days: -1});
    assert.equal(timerender.format_time_modern(yesterday, today), "translated: Yesterday");

    process.env.TZ = "America/Juneau";
    let expected = "translated: 5/16/2017 at 11:12:53 PM AKDT (UTC-08:00)";
    assert.equal(timerender.get_full_datetime(yesterday), expected);
    assert.equal(timerender.format_time_modern(yesterday, today), "Tuesday");
    process.env.TZ = utc_tz;

    // Day is 2 days ago in UTC+0 but is yesterday in local timezone.
    today = date_2017;
    yesterday = add(date_2017_PM, {days: -2});
    assert.equal(timerender.format_time_modern(yesterday, today), "Tuesday");

    process.env.TZ = "Asia/Brunei";
    expected = "translated: 5/17/2017 at 5:12:53 AM (UTC+08:00)";
    assert.equal(timerender.get_full_datetime(yesterday), expected);
    assert.equal(timerender.format_time_modern(yesterday, today), "translated: Yesterday");
    process.env.TZ = utc_tz;

    // Day is 6 days ago in UTC+0 but a week ago in local timezone hence difference in returned strings.
    today = date_2017_PM;
    yesterday = add(date_2017, {days: -6});
    assert.equal(timerender.format_time_modern(yesterday, today), "Friday");

    process.env.TZ = "America/Juneau";
    expected = "translated: 5/11/2017 at 11:12:53 PM AKDT (UTC-08:00)";
    assert.equal(timerender.get_full_datetime(yesterday), expected);
    assert.equal(timerender.format_time_modern(yesterday, today), "May 11");
    process.env.TZ = utc_tz;
});

run_test("render_now_returns_year_with_year_boundary", () => {
    const today = date_2019;

    const six_months_ago = add(today, {months: -6});
    const expected = {
        time_str: "Oct 12, 2018",
        formal_time_str: "Friday, October 12, 2018",
        needs_update: false,
    };
    const actual = timerender.render_now(six_months_ago, today);
    assert.equal(actual.time_str, expected.time_str);
    assert.equal(actual.formal_time_str, expected.formal_time_str);
    assert.equal(actual.needs_update, expected.needs_update);
});

run_test("render_date_renders_time_html", () => {
    timerender.clear_for_testing();

    const today = date_2019;

    const message_time = today;
    const expected_html = $t({defaultMessage: "Today"});

    const attrs = {};
    const $span_stub = $("<span>");

    $span_stub.attr = (name, val) => {
        attrs[name] = val;
        return $span_stub;
    };

    $span_stub.append = (str) => {
        $span_stub.html(str);
        return $span_stub;
    };

    const $actual = timerender.render_date(message_time, undefined, today);
    assert.equal($actual.html(), expected_html);
    assert.equal(attrs["data-tippy-content"], "Friday, April 12, 2019");
    assert.equal(attrs.class, "timerender0");
});

run_test("render_date_renders_time_above_html", () => {
    const today = date_2019;

    const message_time = today;
    const message_time_above = add(today, {days: -1});

    const $span_stub = $("<span>");

    let appended_val;
    $span_stub.append = (...val) => {
        appended_val = val;
        return $span_stub;
    };

    const expected = [
        $("<i>"),
        $t({defaultMessage: "Yesterday"}),
        $("<hr>"),
        $("<i>"),
        $t({defaultMessage: "Today"}),
    ];

    timerender.render_date(message_time, message_time_above, today);
    assert.deepEqual(appended_val, expected);
});

run_test("get_full_time", () => {
    const timestamp = date_2017.getTime() / 1000;
    const expected = "2017-05-18T07:12:53Z"; // ISO 8601 date format
    const actual = timerender.get_full_time(timestamp);
    assert.equal(actual, expected);
});

run_test("get_timestamp_for_flatpickr", () => {
    const func = timerender.get_timestamp_for_flatpickr;
    // Freeze time for testing.
    MockDate.set(date_2017.getTime());

    // Invalid timestamps should show current time.
    assert.equal(func("random str").valueOf(), Date.now());

    // Valid ISO timestamps should return the timestamp.
    assert.equal(func(date_2017.toISOString()).valueOf(), date_2017.getTime());

    // Restore the Date object.
    MockDate.reset();
});

run_test("absolute_time_12_hour", () => {
    user_settings.twenty_four_hour_time = false;

    // timestamp with hour > 12, same year
    let timestamp = date_2019.getTime();

    let today = date_2019;
    let expected = "Apr 12 05:52 PM";
    let actual = timerender.absolute_time(timestamp, today);
    assert.equal(actual, expected);

    // timestamp with hour > 12, different year
    let next_year = add(today, {years: 1});
    expected = "Apr 12, 2019 05:52 PM";
    actual = timerender.absolute_time(timestamp, next_year);
    assert.equal(actual, expected);

    // timestamp with hour < 12, same year
    timestamp = date_2017.getTime();

    today = date_2017;
    expected = "May 18 07:12 AM";
    actual = timerender.absolute_time(timestamp, today);
    assert.equal(actual, expected);

    // timestamp with hour < 12, different year
    next_year = add(today, {years: 1});
    expected = "May 18, 2017 07:12 AM";
    actual = timerender.absolute_time(timestamp, next_year);
    assert.equal(actual, expected);
});

run_test("absolute_time_24_hour", () => {
    user_settings.twenty_four_hour_time = true;

    // date with hour > 12, same year
    let today = date_2019;
    let expected = "Apr 12 17:52";
    let actual = timerender.absolute_time(date_2019.getTime(), today);
    assert.equal(actual, expected);

    // date with hour > 12, different year
    let next_year = add(today, {years: 1});

    expected = "Apr 12, 2019 17:52";
    actual = timerender.absolute_time(date_2019.getTime(), next_year);
    assert.equal(actual, expected);

    // timestamp with hour < 12, same year
    today = date_2017;
    expected = "May 18 07:12";
    actual = timerender.absolute_time(date_2017.getTime(), today);
    assert.equal(actual, expected);

    // timestamp with hour < 12, different year
    next_year = add(today, {years: 1});
    expected = "May 18, 2017 07:12";
    actual = timerender.absolute_time(date_2017.getTime(), next_year);
    assert.equal(actual, expected);
});

run_test("get_full_datetime", () => {
    const time = date_2017_PM;

    let expected = "translated: 5/18/2017 at 9:12:53 PM UTC";
    assert.equal(timerender.get_full_datetime(time), expected);

    // test 24 hour time setting.
    user_settings.twenty_four_hour_time = true;
    expected = "translated: 5/18/2017 at 21:12:53 UTC";
    assert.equal(timerender.get_full_datetime(time), expected);

    user_settings.twenty_four_hour_time = false;

    // Test the GMT[+-]x:y logic.
    const previous_env_tz = process.env.TZ;
    process.env.TZ = "Asia/Kolkata";
    expected = "translated: 5/19/2017 at 2:42:53 AM (UTC+05:30)";
    assert.equal(timerender.get_full_datetime(time), expected);
    process.env.TZ = previous_env_tz;
});

run_test("last_seen_status_from_date", () => {
    // Set base_date to March 1 2016 12.30 AM (months are zero based)
    let base_date = new Date(2016, 2, 1, 0, 30);

    function assert_same(duration, expected_status) {
        const past_date = add(base_date, duration);
        const actual_status = timerender.last_seen_status_from_date(past_date, base_date);
        assert.equal(actual_status, expected_status);
    }

    assert_same({seconds: -20}, $t({defaultMessage: "Just now"}));

    assert_same({minutes: -1}, $t({defaultMessage: "Just now"}));

    assert_same({minutes: -2}, $t({defaultMessage: "Just now"}));

    assert_same({minutes: -30}, $t({defaultMessage: "30 minutes ago"}));

    assert_same({hours: -1}, $t({defaultMessage: "An hour ago"}));

    assert_same({hours: -2}, $t({defaultMessage: "2 hours ago"}));

    assert_same({hours: -20}, $t({defaultMessage: "20 hours ago"}));

    assert_same({hours: -24}, $t({defaultMessage: "Yesterday"}));

    assert_same({hours: -48}, $t({defaultMessage: "2 days ago"}));

    assert_same({days: -2}, $t({defaultMessage: "2 days ago"}));

    assert_same({days: -61}, $t({defaultMessage: "61 days ago"}));

    assert_same({days: -300}, $t({defaultMessage: "May 06,\u00A02015"}));

    assert_same({days: -366}, $t({defaultMessage: "Mar 01,\u00A02015"}));

    assert_same({years: -3}, $t({defaultMessage: "Mar 01,\u00A02013"}));

    // Set base_date to May 1 2016 12.30 AM (months are zero based)
    base_date = new Date(2016, 4, 1, 0, 30);

    assert_same({days: -91}, $t({defaultMessage: "Jan\u00A031"}));

    // Set base_date to May 1 2016 10.30 PM (months are zero based)
    base_date = new Date(2016, 4, 2, 23, 30);

    assert_same({hours: -1}, $t({defaultMessage: "An hour ago"}));

    assert_same({hours: -2}, $t({defaultMessage: "2 hours ago"}));

    assert_same({hours: -12}, $t({defaultMessage: "12 hours ago"}));

    assert_same({hours: -24}, $t({defaultMessage: "Yesterday"}));
});

run_test("set_full_datetime", () => {
    let time = date_2019;

    user_settings.twenty_four_hour_time = true;
    let time_str = timerender.stringify_time(time);
    let expected = "17:52";
    assert.equal(time_str, expected);

    user_settings.twenty_four_hour_time = false;
    time_str = timerender.stringify_time(time);
    expected = "5:52 PM";
    assert.equal(time_str, expected);

    time = add(time, {hours: -7}); // time between 1 to 12 o'clock time.
    user_settings.twenty_four_hour_time = false;
    time_str = timerender.stringify_time(time);
    expected = "10:52 AM";
    assert.equal(time_str, expected);
});
