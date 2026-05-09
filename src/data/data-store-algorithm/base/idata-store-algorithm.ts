import { Question } from "src/data/data-structures/card/questions/question";

// Determines how scheduling data is stored in a note
export interface IDataStoreAlgorithm {
    // Set question to _ and return an empty string if you don't want to write a schedule comment into the note
    questionFormatScheduleAsHtmlComment(question: Question): string;
}
