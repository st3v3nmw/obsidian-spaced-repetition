import { Notice, TFile } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithmFsrs } from "src/algorithms/fsrs/srs-algorithm-fsrs";
import { ObsidianVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { OsrCore } from "src/data/core";
import { DataStoreAlgorithm } from "src/data/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStoreInPluginDataAlgorithmOsr } from "src/data/data-store-algorithm/data-store-in-plugin-data-algorithm-osr";
import { DataStore, DataStoreName } from "src/data/data-stores/base/data-store";
import { DataStoreMigrator } from "src/data/data-stores/data-store-migrator";
import { StoreInNotes } from "src/data/data-stores/notes/notes";
import { StoreInPluginData } from "src/data/data-stores/plugin-data/plugin-data";
// import { ScheduleDataMarkdownStorage } from "src/data/data-stores/plugin-data/schedule-data-markdown-storage";
import { ScheduleDataRepository } from "src/data/data-stores/plugin-data/schedule-data-repository";
import { ISRFile, SrTFile } from "src/data/file";
import { DEFAULT_DATA, PluginData } from "src/data/plugin-data";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/data/settings";
import { TopicPath } from "src/deck/topic-path";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { setDebugParser } from "src/parser";

/**
 * Manages all the data systems of the Spaced Repetition plugin and exposes them to the other parts of the plugin.
 *
 * This includes the plugin data, the OSR app core, and the scheduling data repository.
 */
export class DataManager {
    private plugin: SRPlugin;
    private _data: PluginData | null = null;
    private _osrCore: OsrCore | null = null;
    private _syncLock = false;
    public scheduleDataRepository: ScheduleDataRepository | null = null;

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

        // TODO: Uncomment when schedule data is implemented
        // const scheduleStorage = new ScheduleDataMarkdownStorage(
        //     this.plugin.app,
        //     () => {
        //         if (this.data === null) throw new Error("Data not loaded!!");
        //         return this.data.settings.scheduleDataVaultLocation;
        //     }
        // );

        // TODO: Uncomment when schedule data is implemented
        // this.scheduleDataRepository = new ScheduleDataRepository(
        //     this.data,
        //     this.savePluginData.bind(this),
        //     scheduleStorage,
        // );
        // await this.scheduleDataRepository.initialize();

        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    /**
     * Initializes the OSR app core.
     *
     * @param {NoteReviewQueue} noteReviewQueue - The note review queue.
     * @param {() => void} onOsrVaultDataChanged - A callback function that is called when the OSR vault data changes.
     * @returns {Promise<void>} - A promise that resolves when the OSR app core is initialized.
     */
    async initOSRAppCore(
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

        this.osrCore = new OsrCore();
        this.osrCore.init(
            questionPostponementList,
            new ObsidianVaultNoteLinkInfoFinder(this.plugin.app.metadataCache),
            this.data.settings,
            onOsrVaultDataChanged,
            noteReviewQueue,
            this.scheduleDataRepository,
        );
    }

    async loadVault(): Promise<void> {
        if (this._syncLock) {
            return;
        }
        this._syncLock = true;

        try {
            this.osrCore.loadInit();

            const notes: TFile[] = this.plugin.app.vault.getMarkdownFiles();
            for (const noteFile of notes) {
                if (SettingsUtil.isPathInNoteIgnoreFolder(this.data.settings, noteFile.path)) {
                    continue;
                }

                const file: SrTFile = this.createSrTFile(noteFile);
                await this.osrCore.processFile(file);
            }

            this.osrCore.finalizeLoad();
        } finally {
            this._syncLock = false;
        }
    }

    /**
     * Creates a SrTFile object from a note file.
     *
     * @param {TFile} note - The note file.
     * @returns {SrTFile} - The SrTFile object.
     */
    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(
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
        if (settings.dataStore === DataStoreName.PLUGIN_DATA) {
            if (this.scheduleDataRepository === null)
                throw new Error("Schedule data not initialized!!!");
            DataStore.instance = new StoreInPluginData(settings, this.scheduleDataRepository);
            DataStoreAlgorithm.instance = new DataStoreInPluginDataAlgorithmOsr();
        } else {
            DataStore.instance = new StoreInNotes(settings);
            DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);
        }

        // TODO: Move this to the scheduling manager once it is implemented
        SrsAlgorithm.instance =
            settings.algorithm === Algorithm.FSRS
                ? new SrsAlgorithmFsrs(settings)
                : new SrsAlgorithmOsr(settings);
    }

    async migrateDataStore(oldMode: DataStoreName, newMode: DataStoreName): Promise<void> {
        const textDirection = this.plugin.getObsidianRtlSetting();
        if (newMode === DataStoreName.PLUGIN_DATA) {
            if (this.data === null) throw new Error("Data not loaded!!");
            if (this.scheduleDataRepository === null)
                throw new Error("Schedule data not initialized!!!");
            await DataStoreMigrator.migrateToPluginData(
                this.plugin.app,
                this.data.settings,
                textDirection,
                this.scheduleDataRepository,
            );
        } else {
            if (this.scheduleDataRepository === null)
                throw new Error("Schedule data not initialized!!!");
            await DataStoreMigrator.migrateToNotes(
                this.plugin.app,
                this.data.settings,
                textDirection,
                this.scheduleDataRepository,
            );
        }
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
     * @returns {Promise<Note>} - A promise that resolves with the loaded note.
     */
    async loadNote(noteFile: TFile): Promise<Note> {
        if (this.data === null) throw new Error("Data not loaded!!");
        const loader: NoteFileLoader = new NoteFileLoader(this.data.settings);
        const srFile: ISRFile = this.createSrTFile(noteFile);
        const folderTopicPath: TopicPath = TopicPath.getFolderPathFromFilename(
            srFile,
            this.data.settings,
        );

        const note: Note = await loader.load(
            this.createSrTFile(noteFile),
            this.plugin.getObsidianRtlSetting(),
            folderTopicPath,
        );
        if (note.hasChanged) {
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

        const noteSrTFile: ISRFile = this.createSrTFile(note);

        if (SettingsUtil.isPathInNoteIgnoreFolder(this.data.settings, note.path)) {
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
     * Persists the scheduling data now.
     *
     * @returns {Promise<void>} - A promise that resolves when the scheduling data is persisted.
     */
    async persistScheduleDataNow(): Promise<void> {
        if (this.scheduleDataRepository === null)
            throw new Error("Schedule data not initialized!!!");
        await this.scheduleDataRepository.persistCurrentState();
    }
}
