import { Question } from "src/card/questions/question";

export interface IDataStoreAlgorithm {
    questionFormatScheduleAsHtmlComment(question: Question): string;
}
