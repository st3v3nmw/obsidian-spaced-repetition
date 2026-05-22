import { State } from "ts-fsrs";

import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleFactory } from "src/scheduling/algorithms/base/rep-item-info-factory";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
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
