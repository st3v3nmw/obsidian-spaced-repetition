import { Moment } from "moment";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { FSRS_COMMENT_PREFIX, parseFsrsTimestamp } from "src/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-stores/base/data-store";
import { RepItemStorageInfo } from "src/data/data-stores/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { PluginData } from "src/data/plugin-data";
import { SRSettings } from "src/data/settings";
import { DateUtil, formatDateYYYYMMDD, globalDateProvider } from "src/utils/dates";
import { MultiLineTextFinder } from "src/utils/strings";

export class PluginDataStore implements IDataStore {
    public readonly storageType = StorageType.PLUGIN_DATA;
    private settings: SRSettings;
    private pluginData: PluginData;

    constructor(settings: SRSettings, pluginData: PluginData) {
        this.settings = settings;
        this.pluginData = pluginData;
    }

    /**
     * Creates scheduling information from a question text and its storage info.
     *
     * @param originalQuestionText
     * @param _
     * @returns
     */
    createSchedule(originalQuestionText: string, _: RepItemStorageInfo): RepItemScheduleInfo[] {
        const schedulingComment = originalQuestionText.match(/<!--SR:(.+?)-->/m)?.[1];
        if (schedulingComment) {
            return this.parseMultiScheduleComment(schedulingComment) ?? [];
        }

        // Handle legacy scheduling comments for backward compatibility, but prefer the multi-scheduling format if both are presentwd
        const legacyMultiScheduling = [
            ...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
        ];
        if (legacyMultiScheduling.length > 0) {
            return legacyMultiScheduling.map((match) =>
                this.parseLegacySchedule(match[1], parseInt(match[2]), parseInt(match[3])),
            ).filter((info): info is RepItemScheduleInfo => info !== null);
        }

        const result: RepItemScheduleInfo[] = [];
        const scheduling = [...originalQuestionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        for (const match of scheduling) {
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            const parsedSchedule = this.parseLegacySchedule(dueDateStr, interval, ease);
            if (parsedSchedule) {
                result.push(parsedSchedule);
            }
        }
        return result;
    }

    /**
     * Removes scheduling information from a question text.
     *
     * @param questionText
     * @returns
     */
    removeScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }

    /**
     * Writes scheduling information to the data store.
     *
     * @param question
     * @returns
     */
    async writeSchedule(question: Question): Promise<void> {
        await this.write(question);
    }

    /**
     * Writes a question to the data store.
     *
     * @param question
     * @returns
     */
    async write(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();

        const newText: string = question.updateQuestionWithinNoteText(fileText, this.settings);
        await question.note.file.write(newText);
        question.hasChanged = false;
    }

    /**
     * Deletes a question from the data store.
     *
     * @param question
     * @returns
     */
    async delete(question: Question): Promise<void> {
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
            .filter((segment) => segment.length > 0)
            .map((segment) => this.parseScheduleSegment(segment))
            .filter((info): info is RepItemScheduleInfo => info !== null);

        return segments;
    }

    private parseScheduleSegment(segment: string): RepItemScheduleInfo | null {
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

            const parsedDueDate: Moment | null = parseFsrsTimestamp(dueDateStr);

            if (!parsedDueDate) {
                return null;
            }

            return new RepItemScheduleInfoFsrs(
                parsedDueDate,
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
    ): RepItemScheduleInfo | null {
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

    ensurePluginDataStructure(): void {
        const scheduleData = this.pluginData.scheduleData;

        if (!scheduleData) { // Can be undefined if user is on older version of plugin and hasn't updated in a while
            this.pluginData.scheduleData = {
                version: 1,
                noteSchedules: {},
                cardSchedules: {},
            };
        }
    }
}
