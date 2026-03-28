import moment from "moment";
import { State } from "ts-fsrs";

import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
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

    expect(schedule.formatCardScheduleForHtmlComment()).toEqual(
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z",
    );
    expect(schedule.isShortTerm()).toEqual(true);
    expect(schedule.isDue()).toEqual(false);
});

test("converts to and from ts-fsrs card structures", () => {
    const schedule = RepItemScheduleInfoFsrs.fromFsrsCard({
        due: "2023-09-06T00:00:00.000Z",
        stability: 2.5,
        difficulty: 4.5,
        ["elapsed_days"]: 2,
        ["scheduled_days"]: 3,
        ["learning_steps"]: 0,
        reps: 5,
        lapses: 1,
        state: State.Review,
        ["last_review"]: "2023-09-03T00:00:00.000Z",
    });

    expect(schedule).toMatchObject({
        interval: 3,
        stability: 2.5,
        difficulty: 4.5,
        reps: 5,
        lapses: 1,
        state: State.Review,
    });

    const roundTrip = schedule.toFsrsCardInput();
    expect(new Date(roundTrip.due).toISOString()).toEqual("2023-09-06T00:00:00.000Z");
    expect(new Date(roundTrip.last_review).toISOString()).toEqual("2023-09-03T00:00:00.000Z");
    expect(roundTrip.scheduled_days).toEqual(3);
});
