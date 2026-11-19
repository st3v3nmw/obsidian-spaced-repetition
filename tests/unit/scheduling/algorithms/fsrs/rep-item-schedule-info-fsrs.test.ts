import moment from "moment";
import { State } from "ts-fsrs";

import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("formats FSRS card schedule for markdown comments", () => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:10:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        moment("2023-09-06T00:00:00.000Z"),
    );

    expect(schedule.formatScheduleAsSRHtmlComment()).toEqual(
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z",
    );
    expect(schedule.isShortTerm()).toEqual(true);
    expect(schedule.isDue()).toEqual(false);
});

test("Serializes FSRS card schedule for JSON", () => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:10:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        moment("2023-09-06T00:00:00.000Z"),
    );

    const serialized = schedule.serializeSchedule();

    expect(serialized).toMatchObject({
        algorithm: SRAlgorithmType.FSRS,
        scheduleData: {
            dueDate: "2023-09-06T00:10:00.000Z",
            interval: 0,
            stability: 0.4,
            difficulty: 5.5,
            state: State.Learning,
            reps: 1,
            lapses: 0,
            learningSteps: 1,
            lastReview: "2023-09-06T00:00:00.000Z",
        },
    });
});

test("converts to and from ts-fsrs FSRS-6 cards", () => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:00:00.000Z"),
        3,
        4.5,
        2.5,
        State.Review,
        5,
        1,
        0,
        moment("2023-09-03T00:00:00.000Z"),
    );

    const card = schedule.toFsrs6Card();
    expect(card).toMatchObject({
        dueAt: new Date("2023-09-06T00:00:00.000Z"),
        lastReviewAt: new Date("2023-09-03T00:00:00.000Z"),
        stability: 2.5,
        difficulty: 4.5,
        state: State.Review,
        scheduleStatus: "review",
        scheduledDays: 3,
        learningStep: 0,
        reps: 5,
        lapses: 1,
    });

    const roundTrip = RepItemScheduleInfoFsrs.fromFsrs6Card(card);
    expect(roundTrip.formatScheduleAsSRHtmlComment()).toEqual(
        schedule.formatScheduleAsSRHtmlComment(),
    );
});

test("handles missing due dates", () => {
    const noDueSchedule = new RepItemScheduleInfoFsrs(
        null,
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        null,
    );
    expect(noDueSchedule.delayedBeforeReviewTicks).toEqual(0);
});

test("refuses to convert an invalid schedule to a ts-fsrs card", () => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:00:00.000Z"),
        3,
        4.5,
        Number.NaN,
        State.Review,
        5,
        1,
        0,
        moment("2023-09-03T00:00:00.000Z"),
    );

    expect(() => schedule.toFsrs6Card()).toThrow();
});
