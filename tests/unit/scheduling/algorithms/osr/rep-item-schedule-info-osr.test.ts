import moment from "moment";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
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

describe("Serializes card schedule for JSON", () => {
    test("With due date", () => {
        const repItem: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-09-02",
            4,
            270,
            null,
        );
        expect(repItem.serializeSchedule()).toMatchObject({
            algorithm: SRAlgorithmType.SM_2_OSR,
            scheduleData: {
                dueDate: "2023-09-02",
                interval: 4,
                ease: 270,
            },
        });
    });

    test("Without due date", () => {
        const repItem: RepItemScheduleInfoOsr = new RepItemScheduleInfoOsr(null, 5, 290, null);
        expect(repItem.serializeSchedule()).toMatchObject({
            algorithm: SRAlgorithmType.SM_2_OSR,
            scheduleData: {
                dueDate: "2000-01-01",
                interval: 5,
                ease: 290,
            },
        });
    });
});

test("getDummyScheduleForNewCard", () => {
    const repItem: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.getNewSchedule(DEFAULT_SETTINGS);
    expect(repItem.interval).toEqual(1);
    expect(repItem.latestEase).toEqual(250);
    expect(repItem.dueDate.valueOf).toEqual(moment("2000-01-01").valueOf);
});
