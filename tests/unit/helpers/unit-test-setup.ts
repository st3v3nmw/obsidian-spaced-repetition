import { DataStore } from "src/data/data-store/base/data-store";
import { DataStoreAlgorithm } from "src/data/data-store/base/data-store-algorithm";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store/notes-data-store/note-data-store-algorithm-osr";
import { NotesDataStore } from "src/data/data-store/notes-data-store/notes-data-store";
import { SRSettings } from "src/data/settings";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";

import { UnitTestFileModifier } from "./unit-test-file-modifiers";

export function unitTestSetupStandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new NotesDataStore(settings, new UnitTestFileModifier());
    SRAlgorithm.instance = new SRAlgorithmOsr(settings);
    DataStoreAlgorithm.instance = new NoteDataStoreAlgorithmOsr(settings);
}
