import moment, { Moment } from "moment";
import { CardInput, FSRSParameters, Grade, Rating, State } from "ts-fsrs";

import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";

export const FSRS_COMMENT_PREFIX = "fsrs";

const LEGACY_MIN_EASE = 130;
const LEGACY_MAX_EASE = 370;

/**
 * Builds the FSRS parameters object.
 *
 * @param {SRSettings} settings - The settings object.
 * @returns {Partial<FSRSParameters>} - The FSRS parameters object.
 */
export function buildFsrsParameters(settings: SRSettings): Partial<FSRSParameters> {
    return {
        ["request_retention"]: settings.fsrsDesiredRetention,
        ["maximum_interval"]: settings.maximumInterval,
        ["enable_short_term"]: true,
    };
}

/**
 * Converts a review response to a FSRS grade.
 *
 * @param {ReviewResponse} response - The review response.
 * @returns {Grade} - The FSRS grade.
 */
export function reviewResponseToFsrsGrade(response: ReviewResponse): Grade {
    switch (response) {
        case ReviewResponse.Again:
            return Rating.Again;
        case ReviewResponse.Hard:
            return Rating.Hard;
        case ReviewResponse.Good:
            return Rating.Good;
        case ReviewResponse.Easy:
            return Rating.Easy;
        default:
            throw new Error(`Unsupported FSRS response: ${response}`);
    }
}

/**
 * Converts an ease to a difficulty.
 *
 * @param {number} ease - The ease.
 * @returns {number} - The difficulty.
 */
export function easeToDifficulty(ease: number): number {
    if (ease === null || ease === undefined) {
        return 5.5;
    }

    const clampedEase = clamp(ease, LEGACY_MIN_EASE, LEGACY_MAX_EASE);
    const normalized = (clampedEase - LEGACY_MIN_EASE) / (LEGACY_MAX_EASE - LEGACY_MIN_EASE);
    return clamp(10 - normalized * 9, 1, 10);
}

/**
 * Converts a difficulty to an ease.
 *
 * @param {number} difficulty - The difficulty.
 * @returns {number} - The ease.
 */
export function difficultyToEase(difficulty: number): number {
    const clampedDifficulty = clamp(difficulty, 1, 10);
    const normalized = (10 - clampedDifficulty) / 9;
    return Math.round(LEGACY_MIN_EASE + normalized * (LEGACY_MAX_EASE - LEGACY_MIN_EASE));
}

/**
 * Converts a legacy schedule to an FSRS card.
 *
 * @param {RepItemScheduleInfo} schedule - The legacy schedule.
 * @param {Moment} now - The current time.
 * @returns {CardInput} - The FSRS card.
 */
export function legacyScheduleToFsrsCard(schedule: RepItemScheduleInfo, now: Moment): CardInput {
    const interval = Math.max(1, Math.round(schedule?.interval ?? 1));
    const due = schedule?.dueDate ? schedule.dueDate.clone() : now.clone();
    const lastReview = due.clone().subtract(interval, "d");

    return {
        due: due.toDate(),
        stability: Math.max(0.1, interval),
        difficulty: easeToDifficulty(schedule?.latestEase),
        ["elapsed_days"]: Math.max(0, now.diff(lastReview, "days")),
        ["scheduled_days"]: interval,
        ["learning_steps"]: 0,
        reps: Math.max(1, Math.round(Math.log2(interval + 1))),
        lapses: 0,
        state: State.Review,
        ["last_review"]: lastReview.toDate(),
    };
}

/**
 * Formats a FSRS timestamp.
 *
 * @param {Moment | null} date - The FSRS timestamp.
 * @returns {string} - The formatted FSRS timestamp.
 */
export function formatFsrsTimestamp(date: Moment | null): string {
    return date ? date.toDate().toISOString() : "-";
}

/**
 * Parses a FSRS timestamp.
 *
 * @param {string} input - The FSRS timestamp.
 * @returns {Moment|null} - The parsed FSRS timestamp.
 */
export function parseFsrsTimestamp(input: string): Moment | null {
    return input === "-" ? null : moment(input);
}

/**
 * Clamps a value between a minimum and maximum.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} - The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
