import { IDataStoreAlgorithm } from "src/data/data-store/base/idata-store-algorithm";
import { Question } from "src/data/data-structures/card/questions/question";

/**
 * Algorithm output for the external "SR markdown file" data store.
 *
 * Schedule metadata lives in the external schedule-data file, so we return an empty string to
 * prevent any `<!--SR:...-->` comment from being written into the note markdown. The card's
 * block id (e.g. "^sr-id-...") is still written to the note by {@link Question.formatForNote}.
 */
export class SrMdDataStoreAlgorithmOsr implements IDataStoreAlgorithm {
    questionFormatScheduleAsHtmlComment(_: Question): string {
        return "";
    }
}
