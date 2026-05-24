import moment from "moment";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    difficultyToEase,
    sm2ScheduleToFsrsCard,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { ISerializedFSRSScheduleData } from "src/scheduling/algorithms/fsrs/serialized-schedule-data";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { ISerializedSM2ScheduleData } from "src/scheduling/algorithms/osr/serialized-schedule-data";
import { globalDateProvider } from "src/utils/dates";

export class RepItemScheduleFactory {
    static create(
        algorithm: SRAlgorithmType,
        serializedSchedule: ISerializedScheduleEntry,
    ): RepItemScheduleInfo {
        switch (algorithm) {
            case SRAlgorithmType.FSRS:
                return this.createFSRSRepItemSchedule(serializedSchedule);
            case SRAlgorithmType.SM_2_OSR:
                return this.createSM2RepItemSchedule(serializedSchedule);
        }
    }

    static createFSRSRepItemSchedule(
        serializedScheduleEntry: ISerializedScheduleEntry,
    ): RepItemScheduleInfoFsrs {
        if (serializedScheduleEntry.algorithm !== SRAlgorithmType.FSRS) {
            // Convert sm2 schedule to fsrs card and then create a new RepItemScheduleInfoFsrs from it
            const serializedSchedule =
                serializedScheduleEntry.scheduleData as ISerializedSM2ScheduleData;

            const repItemScheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr(
                serializedSchedule.dueDate,
                serializedSchedule.interval,
                serializedSchedule.ease,
                serializedSchedule.delayedBeforeReviewTicks,
            );

            const card = sm2ScheduleToFsrsCard(repItemScheduleInfo, globalDateProvider.now);
            return RepItemScheduleInfoFsrs.fromFsrsCard(card);
        } else {
            // Convert fsrs schedule to RepItemScheduleInfoFsrs
            const serializedSchedule =
                serializedScheduleEntry.scheduleData as ISerializedFSRSScheduleData;

            const repItemScheduleInfo = new RepItemScheduleInfoFsrs(
                moment(serializedSchedule.dueDate),
                serializedSchedule.interval,
                serializedSchedule.difficulty,
                serializedSchedule.stability,
                serializedSchedule.state,
                serializedSchedule.reps,
                serializedSchedule.lapses,
                serializedSchedule.learningSteps,
                moment(serializedSchedule.lastReview),
            );
            return repItemScheduleInfo;
        }
    }

    static createSM2RepItemSchedule(
        serializedScheduleEntry: ISerializedScheduleEntry,
    ): RepItemScheduleInfoOsr {
        if (serializedScheduleEntry.algorithm !== SRAlgorithmType.SM_2_OSR) {
            // Convert fsrs schedule to RepItemScheduleInfoOsr
            const serializedSchedule =
                serializedScheduleEntry.scheduleData as ISerializedFSRSScheduleData;

            const repItemScheduleInfo = new RepItemScheduleInfoOsr(
                moment(serializedSchedule.dueDate),
                serializedSchedule.interval,
                difficultyToEase(serializedSchedule.difficulty),
                0,
            );
            return repItemScheduleInfo;
        } else {
            const serializedSchedule =
                serializedScheduleEntry.scheduleData as ISerializedSM2ScheduleData;

            const repItemScheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr(
                serializedSchedule.dueDate,
                serializedSchedule.interval,
                serializedSchedule.ease,
                serializedSchedule.delayedBeforeReviewTicks,
            );
            return repItemScheduleInfo;
        }
    }
}
