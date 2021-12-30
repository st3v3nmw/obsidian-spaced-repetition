test("Test translation unknown locale", () => {
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "ki"); // Kikuyu
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { t } = require("src/lang/helpers");
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(t("HARD")).toEqual("Hard");
        expect(consoleSpy).toHaveBeenCalledWith("SRS error: Locale ki not found.");
    });
});

test("Test translation without interpolation in English", () => {
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "en");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { t } = require("src/lang/helpers");
        expect(t("HARD")).toEqual("Hard");
    });
});

test("Test translation without interpolation in German", () => {
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "de");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { t } = require("src/lang/helpers");
        expect(t("HARD")).toEqual("Schwer");
    });
});

test("Test translation with interpolation in English", () => {
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "en");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { t } = require("src/lang/helpers");
        expect(t("STATUS_BAR", { dueNotesCount: 1, dueFlashcardsCount: 2 })).toEqual(
            "Review: 1 note(s), 2 card(s) due"
        );
    });
});

test("Test translation with interpolation in German", () => {
    jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => "de");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { t } = require("src/lang/helpers");
        expect(t("STATUS_BAR", { dueNotesCount: 1, dueFlashcardsCount: 2 })).toEqual(
            "Wiederholung: 1 Notiz(en), 2 Karte(n) anstehend"
        );
    });
});
