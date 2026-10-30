import { Rating, State } from "ts-fsrs";

import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    difficultyToEase,
    easeToDifficulty,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
    parseFsrsTimestamp,
    reviewResponseToFsrsGrade,
    sm2ScheduleToFsrsCard,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { globalDateProvider, setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
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
    const actual = sm2ScheduleToFsrsCard(legacySchedule, globalDateProvider.now);

    expect(actual).toMatchObject({
        state: State.Review,
        scheduledDays: 4,
        stability: 4,
        reps: 2,
        lapses: 0,
    });
    expect(actual.dueAt.toISOString()).toContain("2023-09-10");
    expect(actual.lastReviewAt?.toISOString()).toContain("2023-09-06");
});

test("FSRS timestamp helpers", () => {
    const timestamp = formatFsrsTimestamp(globalDateProvider.now);
    expect(timestamp).toEqual("2023-09-06T00:00:00.000Z");
    expect(parseFsrsTimestamp(timestamp)?.toDate().toISOString()).toEqual(timestamp);
    expect(parseFsrsTimestamp("-")).toBeNull();
    expect(FSRS_COMMENT_PREFIX).toEqual("fsrs");
});

test("FSRS helpers handle unsupported responses and missing legacy values", () => {
    expect(() => reviewResponseToFsrsGrade(ReviewResponse.Reset)).toThrow(
        "Unsupported FSRS response: 4",
    );
    expect(easeToDifficulty(null)).toEqual(5.5);
    expect(easeToDifficulty(undefined)).toEqual(5.5);
    expect(formatFsrsTimestamp(null)).toEqual("-");

    const migrated = sm2ScheduleToFsrsCard(null, globalDateProvider.now);
    expect(migrated).toMatchObject({
        scheduledDays: 1,
        difficulty: 5.5,
    });
    expect(migrated.dueAt.toISOString()).toEqual("2023-09-06T00:00:00.000Z");
});
