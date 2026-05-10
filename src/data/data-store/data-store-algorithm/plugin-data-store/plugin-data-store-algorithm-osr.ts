import { IDataStoreAlgorithm } from "src/data/data-store/data-store-algorithm/base/idata-store-algorithm";
import { Question } from "src/data/data-structures/card/questions/question";

// Algorithm output when schedule metadata is stored externally.
// Returning an empty string prevents writing schedule comments into note markdown.
export class PluginDataStoreAlgorithmOsr implements IDataStoreAlgorithm {
    questionFormatScheduleAsHtmlComment(_: Question): string {
        return "";
    }
}
