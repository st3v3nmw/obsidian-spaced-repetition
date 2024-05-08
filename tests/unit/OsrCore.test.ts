import { OsrCore } from "src/OsrCore";
import { UnitTestOsrCore } from "./helpers/UnitTestOsrCore";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { CardListType } from "src/Deck";
import { unitTestSetup_StandardDataStoreAlgorithm } from "./helpers/UnitTestSetup";
import { NoteReviewDeck, SchedNote } from "src/NoteReviewDeck";
import { DateUtil, setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import { formatDate_YYYY_MM_DD } from "src/util/utils";
import moment from "moment";
import { ReviewResponse } from "src/algorithms/base/RepetitionItem";
import { unitTest_CheckNoteFrontmatter } from "./helpers/UnitTestHelper";

function checkDeckTreeCounts(osrCore: UnitTestOsrCore, expectedReviewableCount: number, expectedRemainingCount: number): void {
    expect(osrCore.reviewableDeckTree.getCardCount(CardListType.All, true)).toEqual(expectedReviewableCount);
    expect(osrCore.remainingDeckTree.getCardCount(CardListType.All, true)).toEqual(expectedRemainingCount);
}


function checkNoteReviewDeck_Basic(actual: NoteReviewDeck, expected: any): void {
    expect(actual.deckName).toEqual(expected.deckName);
    expect(actual.dueNotesCount).toEqual(expected.dueNotesCount);
    expect(actual.newNotes.length).toEqual(expected.newNotesLength);
    expect(actual.scheduledNotes.length).toEqual(expected.scheduledNotesLength);
}

function checkScheduledNote(actual: SchedNote, expected: any): void {
    expect(actual.note.path.endsWith(expected.filename)).toBeTruthy();
    expect(formatDate_YYYY_MM_DD(moment(actual.dueUnix))).toEqual(expected.dueDate);
}

beforeAll(() => {
    setupStaticDateProvider_20230906();
    unitTestSetup_StandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("No questions in the text; no files tagged as notes", async () => {
    const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
    await osrCore.loadTestVault("filesButNoQuestions");
    expect(osrCore.noteReviewQueue.dueNotesCount).toEqual(0);
    expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(0);
    checkDeckTreeCounts(osrCore, 0, 0);
    expect(osrCore.questionPostponementList.list.length).toEqual(0);
});

describe("Notes", () => {
    describe("Testing code that loads from test vault", () => {
        test("Tagged as note, but no OSR frontmatter", async () => {
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
            await osrCore.loadTestVault("notes1");

            expect(osrCore.noteReviewQueue.dueNotesCount).toEqual(0);
            expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(1);

            // Single deck "#review", with single new note "Computation Graph.md"
            const actual: NoteReviewDeck = osrCore.noteReviewQueue.reviewDecks.get("#review");
            checkNoteReviewDeck_Basic(actual, {
                deckName: "#review", 
                dueNotesCount: 0, 
                newNotesLength: 1, 
                scheduledNotesLength: 0
            });
            expect(actual.newNotes[0].path.endsWith("Computation Graph.md")).toBeTruthy();
        });

        test("Tagged as note, and includes OSR frontmatter", async () => {
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
            await osrCore.loadTestVault("notes2");

            expect(osrCore.noteReviewQueue.dueNotesCount).toEqual(0);
            expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(1);

            // Single deck "#review", with single scheduled note "Triboelectric Effect.md", 
            const actual: NoteReviewDeck = osrCore.noteReviewQueue.reviewDecks.get("#review");
            checkNoteReviewDeck_Basic(actual, {
                deckName: "#review", 
                dueNotesCount: 0, 
                newNotesLength: 0, 
                scheduledNotesLength: 1
            });
            checkScheduledNote(actual.scheduledNotes[0], {
                filename: "Triboelectric Effect.md", 
                dueDate: "2025-02-21"
            });
        });    
    });

<<<<<<< Updated upstream
    describe("Review New note (i.e. not previously reviewed); no questions present", () => {
=======
    describe("New note - review response", () => {
>>>>>>> Stashed changes
        test("New note without any backlinks", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes1");

            // Review the note
            const file = osrCore.getFileByNoteName("Computation Graph");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        // The notes that have links to [[A]] themselves haven't been reviewed,
        // So the expected post-review schedule is the same as if no files had links to [[A]]
<<<<<<< Updated upstream
        test("Review note with some backlinks (source files without reviews)", async () => {
=======
        test("New note with some backlinks (source files without reviews)", async () => {
>>>>>>> Stashed changes
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes3");

            // Review the note
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

<<<<<<< Updated upstream
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
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 272);
        });
    });

    describe("Review Old note (i.e. previously reviewed); no questions present", () => {
        test("Review note with a backlink - Good", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests/vaults/readme.md
            // See: tests/vaults/notes4/readme.md
            await osrCore.loadTestVault("notes4");

            // Review note A 
            const file = osrCore.getFileByNoteName("A");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Good, settings);

            // Check note frontmatter - 11 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-17";
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 11, 270);
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
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 2, 250);
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
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
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
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 270);
        });

        test("Review note with a backlink (one source file already reviewed)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);

            // See: tests\vaults\readme.md
            await osrCore.loadTestVault("notes4");

            // Review note B 
=======
        test.only("New note with a backlink (one source file already reviewed)", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadTestVault("notes4");

            // Review note B 
            // note A.md contains:
            //      frontmatter from OSR plugin review of EASY
            //      A link to B.md
>>>>>>> Stashed changes
            const file = osrCore.getFileByNoteName("B");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings);

            // Check note frontmatter - 4 days after the simulated test date of 2023-09-06
            const expectedDueDate: string = "2023-09-10";
            unitTest_CheckNoteFrontmatter(file.content, expectedDueDate, 4, 272);
        });
    });
});
