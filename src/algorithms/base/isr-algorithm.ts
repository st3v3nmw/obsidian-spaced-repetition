import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { DueDateHistogram } from "src/due-date-histogram";
import { Note } from "src/note/note";
import { INoteEaseList } from "src/note/note-ease-list";

export enum SRAlgorithmType {
    SM_2_OSR = "SM-2-OSR",
    FSRS = "FSRS",
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
}
