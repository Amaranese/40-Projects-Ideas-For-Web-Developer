"use strict";

const {strict: assert} = require("assert");

const {mock_cjs, mock_esm, set_global, zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");
const {page_params} = require("../zjsunit/zpage_params");

set_global("navigator", {
    userAgent: "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
});

let uppy_stub;
function Uppy(options) {
    return uppy_stub.call(this, options);
}
Uppy.UIPlugin = class UIPlugin {};
mock_cjs("@uppy/core", Uppy);

mock_esm("../../static/js/csrf", {csrf_token: "csrf_token"});

const compose_ui = zrequire("compose_ui");
const compose_actions = zrequire("compose_actions");
const upload = zrequire("upload");

function test(label, f) {
    run_test(label, ({override, override_rewire}) => {
        page_params.max_file_upload_size_mib = 25;
        f({override, override_rewire});
    });
}

test("feature_check", ({override}) => {
    const $upload_button = $.create("upload-button-stub");
    $upload_button.addClass("notdisplayed");
    upload.feature_check($upload_button);
    assert.ok($upload_button.hasClass("notdisplayed"));

    override(window, "XMLHttpRequest", () => ({upload: true}));
    upload.feature_check($upload_button);
    assert.ok(!$upload_button.hasClass("notdisplayed"));
});

test("get_item", () => {
    assert.equal(upload.get_item("textarea", {mode: "compose"}), $("#compose-textarea"));
    assert.equal(
        upload.get_item("send_status_message", {mode: "compose"}),
        $("#compose-error-msg"),
    );
    assert.equal(
        upload.get_item("file_input_identifier", {mode: "compose"}),
        "#compose .file_input",
    );
    assert.equal(upload.get_item("source", {mode: "compose"}), "compose-file-input");
    assert.equal(upload.get_item("drag_drop_container", {mode: "compose"}), $("#compose"));
    assert.equal(
        upload.get_item("markdown_preview_hide_button", {mode: "compose"}),
        $("#compose .undo_markdown_preview"),
    );

    assert.equal(
        upload.get_item("textarea", {mode: "edit", row: 1}),
        $(`#edit_form_${CSS.escape(1)} .message_edit_content`),
    );

    $(`#edit_form_${CSS.escape(2)} .message_edit_content`).closest = () => {
        $(".message_edit_form").set_find_results(".message_edit_save", $(".message_edit_save"));
        return $(".message_edit_form");
    };
    assert.equal(upload.get_item("send_button", {mode: "edit", row: 2}), $(".message_edit_save"));

    assert.equal(
        upload.get_item("send_status_identifier", {mode: "edit", row: 11}),
        `#message-edit-send-status-${CSS.escape(11)}`,
    );
    assert.equal(
        upload.get_item("send_status", {mode: "edit", row: 75}),
        $(`#message-edit-send-status-${CSS.escape(75)}`),
    );

    $(`#message-edit-send-status-${CSS.escape(2)}`).set_find_results(
        ".send-status-close",
        $(".send-status-close"),
    );
    assert.equal(
        upload.get_item("send_status_close_button", {mode: "edit", row: 2}),
        $(".send-status-close"),
    );

    $(`#message-edit-send-status-${CSS.escape(22)}`).set_find_results(
        ".error-msg",
        $(".error-msg"),
    );
    assert.equal(upload.get_item("send_status_message", {mode: "edit", row: 22}), $(".error-msg"));

    assert.equal(
        upload.get_item("file_input_identifier", {mode: "edit", row: 123}),
        `#edit_form_${CSS.escape(123)} .file_input`,
    );
    assert.equal(upload.get_item("source", {mode: "edit", row: 123}), "message-edit-file-input");
    assert.equal(
        upload.get_item("drag_drop_container", {mode: "edit", row: 1}),
        $(`#zfilt${CSS.escape(1)} .message_edit_form`),
    );
    assert.equal(
        upload.get_item("markdown_preview_hide_button", {mode: "edit", row: 65}),
        $(`#edit_form_${CSS.escape(65)} .undo_markdown_preview`),
    );

    assert.throws(
        () => {
            upload.get_item("textarea");
        },
        {
            name: "Error",
            message: "Missing config",
        },
    );
    assert.throws(
        () => {
            upload.get_item("textarea", {mode: "edit"});
        },
        {
            name: "Error",
            message: "Missing row in config",
        },
    );
    assert.throws(
        () => {
            upload.get_item("textarea", {mode: "blah"});
        },
        {
            name: "Error",
            message: "Invalid upload mode!",
        },
    );
    assert.throws(
        () => {
            upload.get_item("invalid", {mode: "compose"});
        },
        {
            name: "Error",
            message: 'Invalid key name for mode "compose"',
        },
    );
    assert.throws(
        () => {
            upload.get_item("invalid", {mode: "edit", row: 20});
        },
        {
            name: "Error",
            message: 'Invalid key name for mode "edit"',
        },
    );
});

test("hide_upload_status", () => {
    $("#compose-send-button").prop("disabled", true);
    $("#compose-send-status").addClass("alert-info").show();

    upload.hide_upload_status({mode: "compose"});

    assert.equal($("#compose-send-button").prop("disabled"), false);
    assert.equal($("#compose-send-button").hasClass("alert-info"), false);
    assert.equal($("#compose-send-button").visible(), false);
});

test("show_error_message", () => {
    $("#compose-send-button").prop("disabled", true);
    $("#compose-send-status").addClass("alert-info").removeClass("alert-error").hide();
    $("#compose-error-msg").text("");
    $("#compose-error-msg").hide();

    upload.show_error_message({mode: "compose"}, "Error message");
    assert.equal($("#compose-send-button").prop("disabled"), false);
    assert.ok($("#compose-send-status").hasClass("alert-error"));
    assert.equal($("#compose-send-status").hasClass("alert-info"), false);
    assert.ok($("#compose-send-status").visible());
    assert.equal($("#compose-error-msg").text(), "Error message");

    upload.show_error_message({mode: "compose"});
    assert.equal($("#compose-error-msg").text(), "translated: An unknown error occurred.");
});

test("upload_files", ({override_rewire}) => {
    let uppy_cancel_all_called = false;
    let files = [
        {
            name: "budapest.png",
            type: "image/png",
        },
    ];
    let uppy_add_file_called = false;
    const uppy = {
        cancelAll: () => {
            uppy_cancel_all_called = true;
        },
        addFile: (params) => {
            uppy_add_file_called = true;
            assert.equal(params.source, "compose-file-input");
            assert.equal(params.name, "budapest.png");
            assert.equal(params.type, "image/png");
            assert.equal(params.data, files[0]);
        },
        getFiles: () => [...files],
    };
    let hide_upload_status_called = false;
    override_rewire(upload, "hide_upload_status", (config) => {
        hide_upload_status_called = true;
        assert.equal(config.mode, "compose");
    });
    const config = {mode: "compose"};
    $("#compose-send-button").prop("disabled", false);
    upload.upload_files(uppy, config, []);
    assert.ok(!$("#compose-send-button").prop("disabled"));

    page_params.max_file_upload_size_mib = 0;
    let show_error_message_called = false;
    override_rewire(upload, "show_error_message", (config, message) => {
        show_error_message_called = true;
        assert.equal(config.mode, "compose");
        assert.equal(
            message,
            "translated: File and image uploads have been disabled for this organization.",
        );
    });
    upload.upload_files(uppy, config, files);
    assert.ok(show_error_message_called);

    page_params.max_file_upload_size_mib = 25;
    let on_click_close_button_callback;
    $(".compose-send-status-close").one = (event, callback) => {
        assert.equal(event, "click");
        on_click_close_button_callback = callback;
    };
    let compose_ui_insert_syntax_and_focus_called = false;
    override_rewire(compose_ui, "insert_syntax_and_focus", (syntax, textarea) => {
        assert.equal(syntax, "[translated: Uploading budapest.png…]()");
        assert.equal(textarea, $("#compose-textarea"));
        compose_ui_insert_syntax_and_focus_called = true;
    });
    let compose_ui_autosize_textarea_called = false;
    override_rewire(compose_ui, "autosize_textarea", () => {
        compose_ui_autosize_textarea_called = true;
    });
    let markdown_preview_hide_button_clicked = false;
    $("#compose .undo_markdown_preview").on("click", () => {
        markdown_preview_hide_button_clicked = true;
    });
    $("#compose-send-button").prop("disabled", false);
    $("#compose-send-status").removeClass("alert-info").hide();
    $("#compose .undo_markdown_preview").show();
    upload.upload_files(uppy, config, files);
    assert.ok($("#compose-send-button").prop("disabled"));
    assert.ok($("#compose-send-status").hasClass("alert-info"));
    assert.ok($("#compose-send-status").visible());
    assert.equal($("<p>").text(), "translated: Uploading…");
    assert.ok(compose_ui_insert_syntax_and_focus_called);
    assert.ok(compose_ui_autosize_textarea_called);
    assert.ok(markdown_preview_hide_button_clicked);
    assert.ok(uppy_add_file_called);

    files = [
        {
            name: "budapest.png",
            type: "image/png",
        },
        {
            name: "prague.png",
            type: "image/png",
        },
    ];
    let add_file_counter = 0;
    uppy.addFile = (file) => {
        assert.equal(file.name, "budapest.png");
        add_file_counter += 1;
        throw new Error("some error");
    };
    upload.upload_files(uppy, config, files);
    assert.equal(add_file_counter, 1);

    set_global("setTimeout", (func) => {
        func();
    });
    hide_upload_status_called = false;
    uppy_cancel_all_called = false;
    let compose_ui_replace_syntax_called = false;
    files = [
        {
            name: "budapest.png",
            type: "image/png",
        },
    ];
    override_rewire(compose_ui, "replace_syntax", (old_syntax, new_syntax, textarea) => {
        compose_ui_replace_syntax_called = true;
        assert.equal(old_syntax, "[translated: Uploading budapest.png…]()");
        assert.equal(new_syntax, "");
        assert.equal(textarea, $("#compose-textarea"));
    });
    on_click_close_button_callback();
    assert.ok(uppy_cancel_all_called);
    assert.ok(hide_upload_status_called);
    assert.ok(compose_ui_autosize_textarea_called);
    assert.ok(compose_ui_replace_syntax_called);
    hide_upload_status_called = false;
    compose_ui_replace_syntax_called = false;
    $("#compose-textarea").val("user modified text");
    on_click_close_button_callback();
    assert.ok(hide_upload_status_called);
    assert.ok(compose_ui_autosize_textarea_called);
    assert.ok(compose_ui_replace_syntax_called);
    assert.equal($("#compose-textarea").val(), "user modified text");
});

test("uppy_config", () => {
    let uppy_stub_called = false;
    let uppy_set_meta_called = false;
    let uppy_used_xhrupload = false;
    let uppy_used_progressbar = false;

    uppy_stub = function (config) {
        uppy_stub_called = true;
        assert.equal(config.debug, false);
        assert.equal(config.autoProceed, true);
        assert.equal(config.restrictions.maxFileSize, 25 * 1024 * 1024);
        assert.equal(Object.keys(config.locale.strings).length, 2);
        assert.ok("exceedsSize" in config.locale.strings);

        return {
            setMeta: (params) => {
                uppy_set_meta_called = true;
                assert.equal(params.csrfmiddlewaretoken, "csrf_token");
            },
            use: (func, params) => {
                const func_name = func.name;
                if (func_name === "XHRUpload") {
                    uppy_used_xhrupload = true;
                    assert.equal(params.endpoint, "/json/user_uploads");
                    assert.equal(params.formData, true);
                    assert.equal(params.fieldName, "file");
                    assert.equal(params.limit, 5);
                    assert.equal(Object.keys(params.locale.strings).length, 1);
                    assert.ok("timedOut" in params.locale.strings);
                } else if (func_name === "ProgressBar") {
                    uppy_used_progressbar = true;
                    assert.equal(params.target, "#compose-send-status");
                    assert.equal(params.hideAfterFinish, false);
                } else {
                    /* istanbul ignore next */
                    assert.fail(`Missing tests for ${func_name}`);
                }
            },
            on: () => {},
        };
    };
    upload.setup_upload({mode: "compose"});

    assert.equal(uppy_stub_called, true);
    assert.equal(uppy_set_meta_called, true);
    assert.equal(uppy_used_xhrupload, true);
    assert.equal(uppy_used_progressbar, true);
});

test("file_input", ({override_rewire}) => {
    upload.setup_upload({mode: "compose"});

    const change_handler = $("body").get_on_handler("change", "#compose .file_input");
    const files = ["file1", "file2"];
    const event = {
        target: {
            files,
            value: "C:\\fakepath\\portland.png",
        },
    };
    let upload_files_called = false;
    override_rewire(upload, "upload_files", (uppy, config, files) => {
        assert.equal(config.mode, "compose");
        assert.equal(files, files);
        upload_files_called = true;
    });
    change_handler(event);
    assert.ok(upload_files_called);
});

test("file_drop", ({override_rewire}) => {
    upload.setup_upload({mode: "compose"});

    let prevent_default_counter = 0;
    const drag_event = {
        preventDefault: () => {
            prevent_default_counter += 1;
        },
    };
    const dragover_handler = $("#compose").get_on_handler("dragover");
    dragover_handler(drag_event);
    assert.equal(prevent_default_counter, 1);

    const dragenter_handler = $("#compose").get_on_handler("dragenter");
    dragenter_handler(drag_event);
    assert.equal(prevent_default_counter, 2);

    const files = ["file1", "file2"];
    const drop_event = {
        preventDefault: () => {
            prevent_default_counter += 1;
        },
        originalEvent: {
            dataTransfer: {
                files,
            },
        },
    };
    const drop_handler = $("#compose").get_on_handler("drop");
    let upload_files_called = false;
    override_rewire(upload, "upload_files", () => {
        upload_files_called = true;
    });
    drop_handler(drop_event);
    assert.equal(prevent_default_counter, 3);
    assert.equal(upload_files_called, true);
});

test("copy_paste", ({override_rewire}) => {
    upload.setup_upload({mode: "compose"});

    const paste_handler = $("#compose").get_on_handler("paste");
    let get_as_file_called = false;
    let event = {
        originalEvent: {
            clipboardData: {
                items: [
                    {
                        kind: "file",
                        getAsFile: () => {
                            get_as_file_called = true;
                        },
                    },
                    {
                        kind: "notfile",
                    },
                ],
            },
        },
    };
    let upload_files_called = false;
    override_rewire(upload, "upload_files", () => {
        upload_files_called = true;
    });

    paste_handler(event);
    assert.ok(get_as_file_called);
    assert.ok(upload_files_called);

    upload_files_called = false;
    event = {
        originalEvent: {},
    };
    paste_handler(event);
    assert.equal(upload_files_called, false);
});

test("uppy_events", ({override_rewire}) => {
    const callbacks = {};
    let uppy_cancel_all_called = false;
    let state = {};
    let files = [];

    uppy_stub = function () {
        return {
            setMeta: () => {},
            use: () => {},
            cancelAll: () => {
                uppy_cancel_all_called = true;
            },
            on: (event_name, callback) => {
                callbacks[event_name] = callback;
            },
            getFiles: () => [...files],
            removeFile: (file_id) => {
                files = files.filter((file) => file.id !== file_id);
            },
            getState: () => ({
                info: {
                    type: state.type,
                    details: state.details,
                    message: state.message,
                },
            }),
        };
    };
    upload.setup_upload({mode: "compose"});
    assert.equal(Object.keys(callbacks).length, 5);

    const on_upload_success_callback = callbacks["upload-success"];
    const file = {
        name: "copenhagen.png",
    };
    let response = {
        body: {
            uri: "/user_uploads/4/cb/rue1c-MlMUjDAUdkRrEM4BTJ/copenhagen.png",
        },
    };
    let compose_actions_start_called = false;
    override_rewire(compose_actions, "start", () => {
        compose_actions_start_called = true;
    });
    let compose_ui_replace_syntax_called = false;
    override_rewire(compose_ui, "replace_syntax", (old_syntax, new_syntax, textarea) => {
        compose_ui_replace_syntax_called = true;
        assert.equal(old_syntax, "[translated: Uploading copenhagen.png…]()");
        assert.equal(
            new_syntax,
            "[copenhagen.png](/user_uploads/4/cb/rue1c-MlMUjDAUdkRrEM4BTJ/copenhagen.png)",
        );
        assert.equal(textarea, $("#compose-textarea"));
    });
    let compose_ui_autosize_textarea_called = false;
    override_rewire(compose_ui, "autosize_textarea", () => {
        compose_ui_autosize_textarea_called = true;
    });
    on_upload_success_callback(file, response);
    assert.ok(compose_actions_start_called);
    assert.ok(compose_ui_replace_syntax_called);
    assert.ok(compose_ui_autosize_textarea_called);

    response = {
        body: {
            uri: undefined,
        },
    };
    compose_actions_start_called = false;
    compose_ui_replace_syntax_called = false;
    compose_ui_autosize_textarea_called = false;
    on_upload_success_callback(file, response);
    assert.equal(compose_actions_start_called, false);
    assert.equal(compose_ui_replace_syntax_called, false);
    assert.equal(compose_ui_autosize_textarea_called, false);

    const on_complete_callback = callbacks.complete;
    set_global("setTimeout", (func) => {
        func();
    });
    let hide_upload_status_called = false;
    override_rewire(upload, "hide_upload_status", () => {
        hide_upload_status_called = true;
    });
    $("#compose-send-status").removeClass("alert-error");
    files = [
        {
            id: "uppy-zulip/jpeg-1e-image/jpeg-163515-1578367331279",
            progress: {
                uploadComplete: true,
            },
        },
        {
            id: "uppy-github/avatar/png-2v-1e-image/png-329746-1576507125831",
            progress: {
                uploadComplete: true,
            },
        },
    ];
    on_complete_callback();
    assert.ok(hide_upload_status_called);
    assert.equal(files.length, 0);

    hide_upload_status_called = false;
    $("#compose-send-status").addClass("alert-error");
    on_complete_callback();
    assert.ok(!hide_upload_status_called);

    $("#compose-send-status").removeClass("alert-error");
    hide_upload_status_called = false;
    files = [
        {
            id: "uppy-zulip/jpeg-1e-image/jpeg-163515-1578367331279",
            progress: {
                uploadComplete: true,
            },
        },
        {
            id: "uppy-github/avatar/png-2v-1e-image/png-329746-1576507125831",
            progress: {
                uploadComplete: false,
            },
        },
    ];
    on_complete_callback();
    assert.ok(!hide_upload_status_called);
    assert.equal(files.length, 1);

    state = {
        type: "error",
        details: "Some error",
        message: "Some error message",
    };
    const on_info_visible_callback = callbacks["info-visible"];
    let show_error_message_called = false;
    uppy_cancel_all_called = false;
    compose_ui_replace_syntax_called = false;
    const on_restriction_failed_callback = callbacks["restriction-failed"];
    override_rewire(upload, "show_error_message", (config, message) => {
        show_error_message_called = true;
        assert.equal(config.mode, "compose");
        assert.equal(message, "Some error message");
    });
    on_info_visible_callback();
    assert.ok(uppy_cancel_all_called);
    assert.ok(show_error_message_called);
    override_rewire(compose_ui, "replace_syntax", (old_syntax, new_syntax, textarea) => {
        compose_ui_replace_syntax_called = true;
        assert.equal(old_syntax, "[translated: Uploading copenhagen.png…]()");
        assert.equal(new_syntax, "");
        assert.equal(textarea, $("#compose-textarea"));
    });
    on_restriction_failed_callback(file, null, null);
    assert.ok(compose_ui_replace_syntax_called);
    compose_ui_replace_syntax_called = false;
    $("#compose-textarea").val("user modified text");
    on_restriction_failed_callback(file, null, null);
    assert.ok(compose_ui_replace_syntax_called);
    assert.equal($("#compose-textarea").val(), "user modified text");

    state = {
        type: "error",
        message: "No Internet connection",
    };
    uppy_cancel_all_called = false;
    on_info_visible_callback();

    state = {
        type: "error",
        details: "Upload Error",
    };
    uppy_cancel_all_called = false;
    on_info_visible_callback();

    const on_upload_error_callback = callbacks["upload-error"];
    show_error_message_called = false;
    compose_ui_replace_syntax_called = false;
    override_rewire(upload, "show_error_message", (config, message) => {
        show_error_message_called = true;
        assert.equal(config.mode, "compose");
        assert.equal(message, "Response message");
    });
    response = {
        body: {
            msg: "Response message",
        },
    };
    uppy_cancel_all_called = false;
    on_upload_error_callback(file, null, response);
    assert.ok(uppy_cancel_all_called);
    assert.ok(show_error_message_called);
    assert.ok(compose_ui_replace_syntax_called);

    compose_ui_replace_syntax_called = false;
    override_rewire(upload, "show_error_message", (config, message) => {
        show_error_message_called = true;
        assert.equal(config.mode, "compose");
        assert.equal(message, undefined);
    });
    uppy_cancel_all_called = false;
    on_upload_error_callback(file, null, null);
    assert.ok(uppy_cancel_all_called);
    assert.ok(show_error_message_called);
    assert.ok(compose_ui_replace_syntax_called);
    show_error_message_called = false;
    $("#compose-textarea").val("user modified text");
    uppy_cancel_all_called = false;
    on_upload_error_callback(file, null);
    assert.ok(uppy_cancel_all_called);
    assert.ok(show_error_message_called);
    assert.ok(compose_ui_replace_syntax_called);
    assert.equal($("#compose-textarea").val(), "user modified text");
});
