import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";

export enum SRAlgorithmType {
    SM_2_OSR = "SM-2-OSR",
    FSRS = "FSRS",
}

export interface ISRAlgorithm {
    algorithmType: SRAlgorithmType;
    cardGetResetSchedule(): RepItemScheduleInfo;
    cardGetNewSchedule(
        response: ReviewResponse,
        notePath: string,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo;
    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        schedule: RepItemScheduleInfo,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo;
}
