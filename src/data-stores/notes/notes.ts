import { Moment } from "moment";
import { App } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { FSRS_COMMENT_PREFIX, parseFsrsTimestamp } from "src/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Question } from "src/card/questions/question";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "src/constants";
import { IDataStore } from "src/data-stores/base/data-store";
import { RepItemStorageInfo } from "src/data-stores/base/rep-item-storage-info";
import { SRSettings } from "src/settings";
import { DateUtil, formatDateYYYYMMDD, globalDateProvider } from "src/utils/dates";
import { MultiLineTextFinder } from "src/utils/strings";

export class StoreInNotes implements IDataStore {
    private settings: SRSettings;
    app: App;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    questionCreateSchedule(
        originalQuestionText: string,
        _: RepItemStorageInfo,
    ): RepItemScheduleInfo[] {
        const schedulingComment = originalQuestionText.match(/<!--SR:(.+?)-->/m)?.[1];
        if (schedulingComment) {
            return this.parseMultiScheduleComment(schedulingComment);
        }

        const legacyMultiScheduling = [
            ...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
        ];
        if (legacyMultiScheduling.length > 0) {
            return legacyMultiScheduling.map((match) =>
                this.parseLegacySchedule(match[1], parseInt(match[2]), parseInt(match[3])),
            );
        }

        const result: RepItemScheduleInfo[] = [];
        const scheduling = [...originalQuestionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        for (const match of scheduling) {
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            result.push(this.parseLegacySchedule(dueDateStr, interval, ease));
        }
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

    async questionDelete(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();
        const originalText: string = question.questionText.original;
        const newText = MultiLineTextFinder.findAndReplace(fileText, originalText, "");

        // Only write if note hasn't changed
        if (newText) {
            await question.note.file.write(newText);
        }
    }

    private parseMultiScheduleComment(comment: string): RepItemScheduleInfo[] {
        const segments = comment
            .split("!")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);

        return segments.map((segment) => this.parseScheduleSegment(segment));
    }

    private parseScheduleSegment(segment: string): RepItemScheduleInfo {
        if (segment.startsWith(FSRS_COMMENT_PREFIX + ",")) {
            const fields = segment.split(",");
            const [
                _algorithm,
                dueDateStr,
                intervalStr,
                stabilityStr,
                difficultyStr,
                stateStr,
                repsStr,
                lapsesStr,
                learningStepsStr,
                lastReviewStr,
            ] = fields;

            return new RepItemScheduleInfoFsrs(
                parseFsrsTimestamp(dueDateStr),
                parseFloat(intervalStr),
                parseFloat(difficultyStr),
                parseFloat(stabilityStr),
                parseInt(stateStr),
                parseInt(repsStr),
                parseInt(lapsesStr),
                parseInt(learningStepsStr),
                parseFsrsTimestamp(lastReviewStr),
            );
        }

        const [dueDateStr, intervalStr, easeStr] = segment.split(",");
        return this.parseLegacySchedule(dueDateStr, parseInt(intervalStr), parseInt(easeStr));
    }

    private parseLegacySchedule(
        dueDateStr: string,
        interval: number,
        ease: number,
    ): RepItemScheduleInfo {
        const dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
        if (
            dueDate === null ||
            formatDateYYYYMMDD(dueDate) === RepItemScheduleInfoOsr.dummyDueDateForNewCard
        ) {
            return null;
        }

        const delayBeforeReviewTicks: number =
            dueDate.valueOf() - globalDateProvider.today.valueOf();
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReviewTicks);
    }
}
