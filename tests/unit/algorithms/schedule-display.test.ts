import moment from "moment";
import { State } from "ts-fsrs";

import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { formatScheduleInterval } from "src/algorithms/schedule-display";
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
