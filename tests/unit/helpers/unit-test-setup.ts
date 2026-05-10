import { SRAlgorithm } from "src/algorithms/base/sr-algorithm";
import { SRAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { DataStoreAlgorithm } from "src/data/data-store-algorithm/base/data-store-algorithm";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/note-data-store/note-data-store-algorithm-osr";
import { DataStore } from "src/data/data-stores/base/data-store";
import { NotesDataStore } from "src/data/data-stores/notes-data-store/notes-data-store";
import { SRSettings } from "src/data/settings";

export function unitTestSetupStandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new NotesDataStore(settings);
    SRAlgorithm.instance = new SRAlgorithmOsr(settings);
    DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(settings);
}
