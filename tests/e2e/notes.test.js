const utils = require("./utils");

before(async function () {
    await utils.setUpVault();
});

describe("Notes Review", () => {
    describe("commands", () => {
        it("should review with default #review tag (easy)", async function () {
            const testFilePath = utils.copyInputFile("notes_default_tag.md", this.test.fullTitle());

            await utils.runCommand("Open a note for review");
            await utils.runCommand("Review note as easy");

            utils.assertNotesScheduling(testFilePath, "4", "270");
        });

        it("should review with default #review tag (good)", async function () {
            const testFilePath = utils.copyInputFile("notes_default_tag.md", this.test.fullTitle());

            await utils.runCommand("Open a note for review");
            await utils.runCommand("Review note as good");

            utils.assertNotesScheduling(testFilePath, "3", "250");
        });

        it("should review with default #review tag (hard)", async function () {
            const testFilePath = utils.copyInputFile("notes_default_tag.md", this.test.fullTitle());

            await utils.runCommand("Open a note for review");
            await utils.runCommand("Review note as hard");

            utils.assertNotesScheduling(testFilePath, "1", "230");
        });
    });

    describe("file menu", () => {
        it("should review with default #review tag (easy)", async function () {
            const testTitle = this.test.fullTitle();
            const testFilePath = utils.copyInputFile("notes_default_tag.md", testTitle);

            const fileEl = browser.$(`.nav-file-title[data-path="${testTitle}.md"]`);
            await fileEl.click(); // open file
            await fileEl.click({ button: "right" }); // open file menu
            await browser.$('//div[text() = "Review: Easy"]').click();
            await utils.sleep(1);

            utils.assertNotesScheduling(testFilePath, "4", "270");
        });

        it("should review with default #review tag (good)", async function () {
            const testTitle = this.test.fullTitle();
            const testFilePath = utils.copyInputFile("notes_default_tag.md", testTitle);

            const fileEl = browser.$(`.nav-file-title[data-path="${testTitle}.md"]`);
            await fileEl.click(); // open file
            await fileEl.click({ button: "right" }); // open file menu
            await browser.$('//div[text() = "Review: Good"]').click();
            await utils.sleep(1);

            utils.assertNotesScheduling(testFilePath, "3", "250");
        });

        it("should review with default #review tag (hard)", async function () {
            const testTitle = this.test.fullTitle();
            const testFilePath = utils.copyInputFile("notes_default_tag.md", testTitle);

            const fileEl = browser.$(`.nav-file-title[data-path="${testTitle}.md"]`);
            await fileEl.click(); // open file
            await fileEl.click({ button: "right" }); // open file menu
            await browser.$('//div[text() = "Review: Hard"]').click();
            await utils.sleep(1);

            utils.assertNotesScheduling(testFilePath, "1", "230");
        });
    });

    // describe("sidebar", () => {
    //     before(async function () {
    //         // Open the sidebar
    //         await browser.$("div.sidebar-toggle-button.mod-right").click();
    //         await browser.$('.workspace-tab-header[aria-label="Notes Review Queue"]').click();
    //     });

    //     it("should review with default #review tag (easy)", async function () {
    //         const testTitle = this.test.fullTitle();
    //         const testFilePath = utils.copyInputFile("notes_default_tag.md", testTitle);
    //         await utils.runCommand("Open a note for review");  // force re-index

    //         await utils.sleep(2);
    //         const fileEl = browser.$(
    //             `//div[@class="nav-file-title-content" and text()="${testTitle}"]`
    //         );
    //         await fileEl.click(); // open file
    //         await fileEl.click({ button: "right" }); // open file menu
    //         await browser.$('//div[text() = "Review: Easy"]').click();
    //         await utils.sleep(1);

    //         utils.assertNotesScheduling(testFilePath, "4", "270");
    //     });
    // });
});
