import { App, Notice, TFile, TFolder, Vault } from "obsidian";

import { SR_COMMENT_AND_WHITESPACE_FINDER } from "src/data/constants";
import { StorageType } from "src/data/data-store/base/data-store";
import { ExternalDataFileModifier, IFileModifier } from "src/data/data-store/base/file-modifier";
import { ISerializedScheduleData } from "src/data/plugin-data";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { RepItemScheduleFactory } from "src/scheduling/algorithms/base/rep-item-info-factory";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";

/**
 * Represents the interface for a folder data file modifier.
 */
export interface IFolderDataFileModifier extends IFileModifier {
    updateNoteSchedule(dataId: string, schedule: RepItemScheduleInfo): Promise<void>;
    deleteNoteSchedule(dataId: string): Promise<void>;
    readNoteSchedule(dataId: string): Promise<RepItemScheduleInfo | null>;
    updateCardSchedule(dataId: string, schedule: RepItemScheduleInfo[]): Promise<void>;
    deleteCardSchedule(dataId: string): Promise<void>;
    readCardSchedule(dataId: string): Promise<RepItemScheduleInfo[] | null>;
    ensureFolderStructure(): Promise<boolean>;
}

/**
 * Handles the deletion of scheduling data from notes and flashcards.
 */
export class FolderDataFileModifier
    extends ExternalDataFileModifier
    implements IFolderDataFileModifier {
    public static readonly SCHEDULE_DATA_FOLDER = "Schedule Data";
    public static readonly SCHEDULE_FILE_NAME = "schedule-data.sr.md";
    public static readonly DEFAULT_FILE_CONTENT = JSON.stringify({
        version: 1,
        noteSchedules: {},
        cardSchedules: {},
    } as ISerializedScheduleData);

    constructor(plugin: SRPlugin, app: App) {
        super(plugin, app);
    }

    /**
     * Updates the scheduling data for a card.
     *
     * @param {string} dataId - The dataId of the card.
     * @param {RepItemScheduleInfo[]} schedule - The scheduling data for the card.
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is updated.
     */
    async updateCardSchedule(dataId: string, schedule: RepItemScheduleInfo[]): Promise<void> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Card schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);

        if (!dataFile.cardSchedules[dataId]) {
            dataFile.cardSchedules[dataId] = [];
        }
        dataFile.cardSchedules[dataId] = schedule.map((s) => s.serializeSchedule());

        await this.writeScheduleRecord(JSON.stringify(dataFile));
    }

    /**
     * Updates the scheduling data for a note.
     *
     * @param {string} dataId - The dataId of the note.
     * @param {RepItemScheduleInfo} schedule - The scheduling data for the note.
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is updated.
     */
    async updateNoteSchedule(dataId: string, schedule: RepItemScheduleInfo): Promise<void> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Note schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);

        dataFile.noteSchedules[dataId] = schedule.serializeSchedule();

        await this.writeScheduleRecord(JSON.stringify(dataFile));
    }

    /**
     * Deletes the scheduling data for a card.
     *
     * @param {string} dataId - The dataId of the card.
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is deleted.
     */
    async deleteCardSchedule(dataId: string): Promise<void> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Card schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);
        delete dataFile.cardSchedules[dataId];

        await this.writeScheduleRecord(JSON.stringify(dataFile));
    }

    /**
     * Deletes the scheduling data for a note.
     *
     * @param {string} dataId - The dataId of the note.
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is deleted.
     */
    async deleteNoteSchedule(dataId: string): Promise<void> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Card schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);
        delete dataFile.noteSchedules[dataId];

        await this.writeScheduleRecord(JSON.stringify(dataFile));
    }

    /**
     * Reads the scheduling data for a card.
     *
     * @param {string} dataId - The dataId of the card.
     * @returns {Promise<RepItemScheduleInfo[] | null>} - A promise that resolves with the scheduling data for the card or null if not found.
     */
    async readCardSchedule(dataId: string): Promise<RepItemScheduleInfo[] | null> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Card schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);

        if (dataFile.cardSchedules[dataId]) {
            // Filter out null entries
            const entries = dataFile.cardSchedules[dataId].filter((s) => s !== null);

            return entries.length === 0
                ? null
                : entries.map((s) => RepItemScheduleFactory.create(s.algorithm, s)); // Deserialize schedules
        }
        return null;
    }

    /**
     * Reads the scheduling data for a note.
     *
     * @param {string} dataId - The dataId of the note.
     * @returns {Promise<RepItemScheduleInfo | null>} - A promise that resolves with the scheduling data for the note or null if not found.
     */
    async readNoteSchedule(dataId: string): Promise<RepItemScheduleInfo | null> {
        const dataFileText: string | null = await this.loadScheduleRecord();
        if (dataFileText === null) {
            throw new Error("Card schedule data not found");
        }

        const dataFile: ISerializedScheduleData = JSON.parse(dataFileText);

        if (dataFile.noteSchedules[dataId]) {
            const entry = dataFile.noteSchedules[dataId];

            return RepItemScheduleFactory.create(entry.algorithm, entry); // Deserialize schedules
        }
        return null;
    }

    /**
     * Loads the scheduling data from the schedule data file.
     *
     * @returns {Promise<string | null>} - A promise that resolves with the scheduling data as a string or null if not found.
     */
    private async loadScheduleRecord(): Promise<string | null> {
        const scheduleDataFile: TFile | null = this.app.vault.getFileByPath(
            `${this.plugin.dataManager.data.settings.scheduleDataVaultLocation}/` +
            FolderDataFileModifier.SCHEDULE_FILE_NAME,
        );

        if (scheduleDataFile === null) {
            return null;
        }

        return await this.app.vault.read(scheduleDataFile);
    }

    /**
     * Writes the scheduling data to the schedule data file.
     *
     * @param {string} data - The scheduling data to write.
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is written.
     */
    private async writeScheduleRecord(data: string): Promise<void> {
        const cardDataFile: TFile | null = this.app.vault.getFileByPath(
            `${this.plugin.dataManager.data.settings.scheduleDataVaultLocation}/` +
            FolderDataFileModifier.SCHEDULE_FILE_NAME,
        );
        if (cardDataFile === null) {
            throw new Error("Card schedule data not found");
        }
        await this.app.vault.modify(cardDataFile, data);
    }

    /**
     * Ensures that the folder/file structure for the data store exists
     */
    async ensureFolderStructure(): Promise<boolean> {
        const srFolder = await this.ensureFolder(
            this.plugin.dataManager.data.settings.scheduleDataVaultLocation,
        );
        await this.ensureFile(srFolder.path + "/" + FolderDataFileModifier.SCHEDULE_FILE_NAME);
        return true;
    }

    /**
     * Ensures that a necessary folder exists
     *
     * @param path Custom path to folder
     * @returns {Promise<TFolder>} Reference to the ensured folder
     */
    async ensureFolder(path: string): Promise<TFolder> {
        let folder: TFolder | null = this.app.vault.getFolderByPath(path);
        if (folder === null) {
            folder = await this.app.vault.createFolder(path);
        }

        return folder;
    }

    /**
     * Ensures that a needed file exists
     *
     * @param path custom path of file
     * @returns {Promise<TFile>} Reference to the ensured file
     */
    async ensureFile(path: string): Promise<TFile> {
        let file: TFile | null = this.app.vault.getFileByPath(path);

        if (file === null) {
            file = await this.app.vault.create(path, FolderDataFileModifier.DEFAULT_FILE_CONTENT);
        }

        return file;
    }

    /**
     * Migrates the data store from the previous store to the new store.
     *
     * @param previousType The previousType of the data store.
     */
    async migrateDataStore(oldMode: StorageType): Promise<void> {
        // TODO: Implement this
        console.log("Migrating data store from " + oldMode + " to " + StorageType.FOLDER);
        switch (oldMode) {
            case StorageType.NOTES:
                await this.replaceAllSchedulingCommentsWithDataIds(this.plugin.app.vault);
                break;
            case StorageType.PLUGIN_DATA:
            default:
                // We don't need to migrate the data store if it is the same as the new mode
                return Promise.resolve();
        }
    }

    /**
     * Replaces all card scheduling data from a markdown file with.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    async replaceAllSchedulingCommentsWithDataIds(vault: Vault) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.replaceSchedulingCommentWithDataId(
                vault,
                files[i],
                this.updateCardSchedule.bind(this),
            );
        }
    }

    /**
     * Deletes all note scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    async removeSchedulingInfoInNotes(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
                delete frontmatter["sr-due"];
                delete frontmatter["sr-interval"];
                delete frontmatter["sr-ease"];
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }

        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    async removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]) {
        await this.removeTagsFromFrontmatter(vault, file, tagsToDelete);
        try {
            await vault.process(file, (data) => {
                let newData = data;
                for (const tagToDelete of tagsToDelete.sort((a, b) => b.length - a.length)) {
                    const regex = new RegExp(
                        // eslint-disable-next-line no-useless-escape
                        `(${tagToDelete}[\/[a-zA-z\-[0-9]*]*\/]*[a-zA-z\-[0-9]*]*)`,
                        "gm",
                    );
                    newData = newData.replace(regex, "");
                    newData = newData.replace(tagToDelete, "");
                }
                return newData;
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }
    }

    async removeTagsFromFrontmatter(vault: Vault, file: TFile, tagsToDelete: string[]) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
                frontmatter["tags"] = (frontmatter["tags"] as string[]).filter((tag: string) => {
                    let deleteTag = false;
                    for (const tagToDelete of tagsToDelete.sort((a, b) => b.length - a.length)) {
                        if (tag.startsWith(tagToDelete.replace("#", ""))) {
                            deleteTag = true;
                            break;
                        }
                    }
                    return !deleteTag;
                });
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }
    }

    /**
     * Deletes all card scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    async removeSchedulingInfoInCards(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ) {
        try {
            await vault.process(file, (data) => {
                return data.replace(SR_COMMENT_AND_WHITESPACE_FINDER, "");
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }

        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    /**
     * Deletes all scheduling data from all markdown files in the vault.
     */
    async deleteAllSchedulingData(
        deleteTags: boolean,
        deckTagsToDelete: string[] = [],
        noteTagsToDelete: string[] = [],
    ) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInNotes(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                noteTagsToDelete,
            );
            await this.removeSchedulingInfoInCards(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                deckTagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    async deleteAllSchedulingDataInNotes(deleteTags: boolean, tagsToDelete: string[] = []) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInNotes(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                tagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all card scheduling data from all files in the vault.
     */
    async deleteAllSchedulingDataInCards(deleteTags: boolean, tagsToDelete: string[] = []) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInCards(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                tagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteAllSchedulingDataOfCardsInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ) {
        await this.removeSchedulingInfoInCards(
            this.plugin.app.vault,
            file,
            deleteTags,
            tagsToDelete,
        );

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    async deleteNoteSchedulingDataInNote(file: TFile, deleteTags: boolean, tagsToDelete: string[]) {
        await this.removeSchedulingInfoInNotes(
            this.plugin.app.vault,
            file,
            deleteTags,
            tagsToDelete,
        );

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }
}
