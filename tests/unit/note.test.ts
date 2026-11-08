import { Deck } from "src/data/data-structures/deck/deck";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS } from "src/data/settings";
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
