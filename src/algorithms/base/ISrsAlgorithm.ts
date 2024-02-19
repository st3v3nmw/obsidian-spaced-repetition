import { ISRFile } from "src/SRFile";
import { RepItemScheduleInfo } from "./RepItemScheduleInfo";
import { ReviewResponse } from "./RepetitionItem";

export interface ISrsAlgorithm {
    noteGetScheduleFromFrontmatter()
    noteCalcNewSchedule(notePath: string): RepItemScheduleInfo;
    noteCalcUpdatedSchedule(noteSchedule: RepItemScheduleInfo, response: ReviewResponse): RepItemScheduleInfo;

    cardGetResetSchedule(): RepItemScheduleInfo;
    cardGetNewSchedule(response: ReviewResponse, notePath: string): RepItemScheduleInfo;
    cardCalcUpdatedSchedule(response: ReviewResponse, schedule: RepItemScheduleInfo): RepItemScheduleInfo;
    
}
