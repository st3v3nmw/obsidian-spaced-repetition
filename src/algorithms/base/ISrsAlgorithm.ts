import { ISRFile } from "src/SRFile";
import { RepItemScheduleInfo } from "./RepItemScheduleInfo";
import { ReviewResponse } from "./RepetitionItem";
import { Note } from "src/Note";
import { OsrNoteGraph } from "../osr/OsrNoteGraph";
import { DueDateHistogram } from "src/DueDateHistogram";

export interface ISrsAlgorithm {
    noteOnLoadedNote(path: string, note: Note, noteEase: number): void;
    noteCalcNewSchedule(notePath: string, osrNoteGraph: OsrNoteGraph, response: ReviewResponse, dueDateNoteHistogram: DueDateHistogram): RepItemScheduleInfo;
    noteCalcUpdatedSchedule(notePath: string, noteSchedule: RepItemScheduleInfo, response: ReviewResponse, dueDateNoteHistogram: DueDateHistogram): RepItemScheduleInfo;

    cardGetResetSchedule(): RepItemScheduleInfo;
    cardGetNewSchedule(response: ReviewResponse, notePath: string, dueDateFlashcardHistogram: DueDateHistogram): RepItemScheduleInfo;
    cardCalcUpdatedSchedule(response: ReviewResponse, schedule: RepItemScheduleInfo, dueDateFlashcardHistogram: DueDateHistogram): RepItemScheduleInfo;
    
}
