import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";

/**
 * All available data stores types.
 * NOTE: The type determines where data is stored and retrieved from
 */
export enum StorageType {
    NOTES = "NOTES",
    // FOLDER = "FOLDER",
    // PLUGIN_DATA = "PLUGIN_DATA",
}

/**
 * This is the interface that all data stores must implement.
 */
export interface IDataStore {
    readonly storageType: StorageType;
    readonly fileModifier: IFileModifier;
    isStructureInitialized: Promise<boolean>;

    /**
     * Migrates the data store from the previous store to the new store.
     *
     * @param previousType The previousType of the data store.
     */
    migrateDataStore(previousType: StorageType): Promise<void>;

    /**
     * Creates scheduling information from a question text and its storage info.
     *
     * @param originalQuestionText
     * @param _
     * @returns
     */
    createSchedule(
        originalQuestionText: string,
        storageInfo: RepItemStorageInfo,
    ): RepItemScheduleInfo[];

    /**
     * Removes scheduling information from a question text.
     *
     * @param questionText
     * @returns
     */
    removeScheduleInfo(questionText: string): string;

    /**
     * Writes a question to the data store.
     *
     * @param question
     * @returns
     */
    write(question: Question): Promise<void>;

    /**
     * Writes scheduling information to the data store.
     *
     * @param question
     * @returns
     */
    writeSchedule(question: Question): Promise<void>;

    /**
     * Deletes a question from the data store.
     *
     * @param question
     * @returns
     */
    delete(question: Question): Promise<void>;
}

/**
 * This is a singleton class that is used to access the question data store.
 *
 * When the plugin is loaded, the question data store is initialized with whatever data store type is selected and this class is used to access it.
 */
export class DataStore {
    static instance: IDataStore;

    public static getInstance(): IDataStore {
        if (!DataStore.instance) {
            throw new Error("there is no QuestionDataStore instance.");
        }
        return DataStore.instance;
    }
}
