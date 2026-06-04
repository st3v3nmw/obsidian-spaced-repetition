import { moment } from "obsidian";

import { IBaseLocale } from "src/lang/base-locale";
import af from "src/lang/locale/af";
import ar from "src/lang/locale/ar";
import bn from "src/lang/locale/bn";
import cz from "src/lang/locale/cz";
import da from "src/lang/locale/da";
import de from "src/lang/locale/de";
import en from "src/lang/locale/en";
import enGB from "src/lang/locale/en-gb";
import es from "src/lang/locale/es";
import fr from "src/lang/locale/fr";
import hi from "src/lang/locale/hi";
import id from "src/lang/locale/id";
import it from "src/lang/locale/it";
import ja from "src/lang/locale/ja";
import ko from "src/lang/locale/ko";
import mr from "src/lang/locale/mr";
import nl from "src/lang/locale/nl";
import no from "src/lang/locale/no";
import pl from "src/lang/locale/pl";
import pt from "src/lang/locale/pt";
import ptBR from "src/lang/locale/pt-br";
import ro from "src/lang/locale/ro";
import ru from "src/lang/locale/ru";
import sw from "src/lang/locale/sw";
import ta from "src/lang/locale/ta";
import te from "src/lang/locale/te";
import th from "src/lang/locale/th";
import tr from "src/lang/locale/tr";
import uk from "src/lang/locale/uk";
import ur from "src/lang/locale/ur";
import vi from "src/lang/locale/vi";
import zhCN from "src/lang/locale/zh-cn";
import zhTW from "src/lang/locale/zh-tw";

export interface ILocaleOption {
    language: string;
    languageName: string;
}

export interface ILocaleManager {
    currentLocale: string;
    readonly loadedLocale: string;
    readonly localeMap: { [k: string]: IBaseLocale };

    currentTranslation: () => IBaseLocale;
    currentLocaleName: () => string;
    currentLocaleCode: () => string;

    getLocaleOptionsList: () => ILocaleOption[];
}

export class LocaleManagerInstance {
    static instance: ILocaleManager;

    public static getInstance(): ILocaleManager {
        if (!LocaleManagerInstance.instance) {
            throw new Error("there is no QuestionDataStore instance.");
        }
        return LocaleManagerInstance.instance;
    }
}

export class LocaleManager implements ILocaleManager {
    public currentLocale: string; // The locale that is currently used
    public readonly loadedLocale: string; // The locale that is loaded by moment
    public readonly localeMap: { [k: string]: IBaseLocale }; // The locale map

    constructor() {
        // Load the current locale via moment
        this.loadedLocale = moment.locale();
        // Current locale is the same as the loaded locale if not changed elsewhere
        this.currentLocale = this.loadedLocale;
        this.localeMap = {
            af,
            ar,
            bn,
            cs: cz,
            da,
            de,
            en,
            "en-gb": enGB,
            es,
            fr,
            hi,
            id,
            it,
            ja,
            ko,
            mr,
            nl,
            nn: no,
            pl,
            pt,
            "pt-br": ptBR,
            ro,
            ru,
            sw,
            ta,
            te,
            th,
            tr,
            uk,
            ur,
            vi,
            "zh-cn": zhCN,
            "zh-tw": zhTW,
        };
    }

    /**
     * Gets the current translation.
     */
    public currentTranslation(): IBaseLocale {
        const currentLocale: string = LocaleManagerInstance.getInstance().currentLocale;
        const currentLocaleMap: IBaseLocale = this.localeMap[currentLocale];

        if (!currentLocaleMap) {
            console.warn(`SRS error: Locale ${currentLocale} not found.`);
        }

        return currentLocaleMap;
    }

    /**
     * Gets the current locale name.
     */
    public currentLocaleName(): string {
        return this.currentTranslation().languageName;
    }

    /**
     * Gets the current locale code.
     */
    public currentLocaleCode(): string {
        return this.currentTranslation().language;
    }

    /**
     * Gets the list of available locales.
     */
    public getLocaleOptionsList(): ILocaleOption[] {
        return Object.keys(this.localeMap).map((locale) => ({
            language: locale,
            languageName: this.localeMap[locale].languageName,
        }));
    }
}
