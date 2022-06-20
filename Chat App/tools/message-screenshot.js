"use strict";

/* global $, CSS */

const path = require("path");

const commander = require("commander");
require("css.escape");
const mkdirp = require("mkdirp");
const puppeteer = require("puppeteer");

const options = {};

commander
    .arguments("<message_id> <image_path> <realm_uri")
    .action((messageId, imagePath, realmUri) => {
        options.messageId = messageId;
        options.imagePath = imagePath;
        options.realmUri = realmUri;
        console.log(`Capturing screenshot for message ${messageId} to ${imagePath}`);
    })
    .parse(process.argv);

if (options.messageId === undefined) {
    console.error("no messageId specified!");
    process.exit(1);
}

// TODO: Refactor to share code with frontend_tests/puppeteer_tests/realm-creation.ts
async function run() {
    const browser = await puppeteer.launch({
        args: [
            "--window-size=1400,1024",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            // Helps render fonts correctly on Ubuntu: https://github.com/puppeteer/puppeteer/issues/661
            "--font-render-hinting=none",
        ],
        defaultViewport: null,
        headless: true,
    });
    try {
        const page = await browser.newPage();
        // deviceScaleFactor:2 gives better quality screenshots (higher pixel density)
        await page.setViewport({width: 1280, height: 1024, deviceScaleFactor: 2});
        await page.goto(options.realmUri);
        // wait for Iago devlogin button and click on it.
        await page.waitForSelector('[value="iago@zulip.com"]');

        // By waiting till DOMContentLoaded we're confirming that Iago is logged in.
        await Promise.all([
            page.waitForNavigation({waitUntil: "domcontentloaded"}),
            page.click('[value="iago@zulip.com"]'),
        ]);

        // Navigate to message and capture screenshot
        await page.goto(`${options.realmUri}/#narrow/id/${options.messageId}`);
        const messageSelector = `#zfilt${CSS.escape(options.messageId)}`;
        await page.waitForSelector(messageSelector);
        // remove unread marker and don't select message
        const marker = `#zfilt${CSS.escape(options.messageId)} .unread_marker`;
        await page.evaluate((sel) => $(sel).remove(), marker);
        const messageBox = await page.$(messageSelector);
        await page.evaluate((msg) => $(msg).removeClass("selected_message"), messageSelector);
        const messageGroup = (await messageBox.$x(".."))[0];
        // Compute screenshot area, with some padding around the message group
        const clip = {...(await messageGroup.boundingBox())};
        clip.y -= 5;
        clip.x -= 5;
        clip.width += 10;
        clip.height += 10;
        const imagePath = options.imagePath;
        const imageDir = path.dirname(imagePath);
        mkdirp.sync(imageDir);
        await page.screenshot({path: imagePath, clip});
    } catch (error) {
        console.log(error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

run();
