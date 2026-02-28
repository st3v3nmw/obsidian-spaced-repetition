import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data-stores/base/data-store";
import { StoreInNotes } from "src/data-stores/notes/notes";
import { GamificationScorer } from "src/gamification/base/gamification-scorer";
import { IGamificationScorer } from "src/gamification/base/igamification-scorer";
import { SRSettings } from "src/settings";

export function unitTestSetupStandardDataStoreAlgorithm(settings: SRSettings) {
    DataStore.instance = new StoreInNotes(settings);
    SrsAlgorithm.instance = new SrsAlgorithmOsr(settings);
    DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);
}

export function unitTestSetupGamificationScorer() {
    // Mock implementation of IGamificationScorer for testing purposes
    class MockGamificationScorer implements IGamificationScorer {
        async score(_response: ReviewResponse): Promise<void> {
            // Mock scoring logic, can be left empty for testing
        }
    }

    GamificationScorer.instance = new MockGamificationScorer();
}
