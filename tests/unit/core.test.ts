import moment from "moment";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { CardListType } from "src/deck";
import { NoteDueDateHistogram } from "src/due-date-histogram";
import { ISRFile } from "src/file";
import { NoteReviewDeck, SchedNote } from "src/note-review-deck";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { formatDateYYYYMMDD, setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestOsrCore } from "./helpers/unit-test-core";
import { unitTestCheckNoteFrontmatter } from "./helpers/unit-test-helper";
import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

function checkDeckTreeCounts(
    osrCore: UnitTestOsrCore,
    expectedReviewableCount: number,
    expectedRemainingCount: number,
): void {
    expect(osrCore.reviewableDeckTree.getCardCount(CardListType.All, true)).toEqual(
        expectedReviewableCount,
    );
    expect(osrCore.remainingDeckTree.getCardCount(CardListType.All, true)).toEqual(
        expectedRemainingCount,
    );
}

function checkNoteReviewDeckBasic(
    actual: NoteReviewDeck,
    expected: {
        deckName: string;
        dueNotesCount: number;
        newNotesLength: number;
        scheduledNotesLength: number;
    },
): void {
    expect(actual.deckName).toEqual(expected.deckName);
    expect(actual.dueNotesCount).toEqual(expected.dueNotesCount);
    expect(actual.newNotes.length).toEqual(expected.newNotesLength);
    expect(actual.scheduledNotes.length).toEqual(expected.scheduledNotesLength);
}

function checkScheduledNote(
    actual: SchedNote,
    expected: { filename: string; dueDate: string },
): void {
    expect(actual.note.path.endsWith(expected.filename)).toBeTruthy();
    expect(formatDateYYYYMMDD(moment(actual.dueUnix))).toEqual(expected.dueDate);
}

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("No questions in the text; no files tagged as notes", async () => {
    const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
    await osrCore.loadTestVault("filesButNoQuestions");
    expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
    expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(0);
    checkDeckTreeCounts(osrCore, 0, 0);
    expect(osrCore.questionPostponementList.list.length).toEqual(0);
});

describe("Notes", () => {
    describe("Testing code that loads from test vault", () => {
        test("Tagged as note, but no OSR frontmatter", async () => {
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
            await osrCore.loadTestVault("notes1");

            expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
            expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(1);

            // Single deck "#review", with single new note "Computation Graph.md"
            const actual: NoteReviewDeck = osrCore.noteReviewQueue.reviewDecks.get("#review");
            checkNoteReviewDeckBasic(actual, {
                deckName: "#review",
                dueNotesCount: 0,
                newNotesLength: 1,
                scheduledNotesLength: 0,
            });
            expect(actual.newNotes[0].path.endsWith("Computation Graph.md")).toBeTruthy();
        });

        test("Tagged as note, and includes OSR frontmatter", async () => {
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
            await osrCore.loadTestVault("notes2");

            expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
            expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(1);

            // Single deck "#review", with single scheduled note "Triboelectric Effect.md",
            const actual: NoteReviewDeck = osrCore.noteReviewQueue.reviewDecks.get("#review");
            checkNoteReviewDeckBasic(actual, {
                deckName: "#review",
                dueNotesCount: 0,
                newNotesLength: 0,
                scheduledNotesLength: 1,
            });
            checkScheduledNote(actual.scheduledNotes[0], {
                filename: "Triboelectric Effect.md",
                dueDate: "2025-02-21",
            });
        });
    });

    describe("Review New note (i.e. not previously reviewed); no questions present", () => {
        test("New note without any backlinks", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes1");

            // Review the note
            const file = osrCore.getFileByNoteName("Computation Graph");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        // The notes that have links to [[A]] themselves haven't been reviewed,
        // So the expected post-review schedule is the same as if no files had links to [[A]]
        test("Review note with some backlinks (source files without reviews)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes3");

            // Review the note
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        test("Review note with a backlink (one source file already reviewed)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests\vaults\readme.md
            await osrCore.loadTestVault("notes4");

            // Review note B
            const file = osrCore.getFileByNoteName("B");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 272);
        });
    });

    describe("Review Old note (i.e. previously reviewed); no questions present", () => {
        test("Review note with a backlink - Good", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests/vaults/readme.md
            // See: tests/vaults/notes4/readme.md
            await osrCore.loadTestVault("notes4");

            // Initial histogram
            expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
            let expectedHistogram: NoteDueDateHistogram = new NoteDueDateHistogram({
                4: 1,
            });
            expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);

            // Review note A
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Good, settings);

            // Check note frontmatter - 11 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-17";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 11, 270);

            expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
            expectedHistogram = new NoteDueDateHistogram({
                11: 1,
            });
            expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);
        });

        test("Review note with a backlink - Hard", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests/vaults/readme.md
            // See: tests/vaults/notes4/readme.md
            await osrCore.loadTestVault("notes4");

            // Review note A
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Hard, settings);

            // Check note frontmatter - 2 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-08";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 2, 250);
        });
    });

    describe("Review New note (i.e. not previously reviewed); questions present and some previously reviewed", () => {
        test("New note without any backlinks", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes1");

            // Review the note
            const file = osrCore.getFileByNoteName("Computation Graph");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        // The notes that have links to [[A]] themselves haven't been reviewed,
        // So the expected post-review schedule is the same as if no files had links to [[A]]
        test("Review note with some backlinks (source files without reviews)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes3");

            // Review the note
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        test("Review note with a backlink (one source file already reviewed)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests\vaults\readme.md
            await osrCore.loadTestVault("notes4");

            // Review note B
            const file = osrCore.getFileByNoteName("B");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTestCheckNoteFrontmatter(file.content, expectedDueDate, 4, 272);
        });
    });

    describe("loadNote", () => {
        test("There is schedule info for 3 cards, but only 2 cards in the question", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            settings.cardCommentOnSameLine = true;
            settings.clozePatterns = ["{{[123;;]answer[;;hint]}}"];
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes6");

            /*
                A {{question}} with multiple parts {{Navevo part}}
                <!--SR:!2024-05-22,1,230!2024-05-25,4,270!2033-03-03,3,333-->
                The final schedule info "!2033-03-03,3,333" has been deleted
             */
            const file = osrCore.getFileByNoteName("A");
            expect(file.content).toContain("<!--SR:!2024-05-22,1,230!2024-05-25,4,270-->");
        });
    });
});

describe("Note Due Date Histogram", () => {
    test("New note", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        await osrCore.loadTestVault("notes1");

        // Initial status
        expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);

        // Review the note
        const file = osrCore.getFileByNoteName("Computation Graph");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

        // Check histogram - in 4 days there is one card due
        expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
        const expectedHistogram: NoteDueDateHistogram = new NoteDueDateHistogram({
            4: 1,
        });
        expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);
    });

    test("Review old note - Good", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

        // See: tests/vaults/readme.md
        // See: tests/vaults/notes4/readme.md
        await osrCore.loadTestVault("notes4");

        // Initial histogram
        expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
        let expectedHistogram: NoteDueDateHistogram = new NoteDueDateHistogram({
            4: 1,
        });
        expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);

        // Review note A
        const file = osrCore.getFileByNoteName("A");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Good, settings);

        expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
        expectedHistogram = new NoteDueDateHistogram({
            11: 1,
        });
        expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);
    });

    test("Review multiple notes", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

        // See: tests/vaults/readme.md
        // See: tests/vaults/notes4/readme.md
        await osrCore.loadTestVault("notes4");

        // Review all the notes
        let file: ISRFile = osrCore.getFileByNoteName("A");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Good, settings);
        file = osrCore.getFileByNoteName("B");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Hard, settings);
        file = osrCore.getFileByNoteName("C");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Hard, settings);
        file = osrCore.getFileByNoteName("D");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Good, settings);

        expect(osrCore.dueDateNoteHistogram.dueNotesCount).toEqual(0);
        const expectedHistogram: NoteDueDateHistogram = new NoteDueDateHistogram({
            1: 2,
            3: 1,
            11: 1,
        });
        expect(osrCore.dueDateNoteHistogram).toEqual(expectedHistogram);
    });
});

describe("Note review - bury all flashcards", () => {
    test("burySiblingCards - false", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        settings.burySiblingCards = false;
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        await osrCore.loadTestVault("notes5");

        // Nothing initially on the postponement list
        expect(osrCore.questionPostponementList.list.length).toEqual(0);

        // Review the note
        const file = osrCore.getFileByNoteName("D");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

        // Because burySiblingCards is false, nothing has been added to the postponement list
        expect(osrCore.questionPostponementList.list.length).toEqual(0);
    });

    test("burySiblingCards - true", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        settings.burySiblingCards = true;
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        await osrCore.loadTestVault("notes5");

        // Nothing initially on the postponement list
        expect(osrCore.questionPostponementList.list.length).toEqual(0);

        // Review the note
        const file = osrCore.getFileByNoteName("D");
        await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

        // The two cards in note D have been added to the postponement list
        expect(osrCore.questionPostponementList.list.length).toEqual(2);
    });
});
