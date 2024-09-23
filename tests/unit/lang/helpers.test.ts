test("Check that localization entries are consistent across all files", () => {
    jest.isolateModules(() => {
        const { localeMap } = require("src/lang/helpers");
        const expected_keys: string[] = Object.keys(localeMap["en"]);
        for (const [language_code, locale] of Object.entries(localeMap) as [string, string[]][]) {
            const locale_keys = Object.keys(locale);
            if (locale_keys.length == 0 || language_code == "en") continue;

            const unmapped_keys = expected_keys.filter((x) => !locale_keys.includes(x));
            expect(
                unmapped_keys.length,
                `The ${language_code} locale does not include translations for: ${unmapped_keys}.`,
            ).toBe(0);
            const extra_keys = locale_keys.filter((x) => !expected_keys.includes(x));
            expect(
                extra_keys.length,
                `The ${language_code} locale includes the following translations that are no longer in use: ${extra_keys}.`,
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
