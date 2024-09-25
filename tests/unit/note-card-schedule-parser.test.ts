import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { TICKS_PER_DAY } from "src/constants";
import { DataStore } from "src/data-stores/base/data-store";
import { DEFAULT_SETTINGS } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("No schedule info for question", () => {
    expect(DataStore.getInstance().questionCreateSchedule("A::B", null)).toEqual([]);
});

test("Single schedule info for question (on separate line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().questionCreateSchedule(
        `What symbol represents an electric field:: $\\large \\vec E$
<!--SR:!2023-09-02,4,270-->`,
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Single schedule info for question (on same line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().questionCreateSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2023-09-02,4,270-->",
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Multiple schedule info for question (on separate line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().questionCreateSchedule(
        `This is a really very ==interesting== and ==fascinating== and ==great== test
    <!--SR:!2023-09-03,1,230!2023-09-05,3,250!2023-09-06,4,270-->`,
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230, -3 * TICKS_PER_DAY),
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-05", 3, 250, -1 * TICKS_PER_DAY),
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 4, 270, 0),
    ]);
});
