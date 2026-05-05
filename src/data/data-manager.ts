import { Notice, TFile } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithmFsrs } from "src/algorithms/fsrs/srs-algorithm-fsrs";
import { ObsidianVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { OsrAppCore } from "src/core";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStoreInPluginDataAlgorithmOsr } from "src/data-store-algorithm/data-store-in-plugin-data-algorithm-osr";
import { DataStore, DataStoreName } from "src/data-stores/base/data-store";
import { DataStoreMigrator } from "src/data-stores/data-store-migrator";
import { StoreInNotes } from "src/data-stores/notes/notes";
import { StoreInPluginData } from "src/data-stores/plugin-data/plugin-data";
// import { ScheduleDataMarkdownStorage } from "src/data-stores/plugin-data/schedule-data-markdown-storage";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { TopicPath } from "src/deck/topic-path";
import { ISRFile, SrTFile } from "src/file";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { setDebugParser } from "src/parser";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/settings";

/**
 * Manages the plugin data and handles loading/saving/migrating.
 */
export class DataManager {
    private plugin: SRPlugin;
    private _data: PluginData | null = null;
    private _osrAppCore: OsrAppCore | null = null;
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

    isOsrAppCoreLoaded(): boolean {
        return this._osrAppCore !== null;
    }

    get data(): PluginData {
        if (this._data === null) throw new Error("Data not loaded!!");
        return this._data;
    }

    set data(data: PluginData) {
        this._data = data;
    }

    get osrAppCore(): OsrAppCore {
        if (this._osrAppCore === null)
            throw new Error("SR plugin or OSR app core not initialized!!!");
        return this._osrAppCore;
    }

    set osrAppCore(osrAppCore: OsrAppCore) {
        this._osrAppCore = osrAppCore;
    }

    /**
     * Loads the plugin data.
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

        const osrNoteLinkInfoFinder: ObsidianVaultNoteLinkInfoFinder =
            new ObsidianVaultNoteLinkInfoFinder(this.plugin.app.metadataCache);

        this.osrAppCore = new OsrAppCore(this.plugin.app);
        this.osrAppCore.init(
            questionPostponementList,
            osrNoteLinkInfoFinder,
            this.data.settings,
            onOsrVaultDataChanged,
            noteReviewQueue,
            this.scheduleDataRepository,
        );
    }

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
            if (this.data === null) throw new Error("Data not loaded!!");
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

    async sync(): Promise<void> {
        if (this.osrAppCore === null) throw new Error("OSR app core not initialized!!!");
        if (this.data === null) throw new Error("Data not loaded!!");

        if (this.osrAppCore.syncLock) {
            return;
        }

        const now = window.moment(Date.now());
        this.osrAppCore.defaultTextDirection = this.plugin.getObsidianRtlSetting();

        await this.osrAppCore.loadVault();

        if (this.data.settings.showSchedulingDebugMessages) {
            console.log(`SR: ${t("DECKS")}`, this.osrAppCore.reviewableDeckTree);
            console.log(
                "SR: " +
                    t("SYNC_TIME_TAKEN", {
                        t: Date.now() - now.valueOf(),
                    }),
            );
        }
    }

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

    async saveNoteReviewResponse(note: TFile, response: ReviewResponse): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        if (this.osrAppCore === null) throw new Error("OSR app core not initialized!!!");
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

        await this.osrAppCore.saveNoteReviewResponse(noteSrTFile, response, this.data.settings);

        new Notice(t("RESPONSE_RECEIVED"));

        if (this.data.settings.autoNextNote) {
            this.plugin.nextNoteReviewHandler.autoReviewNextNote();
        }
    }

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(
            this.plugin.app.vault,
            this.plugin.app.metadataCache,
            this.plugin.app.fileManager,
            note,
        );
    }

    async savePluginData(): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        await this.plugin.saveData(this.data);
    }

    async persistScheduleDataNow(): Promise<void> {
        if (this.scheduleDataRepository === null)
            throw new Error("Schedule data not initialized!!!");
        await this.scheduleDataRepository.persistCurrentState();
    }
}
