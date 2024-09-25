test("Check that localization entries are consistent across all files", () => {
    jest.isolateModules(() => {
        const { localeMap } = require("src/lang/helpers");
        const expectedKeys: string[] = Object.keys(localeMap["en"]);
        for (const [languageCode, locale] of Object.entries(localeMap) as [string, string[]][]) {
            const localeKeys = Object.keys(locale);
            if (localeKeys.length == 0 || languageCode == "en") continue;

            const unmappedKeys = expectedKeys.filter((x) => !localeKeys.includes(x));
            expect(
                unmappedKeys.length,
                `The ${languageCode} locale does not include translations for: ${unmappedKeys}.`,
            ).toBe(0);
            const extraKeys = localeKeys.filter((x) => !expectedKeys.includes(x));
            expect(
                extraKeys.length,
                `The ${languageCode} locale includes the following translations that are no longer in use: ${extraKeys}.`,
            ).toBe(0);
        }
    });
});

test("Test translation unknown locale", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "ki"); // Kikuyu
        const { t } = require("src/lang/helpers");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(t("DECKS")).toEqual("Decks");
        expect(consoleSpy).toHaveBeenCalledWith("SRS error: Locale ki not found.");
    });
});

test("Test translation without interpolation in English", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "en");
        const { t } = require("src/lang/helpers");
        expect(t("DECKS")).toEqual("Decks");
    });
});

test("Test translation without interpolation in čeština", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "cs");
        const { t } = require("src/lang/helpers");
        expect(t("DECKS")).toEqual("Balíčky");
    });
});

test("Test translation with interpolation in English", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "en");
        const { t } = require("src/lang/helpers");
        expect(t("STATUS_BAR", { dueNotesCount: 1, dueFlashcardsCount: 2 })).toEqual(
            "Review: 1 note(s), 2 card(s) due",
        );
    });
});

test("Test translation with interpolation in German", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "de");
        const { t } = require("src/lang/helpers");
        expect(t("STATUS_BAR", { dueNotesCount: 1, dueFlashcardsCount: 2 })).toEqual(
            "Wiederholung: 1 Notiz(en), 2 Karte(n) anstehend",
        );
    });
});
