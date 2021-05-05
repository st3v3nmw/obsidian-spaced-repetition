import type SRPlugin from "./main";

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Reset,
}

export function schedule(
    response: ReviewResponse,
    interval: number,
    ease: number,
    lapsesIntervalChange: number,
    easyBonus: number,
    fuzz: boolean = true,
) {
    if (response != ReviewResponse.Good) {
        ease =
            response == ReviewResponse.Easy
                ? ease + 20
                : Math.max(130, ease - 20);
    }

    if (response == ReviewResponse.Hard)
        interval = Math.max(
            1,
            interval * lapsesIntervalChange
        );
    else interval = (interval * ease) / 100;

    if (response == ReviewResponse.Easy)
        interval *= easyBonus;

    if (fuzz) {
        // fuzz
        if (interval >= 8) {
            let fuzz = [-0.05 * interval, 0, 0.05 * interval];
            interval += fuzz[Math.floor(Math.random() * fuzz.length)];
        }
    }

    return { interval: Math.round(interval * 10) / 10, ease };
}
