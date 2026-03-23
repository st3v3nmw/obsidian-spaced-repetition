import moment, { Moment } from "moment";
import {
    CardInput,
    FSRSParameters,
    Grade,
    Rating,
    State,
} from "ts-fsrs";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SRSettings } from "src/settings";

export const FSRS_COMMENT_PREFIX = "fsrs";

const LEGACY_MIN_EASE = 130;
const LEGACY_MAX_EASE = 370;

export function buildFsrsParameters(settings: SRSettings): Partial<FSRSParameters> {
    return {
        ["request_retention"]: settings.fsrsDesiredRetention,
        ["maximum_interval"]: settings.maximumInterval,
        ["enable_short_term"]: true,
    };
}

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

export function easeToDifficulty(ease: number): number {
    if (ease === null || ease === undefined) {
        return 5.5;
    }

    const clampedEase = clamp(ease, LEGACY_MIN_EASE, LEGACY_MAX_EASE);
    const normalized = (clampedEase - LEGACY_MIN_EASE) / (LEGACY_MAX_EASE - LEGACY_MIN_EASE);
    return clamp(10 - normalized * 9, 1, 10);
}

export function difficultyToEase(difficulty: number): number {
    const clampedDifficulty = clamp(difficulty, 1, 10);
    const normalized = (10 - clampedDifficulty) / 9;
    return Math.round(LEGACY_MIN_EASE + normalized * (LEGACY_MAX_EASE - LEGACY_MIN_EASE));
}

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

export function formatFsrsTimestamp(date: Moment | null): string {
    return date ? date.toDate().toISOString() : "-";
}

export function parseFsrsTimestamp(input: string): Moment | null {
    return input === "-" ? null : moment(input);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
