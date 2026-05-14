// https://github.com/mgmeyers/obsidian-kanban/blob/93014c2512507fde9eafd241e8d4368a8dfdf853/src/lang/helpers.ts

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

export const localeMap: { [k: string]: IBaseLocale } = {
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

// Load the current locale via moment
const loadedLocale: string = moment.locale();
// Get the translations from the locale map via the loaded locale
const currentLocale: IBaseLocale = localeMap[loadedLocale];

/**
 * Inserts parameters into the translation string
 *
 * @param translation The translation string
 * @param params Parameters to insert into the translation string
 * @returns {string}
 */
function insertParameters(translation: string, params: Record<string, unknown>): string {
    // https://stackoverflow.com/a/41015840/
    // Retrieve names of parameters
    const names: string[] = Object.keys(params);
    // Retrieve values of parameters
    const vals: unknown[] = Object.values(params);

    console.log(names, vals);

    function replaceNamesWithValues(translation: string, names: string[], vals: unknown[]): string {
        let result: string = translation;

        for (let i = 0; i < names.length; i++) {
            const name: string = names[i];
            const value: unknown = vals[i];

            // Replace name with value
            result = result.replace("${" + name + "}", value + ""); // Force string conversion of value
        }

        return result;
    }

    const testResult = replaceNamesWithValues(translation, names, vals);

    console.log(testResult);
    return testResult;
}

/**
 * Retrieves the translation via the current locale and inserts parameters into it
 */
export function t(str: keyof IBaseLocale, params?: Record<string, unknown>): string {
    if (!currentLocale) {
        console.error(`SRS error: Locale ${moment.locale()} not found.`);
    }

    // Retrieve translation from locale. Fall back to english if something went wrong
    const translation = (currentLocale && currentLocale[str]) || en[str];

    if (params) {
        return insertParameters(translation, params);
    }

    return translation;
}
