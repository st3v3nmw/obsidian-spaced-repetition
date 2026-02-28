import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { DueDateHistogram } from "src/due-date-histogram";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { setupStaticDateProvider, setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestOsrCore } from "./helpers/unit-test-core";
import {
    unitTestSetupGamificationScorer,
    unitTestSetupStandardDataStoreAlgorithm,
} from "./helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
    unitTestSetupGamificationScorer();
});

function checkHistogramValue(histogram: DueDateHistogram, nDays: number, expectedValue: number) {
    expect(histogram.hasEntryForDays(nDays)).toEqual(true);
    expect(histogram.get(nDays)).toEqual(expectedValue);
}

function checkHistogramDueCardCount(histogram: DueDateHistogram, expectedValue: number) {
    checkHistogramValue(histogram, DueDateHistogram.dueNowNDays, expectedValue);
}

describe("determineScheduleInfo", () => {
    test("No notes due", async () => {
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);

        // A.md due 2023-09-10 (in 4 days time)
        await osrCore.loadTestVault("notes4");
        const histogram: DueDateHistogram = osrCore.dueDateNoteHistogram;
        expect(histogram.hasEntryForDays(DueDateHistogram.dueNowNDays)).toEqual(false);
    });

    test("Note A.md due today", async () => {
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);

        // A.md due 2023-09-10, so it should be due
        setupStaticDateProvider("2023-09-10");

        await osrCore.loadTestVault("notes4");
        const histogram: DueDateHistogram = osrCore.dueDateNoteHistogram;
        checkHistogramDueCardCount(histogram, 1);
    });
});

describe("dueNotesCount", () => {
    test("No notes due", async () => {
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);

        // A.md due 2023-09-10 (in 4 days time)
        await osrCore.loadTestVault("notes4");
        expect(osrCore.noteReviewQueue.dueNotesCount).toEqual(1);
    });
});

describe("updateScheduleInfo", () => {
    test("Multiple review decks", async () => {
        const modifiedSettings: SRSettings = {
            ...DEFAULT_SETTINGS,
            tagsToReview: ["#review", "#review-2"],
        };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore({
            ...modifiedSettings,
        });

        await osrCore.loadTestVault("notes7");
        expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(2);

        await osrCore.saveNoteReviewResponse(
            osrCore.getFileByNoteName("A"),
            ReviewResponse.Easy,
            modifiedSettings,
        );

        expect(osrCore.noteReviewQueue.reviewDecks.get("#review")?.newNotes.length).toEqual(0);
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review")?.scheduledNotes.length).toEqual(
            1,
        );
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review-2")?.newNotes.length).toEqual(1);
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review-2")?.scheduledNotes.length).toEqual(
            0,
        );

        await osrCore.saveNoteReviewResponse(
            osrCore.getFileByNoteName("A"),
            ReviewResponse.Easy,
            modifiedSettings,
        );
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review")?.scheduledNotes.length).toEqual(
            1,
        );
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review")?.newNotes.length).toEqual(0);
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review-2")?.newNotes.length).toEqual(1);
        expect(osrCore.noteReviewQueue.reviewDecks.get("#review-2")?.scheduledNotes.length).toEqual(
            0,
        );
    });
});
