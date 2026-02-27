import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card/card";
import { Question } from "src/card/questions/question";
import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "src/constants";
import { IDataStoreAlgorithm } from "src/data-store-algorithm/idata-store-algorithm";
import { SRSettings } from "src/settings";
import { formatDateYYYYMMDD } from "src/utils/dates";

// Algorithm: The original OSR algorithm
//      (RZ: Perhaps not the original algorithm, but the only one available in 2023/early 2024)
//
// Data Store: With data stored in the note's markdown file
export class DataStoreInNoteAlgorithmOsr implements IDataStoreAlgorithm {
    private settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    questionFormatScheduleAsHtmlComment(question: Question): string {
        let result: string = SR_HTML_COMMENT_BEGIN;

        for (let i = 0; i < question.cards.length; i++) {
            const card: Card = question.cards[i];
            result += this.formatCardSchedule(card);
        }
        result += SR_HTML_COMMENT_END;
        return result;
    }

    formatCardSchedule(card: Card) {
        let result: string;
        if (card.hasSchedule) {
            const schedule = card.scheduleInfo as RepItemScheduleInfoOsr;
            const dateStr = schedule.dueDate
                ? formatDateYYYYMMDD(schedule.dueDate)
                : RepItemScheduleInfoOsr.dummyDueDateForNewCard;
            result = `!${dateStr},${schedule.interval},${schedule.latestEase}`;
        } else {
            result = `!${RepItemScheduleInfoOsr.dummyDueDateForNewCard},${RepItemScheduleInfoOsr.initialInterval},${this.settings.baseEase}`;
        }
        return result;
    }
}
