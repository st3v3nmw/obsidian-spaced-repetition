import { ISRFile } from "src/SRFile";
import { RepItemScheduleInfo } from "./RepItemScheduleInfo";
import { ReviewResponse } from "./RepetitionItem";
import { Note } from "src/Note";

export interface ISrsAlgorithm {
    noteOnLoadedNote(note: Note): void;
    noteCalcNewSchedule(notePath: string, response: ReviewResponse): RepItemScheduleInfo;
    noteCalcUpdatedSchedule(notePath: string, noteSchedule: RepItemScheduleInfo, response: ReviewResponse): RepItemScheduleInfo;

    cardGetResetSchedule(): RepItemScheduleInfo;
    cardGetNewSchedule(response: ReviewResponse, notePath: string): RepItemScheduleInfo;
    cardCalcUpdatedSchedule(response: ReviewResponse, schedule: RepItemScheduleInfo): RepItemScheduleInfo;
    
}
