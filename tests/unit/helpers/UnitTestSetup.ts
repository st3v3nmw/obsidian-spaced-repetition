import { INoteEaseList } from "src/NoteEaseList";
import { SrsAlgorithm } from "src/algorithms/base/SrsAlgorithm";
import { SrsAlgorithm_Osr } from "src/algorithms/osr/SrsAlgorithm_Osr";
import { DataStore } from "src/dataStore/base/DataStore";
import { DataStore_StoreInNote } from "src/dataStore/storeInNote/DataStore_StoreInNote";
import { DataStoreAlgorithm } from "src/dataStoreAlgorithm/DataStoreAlgorithm";
import { DataStoreInNote_AlgorithmOsr } from "src/dataStoreAlgorithm/DataStoreInNote_AlgorithmOsr";
import { SRSettings } from "src/settings";

export function unitTestSetup_StandardDataStoreAlgorithm(settings: SRSettings, noteEaseList: INoteEaseList) {
    DataStore.instance = new DataStore_StoreInNote(settings);
    SrsAlgorithm.instance = new SrsAlgorithm_Osr(settings, noteEaseList);
    DataStoreAlgorithm.instance = new DataStoreInNote_AlgorithmOsr(settings);
}