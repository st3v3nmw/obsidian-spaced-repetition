import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "src/data/constants";
import { IDataStoreAlgorithm } from "src/data/data-store-algorithm/base/idata-store-algorithm";
import { Card } from "src/data/data-structures/card/card";
import { Question } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";

// Algorithm: The original OSR algorithm
//      (RZ: Perhaps not the original algorithm, but the only one available in 2023/early 2024)
//
// Data Store: With data stored in the note's markdown file
export class NoteDataStoreAlgorithmOsr implements IDataStoreAlgorithm {
    private settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    questionFormatScheduleAsHtmlComment(question: Question): string {
        let accumulatedSchedules: string = "";

        // A question can have multiple cards, when it has multiple clozes in a single line.
        // For each card, we format its schedule information and append it to the result string.
        for (let i = 0; i < question.cards.length; i++) {
            const card: Card = question.cards[i];
            accumulatedSchedules += this.formatCardSchedule(card);
        }

        return SR_HTML_COMMENT_BEGIN + accumulatedSchedules + SR_HTML_COMMENT_END;
    }

    /**
     * Formats a card's scheduling information as a comment.
     *
     * It will return either the existing scheduling information or a default value if the card has no scheduling information.
     *
     * @param {Card} card - The card.
     * @returns {string} - The formatted card schedule.
     */
    formatCardSchedule(card: Card) {
        if (card.hasSchedule && card.scheduleInfo) {
            return card.scheduleInfo.formatScheduleAsSRHtmlComment();
        }

        // TODO: Provide a default schedule for the FSRS algorithm
        return `!${RepItemScheduleInfoOsr.dummyDueDateForNewCard},${RepItemScheduleInfoOsr.initialInterval},${this.settings.baseEase}`;
    }
}
