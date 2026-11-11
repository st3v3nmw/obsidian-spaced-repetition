import { moment } from "obsidian";

import en from "src/lang/locale/en";
import { LocaleManager, LocaleManagerInstance } from "src/lang/locale-manager";

describe("LocaleManager", () => {
    describe("Locale without a translation (e.g. Swedish)", () => {
        let manager: LocaleManager;

        beforeEach(() => {
            (moment.locale as jest.Mock).mockReturnValue("sv");
            manager = new LocaleManager();
            LocaleManagerInstance.instance = manager;
        });

        test("currentTranslation falls back to English", () => {
            expect(manager.currentTranslation()).toEqual(en);
        });
    });
});
