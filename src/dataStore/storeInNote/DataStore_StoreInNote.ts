import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";
import { INoteStore } from "../base/NoteStore";
import { RepItemStorageInfo } from "../base/RepItemStorageInfo";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, SCHEDULING_INFO_REGEX, SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END, YAML_FRONT_MATTER_REGEX } from "src/constants";
import { Moment } from "moment";
import { DateUtil, globalDateProvider } from "src/util/DateProvider";
import { RepItemScheduleInfo_Osr } from "src/algorithms/osr/RepItemScheduleInfo_Osr";
import { formatDate_YYYY_MM_DD } from "src/util/utils";
import { Question } from "src/Question";
import { SRSettings } from "src/settings";
import { IDataStore } from "../base/DataStore";
import { Card } from "src/Card";
import { ISRFile } from "src/SRFile";
import { App, FrontMatterCache } from "obsidian";
import { LinkStat, OsrNoteGraph } from "src/algorithms/osr/OsrNoteGraph";
import { NoteEaseList } from "src/NoteEaseList";

export class DataStore_StoreInNote implements IDataStore {
    private settings: SRSettings;
    app: App;
    osrNoteGraph: OsrNoteGraph;
    easeByPath: NoteEaseList;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo> {
        let fileText: string = await note.read();
        let ease: number, interval: number, delayBeforeReview: number;
        const now: number = Date.now();
        const incomingLinks: Record<string, LinkStat[]> = this.osrNoteGraph.incomingLinks;
        const pageranks: Record<string, number> = this.osrNoteGraph.pageranks;

        const fileCachedData = this.app.metadataCache.getFileCache(noteFile) || {};

        const frontmatter: FrontMatterCache | Record<string, unknown> =
            fileCachedData.frontmatter || {};

        // new note?
        if (
            !(
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-due") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-interval") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-ease")
            )
        ) {
        } else {
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
            delayBeforeReview =
                now -
                window
                    .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                    .valueOf();
        }
    }

    async noteSetSchedule(note: ISRFile, repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        let fileText: string = await note.read();

        // check if scheduling info exists
        const repItemScheduleInfo2: RepItemScheduleInfo_Osr = repitem
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

        this.easeByPath.setEaseForPath(note.path, ease);

    }

    questionCreateSchedule(originalQuestionText: string, storageInfo: RepItemStorageInfo): RepItemScheduleInfo[] {
            let scheduling: RegExpMatchArray[] = [...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
            if (scheduling.length === 0)
                scheduling = [...originalQuestionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
    
            const result: RepItemScheduleInfo[] = [];
            for (let i = 0; i < scheduling.length; i++) {
                const match: RegExpMatchArray = scheduling[i];
                const dueDateStr = match[1];
                const interval = parseInt(match[2]);
                const ease = parseInt(match[3]);
                let dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
                if (formatDate_YYYY_MM_DD(dueDate) == RepItemScheduleInfo_Osr.dummyDueDateForNewCard) {
                    dueDate = null;
                }
                const delayBeforeReviewTicks: number = (dueDate != null) ? 
                    dueDate.valueOf() - globalDateProvider.today.valueOf() : null;
    
                const info: RepItemScheduleInfo = new RepItemScheduleInfo_Osr(
                    dueDate,
                    interval,
                    ease,
                    delayBeforeReviewTicks,
                );
                result.push(info);
            }
            return result;
    
    }

    questionFormatScheduleAsHtmlComment(question: Question): string {
        let result: string = SR_HTML_COMMENT_BEGIN;

        for (let i = 0; i < question.cards.length; i++) {
            const card: Card = question.cards[i];
            result += card.scheduleInfo.formatCardScheduleForHtmlComment();
        }
        result += SR_HTML_COMMENT_END;
        return result;
    }

    questionRemoveScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }

    async questionWriteSchedule(question: Question): Promise<void> {
        await this.questionWrite(question);
    }

    async questionWrite(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();

        const newText: string = question.updateQuestionWithinNoteText(fileText, this.settings);
        await question.note.file.write(newText);
        question.hasChanged = false;
    }
}