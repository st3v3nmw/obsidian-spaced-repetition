import { MULTI_SCHEDULING_EXTRACTOR, SM2_SCHEDULE_INFO_EXTRACTOR } from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { CommentParser } from "src/utils/comment-parser";
import { MultiLineTextFinder } from "src/utils/strings";

export class NotesDataStore implements IDataStore {
    public readonly storageType = StorageType.NOTES;
    private settings: SRSettings;
    public readonly fileModifier: IFileModifier;
    public isStructureInitialized: Promise<boolean>;

    constructor(settings: SRSettings, scheduleDeleter: IFileModifier) {
        this.settings = settings;
        this.fileModifier = scheduleDeleter;
        this.isStructureInitialized = Promise.resolve(true);
    }

    /**
     * Migrates the data store from the previous store to the new store.
     *
     * @param previousType The previousType of the data store.
     */
    async migrateDataStore(previousType: StorageType): Promise<void> {
        await this.fileModifier.migrateDataStore(previousType);
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
            return CommentParser.parseMultiScheduleComment(schedulingComment) ?? [];
        }

        // Handle legacy scheduling comments for backward compatibility, but prefer the multi-scheduling format if both are presentwd
        const sm2MultiScheduling = [...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
        if (sm2MultiScheduling.length > 0) {
            return sm2MultiScheduling
                .map((match) =>
                    CommentParser.parseSM2Schedule(
                        match[1],
                        parseInt(match[2]),
                        parseInt(match[3]),
                    ),
                )
                .filter((info): info is RepItemScheduleInfo => info !== null);
        }

        const result: RepItemScheduleInfo[] = [];
        const scheduling = [...originalQuestionText.matchAll(SM2_SCHEDULE_INFO_EXTRACTOR)];
        for (const match of scheduling) {
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            const parsedSchedule = CommentParser.parseSM2Schedule(dueDateStr, interval, ease);
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

        const newText: string = await question.updateQuestionWithinNoteText(
            fileText,
            this.settings,
        );
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
}
