import { Question } from "src/card/questions/question";
import { IDataStoreAlgorithm } from "src/data-store-algorithm/idata-store-algorithm";

// Algorithm output when schedule metadata is stored externally.
// Returning an empty string prevents writing schedule comments into note markdown.
export class DataStoreInPluginDataAlgorithmOsr implements IDataStoreAlgorithm {
    questionFormatScheduleAsHtmlComment(_: Question): string {
        return "";
    }
}
