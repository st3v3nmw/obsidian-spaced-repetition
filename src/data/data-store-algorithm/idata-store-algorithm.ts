import { Question } from "src/data/data-structures/card/questions/question";

export interface IDataStoreAlgorithm {
    questionFormatScheduleAsHtmlComment(question: Question): string;
}
