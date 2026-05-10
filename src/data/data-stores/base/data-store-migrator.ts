import { DataStoreAlgorithm } from "src/data/data-store-algorithm/base/data-store-algorithm";
import { FolderDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/folder-data-store/folder-data-store-algorithm-osr";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/note-data-store/note-data-store-algorithm-osr";
import { DataStore, StorageType } from "src/data/data-stores/base/data-store";
import { FolderDataStore } from "src/data/data-stores/folder-data-store/folder-data-store";
import { NotesDataStore } from "src/data/data-stores/notes-data-store/notes-data-store";
import { PluginDataStore } from "src/data/data-stores/plugin-data-store/plugin-data-store";
import SRPlugin from "src/main";
import { TextDirection } from "src/utils/strings";

export interface IDataStoreTransitData {}

export class DataStoreMigrator {
    static async migrateDataStore(
        plugin: SRPlugin,
        textDirection: TextDirection,
        oldMode: StorageType,
        newMode: StorageType,
    ): Promise<void> {
        // Save the data store state in a universal format that can be imported into the new data store.
        const transitData = DataStoreMigrator.exportTransitData(oldMode);

        // Migrate the data store to the new storage type.
        switch (newMode) {
            case StorageType.PLUGIN_DATA:
                DataStore.instance = new PluginDataStore(
                    plugin.dataManager.data.settings,
                    plugin.dataManager.data,
                );
                DataStoreAlgorithm.instance = new FolderDataStoreAlgorithmOsr();
                break;
            case StorageType.FOLDER:
                DataStore.instance = new FolderDataStore(
                    plugin.dataManager.data.settings,
                    plugin.app,
                );
                DataStoreAlgorithm.instance = new FolderDataStoreAlgorithmOsr();
                break;
            case StorageType.NOTES:
                DataStore.instance = new NotesDataStore(plugin.dataManager.data.settings);
                DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(
                    plugin.dataManager.data.settings,
                );
                break;
        }

        console.log(`Migrated data store from ${oldMode} to ${newMode}`);
        console.log("Current storage type:", DataStore.instance.storageType);

        // Import the data store state from the transit data.
        await DataStoreMigrator.importTransitDataToDataStore(newMode, transitData);
    }

    private static async exportTransitData(
        currentStorageType: StorageType,
    ): Promise<IDataStoreTransitData> {
        const dataStoreTransitData: IDataStoreTransitData = {};
        switch (currentStorageType) {
            case StorageType.NOTES:
                // TODO: Implement this
                break;
            case StorageType.FOLDER:
                // TODO: Implement this
                break;
            case StorageType.PLUGIN_DATA:
                // TODO: Implement this
                break;
        }
        return dataStoreTransitData;
    }

    private static async importTransitDataToDataStore(
        currentStorageType: StorageType,
        dataStoreTransitData: IDataStoreTransitData,
    ): Promise<void> {
        switch (currentStorageType) {
            case StorageType.NOTES:
                // TODO: Implement this
                break;
            case StorageType.FOLDER:
                // TODO: Implement this
                break;
            case StorageType.PLUGIN_DATA:
                // TODO: Implement this
                break;
        }
    }
}
