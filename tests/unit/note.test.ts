import { Deck } from "src/deck";
import { Note } from "src/note";
import { NoteFileLoader } from "src/note-file-loader";
import { NoteParser } from "src/note-parser";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";
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
        expect(subdeck.newFlashcards[0].front).toEqual("Q1");
        expect(subdeck.newFlashcards[1].front).toEqual("Q2");
        expect(subdeck.newFlashcards[2].front).toEqual("Q3");
        expect(subdeck.dueFlashcards.length).toEqual(0);
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
        expect(subdeck.newFlashcards.length).toEqual(6);
        const frontList = subdeck.newFlashcards.map((card) => card.front);

        expect(frontList).toEqual(["Q1", "A1", "Q2", "A2", "Q3", "A3"]);
        expect(subdeck.dueFlashcards.length).toEqual(0);
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
