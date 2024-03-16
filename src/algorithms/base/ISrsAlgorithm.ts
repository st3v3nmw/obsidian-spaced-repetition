import { ISRFile } from "src/SRFile";
import { RepItemScheduleInfo } from "./RepItemScheduleInfo";
import { ReviewResponse } from "./RepetitionItem";
import { Note } from "src/Note";
import { OsrNoteGraph } from "../osr/OsrNoteGraph";

export interface ISrsAlgorithm {
    noteOnLoadedNote(note: Note): void;
    noteCalcNewSchedule(notePath: string, osrNoteGraph: OsrNoteGraph, response: ReviewResponse): RepItemScheduleInfo;
    noteCalcUpdatedSchedule(notePath: string, noteSchedule: RepItemScheduleInfo, response: ReviewResponse): RepItemScheduleInfo;

    cardGetResetSchedule(): RepItemScheduleInfo;
    cardGetNewSchedule(response: ReviewResponse, notePath: string): RepItemScheduleInfo;
    cardCalcUpdatedSchedule(response: ReviewResponse, schedule: RepItemScheduleInfo): RepItemScheduleInfo;
    
}
