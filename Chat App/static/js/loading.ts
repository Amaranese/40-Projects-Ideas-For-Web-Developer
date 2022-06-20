import $ from "jquery";

import render_loader from "../templates/loader.hbs";

export function make_indicator(
    $outer_container: JQuery,
    {abs_positioned = false, text}: {abs_positioned?: boolean; text?: string} = {},
): void {
    let $container = $outer_container;

    // TODO: We set white-space to 'nowrap' because under some
    // unknown circumstances (it happens on Keegan's laptop) the text
    // width calculation, above, returns a result that's a few pixels
    // too small.  The container's div will be slightly too small,
    // but that's probably OK for our purposes.
    $outer_container.css({"white-space": "nowrap"});

    $container.empty();

    if (abs_positioned) {
        // Create some additional containers to facilitate absolutely
        // positioned spinners.
        const container_id = $container.attr("id")!;
        let $inner_container = $("<div>", {id: `${container_id}_box_container`});
        $container.append($inner_container);
        $container = $inner_container;
        $inner_container = $("<div>", {id: `${container_id}_box`});
        $container.append($inner_container);
        $container = $inner_container;
    }

    const $spinner_elem = $("<div>", {class: "loading_indicator_spinner", ["aria-hidden"]: "true"});
    $spinner_elem.html(render_loader({container_id: $outer_container.attr("id")}));
    $container.append($spinner_elem);
    let text_width = 0;

    if (text !== undefined) {
        const $text_elem = $("<span>", {class: "loading_indicator_text"});
        $text_elem.text(text);
        $container.append($text_elem);
        // See note, below
        if (!abs_positioned) {
            text_width = 20 + ($text_elem.width() ?? 0);
        }
    }

    // These width calculations are tied to the spinner width and
    // margins defined via CSS
    $container.css({width: 38 + text_width, height: 0});

    $outer_container.data("destroying", false);
}

export function destroy_indicator($container: JQuery): void {
    if ($container.data("destroying")) {
        return;
    }
    $container.data("destroying", true);

    const spinner = $container.data("spinner_obj");
    if (spinner !== undefined) {
        spinner.stop();
    }
    $container.removeData("spinner_obj");
    $container.empty();
    $container.css({width: 0, height: 0});
}

export function show_button_spinner($elt: JQuery, using_dark_theme: boolean): void {
    if (!using_dark_theme) {
        $elt.attr("src", "/static/images/loader-black.svg");
    } else {
        $elt.attr("src", "/static/images/loader-white.svg");
    }
    $elt.css("display", "inline-block");
}
