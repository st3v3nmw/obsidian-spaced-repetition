import { Notice, TFile, Vault } from "obsidian";

import { FLASHCARD_SCHEDULE_INFO } from "src/data/constants";
import { OsrCore } from "src/data/core";
import { DataStoreAlgorithm } from "src/data/data-store-algorithm/base/data-store-algorithm";
import { FolderDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/folder-data-store/folder-data-store-algorithm-osr";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/note-data-store/note-data-store-algorithm-osr";
import { DataStore, StorageType } from "src/data/data-stores/base/data-store";
import { DataStoreMigrator } from "src/data/data-stores/base/data-store-migrator";
import { FolderDataStore } from "src/data/data-stores/folder-data-store/folder-data-store";
import { NotesDataStore } from "src/data/data-stores/notes-data-store/notes-data-store";
import { PluginDataStore } from "src/data/data-stores/plugin-data-store/plugin-data-store";
import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile, SRNoteTFile } from "src/data/data-structures/file/note-file";
import { DEFAULT_DATA, PluginData } from "src/data/plugin-data";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { setDebugParser } from "src/parser";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { SrsAlgorithmFsrs } from "src/scheduling/algorithms/fsrs/sr-algorithm-fsrs";
import { ObsidianVaultNoteLinkInfoFinder } from "src/scheduling/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";

/**
 * Manages all the data related systems of the Spaced Repetition plugin and exposes them to the other parts of the plugin.
 *
 * This includes the plugin data, the OSR app core, and the scheduling data repository.
 */
export class DataManager {
    private plugin: SRPlugin;
    private _data: PluginData | null = null;
    private _osrCore: OsrCore | null = null;
    private _syncLock = false;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    /**
     * Checks if the data has been loaded.
     */
    isDataLoaded(): boolean {
        return this._data !== null;
    }

    /**
     * Checks if the OSR app core has been loaded.
     */
    isOsrCoreLoaded(): boolean {
        return this._osrCore !== null;
    }

    get data(): PluginData {
        if (this._data === null) throw new Error("Data not loaded!!");
        return this._data;
    }

    set data(data: PluginData) {
        this._data = data;
    }

    get osrCore(): OsrCore {
        if (this._osrCore === null) throw new Error("SR plugin or OSR core not initialized!!!");
        return this._osrCore;
    }

    set osrCore(osrCore: OsrCore) {
        this._osrCore = osrCore;
    }

    get syncLock(): boolean {
        return this._syncLock;
    }

    /**
     * Loads the plugin data from the data.json from the plugin's folder.
     */
    async loadData(): Promise<void> {
        const loadedData: PluginData = await this.plugin.loadData();
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);

        setDebugParser(this.data.settings.showParserDebugMessages);
        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    /**
     * Initializes the OSR app core.
     *
     * @param {NoteReviewQueue} noteReviewQueue - The note review queue.
     * @param {() => void} onOsrVaultDataChanged - A callback function that is called when the OSR vault data changes.
     * @returns {Promise<void>} - A promise that resolves when the OSR app core is initialized.
     */
    async initOSRCore(
        noteReviewQueue: NoteReviewQueue,
        onOsrVaultDataChanged: () => void,
    ): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        const questionPostponementList: QuestionPostponementList = new QuestionPostponementList(
            this.plugin,
            this.data.settings,
            this.data.buryList,
        );
        await questionPostponementList.clearIfNewDay(this.data);

        this.osrCore = new OsrCore(
            questionPostponementList,
            new ObsidianVaultNoteLinkInfoFinder(this.plugin.app.metadataCache),
            this.data.settings,
            onOsrVaultDataChanged,
            noteReviewQueue,
            this.plugin.getObsidianRtlSetting(),
        );
    }

    async loadVault(): Promise<void> {
        if (this._syncLock) {
            return;
        }
        this._syncLock = true;

        try {
            this.osrCore.loadInitialStateOfCore();

            const notes: TFile[] = this.plugin.app.vault.getMarkdownFiles();
            for (const noteFile of notes) {
                // Skip files in the note ignore folder
                if (SettingsUtil.isPathInFoldersToIgnore(this.data.settings, noteFile.path))
                    continue;

                const file: SRNoteTFile = this.createSRNoteTFile(noteFile);
                await this.osrCore.processFile(file);
            }

            this.osrCore.finalizeLoad();
        } finally {
            this._syncLock = false;
        }
    }

    /**
     * Creates a SRNoteTFile object from a note file.
     *
     * @param {TFile} note - The note file.
     * @returns {SRNoteTFile} - The SRNoteTFile object.
     */
    createSRNoteTFile(note: TFile): SRNoteTFile {
        return new SRNoteTFile(
            this.plugin.app.vault,
            this.plugin.app.metadataCache,
            this.plugin.app.fileManager,
            note,
        );
    }

    /**
     * Sets up the data store and algorithm instances based on the settings.
     *
     * @param {SRSettings} settings - The settings object.
     */
    setupDataStoreAndAlgorithmInstances(settings: SRSettings) {
        switch (settings.dataStore) {
            case StorageType.PLUGIN_DATA:
                DataStore.instance = new PluginDataStore(settings, this.plugin.dataManager.data);
                DataStoreAlgorithm.instance = new FolderDataStoreAlgorithmOsr();
                break;
            case StorageType.FOLDER:
                DataStore.instance = new FolderDataStore(settings, this.plugin.app);
                DataStoreAlgorithm.instance = new FolderDataStoreAlgorithmOsr();
                break;
            case StorageType.NOTES:
                DataStore.instance = new NotesDataStore(settings);
                DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(settings);
                break;
        }

        console.log("Current storage type:", DataStore.instance.storageType);

        // TODO: Move this to the scheduling manager once it is implemented
        SRAlgorithm.instance =
            settings.algorithm === SRAlgorithmType.FSRS
                ? new SrsAlgorithmFsrs(settings)
                : new SRAlgorithmOsr(settings);
    }

    async migrateDataStore(oldMode: StorageType, newMode: StorageType): Promise<void> {
        const textDirection = this.plugin.getObsidianRtlSetting();
        await DataStoreMigrator.migrateDataStore(this.plugin, textDirection, oldMode, newMode);
    }

    /**
     * Synchronizes the data with the Obsidian vault.
     *
     * @returns {Promise<void>} - A promise that resolves when the synchronization is complete.
     */
    async sync(): Promise<void> {
        if (this.osrCore === null) throw new Error("OSR app core not initialized!!!");
        if (this.data === null) throw new Error("Data not loaded!!");

        if (this.syncLock) {
            return;
        }

        const now = window.moment(Date.now());
        this.osrCore.defaultTextDirection = this.plugin.getObsidianRtlSetting();

        await this.loadVault();

        if (this.data.settings.showSchedulingDebugMessages) {
            console.log(`SR: ${t("DECKS")}`, this.osrCore.reviewableDeckTree);
            console.log(
                "SR: " +
                    t("SYNC_TIME_TAKEN", {
                        t: Date.now() - now.valueOf(),
                    }),
            );
        }
    }

    /**
     * Loads a note from the Obsidian vault.
     *
     * @param {TFile} noteFile - The note file.
     * @returns {Promise<Note | null>} - A promise that resolves with the loaded note or null if not found.
     */
    async loadNote(noteFile: TFile): Promise<Note | null> {
        if (this.data === null) throw new Error("Data not loaded!!");
        const loader: NoteFileLoader = new NoteFileLoader(this.data.settings);
        const srFile: ISRNoteTFile = this.createSRNoteTFile(noteFile);
        const folderTopicPath: TopicPath = TopicPath.getFolderPathFromFilename(
            srFile,
            this.data.settings,
        );

        const note: Note | null = await loader.load(
            this.createSRNoteTFile(noteFile),
            this.plugin.getObsidianRtlSetting(),
            folderTopicPath,
        );
        if (note && note.hasChanged) {
            note.writeNoteFile(this.data.settings);
        }
        return note;
    }

    /**
     * Saves the review response for a note.
     *
     * @param {TFile} note - The note file.
     * @param {ReviewResponse} response - The review response.
     * @returns {Promise<void>} - A promise that resolves when the review response is saved.
     */
    async saveNoteReviewResponse(note: TFile, response: ReviewResponse): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        if (this.osrCore === null) throw new Error("OSR app core not initialized!!!");
        if (this.plugin.nextNoteReviewHandler === null)
            throw new Error("Next note review handler not initialized!!!");

        const noteSrTFile: ISRNoteTFile = this.createSRNoteTFile(note);

        if (SettingsUtil.isPathInFoldersToIgnore(this.data.settings, note.path)) {
            new Notice(t("NOTE_IN_IGNORED_FOLDER"));
            return;
        }

        const tags = noteSrTFile.getAllTagsFromCache();
        if (!SettingsUtil.isAnyTagANoteReviewTag(this.data.settings, tags)) {
            new Notice(t("PLEASE_TAG_NOTE"));
            return;
        }

        await this.osrCore.saveNoteReviewResponse(noteSrTFile, response, this.data.settings);

        new Notice(t("RESPONSE_RECEIVED"));

        if (this.data.settings.autoNextNote) {
            this.plugin.nextNoteReviewHandler.autoReviewNextNote();
        }
    }

    /**
     * Saves the plugin data.
     *
     * @returns {Promise<void>} - A promise that resolves when the plugin data is saved.
     */
    async savePluginData(): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        await this.plugin.saveData(this.data);
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
                return data.replace(FLASHCARD_SCHEDULE_INFO, "");
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
