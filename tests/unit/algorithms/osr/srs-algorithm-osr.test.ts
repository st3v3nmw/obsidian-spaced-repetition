import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { DEFAULT_SETTINGS } from "src/settings";

import {
    unitTestSetupGamificationScorer,
    unitTestSetupStandardDataStoreAlgorithm,
} from "../../helpers/unit-test-setup";

beforeAll(() => {
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
    unitTestSetupGamificationScorer();
});

test("SrsAlgorithmOsr should return note stats", () => {
    const noteStats = SrsAlgorithm.getInstance().noteStats();
    expect(noteStats.dict).toEqual({});
});
