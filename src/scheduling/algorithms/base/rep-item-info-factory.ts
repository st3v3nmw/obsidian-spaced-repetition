import moment from "moment";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { difficultyToEase, parseFsrsTimestamp } from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import {
    ISerializedFSRS7ScheduleData,
    ISerializedFSRSScheduleData,
} from "src/scheduling/algorithms/fsrs/serialized-schedule-data";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { ISerializedSM2ScheduleData } from "src/scheduling/algorithms/osr/serialized-schedule-data";

export class RepItemScheduleFactory {
    /**
     * Creates the schedule of a serialized entry for the given algorithm setting.
     *
     * With the FSRS setting, FSRS-6 and FSRS-7 schedules keep their model and SM-2 schedules become FSRS-6 schedules.
     * With the SM-2 setting, FSRS-6 and FSRS-7 schedules become SM-2 schedules.
     */
    static create(
        algorithm: SRAlgorithmType,
        serializedSchedule: ISerializedScheduleEntry,
    ): RepItemScheduleInfo {
        switch (algorithm) {
            case SRAlgorithmType.FSRS:
                return this.createFSRSRepItemSchedule(serializedSchedule);
            case SRAlgorithmType.SM_2_OSR:
                return this.createSM2RepItemSchedule(serializedSchedule);
            case SRAlgorithmType.FSRS7:
                throw new Error(
                    "FSRS-7 isn't an algorithm setting, FSRS-7 schedules belong to FSRS",
                );
        }
    }

    static createFSRSRepItemSchedule(
        serializedScheduleEntry: ISerializedScheduleEntry,
    ): RepItemScheduleInfoFsrs | RepItemScheduleInfoFsrs7 {
        switch (serializedScheduleEntry.algorithm) {
            case SRAlgorithmType.FSRS7: {
                const data = serializedScheduleEntry.scheduleData as ISerializedFSRS7ScheduleData;
                return new RepItemScheduleInfoFsrs7(
                    moment(data.dueDate),
                    data.interval,
                    data.difficulty,
                    data.stability,
                    data.stabilityFast,
                    data.state,
                    data.reps,
                    data.lapses,
                    data.learningSteps,
                    parseFsrsTimestamp(data.lastReview),
                );
            }
            case SRAlgorithmType.FSRS: {
                const data = serializedScheduleEntry.scheduleData as ISerializedFSRSScheduleData;
                return new RepItemScheduleInfoFsrs(
                    moment(data.dueDate),
                    data.interval,
                    data.difficulty,
                    data.stability,
                    data.state,
                    data.reps,
                    data.lapses,
                    data.learningSteps,
                    parseFsrsTimestamp(data.lastReview),
                );
            }
            case SRAlgorithmType.SM_2_OSR:
                // SM-2 schedules move to FSRS-6
                return RepItemScheduleInfoFsrs.fromSm2Schedule(
                    this.createSM2RepItemSchedule(serializedScheduleEntry),
                );
        }
    }

    static createSM2RepItemSchedule(
        serializedScheduleEntry: ISerializedScheduleEntry,
    ): RepItemScheduleInfoOsr {
        switch (serializedScheduleEntry.algorithm) {
            case SRAlgorithmType.FSRS:
            case SRAlgorithmType.FSRS7: {
                const data = serializedScheduleEntry.scheduleData as ISerializedFSRSScheduleData;
                return new RepItemScheduleInfoOsr(
                    moment(data.dueDate),
                    // SM-2 intervals are whole days, FSRS-7 intervals are fractional
                    Math.round(data.interval),
                    difficultyToEase(data.difficulty),
                    0,
                );
            }
            case SRAlgorithmType.SM_2_OSR: {
                const data = serializedScheduleEntry.scheduleData as ISerializedSM2ScheduleData;
                return RepItemScheduleInfoOsr.fromDueDateStr(
                    data.dueDate,
                    data.interval,
                    data.ease,
                    data.delayedBeforeReviewTicks,
                );
            }
        }
    }
}
