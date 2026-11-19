import moment from "moment";
import { State } from "ts-fsrs";
import { curve } from "ts-fsrs/models/fsrs-7";

import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { easeToDifficulty } from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { FSRS7_WEIGHTS } from "src/scheduling/algorithms/fsrs/fsrs-schedulers";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

function reviewSchedule(): RepItemScheduleInfoFsrs7 {
    return new RepItemScheduleInfoFsrs7(
        moment("2023-09-16T01:52:52.121Z"),
        10.07143659,
        3.49771674,
        5.69148946,
        32.23815599,
        State.Review,
        2,
        0,
        0,
        moment("2023-09-06T00:10:00.000Z"),
    );
}

test("formats FSRS-7 card schedule for markdown comments", () => {
    const schedule = reviewSchedule();

    expect(schedule.algorithmType).toEqual(SRAlgorithmType.FSRS7);
    expect(schedule.formatScheduleAsSRHtmlComment()).toEqual(
        "!fsrs7,2023-09-16T01:52:52.121Z,10.07143659,5.69148946,32.23815599,3.49771674,2,2,0,0,2023-09-06T00:10:00.000Z",
    );
    expect(schedule.isDue()).toEqual(false);
    expect(schedule.latestEase).toBeGreaterThanOrEqual(130);
});

test("serializes FSRS-7 card schedule for JSON", () => {
    expect(reviewSchedule().serializeSchedule()).toEqual({
        algorithm: SRAlgorithmType.FSRS7,
        scheduleData: {
            dueDate: "2023-09-16T01:52:52.121Z",
            interval: 10.07143659,
            stability: 5.69148946,
            stabilityFast: 32.23815599,
            difficulty: 3.49771674,
            state: State.Review,
            reps: 2,
            lapses: 0,
            learningSteps: 0,
            lastReview: "2023-09-06T00:10:00.000Z",
        },
    });
});

test("converts to and from ts-fsrs FSRS-7 cards", () => {
    const schedule = reviewSchedule();

    const card = schedule.toFsrs7Card();
    expect(card).toMatchObject({
        dueAt: new Date("2023-09-16T01:52:52.121Z"),
        lastReviewAt: new Date("2023-09-06T00:10:00.000Z"),
        stability: 5.69148946,
        stabilityFast: 32.23815599,
        difficulty: 3.49771674,
        state: State.Review,
        scheduleStatus: "review",
        scheduledDays: 10.07143659,
        learningStep: 0,
        reps: 2,
        lapses: 0,
    });

    const roundTrip = RepItemScheduleInfoFsrs7.fromFsrs7Card(card);
    expect(roundTrip.formatScheduleAsSRHtmlComment()).toEqual(
        schedule.formatScheduleAsSRHtmlComment(),
    );
});

test("rounds the fractional interval of ts-fsrs cards to 8 decimal places", () => {
    const card = {
        ...reviewSchedule().toFsrs7Card(),
        scheduledDays: 10.07143659151449,
    };

    expect(RepItemScheduleInfoFsrs7.fromFsrs7Card(card).interval).toEqual(10.07143659);
});

test("refuses to convert an invalid schedule to a ts-fsrs card", () => {
    const schedule = reviewSchedule();
    schedule.stabilityFast = Number.NaN;

    expect(() => schedule.toFsrs7Card()).toThrow();
});

describe("SM-2 schedules converted to FSRS-7", () => {
    const recallAt = (schedule: RepItemScheduleInfoFsrs7, elapsedDays: number) =>
        curve(FSRS7_WEIGHTS, elapsedDays, schedule).retrievability;

    test("keep their due date and are predicted to be recalled with 90% on it", () => {
        const sm2 = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270);
        const actual = RepItemScheduleInfoFsrs7.fromSm2Schedule(sm2);

        expect(actual).toBeInstanceOf(RepItemScheduleInfoFsrs7);
        expect(actual).toMatchObject({
            interval: 4,
            difficulty: easeToDifficulty(270),
            state: State.Review,
            reps: 2,
            lapses: 0,
            learningSteps: 0,
        });
        expect(actual.dueDate.format("YYYY-MM-DD")).toEqual("2023-09-10");
        expect(actual.lastReview.format("YYYY-MM-DD")).toEqual("2023-09-06");
        expect(actual.stabilityFast).toBeCloseTo(0.8 * actual.stability, 6);
        expect(recallAt(actual, 4)).toBeCloseTo(0.9, 6);
        expect(recallAt(actual, 2)).toBeGreaterThan(0.9);
        expect(recallAt(actual, 8)).toBeLessThan(0.9);
        expect(() => actual.toFsrs7Card()).not.toThrow();
    });

    test.each([
        [1, 130],
        [5, 250],
        [25, 250],
        [76, 370],
        [36525, 250],
    ])("work for an interval of %i days and an ease of %i", (interval, ease) => {
        const sm2 = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", interval, ease);
        const actual = RepItemScheduleInfoFsrs7.fromSm2Schedule(sm2);

        expect(actual.interval).toEqual(interval);
        expect(recallAt(actual, interval)).toBeCloseTo(0.9, 6);
        expect(actual.stabilityFast).toBeCloseTo(0.8 * actual.stability, 6);
        expect(() => actual.toFsrs7Card()).not.toThrow();
    });

    test("treat an SM-2 interval of 0 days as 1 day", () => {
        const actual = RepItemScheduleInfoFsrs7.fromSm2Schedule(
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 0, 250),
        );

        expect(actual.interval).toEqual(1);
        expect(actual.lastReview.format("YYYY-MM-DD")).toEqual("2023-09-09");
    });
});
