import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { Question } from "src/question";
import { ISRFile } from "src/sr-file";

export interface IDataStoreAlgorithm {
    noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo>;
    noteSetSchedule(note: ISRFile, scheduleInfo: RepItemScheduleInfo): Promise<void>;
    questionFormatScheduleAsHtmlComment(question: Question): string;
}
