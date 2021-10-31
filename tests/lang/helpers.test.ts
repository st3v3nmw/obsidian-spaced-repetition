test("Test translation without interpolation in English", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => 'en');
        const {t} = require("src/lang/helpers");
        expect(t("HARD")).toEqual("Hard");
    });
});

test("Test translation without interpolation in German", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => 'de');
        const {t} = require("src/lang/helpers");
        expect(t("HARD")).toEqual("Schwer");
    });
});

test("Test translation with interpolation in English", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => 'en');
        const {t} = require("src/lang/helpers");
        expect(
            t("STATUS_BAR", {dueNotesCount: 1, dueFlashcardsCount: 2})
        ).toEqual("Review: 1 notes(s), 2 card(s) due");
    });
});

test("Test translation with interpolation in German", () => {
    jest.isolateModules(() => {
        const { moment } = require("obsidian");
        const mockLocale = moment.locale as jest.MockedFunction<() => string>;
        mockLocale.mockImplementation(() => 'de');
        const {t} = require("src/lang/helpers");
        expect(
            t("STATUS_BAR", {dueNotesCount: 1, dueFlashcardsCount: 2})
        ).toEqual("Wiederholung: 1 Notiz(en), 2 Karte(n) anstehend");
    });
});
