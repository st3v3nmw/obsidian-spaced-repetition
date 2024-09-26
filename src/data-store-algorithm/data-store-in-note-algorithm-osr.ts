import { Moment } from "moment";
import moment from "moment";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card";
import {
    ALLOWED_DATE_FORMATS,
    SCHEDULING_INFO_REGEX,
    SR_HTML_COMMENT_BEGIN,
    SR_HTML_COMMENT_END,
    YAML_FRONT_MATTER_REGEX,
} from "src/constants";
import { IDataStoreAlgorithm } from "src/data-store-algorithm/idata-store-algorithm";
import { ISRFile } from "src/file";
import { Question } from "src/question";
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

    async noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo> {
        let result: RepItemScheduleInfo = null;
        const frontmatter: Map<string, string> = await note.getFrontmatter();

        if (
            frontmatter &&
            frontmatter.has("sr-due") &&
            frontmatter.has("sr-interval") &&
            frontmatter.has("sr-ease")
        ) {
            const dueDate: Moment = moment(frontmatter.get("sr-due"), ALLOWED_DATE_FORMATS);
            const interval: number = parseFloat(frontmatter.get("sr-interval"));
            const ease: number = parseFloat(frontmatter.get("sr-ease"));
            result = new RepItemScheduleInfoOsr(dueDate, interval, ease);
        }
        return result;
    }

    async noteSetSchedule(note: ISRFile, repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        let fileText: string = await note.read();

        const schedInfo: RepItemScheduleInfoOsr = repItemScheduleInfo as RepItemScheduleInfoOsr;
        const dueString: string = formatDateYYYYMMDD(schedInfo.dueDate);
        const interval: number = schedInfo.interval;
        const ease: number = schedInfo.latestEase;

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            const schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n` +
                    `${schedulingInfo[5]}---`,
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            const existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n---`,
            );
        } else {
            fileText =
                `---\nsr-due: ${dueString}\nsr-interval: ${interval}\n` +
                `sr-ease: ${ease}\n---\n\n${fileText}`;
        }

        await note.write(fileText);
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
