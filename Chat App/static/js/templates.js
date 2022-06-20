import Handlebars from "handlebars/runtime";

import {default_html_elements, intl} from "./i18n";
import * as util from "./util";

// Below, we register Zulip-specific extensions to the handlebars API.
//
// IMPORTANT: When adding a new handlebars helper, update the
// knownHelpers array in the webpack config so that webpack knows your
// helper is registered at runtime and don't try to require them when
// bundling.

// We don't want to wait for DOM ready to register the Handlebars helpers
// below. There's no need to, as they do not access the DOM.
// Furthermore, waiting for DOM ready would introduce race conditions with
// other DOM-ready callbacks that attempt to render templates.

Handlebars.registerHelper({
    eq(a, b) {
        return a === b;
    },
    and(...args) {
        args.pop(); // Handlebars options
        if (args.length === 0) {
            return true;
        }
        const last = args.pop();
        for (const arg of args) {
            if (!arg || Handlebars.Utils.isEmpty(arg)) {
                return arg;
            }
        }
        return last;
    },
    or(...args) {
        args.pop(); // Handlebars options
        if (args.length === 0) {
            return false;
        }
        const last = args.pop();
        for (const arg of args) {
            if (arg && !Handlebars.Utils.isEmpty(arg)) {
                return arg;
            }
        }
        return last;
    },
    not(a) {
        return !a || Handlebars.Utils.isEmpty(a);
    },
});

Handlebars.registerHelper("t", (message) => {
    // Marks a string for translation.
    // Example usage:
    //     {{t "some English text"}}

    const descriptor = {id: message, defaultMessage: message};
    return intl.formatMessage(descriptor);
});

Handlebars.registerHelper("tr", function (options) {
    // Marks a block for translation.
    // Example usage 1:
    //     {{#tr}}
    //         <p>some English text</p>
    //     {{/tr}}
    //
    // Example usage 2:
    //     {{#tr}}
    //         <p>This {variable} will get value from the current context</p>
    //     {{/tr}}
    //
    // Note: use `{` and `}` instead of `{{` and `}}` to declare
    // variables.
    const message = options
        .fn(this)
        .trim()
        .split("\n")
        .map((s) => s.trim())
        .join(" ");
    const descriptor = {id: message, defaultMessage: message};
    const result = intl.formatMessage(descriptor, {
        ...default_html_elements,
        ...Object.fromEntries(
            Object.entries(options.fn.partials ?? {}).map(([name, value]) => [
                name,
                (s) => value(this, {data: {"partial-block": () => s.join("")}}),
            ]),
        ),
        ...Object.fromEntries(
            Object.entries(this ?? {}).map(([key, value]) => [
                key,
                Handlebars.Utils.escapeExpression(value),
            ]),
        ),
    });
    return new Handlebars.SafeString(result);
});

Handlebars.registerHelper(
    "rendered_markdown",
    (content) => new Handlebars.SafeString(util.clean_user_content_links(content)),
);

Handlebars.registerHelper("numberFormat", (number) => number.toLocaleString());
