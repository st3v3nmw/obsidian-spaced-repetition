import { Rating, State } from "ts-fsrs";

import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    difficultyToEase,
    easeToDifficulty,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
    FSRS7_COMMENT_PREFIX,
    fsrsScheduleStatus,
    parseFsrsState,
    parseFsrsTimestamp,
    reviewResponseToFsrsGrade,
    roundFsrsNumber,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
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

test("FSRS timestamp helpers", () => {
    const timestamp = formatFsrsTimestamp(globalDateProvider.now);
    expect(timestamp).toEqual("2023-09-06T00:00:00.000Z");
    expect(parseFsrsTimestamp(timestamp).toDate().toISOString()).toEqual(timestamp);
    expect(parseFsrsTimestamp("-")).toBeNull();
    expect(FSRS_COMMENT_PREFIX).toEqual("fsrs");
    expect(FSRS7_COMMENT_PREFIX).toEqual("fsrs7");
});

test("FSRS helpers handle unsupported responses and missing legacy values", () => {
    expect(() => reviewResponseToFsrsGrade(ReviewResponse.Reset)).toThrow(
        "Unsupported FSRS response: 4",
    );
    expect(easeToDifficulty(null)).toEqual(5.5);
    expect(easeToDifficulty(undefined as never)).toEqual(5.5);
    expect(formatFsrsTimestamp(null)).toEqual("-");
});

test("parseFsrsState accepts the four FSRS states only", () => {
    expect(parseFsrsState("0")).toEqual(State.New);
    expect(parseFsrsState("1")).toEqual(State.Learning);
    expect(parseFsrsState("2")).toEqual(State.Review);
    expect(parseFsrsState("3")).toEqual(State.Relearning);
    expect(() => parseFsrsState("4")).toThrow('Invalid FSRS state "4"');
    expect(() => parseFsrsState("")).toThrow('Invalid FSRS state ""');
    expect(() => parseFsrsState("2.5")).toThrow('Invalid FSRS state "2.5"');
});

test("fsrsScheduleStatus maps FSRS states to ts-fsrs schedule statuses", () => {
    expect(fsrsScheduleStatus(State.New)).toEqual("new");
    expect(fsrsScheduleStatus(State.Learning)).toEqual("learning");
    expect(fsrsScheduleStatus(State.Relearning)).toEqual("learning");
    expect(fsrsScheduleStatus(State.Review)).toEqual("review");
});

test("roundFsrsNumber rounds to 8 decimal places", () => {
    expect(roundFsrsNumber(10 / (24 * 60))).toEqual(0.00694444);
    expect(roundFsrsNumber(10.07143659151449)).toEqual(10.07143659);
    expect(roundFsrsNumber(3)).toEqual(3);
});
