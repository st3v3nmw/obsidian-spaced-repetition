import { OsrCore } from "src/OsrCore";
import { UnitTestOsrCore } from "./helpers/UnitTestOsrCore";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { CardListType } from "src/Deck";
import { unitTestSetup_StandardDataStoreAlgorithm } from "./helpers/UnitTestSetup";
import { NoteReviewDeck, SchedNote } from "src/NoteReviewDeck";
import { DateUtil } from "src/util/DateProvider";
import { formatDate_YYYY_MM_DD } from "src/util/utils";
import moment from "moment";
import { ReviewResponse } from "src/algorithms/base/RepetitionItem";

interface IExpected {
    dueNotesCount: number;
}

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
    unitTestSetup_StandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("No questions in the text; no files tagged as notes", async () => {
    const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
    await osrCore.loadVault("filesButNoQuestions");
    const expected: IExpected =  {
        dueNotesCount: 0
    };
    expect(osrCore.noteReviewQueue.dueNotesCount).toEqual(0);
    expect(osrCore.noteReviewQueue.reviewDecks.size).toEqual(0);
    checkDeckTreeCounts(osrCore, 0, 0);
    expect(osrCore.questionPostponementList.list.length).toEqual(0);
});

describe("Notes", () => {
    describe("Loading from vault", () => {
        test("Tagged as note, but no OSR frontmatter", async () => {
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
            await osrCore.loadVault("notes1");

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
            await osrCore.loadVault("notes2");

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

    describe("Saving note's review response", () => {
        test("New note", async () => {
            const settings: SRSettings = { ...DEFAULT_SETTINGS };
            const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
            await osrCore.loadVault("notes1");

            // Review the note
            const file = osrCore.getFile("Computation Graph.md");
            await osrCore.saveNoteReviewResponse(file, ReviewResponse.Easy, settings)
            const noteContent: string = file.content;

            // TODO: Check note frontmatter
        });
    });
});

