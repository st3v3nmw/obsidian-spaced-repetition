import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/settings";

describe("SettingsUtil", () => {
    test("isPathInNoteIgnoreFolder", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS, noteFoldersToIgnore: ["/test"] };
        expect(SettingsUtil.isPathInNoteIgnoreFolder(settings, "/test/test")).toEqual(true);
        expect(SettingsUtil.isPathInNoteIgnoreFolder(settings, "/notes/test2")).toEqual(false);
    });

    test("isAnyTagANoteReviewTag", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS, tagsToReview: ["#review"] };
        expect(SettingsUtil.isAnyTagANoteReviewTag(settings, ["#review"])).toEqual(true);
        expect(SettingsUtil.isAnyTagANoteReviewTag(settings, ["#review", "#test"])).toEqual(true);
        expect(SettingsUtil.isAnyTagANoteReviewTag(settings, ["#test"])).toEqual(false);
    });

    test("isAnyTagIgnoredForFlashcards", () => {
        const settings: SRSettings = {
            ...DEFAULT_SETTINGS,
            flashcardTagsToIgnore: ["#archived"],
        };
        expect(SettingsUtil.isAnyTagIgnoredForFlashcards(settings, ["#archived"])).toEqual(true);
        expect(SettingsUtil.isAnyTagIgnoredForFlashcards(settings, ["#archived/old"])).toEqual(
            true,
        );
        expect(SettingsUtil.isAnyTagIgnoredForFlashcards(settings, ["#flashcards"])).toEqual(false);
        expect(
            SettingsUtil.isAnyTagIgnoredForFlashcards(settings, ["#flashcards", "#archived"]),
        ).toEqual(true);
        const settingsNoIgnore: SRSettings = { ...DEFAULT_SETTINGS, flashcardTagsToIgnore: [] };
        expect(SettingsUtil.isAnyTagIgnoredForFlashcards(settingsNoIgnore, ["#archived"])).toEqual(
            false,
        );
    });

    test("isAnyTagIgnoredForNotes", () => {
        const settings: SRSettings = {
            ...DEFAULT_SETTINGS,
            noteTagsToIgnore: ["#archived"],
        };
        expect(SettingsUtil.isAnyTagIgnoredForNotes(settings, ["#archived"])).toEqual(true);
        expect(SettingsUtil.isAnyTagIgnoredForNotes(settings, ["#archived/old"])).toEqual(true);
        expect(SettingsUtil.isAnyTagIgnoredForNotes(settings, ["#review"])).toEqual(false);
        expect(SettingsUtil.isAnyTagIgnoredForNotes(settings, ["#review", "#archived"])).toEqual(
            true,
        );
        const settingsNoIgnore: SRSettings = { ...DEFAULT_SETTINGS, noteTagsToIgnore: [] };
        expect(SettingsUtil.isAnyTagIgnoredForNotes(settingsNoIgnore, ["#archived"])).toEqual(
            false,
        );
    });

    test("upgradeSettings", () => {
        let settings: SRSettings = { ...DEFAULT_SETTINGS };
        upgradeSettings(settings);
        expect(settings).toEqual(DEFAULT_SETTINGS);

        settings = {
            ...DEFAULT_SETTINGS,
            randomizeCardOrder: true,
            flashcardCardOrder: null,
            flashcardDeckOrder: null,
            disableFileMenuReviewOptions: true,
        };
        upgradeSettings(settings);
        expect(settings).toEqual(DEFAULT_SETTINGS);

        settings = { ...DEFAULT_SETTINGS, clozePatterns: null, convertBoldTextToClozes: true };
        upgradeSettings(settings);
        expect(settings).toEqual({
            ...DEFAULT_SETTINGS,
            convertBoldTextToClozes: true,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**"],
        });

        settings = { ...DEFAULT_SETTINGS, clozePatterns: null };
        upgradeSettings(settings);
        expect(settings).toEqual({
            ...DEFAULT_SETTINGS,
            convertHighlightsToClozes: true,
            clozePatterns: ["==[123;;]answer[;;hint]=="],
        });

        settings = {
            ...DEFAULT_SETTINGS,
            clozePatterns: null,
            convertHighlightsToClozes: false,
            convertCurlyBracketsToClozes: true,
        };
        upgradeSettings(settings);
        expect(settings).toEqual({
            ...DEFAULT_SETTINGS,
            convertCurlyBracketsToClozes: true,
            convertHighlightsToClozes: false,
            clozePatterns: ["{{[123;;]answer[;;hint]}}"],
        });
    });
});
