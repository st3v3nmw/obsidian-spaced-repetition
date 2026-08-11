import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";

/**
 * All available data stores types.
 * NOTE: The type determines where data is stored and retrieved from
 */
export enum StorageType {
    NOTES = "NOTES",
    // Schedule data stored outside of notes, in a single markdown file in the vault
    // (so Obsidian Sync picks it up). See SrMdDataStore.
    SR_MD = "SR_MD",
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
     * Optionally preloads any external state the store needs before the vault is scanned.
     *
     * Stores that keep schedule data outside of notes (e.g. {@link StorageType.SR_MD})
     * read that file once here so that the synchronous {@link createSchedule} read path
     * can look schedules up from memory. Stores that read inline from notes don't need this.
     */
    preload?(): Promise<void>;

    /**
     * Migrates all scheduling data from the previous store into this store.
     *
     * @param oldMode The storage type the data is currently stored in.
     */
    migrateDataStore(oldMode: StorageType): Promise<void>;

    /**
     * Reads the scheduling information for a whole note (note-level review).
     *
     * @param noteFile The note file.
     */
    readNoteSchedule(noteFile: ISRNoteTFile): Promise<RepItemScheduleInfo | null>;

    /**
     * Writes the scheduling information for a whole note (note-level review).
     *
     * @param noteFile The note file.
     * @param schedule The scheduling information to store.
     */
    writeNoteSchedule(noteFile: ISRNoteTFile, schedule: RepItemScheduleInfo): Promise<void>;

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
