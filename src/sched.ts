import { ReviewResponse, SRSettings } from "./types";
import { getSetting } from "./settings";

export function schedule(
    response: ReviewResponse,
    interval: number,
    ease: number,
    fuzz: boolean,
    settingsObj: SRSettings
) {
    let lapsesIntervalChange: number = getSetting(
        "lapsesIntervalChange",
        settingsObj
    );
    let easyBonus: number = getSetting("easyBonus", settingsObj);
    let maximumInterval: number = getSetting("maximumInterval", settingsObj);

    if (response != ReviewResponse.Good) {
        ease =
            response == ReviewResponse.Easy
                ? ease + 20
                : Math.max(130, ease - 20);
    }

    if (response == ReviewResponse.Hard)
        interval = Math.max(1, interval * lapsesIntervalChange);
    else interval = (interval * ease) / 100;

    if (response == ReviewResponse.Easy) interval *= easyBonus;

    if (fuzz) {
        // fuzz
        if (interval >= 8) {
            let fuzz = [-0.05 * interval, 0, 0.05 * interval];
            interval += fuzz[Math.floor(Math.random() * fuzz.length)];
        }
    }

    interval = Math.min(interval, maximumInterval);

    return { interval: Math.round(interval * 10) / 10, ease };
}

export function textInterval(interval: number, isMobile: boolean): string {
    let m = Math.round(interval / 3) / 10;
    let y = Math.round(interval / 36.5) / 10;

    if (isMobile) {
        if (interval < 30) return `${interval}d`;
        else if (interval < 365) return `${m}m`;
        else return `${y}y`;
    } else {
        if (interval < 30)
            return interval == 1.0 ? "1.0 day" : `${interval} days`;
        else if (interval < 365) return m == 1.0 ? "1.0 month" : `${m} months`;
        else return y == 1.0 ? "1.0 year" : `${y} years`;
    }
}
