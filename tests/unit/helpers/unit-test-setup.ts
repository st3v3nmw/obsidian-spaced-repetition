import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithm_Osr } from "src/algorithms/osr/srs-algorithm-osr";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNote_AlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data-stores/base/data-store";
import { StoreInNote } from "src/data-stores/store-in-note/note";
import { SRSettings } from "src/settings";

export function unitTestSetup_StandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new StoreInNote(settings);
    SrsAlgorithm.instance = new SrsAlgorithm_Osr(settings);
    DataStoreAlgorithm.instance = new DataStoreInNote_AlgorithmOsr(settings);
}
