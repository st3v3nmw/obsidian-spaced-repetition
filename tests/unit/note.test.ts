import { Card } from "src/data/data-structures/card/card";
import { generateCardId, isValidCardId } from "src/data/data-structures/card/card-id";
import { Deck } from "src/data/data-structures/deck/deck";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { ensureCardId } from "src/history/ensure-card-id";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteParser } from "src/note/note-parser";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "./helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

const parser: NoteParser = new NoteParser(DEFAULT_SETTINGS);
const noteFileLoader: NoteFileLoader = new NoteFileLoader(DEFAULT_SETTINGS);

beforeAll(() => {
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("appendCardsToDeck", () => {
    test("Multiple questions, single card per question", async () => {
        const noteText: string = `#flashcards/test
Q1::A1
Q2::A2
Q3::A3
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const folderTopicPath = TopicPath.emptyPath;
        const note: Note = await parser.parse(file, TextDirection.Ltr, folderTopicPath);
        const deck: Deck = Deck.emptyDeck;
        note.appendCardsToDeck(deck);
        const subdeck: Deck = deck.getDeck(new TopicPath(["flashcards", "test"]));
        expect(subdeck.newRepItems[0].front).toEqual("Q1");
        expect(subdeck.newRepItems[1].front).toEqual("Q2");
        expect(subdeck.newRepItems[2].front).toEqual("Q3");
        expect(subdeck.dueRepItems.length).toEqual(0);
    });

    test("Multiple questions, multiple cards per question", async () => {
        const noteText: string = `#flashcards/test
Q1:::A1
Q2:::A2
Q3:::A3
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const folderTopicPath = TopicPath.emptyPath;
        const note: Note = await parser.parse(file, TextDirection.Ltr, folderTopicPath);
        const deck: Deck = Deck.emptyDeck;
        note.appendCardsToDeck(deck);
        const subdeck: Deck = deck.getDeck(new TopicPath(["flashcards", "test"]));
        expect(subdeck.newRepItems.length).toEqual(6);
        const frontList = subdeck.newRepItems.map((card) => card.front);

        expect(frontList).toEqual(["Q1", "A1", "Q2", "A2", "Q3", "A3"]);
        expect(subdeck.dueRepItems.length).toEqual(0);
    });
});

describe("writeNoteFile", () => {
    test("Multiple questions, some with too many schedule details", async () => {
        const originalText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->
`;
        const file: UnitTestSRFile = new UnitTestSRFile(originalText);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);

        await note.writeNoteFile(DEFAULT_SETTINGS);
        const updatedText: string = file.content;

        const expectedText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->
`;
        expect(updatedText).toEqual(expectedText);
    });
});

describe("Suspended cards", () => {
    const suspendedNoteText: string = `#flashcards/test
Q1::A1 <!--SR:!2023-09-02,4,270,suspended-->
Q2::A2
Q3:::A3 <!--SR:!2000-01-01,1,250,suspended!2023-09-02,5,270-->
`;

    test("Suspended cards are not appended to any deck", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(suspendedNoteText);
        const note: Note = await parser.parse(file, TextDirection.Ltr, TopicPath.emptyPath);

        expect(note.questionList[0].cards[0].isSuspended).toEqual(true);
        expect(note.questionList[1].cards[0].isSuspended).toEqual(false);
        expect(note.questionList[2].cards.map((card) => card.isSuspended)).toEqual([true, false]);

        const deck: Deck = new Deck("Root", null);
        note.appendCardsToDeck(deck);
        const subdeck: Deck = deck.getDeck(new TopicPath(["flashcards", "test"]));
        expect(subdeck.newRepItems.map((card) => card.front)).toEqual(["Q2"]);
        expect(subdeck.dueRepItems.map((card) => card.front)).toEqual(["A3"]);
    });

    test("Writing the note keeps the suspended flags", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(suspendedNoteText);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        note.questionList.forEach((question) => (question.hasChanged = true));

        await note.writeNoteFile({ ...DEFAULT_SETTINGS, cardCommentOnSameLine: true });
        expect(file.content).toEqual(suspendedNoteText);
    });

    test("unsuspendAllCards removes every suspended flag", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(suspendedNoteText);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);

        expect(note.unsuspendAllCards()).toEqual(2);
        expect(note.unsuspendAllCards()).toEqual(0);

        await note.writeNoteFile({ ...DEFAULT_SETTINGS, cardCommentOnSameLine: true });
        expect(file.content).toEqual(`#flashcards/test
Q1::A1 <!--SR:!2023-09-02,4,270-->
Q2::A2
Q3:::A3 <!--SR:!2000-01-01,1,250!2023-09-02,5,270-->
`);
    });

    test("Unsuspending a never reviewed card removes the scheduling comment", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(`#flashcards/test
Q1::A1 <!--SR:!2000-01-01,1,250,suspended-->
`);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);

        expect(note.unsuspendAllCards()).toEqual(1);
        await note.writeNoteFile({ ...DEFAULT_SETTINGS, cardCommentOnSameLine: true });
        expect(file.content).toEqual(`#flashcards/test
Q1::A1
`);
    });
});

describe("Card ids", () => {
    const noteTextWithIds: string = `#flashcards/test
Q1::A1 <!--SR:!2023-09-02,4,270,id=aaa111-->
Q2::A2
Q3:::A3 <!--SR:!2000-01-01,1,250,suspended,id=bbb222!2023-09-02,5,270-->
`;

    test("Card ids are read from the scheduling comment", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(noteTextWithIds);
        const note: Note = await parser.parse(file, TextDirection.Ltr, TopicPath.emptyPath);

        expect(note.questionList[0].cards[0].id).toEqual("aaa111");
        expect(note.questionList[1].cards[0].id).toBeNull();
        expect(note.questionList[2].cards.map((card) => card.id)).toEqual(["bbb222", null]);
    });

    test("Writing the note keeps the card ids", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(noteTextWithIds);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        note.questionList.forEach((question) => (question.hasChanged = true));

        await note.writeNoteFile({ ...DEFAULT_SETTINGS, cardCommentOnSameLine: true });
        expect(file.content).toEqual(noteTextWithIds);
    });

    test("ensureCardId stores a new id in the scheduling comment of a never reviewed card", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(`#flashcards/test
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
`);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        const card1: Card = note.questionList[0].cards[0];
        const card2: Card = note.questionList[1].cards[0];

        const id1: string = await ensureCardId(card1);
        const id2: string = await ensureCardId(card2);
        expect(id1).toMatch(/^[0-9a-z]{12}$/);
        expect(id2).toMatch(/^[0-9a-z]{12}$/);
        expect(id1).not.toEqual(id2);

        // Existing ids are kept
        expect(await ensureCardId(card1)).toEqual(id1);

        expect(file.content).toEqual(`#flashcards/test
Q1::A1
<!--SR:!2000-01-01,1,250,id=${id1}-->
Q2::A2
<!--SR:!2023-09-02,4,270,id=${id2}-->
`);

        // And read back on the next load
        const reloaded: Note = await noteFileLoader.load(
            file,
            TextDirection.Ltr,
            TopicPath.emptyPath,
        );
        expect(reloaded.questionList[0].cards[0].id).toEqual(id1);
        expect(reloaded.questionList[0].cards[0].isNew).toEqual(true);
        expect(reloaded.questionList[1].cards[0].id).toEqual(id2);
    });

    test("ensureCardId throws if the card's text changed in the note", async () => {
        const file: UnitTestSRFile = new UnitTestSRFile(`#flashcards/test
Q1::A1
`);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        file.content = `#flashcards/test
Q1::B1
`;
        await expect(ensureCardId(note.questionList[0].cards[0])).rejects.toThrow(
            /changed in the note/,
        );
        expect(note.questionList[0].cards[0].id).toBeNull();
    });
});

describe("generateCardId", () => {
    test("Generates distinct valid ids", () => {
        const ids: Set<string> = new Set();
        for (let i = 0; i < 1000; i++) {
            const id: string = generateCardId();
            expect(id).toMatch(/^[0-9a-z]{12}$/);
            expect(isValidCardId(id)).toEqual(true);
            ids.add(id);
        }
        expect(ids.size).toEqual(1000);
    });
});
