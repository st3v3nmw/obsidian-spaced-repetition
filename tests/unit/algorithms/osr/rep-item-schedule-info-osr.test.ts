import moment from "moment";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";

describe("formatCardScheduleForHtmlComment", () => {
    test("With due date", () => {
        const repItem: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-09-02",
            4,
            270,
            null,
        );
        expect(repItem.formatScheduleAsSRHtmlComment()).toEqual("!2023-09-02,4,270");
    });

    test("Without due date", () => {
        const repItem: RepItemScheduleInfoOsr = new RepItemScheduleInfoOsr(null, 5, 290, null);
        expect(repItem.formatScheduleAsSRHtmlComment()).toEqual("!2000-01-01,5,290");
    });
});

test("getDummyScheduleForNewCard", () => {
    const repItem: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.getNewSchedule(DEFAULT_SETTINGS);
    expect(repItem.interval).toEqual(1);
    expect(repItem.latestEase).toEqual(250);
    expect(repItem.dueDate.valueOf).toEqual(moment("2000-01-01").valueOf);
});
