import { Moment } from "moment";
import { App, TFile, TFolder } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { FSRS_COMMENT_PREFIX, parseFsrsTimestamp } from "src/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-stores/base/data-store";
import { RepItemStorageInfo } from "src/data/data-stores/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { DateUtil, formatDateYYYYMMDD, globalDateProvider } from "src/utils/dates";
import { MultiLineTextFinder } from "src/utils/strings";

export class FolderDataStore implements IDataStore {
    public static readonly SCHEDULE_DATA_FOLDER = "Schedule Data";
    public static readonly CARD_FILE_NAME = "card-schedule-data.sr.md";
    public static readonly NOTE_FILE_NAME = "note-schedule-data.sr.md";
    public readonly storageType = StorageType.FOLDER;
    private settings: SRSettings;
    private app: App;

    constructor(settings: SRSettings, app: App) {
        this.settings = settings;
        this.app = app;
        this.ensureFolderStructure();
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
            return legacyMultiScheduling
                .map((match) =>
                    this.parseLegacySchedule(match[1], parseInt(match[2]), parseInt(match[3])),
                )
                .filter((info): info is RepItemScheduleInfo => info !== null);
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

    async ensureFolderStructure(): Promise<void> {
        const srFolder = await this.ensureFolder(this.settings.scheduleDataVaultLocation);
        const scheduleFolder = await this.ensureFolder(
            srFolder.path + "/" + FolderDataStore.SCHEDULE_DATA_FOLDER,
        );
        await this.ensureFile(scheduleFolder.path + "/" + FolderDataStore.CARD_FILE_NAME);
        await this.ensureFile(scheduleFolder.path + "/" + FolderDataStore.NOTE_FILE_NAME);
    }

    async ensureFolder(path: string): Promise<TFolder> {
        let folder: TFolder | null = this.app.vault.getFolderByPath(path);

        if (folder === null) {
            folder = await this.app.vault.createFolder(path);
        }

        return folder;
    }

    async ensureFile(path: string): Promise<TFile> {
        let file: TFile | null = this.app.vault.getFileByPath(path);

        if (file === null) {
            file = await this.app.vault.create(path, "");
        }

        return file;
    }
}
