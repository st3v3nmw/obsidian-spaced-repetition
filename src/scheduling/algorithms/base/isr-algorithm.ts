import { Note } from "src/note/note";
import { INoteEaseList } from "src/note/note-ease-list";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";

/**
 * The algorithm setting is either SM_2_OSR or FSRS. FSRS7 only identifies schedules: with the FSRS setting, new and
 * reset cards are scheduled with FSRS-7, while cards that are already on FSRS-6 (FSRS) stay on FSRS-6.
 */
export enum SRAlgorithmType {
    SM_2_OSR = "SM-2-OSR",
    FSRS = "FSRS",
    FSRS7 = "FSRS-7",
}

export interface ISRAlgorithm {
    algorithmType: SRAlgorithmType;
    noteOnLoadedNote(path: string, note: Note | null, noteEase: number | null): void;
    noteCalcNewSchedule(
        notePath: string,
        osrNoteGraph: OsrNoteGraph,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo;
    noteCalcUpdatedSchedule(
        notePath: string,
        noteSchedule: RepItemScheduleInfo,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo;
    noteStats(): INoteEaseList;

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
    /**
     * The probability that the card is recalled now, as predicted by the algorithm, or null if the algorithm
     * doesn't predict it for this schedule.
     */
    cardRecallProbability(schedule: RepItemScheduleInfo): number | null;
}
