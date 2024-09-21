import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { TICKS_PER_DAY } from "src/constants";
import { DueDateHistogram } from "src/due-date-histogram";
import { t } from "src/lang/helpers";
import { SRSettings } from "src/settings";

// Note that if dueDateHistogram is provided, then it is just used to assist with fuzzing.
// (Unlike earlier versions, it is not updated based on the calculated schedule. The
// caller needs to do that if needed.

export function osrSchedule(
    response: ReviewResponse,
    originalInterval: number,
    ease: number,
    delayedBeforeReview: number,
    settingsObj: SRSettings,
    dueDateHistogram?: DueDateHistogram,
): Record<string, number> {
    const delayedBeforeReviewDays = Math.max(0, Math.floor(delayedBeforeReview / TICKS_PER_DAY));
    let interval: number = originalInterval;

    if (response === ReviewResponse.Easy) {
        ease += 20;
        interval = ((interval + delayedBeforeReviewDays) * ease) / 100;
        interval *= settingsObj.easyBonus;
    } else if (response === ReviewResponse.Good) {
        interval = ((interval + delayedBeforeReviewDays / 2) * ease) / 100;
    } else if (response === ReviewResponse.Hard) {
        ease = Math.max(130, ease - 20);
        interval = Math.max(
            1,
            (interval + delayedBeforeReviewDays / 4) * settingsObj.lapsesIntervalChange,
        );
    }

    // replaces random fuzz with load balancing over the fuzz interval
    if (dueDateHistogram !== undefined) {
        interval = Math.round(interval);
        // disable fuzzing for small intervals
        if (interval > 4) {
            let fuzz = 0;
            if (interval < 7) fuzz = 1;
            else if (interval < 30) fuzz = Math.max(2, Math.floor(interval * 0.15));
            else fuzz = Math.max(4, Math.floor(interval * 0.05));

            const fuzzedInterval = dueDateHistogram.findLeastUsedIntervalOverRange(interval, fuzz);
            interval = fuzzedInterval;
        }
    }

    interval = Math.min(interval, settingsObj.maximumInterval);
    interval = Math.round(interval * 10) / 10;

    return { interval, ease };
}

export function textInterval(interval: number, isMobile: boolean): string {
    if (interval === undefined) {
        return t("NEW");
    }

    const m: number = Math.round(interval / 3.04375) / 10,
        y: number = Math.round(interval / 36.525) / 10;

    if (isMobile) {
        if (m < 1.0) return t("DAYS_STR_IVL_MOBILE", { interval });
        else if (y < 1.0) return t("MONTHS_STR_IVL_MOBILE", { interval: m });
        else return t("YEARS_STR_IVL_MOBILE", { interval: y });
    } else {
        if (m < 1.0) return t("DAYS_STR_IVL", { interval });
        else if (y < 1.0) return t("MONTHS_STR_IVL", { interval: m });
        else return t("YEARS_STR_IVL", { interval: y });
    }
}
