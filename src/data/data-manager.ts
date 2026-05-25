import { TFile } from "obsidian";

import { OsrCore } from "src/data/core";
import { DataStore, StorageType } from "src/data/data-store/base/data-store";
import { DataStoreAlgorithm } from "src/data/data-store/base/data-store-algorithm";
import { NoteDataFileModifier } from "src/data/data-store/notes-data-store/note-data-file-modifier";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store/notes-data-store/note-data-store-algorithm-osr";
import { NotesDataStore } from "src/data/data-store/notes-data-store/notes-data-store";
import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile, SRNoteTFile } from "src/data/data-structures/file/note-file";
import { DEFAULT_DATA, PluginData } from "src/data/plugin-data";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { setDebugParser } from "src/parser";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { SrsAlgorithmFsrs } from "src/scheduling/algorithms/fsrs/sr-algorithm-fsrs";
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
        const loadedData: PluginData = (await this.plugin.loadData()) as PluginData;
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);

        setDebugParser(this.data.settings.showParserDebugMessages);
        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    /**
     * Initializes the OSR app core.
     *
     * @param {() => void} onOsrVaultDataChanged - A callback function that is called when the OSR vault data changes.
     * @returns {Promise<void>} - A promise that resolves when the OSR app core is initialized.
     */
    async initOSRCore(onOsrVaultDataChanged: () => Promise<void>): Promise<void> {
        if (this.data === null) throw new Error("Data not loaded!!");
        const questionPostponementList: QuestionPostponementList = new QuestionPostponementList(
            this.plugin,
            this.data.settings,
            this.data.buryList,
        );
        await questionPostponementList.clearIfNewDay(this.data);

        this.osrCore = new OsrCore(
            questionPostponementList,
            this.data.settings,
            onOsrVaultDataChanged,
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

            await this.osrCore.finalizeLoad();
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
            case StorageType.NOTES:
                DataStore.instance = new NotesDataStore(
                    settings,
                    new NoteDataFileModifier(this.plugin),
                );
                DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(settings);
                break;
        }

        // TODO: Move this to the scheduling manager once it is implemented
        SRAlgorithm.instance =
            settings.algorithm === SRAlgorithmType.FSRS
                ? new SrsAlgorithmFsrs(settings)
                : new SRAlgorithmOsr(settings);
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
            await note.writeNoteFile(this.data.settings);
        }
        return note;
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
}
