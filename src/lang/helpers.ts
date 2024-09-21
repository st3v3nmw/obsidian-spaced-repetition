// https://github.com/mgmeyers/obsidian-kanban/blob/93014c2512507fde9eafd241e8d4368a8dfdf853/src/lang/helpers.ts

import { moment } from "obsidian";

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

export const localeMap: { [k: string]: Partial<typeof en> } = {
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

const locale = localeMap[moment.locale()];

// https://stackoverflow.com/a/41015840/
function interpolate(str: string, params: Record<string, unknown>): string {
    const names: string[] = Object.keys(params);
    const vals: unknown[] = Object.values(params);
    return new Function(...names, `return \`${str}\`;`)(...vals);
}

export function t(str: keyof typeof en, params?: Record<string, unknown>): string {
    if (!locale) {
        console.error(`SRS error: Locale ${moment.locale()} not found.`);
    }

    const result = (locale && locale[str]) || en[str];

    if (params) {
        return interpolate(result, params);
    }

    return result;
}
