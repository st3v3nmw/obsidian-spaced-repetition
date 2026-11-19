import moment, { Moment } from "moment";
import { Grade, Rating, State } from "ts-fsrs";

import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";

// Prefix of FSRS-6 schedules in the scheduling comment, e.g. "!fsrs,2023-09-06T00:10:00.000Z,0,..."
export const FSRS_COMMENT_PREFIX = "fsrs";
// Prefix of FSRS-7 schedules in the scheduling comment, e.g. "!fsrs7,2023-09-06T00:10:00.000Z,0.00694444,..."
export const FSRS7_COMMENT_PREFIX = "fsrs7";

const LEGACY_MIN_EASE = 130;
const LEGACY_MAX_EASE = 370;

// ts-fsrs rounds memory states to 8 decimal places, we do the same for the fractional FSRS-7 intervals
const FSRS_DECIMAL_PLACES = 8;

export type FsrsScheduleStatus = "new" | "learning" | "review";

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
 * Returns the ts-fsrs schedule status of a card in the given state.
 * The plugin keeps track of suspended cards itself, so cards are never "suspended" for ts-fsrs.
 *
 * @param {State} state - The FSRS state of the card.
 * @returns {FsrsScheduleStatus} - The ts-fsrs schedule status.
 */
export function fsrsScheduleStatus(state: State): FsrsScheduleStatus {
    switch (state) {
        case State.New:
            return "new";
        case State.Learning:
        case State.Relearning:
            return "learning";
        case State.Review:
            return "review";
    }
}

/**
 * Parses the FSRS state of a scheduling comment.
 *
 * @param {string} input - The state, e.g. "2".
 * @returns {State} - The FSRS state.
 */
export function parseFsrsState(input: string): State {
    switch (input.trim()) {
        case "0":
            return State.New;
        case "1":
            return State.Learning;
        case "2":
            return State.Review;
        case "3":
            return State.Relearning;
        default:
            throw new Error(`Invalid FSRS state "${input}"`);
    }
}

/**
 * Rounds a number of the FSRS state to the precision ts-fsrs uses.
 *
 * @param {number} value - The number.
 * @returns {number} - The rounded number.
 */
export function roundFsrsNumber(value: number): number {
    const factor = 10 ** FSRS_DECIMAL_PLACES;
    return Math.round(value * factor) / factor;
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
