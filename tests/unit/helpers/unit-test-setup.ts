import { DataStoreAlgorithm } from "src/data/data-store-algorithm/base/data-store-algorithm";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store-algorithm/note-data-store/note-data-store-algorithm-osr";
import { DataStore } from "src/data/data-store-instances/base/data-store";
import { NotesDataStore } from "src/data/data-store-instances/notes-data-store/notes-data-store";
import { SRSettings } from "src/data/settings";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";

export function unitTestSetupStandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new NotesDataStore(settings);
    SRAlgorithm.instance = new SRAlgorithmOsr(settings);
    DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(settings);
}
