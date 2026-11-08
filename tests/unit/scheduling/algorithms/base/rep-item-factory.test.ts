import { State } from "ts-fsrs";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleFactory } from "src/scheduling/algorithms/base/rep-item-info-factory";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";

test("creates a new rep item", () => {
    const osrItem = RepItemScheduleFactory.create(SRAlgorithmType.SM_2_OSR, {
        algorithm: SRAlgorithmType.SM_2_OSR,
        scheduleData: {
            dueDate: "2023-09-06T00:10:00.000Z",
            interval: 0,
            ease: 250,
            delayedBeforeReviewTicks: 0,
        },
    });

    expect(osrItem).toBeInstanceOf(RepItemScheduleInfoOsr);
    expect(osrItem).toBeInstanceOf(RepItemScheduleInfo);

    const fsrsItem = RepItemScheduleFactory.create(SRAlgorithmType.FSRS, {
        algorithm: SRAlgorithmType.FSRS,
        scheduleData: {
            dueDate: "2023-09-06T00:10:00.000Z",
            interval: 0,
            difficulty: 5.5,
            stability: 0.4,
            state: State.Learning,
            reps: 1,
            lapses: 0,
            learningSteps: 1,
            lastReview: "2023-09-06T00:00:00.000Z",
        },
    });

    expect(fsrsItem).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(fsrsItem).toBeInstanceOf(RepItemScheduleInfo);
});

const FSRS7_ENTRY: ISerializedScheduleEntry = {
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
};

test("FSRS-7 entries stay FSRS-7 with the FSRS setting", () => {
    const item = RepItemScheduleFactory.create(SRAlgorithmType.FSRS, FSRS7_ENTRY);

    expect(item).toBeInstanceOf(RepItemScheduleInfoFsrs7);
    expect(item.serializeSchedule()).toEqual(FSRS7_ENTRY);
});

test("FSRS-7 entries become SM-2 schedules with whole-day intervals with the SM-2 setting", () => {
    const item = RepItemScheduleFactory.create(SRAlgorithmType.SM_2_OSR, FSRS7_ENTRY);

    expect(item).toBeInstanceOf(RepItemScheduleInfoOsr);
    expect(item.interval).toEqual(10);
    expect(item.formatScheduleAsSRHtmlComment()).toEqual("!2023-09-16,10,303");
});

test("SM-2 entries become FSRS-7 schedules with the FSRS setting", () => {
    const item = RepItemScheduleFactory.create(SRAlgorithmType.FSRS, {
        algorithm: SRAlgorithmType.SM_2_OSR,
        scheduleData: {
            dueDate: "2023-09-10",
            interval: 4,
            ease: 270,
            delayedBeforeReviewTicks: 0,
        },
    });

    expect(item).toBeInstanceOf(RepItemScheduleInfoFsrs7);
    expect((item as RepItemScheduleInfoFsrs7).state).toEqual(State.Review);
    expect(item.dueDate.format("YYYY-MM-DD")).toEqual("2023-09-10");
});

test("FSRS-7 isn't an algorithm setting", () => {
    expect(() => RepItemScheduleFactory.create(SRAlgorithmType.FSRS7, FSRS7_ENTRY)).toThrow(
        /FSRS-7 isn't an algorithm setting/,
    );
});
