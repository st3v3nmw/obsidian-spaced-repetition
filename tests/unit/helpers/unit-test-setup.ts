import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { DataStoreAlgorithm } from "src/data/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data/data-stores/base/data-store";
import { StoreInNotes } from "src/data/data-stores/notes/notes";
import { SRSettings } from "src/data/settings";

export function unitTestSetupStandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new StoreInNotes(settings);
    SrsAlgorithm.instance = new SrsAlgorithmOsr(settings);
    DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);
}
