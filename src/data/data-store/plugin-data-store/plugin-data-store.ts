import { generate } from "short-uuid";

import { SR_DATA_ID_TAG } from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { PluginData } from "src/data/plugin-data";
import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { MultiLineTextFinder } from "src/utils/strings";

export class PluginDataStore implements IDataStore {
    public readonly storageType = StorageType.PLUGIN_DATA;
    private settings: SRSettings;
    private pluginData: PluginData;
    public readonly fileModifier: IFileModifier;
    public isStructureInitialized: Promise<boolean>;

    constructor(settings: SRSettings, fileModifier: IFileModifier, pluginData: PluginData) {
        this.settings = settings;
        this.pluginData = pluginData;
        this.fileModifier = fileModifier;
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
    async createSchedule(
        originalQuestionText: string,
        _: RepItemStorageInfo,
    ): Promise<RepItemScheduleInfo[]> {
        const dataId: string | null = this.getDataId(originalQuestionText);
        if (dataId === null) {
            return [];
        }

        // TODO: Retrieve schedule via cardBlockId
        return [];
    }

    /**
     * Removes scheduling information from a question text.
     *
     * @param questionText
     * @returns
     */
    removeScheduleInfo(questionText: string): string {
        const dataId: string | null = this.getDataId(questionText);
        if (dataId === null) {
            return questionText;
        }

        questionText = questionText.replace(SR_DATA_ID_TAG + dataId, "");

        // TODO: Remove schedule in folder via cardBlockId
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
        if (dataId === null) {
            dataId = generate();
            question.questionText.original = question.questionText.original.endsWith("\n")
                ? question.questionText.original + SR_DATA_ID_TAG + dataId
                : question.questionText.original + "\n" + SR_DATA_ID_TAG + dataId;
        }

        // TODO: Update schedule via cardBlockId

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
        // TODO: Get cardBlockId if present & delete schedule
        const fileText: string = await question.note.file.read();
        const originalText: string = question.questionText.original;
        const newText = MultiLineTextFinder.findAndReplace(fileText, originalText, "");

        // Only write if note hasn't changed
        if (newText) {
            await question.note.file.write(newText);
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
