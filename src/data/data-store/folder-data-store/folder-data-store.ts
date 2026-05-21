import { generate } from "short-uuid";

import { SR_DATA_ID_TAG } from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-store/base/data-store";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { IFolderDataFileModifier } from "src/data/data-store/folder-data-store/folder-data-file-modifier";
import { Question } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { MultiLineTextFinder } from "src/utils/strings";

/**
 * Manages the scheduling data for cards and notes stored in a folder.
 *
 * @class FolderDataStore
 * @extends {IDataStore}
 */
export class FolderDataStore implements IDataStore {
    public readonly storageType = StorageType.FOLDER;
    private settings: SRSettings;
    public readonly fileModifier: IFolderDataFileModifier; // All file modifications go through this fileModifier, which allows for easier unit testing
    public isStructureInitialized: Promise<boolean>; // Promise that resolves when the data store is initialized

    constructor(settings: SRSettings, fileModifier: IFolderDataFileModifier) {
        this.settings = settings;
        this.fileModifier = fileModifier;
        this.isStructureInitialized = this.fileModifier.ensureFolderStructure();
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
    async createSchedule(
        originalQuestionText: string,
        _: RepItemStorageInfo,
    ): Promise<RepItemScheduleInfo[]> {
        const dataId: string | null = this.getDataId(originalQuestionText);
        if (dataId === null) {
            return [];
        }

        // Retrieve schedule via dataId
        const cardSchedule = await this.fileModifier.readCardSchedule(dataId);
        return cardSchedule === null ? [] : cardSchedule;
    }

    /**
     * Removes scheduling information from a question text.
     *
     * @param questionText
     * @returns
     */
    async removeScheduleInfo(questionText: string): Promise<string> {
        const dataId: string | null = this.getDataId(questionText);
        if (dataId === null) {
            return questionText;
        }

        questionText = questionText.replace(SR_DATA_ID_TAG + dataId, "");
        await this.fileModifier.deleteCardSchedule(dataId);
        return questionText;
    }

    /**
     * Writes scheduling information to the data store.
     *
     * @param question
     * @returns
     */
    async writeSchedule(question: Question): Promise<void> {
        // Create dataId if not present
        let dataId: string | null = this.getDataId(question.questionText.original);

        console.log("writeSchedule", dataId, question.questionText.original);

        if (dataId === null) {
            dataId = generate();
            question.questionText.original = question.questionText.original.endsWith("\n")
                ? question.questionText.original + SR_DATA_ID_TAG + dataId
                : question.questionText.original + "\n" + SR_DATA_ID_TAG + dataId;


            await this.write(question);
        }

        await this.fileModifier.updateCardSchedule(
            dataId,
            question.cards.map((card) => card.scheduleInfo).filter((s) => s !== null),
        );
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
        // TODO: Get cardBlockId if present & delete schedule
        const fileText: string = await question.note.file.read();
        const originalText: string = question.questionText.original;
        const newText = MultiLineTextFinder.findAndReplace(fileText, originalText, "");

        // Only write if note hasn't changed
        if (newText) {
            await question.note.file.write(newText);

            const dataId: string | null = this.getDataId(question.questionText.original);
            if (dataId === null) {
                return;
            }

            await this.fileModifier.deleteCardSchedule(dataId);
        }
    }

    getDataId(questionText: string): string | null {
        // Parse for dataId
        if (questionText.indexOf(SR_DATA_ID_TAG) === -1) {
            return null;
        } else {
            return questionText.split(SR_DATA_ID_TAG)[1].trim();
        }
    }
}
