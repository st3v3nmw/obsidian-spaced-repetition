import { ReviewResponse, SRSettings } from "./types";
import { getSetting } from "./settings";

export function schedule(
    response: ReviewResponse,
    interval: number,
    ease: number,
    delayBeforeReview: number,
    fuzz: boolean,
    settingsObj: SRSettings
) {
    let lapsesIntervalChange: number = getSetting(
        "lapsesIntervalChange",
        settingsObj
    );
    let easyBonus: number = getSetting("easyBonus", settingsObj);
    let maximumInterval: number = getSetting("maximumInterval", settingsObj);

    delayBeforeReview = Math.max(
        0,
        Math.floor(delayBeforeReview / (24 * 3600 * 1000))
    );

    if (response == ReviewResponse.Easy) {
        ease += 20;
        interval = ((interval + delayBeforeReview) * ease) / 100;
        interval *= easyBonus;
    } else if (response == ReviewResponse.Good) {
        interval = ((interval + delayBeforeReview / 2) * ease) / 100;
    } else if (response == ReviewResponse.Hard) {
        ease = Math.max(130, ease - 20);
        interval = Math.max(
            1,
            (interval + delayBeforeReview / 4) * lapsesIntervalChange
        );
    }

    if (fuzz) {
        // fuzz
        if (interval >= 8) {
            let fuzz: number[] = [-0.05 * interval, 0, 0.05 * interval];
            interval += fuzz[Math.floor(Math.random() * fuzz.length)];
        }
    }

    interval = Math.min(interval, maximumInterval);

    return { interval: Math.round(interval * 10) / 10, ease };
}

export function textInterval(interval: number, isMobile: boolean): string {
    let m: number = Math.round(interval / 3) / 10;
    let y: number = Math.round(interval / 36.5) / 10;

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
