const expect = require("chai").expect;
const fs = require("fs");
const path = require("node:path");
const { Key } = require("webdriverio");

const constants = require("./constants");

module.exports = {
    // Step
    sleep: async (seconds) => {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    },

    // Setup
    setUpVault: async () => {
        await browser;

        // Open the vault
        await browser.execute(
            "require('electron').ipcRenderer.sendSync('vault-open', 'tests/e2e/vault', false)",
        );
        await module.exports.sleep(2);

        // Disable safemode and enable the plugin
        await browser.execute(
            "app.plugins.setEnable(true);app.plugins.enablePlugin('obsidian-spaced-repetition')",
        );

        // Trust the vault
        await browser
            .$("div.modal.mod-trust-folder > div.modal-button-container > button:nth-child(1)")
            .click();
        await browser.$("div.modal-close-button").click();
    },

    copyInputFile: (src, test_title) => {
        const testFilePath = path.resolve(__dirname, "vault", `${test_title}.md`);
        fs.copyFileSync(path.resolve(__dirname, "inputs", src), testFilePath);
        return testFilePath;
    },

    // Interaction
    runCommand: async (command) => {
        await browser.keys([Key.Ctrl, "p"]);
        await browser.$("div.prompt > div.prompt-input-container > input").setValue(command);
        await browser.keys([Key.Enter]);
        await module.exports.sleep(1);
    },

    // Notes
    assertNotesScheduling: (testFilePath, expectedInterval, expectedEase) => {
        const schedulingInfo = constants.SCHEDULING_INFO_REGEX.exec(fs.readFileSync(testFilePath));
        expect(schedulingInfo[3]).to.equal(expectedInterval);
        expect(schedulingInfo[4]).to.equal(expectedEase);
    },
};
