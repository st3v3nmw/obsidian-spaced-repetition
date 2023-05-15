import { TFile } from "obsidian";

import { SRSettings } from "src/settings";
import { t } from "src/lang/helpers";
import { MINUTES_PER_DAY } from "./constants";

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Impossible,
    Reset,
}

// Flashcards

export interface Card {
    editLater: boolean;
    // scheduling
    isDue: boolean;
    isReDue: boolean;
    interval?: number;
    ease?: number;
    delayBeforeReview?: number;
    previousReview?: number;
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
        } else if (response === ReviewResponse.Hard) {
            interval = 5;
            ease = Math.max(settingsObj.baseEase, ease - 20);
        } else {
            interval = 1;
            ease = Math.max(settingsObj.baseEase, ease - 20);
        }
    } else {
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
        } else {
            ease = Math.max(settingsObj.baseEase, ease - 20);
            interval = 5;
        }
    }

    // replaces random fuzz with load balancing over the fuzz interval
    interval = roundInterval(interval, settingsObj.maximumInterval);
    if (dueDates !== undefined) {
        const dayInterval = Math.round(interval / MINUTES_PER_DAY);
        if (!Object.prototype.hasOwnProperty.call(dueDates, dayInterval)) {
            dueDates[dayInterval] = 0;
        } else {
            // disable fuzzing for small intervals
            if (interval > 4 * MINUTES_PER_DAY) {
                let fuzz = 0;

                if (interval < 7 * MINUTES_PER_DAY) {
                    fuzz = 1;
                } else if (interval < 30 * MINUTES_PER_DAY) {
                    fuzz = Math.max(2, Math.floor(interval * 0.15));
                } else {
                    fuzz = Math.max(4, Math.floor(interval * 0.05));
                }

                fuzz *= MINUTES_PER_DAY;

                const originalInterval = interval;
                outer: for (let i = MINUTES_PER_DAY; i <= fuzz; i += MINUTES_PER_DAY) {
                    for (let ivl of [originalInterval - i, originalInterval + i]) {
                        ivl = roundInterval(ivl, settingsObj.maximumInterval);;
                        const dayIvl = Math.round(ivl / MINUTES_PER_DAY);
                        if (!Object.prototype.hasOwnProperty.call(dueDates, dayIvl)) {
                            dueDates[dayIvl] = 0;
                            interval = ivl;
                            break outer;
                        }
                        if (dueDates[dayIvl] < dueDates[dayInterval]) interval = ivl;
                    }
                }
            }
        }

        dueDates[Math.round(interval / MINUTES_PER_DAY)]++;
    }

    return { interval: Math.round(interval * 10) / 10, ease };
}

export function textInterval(interval: number, isMobile: boolean): string {
    if (interval === undefined) {
        return t("NEW");
    }
    
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

// Round down to 1m and 10m for consistency
function roundInterval(interval: number, maximumInterval: number): number {
    interval = Math.round(interval);
    interval = Math.min(interval, maximumInterval * MINUTES_PER_DAY);
    if (interval < 5) {
        interval = 1;
    } else if (interval < 10) {
        interval = 5;
    } else if (interval < MINUTES_PER_DAY / 3) {
        interval = 10;
    } else if (interval < MINUTES_PER_DAY) {
        interval = MINUTES_PER_DAY;
    }

    return interval;
}