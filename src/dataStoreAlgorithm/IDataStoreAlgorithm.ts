import { Question } from "src/Question";
import { ISRFile } from "src/SRFile";
import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";

export interface IDataStoreAlgorithm {
    noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo>;
    noteSetSchedule(note: ISRFile, scheduleInfo: RepItemScheduleInfo): Promise<void>;
    questionFormatScheduleAsHtmlComment(question: Question): string;
}