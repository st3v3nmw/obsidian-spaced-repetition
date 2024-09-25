import moment from "moment";

import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { DEFAULT_SETTINGS } from "src/settings";

describe("formatCardScheduleForHtmlComment", () => {
    test("With due date", () => {
        const repItem: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-09-02",
            4,
            270,
            null,
        );
        expect(repItem.formatCardScheduleForHtmlComment()).toEqual("!2023-09-02,4,270");
    });

    test("Without due date", () => {
        const repItem: RepItemScheduleInfoOsr = new RepItemScheduleInfoOsr(null, 5, 290, null);
        expect(repItem.formatCardScheduleForHtmlComment()).toEqual("!2000-01-01,5,290");
    });
});

test("getDummyScheduleForNewCard", () => {
    const repItem: RepItemScheduleInfoOsr =
        RepItemScheduleInfoOsr.getDummyScheduleForNewCard(DEFAULT_SETTINGS);
    expect(repItem.interval).toEqual(1);
    expect(repItem.latestEase).toEqual(250);
    expect(repItem.dueDate.valueOf).toEqual(moment("2000-01-01").valueOf);
});
