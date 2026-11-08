import moment from "moment";
import { State } from "ts-fsrs";

import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { textInterval } from "src/scheduling/algorithms/osr/note-scheduling";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import {
    formatPendingDueTime,
    formatScheduleInterval,
} from "src/scheduling/algorithms/schedule-display";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("formats day-based schedules with the legacy interval formatter", () => {
    const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270);
    expect(formatScheduleInterval(schedule, false)).toEqual(textInterval(4, false));
});

test("formats short-term FSRS schedules in minutes and hours", () => {
    const minutesSchedule = new RepItemScheduleInfoFsrs(
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
    const hoursSchedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T02:00:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        moment("2023-09-06T00:00:00.000Z"),
    );

    expect(formatScheduleInterval(minutesSchedule, false)).toEqual("10 min");
    expect(formatScheduleInterval(hoursSchedule, true)).toEqual("2h");
});

test("formats pending times and falls back when the short-term due date is missing", () => {
    const minutesSchedule = new RepItemScheduleInfoFsrs(
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
    const hoursSchedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T02:00:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        moment("2023-09-06T00:00:00.000Z"),
    );

    expect(formatScheduleInterval(undefined, false)).toEqual(textInterval(undefined, false));
    expect(formatScheduleInterval({ interval: 0, dueDate: null } as never, false)).toEqual(
        textInterval(0, false),
    );
    expect(formatScheduleInterval(minutesSchedule, true)).toEqual("10m");
    expect(formatScheduleInterval(hoursSchedule, false)).toEqual("2 hr");
    expect(formatPendingDueTime(Date.parse("2023-09-06T00:10:00.000Z"))).toEqual("00:10:00");
});

test("formats fractional FSRS-7 intervals in whole days, and sub-day ones in minutes and hours", () => {
    const fsrs7 = (dueDate: string, interval: number) =>
        new RepItemScheduleInfoFsrs7(
            moment(dueDate),
            interval,
            3.5,
            5.7,
            32.2,
            State.Review,
            2,
            0,
            0,
            moment("2023-09-06T00:00:00.000Z"),
        );

    expect(formatScheduleInterval(fsrs7("2023-09-16T01:42:52.121Z", 10.07143659), false)).toEqual(
        textInterval(10, false),
    );
    expect(formatScheduleInterval(fsrs7("2023-09-07T13:00:00.000Z", 1.54166667), false)).toEqual(
        textInterval(2, false),
    );
    expect(formatScheduleInterval(fsrs7("2023-09-06T13:00:00.000Z", 0.54166667), false)).toEqual(
        "13 hr",
    );
});
