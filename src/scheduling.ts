import { TFile } from "obsidian";

import { SRSettings } from "src/settings";
import { t } from "src/lang/helpers";
import { MINUTES_PER_DAY } from "./constants";

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Reset,
}

// Flashcards

export interface Card {
    // scheduling
    isDue: boolean;
    isReDue: boolean;
    interval?: number;
    ease?: number;
    delayBeforeReview?: number;
    // note
    note: TFile;
    lineNo: number;
    // visuals
    front: string;
    back: string;
    cardText: string;
    context: string;
    // types
    cardType: CardType;
    // information for sibling cards
    siblingIdx: number;
    siblings: Card[];
}

export enum CardType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

/**
 * 
 * @param response Whether or not the card was labelled 'easy', 'good', or 'hard'
 * @param interval The interval in minutes between the previous review and when the card becomes available for review.
 * @param ease The internal ease of the card
 * @param delayBeforeReview Difference in ms between a card's scheduled review time & when its actually reviewed.
 * @param settingsObj The global settings object
 * @param dueDates The array of due dates (for statistics)
 * @returns Object containing the new scheduling interval & ease of the card.
 */
export function schedule(
    response: ReviewResponse,
    interval: number,
    ease: number,
    delayBeforeReview: number,
    settingsObj: SRSettings,
    dueDates?: Record<number, number>
): Record<string, number> {
    const minutesBeforeReview: number = Math.max(0, Math.floor(delayBeforeReview / (60 * 1000)));

    if (interval < MINUTES_PER_DAY) {
        if (response === ReviewResponse.Easy) {
            ease += 20;
            interval = MINUTES_PER_DAY;
        } else if (response === ReviewResponse.Good) {
            interval = 10;
        } else {
            interval = 1;
            ease = Math.max(settingsObj.baseEase, ease - 20);
        }
    } else {
        // TODO: Change old algorithm to deal with minutes? How?
        if (response === ReviewResponse.Easy) {
            ease += 20;
            interval = ((interval + minutesBeforeReview) * ease) / 100;
            interval *= settingsObj.easyBonus;
        } else if (response === ReviewResponse.Good) {
            interval = ((interval + minutesBeforeReview / 2) * ease) / 100;
        } else if (response === ReviewResponse.Hard) {
            ease = Math.max(settingsObj.baseEase, ease - 20);
            interval = Math.max(
                1,
                (interval + minutesBeforeReview / 4) * settingsObj.lapsesIntervalChange
            );
        }
    }

    // replaces random fuzz with load balancing over the fuzz interval
    if (dueDates !== undefined) {
        interval = Math.round(interval);
        if (!Object.prototype.hasOwnProperty.call(dueDates, interval)) {
            dueDates[interval] = 0;
        } else {
            // disable fuzzing for small intervals
            if (interval > 4 * MINUTES_PER_DAY) {
                let fuzz = 0;

                if (interval < 7 * MINUTES_PER_DAY) {
                    fuzz = MINUTES_PER_DAY;
                } else if (interval < 30 * MINUTES_PER_DAY) {
                    fuzz = Math.max(2, Math.floor(interval * 0.15));
                } else {
                    fuzz = Math.max(4, Math.floor(interval * 0.05));
                }

                const originalInterval = interval;
                outer: for (let i = 1; i <= fuzz; i++) {
                    for (const ivl of [originalInterval - i, originalInterval + i]) {
                        if (!Object.prototype.hasOwnProperty.call(dueDates, ivl)) {
                            dueDates[Math.round(ivl / MINUTES_PER_DAY)] = 0;
                            interval = ivl;
                            break outer;
                        }
                        if (dueDates[ivl] < dueDates[interval]) interval = ivl;
                    }
                }
            }
        }

        dueDates[Math.round(interval / MINUTES_PER_DAY)]++;
    }

    // Round down to 1m and 10m for consistency
    interval = Math.min(interval, settingsObj.maximumInterval * MINUTES_PER_DAY);
    if (interval < 10) {
        interval = 1;
    } else if (interval < MINUTES_PER_DAY) {
        interval = 10;
    }

    return { interval: Math.round(interval * 10) / 10, ease };
}

export function textInterval(interval: number, isMobile: boolean): string {
    const days: number = Math.round(interval / (24 * 60)),
        months: number = Math.round(days / 3.04375) / 10,
        years: number = Math.round(days / 36.525) / 10;

    if (isMobile) {
        if (days < 1.0) return t("MINUTES_STR_IVL_MOBILE", { interval });
        if (months < 1.0) return t("DAYS_STR_IVL_MOBILE", { interval: days });
        if (years < 1.0) return t("MONTHS_STR_IVL_MOBILE", { interval: months });
        return t("YEARS_STR_IVL_MOBILE", { interval: years });
    } else {
        if (days < 1.0) return t("MINUTES_STR_IVL", { interval });
        if (months < 1.0) return t("DAYS_STR_IVL", { interval: days });
        if (years < 1.0) return t("MONTHS_STR_IVL", { interval: months });
        return t("YEARS_STR_IVL", { interval: years });
    }
}
