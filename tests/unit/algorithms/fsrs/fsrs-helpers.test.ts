import { Rating, State } from "ts-fsrs";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import {
    buildFsrsParameters,
    difficultyToEase,
    easeToDifficulty,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
    legacyScheduleToFsrsCard,
    parseFsrsTimestamp,
    reviewResponseToFsrsGrade,
} from "src/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { DEFAULT_SETTINGS } from "src/settings";
import { globalDateProvider, setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("buildFsrsParameters", () => {
    expect(buildFsrsParameters(DEFAULT_SETTINGS)).toMatchObject({
        ["request_retention"]: DEFAULT_SETTINGS.fsrsDesiredRetention,
        ["maximum_interval"]: DEFAULT_SETTINGS.maximumInterval,
        ["enable_short_term"]: true,
    });
});

test("reviewResponseToFsrsGrade", () => {
    expect(reviewResponseToFsrsGrade(ReviewResponse.Again)).toEqual(Rating.Again);
    expect(reviewResponseToFsrsGrade(ReviewResponse.Hard)).toEqual(Rating.Hard);
    expect(reviewResponseToFsrsGrade(ReviewResponse.Good)).toEqual(Rating.Good);
    expect(reviewResponseToFsrsGrade(ReviewResponse.Easy)).toEqual(Rating.Easy);
});

test("difficulty and ease conversion are inverse enough for legacy migration", () => {
    expect(easeToDifficulty(130)).toEqual(10);
    expect(easeToDifficulty(370)).toEqual(1);
    expect(difficultyToEase(10)).toEqual(130);
    expect(difficultyToEase(1)).toEqual(370);
    expect(difficultyToEase(easeToDifficulty(250))).toBeGreaterThanOrEqual(240);
});

test("legacyScheduleToFsrsCard keeps due date and derives review state", () => {
    const legacySchedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270);
    const actual = legacyScheduleToFsrsCard(legacySchedule, globalDateProvider.now);

    expect(actual).toMatchObject({
        state: State.Review,
        ["scheduled_days"]: 4,
        stability: 4,
        reps: 2,
        lapses: 0,
    });
    expect(new Date(actual.due).toISOString()).toContain("2023-09-10");
    expect(new Date(actual.last_review).toISOString()).toContain("2023-09-06");
});

test("FSRS timestamp helpers", () => {
    const timestamp = formatFsrsTimestamp(globalDateProvider.now);
    expect(timestamp).toEqual("2023-09-06T00:00:00.000Z");
    expect(parseFsrsTimestamp(timestamp).toDate().toISOString()).toEqual(timestamp);
    expect(parseFsrsTimestamp("-")).toBeNull();
    expect(FSRS_COMMENT_PREFIX).toEqual("fsrs");
});
