import { NoteParser } from "src/NoteParser";
import { TopicPath } from "src/TopicPath";
import { Deck } from "src/Deck";
import { Note } from "src/Note";
import { Question } from "src/Question";
import { DEFAULT_SETTINGS } from "src/settings";
import { NoteFileLoader } from "src/NoteFileLoader";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";

let parser: NoteParser = new NoteParser(DEFAULT_SETTINGS);
var noteFileLoader: NoteFileLoader = new NoteFileLoader(DEFAULT_SETTINGS);

describe("appendCardsToDeck", () => {
    test("Multiple questions, single card per question", async () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
Q3::A3
`;
        let file: UnitTestSRFile = new UnitTestSRFile(noteText);
        let folderTopicPath = TopicPath.emptyPath;
        let note: Note = await parser.parse(file, folderTopicPath);
        let deck: Deck = Deck.emptyDeck;
        note.appendCardsToDeck(deck);
        let subdeck: Deck = deck.getDeck(new TopicPath(["flashcards", "test"]));
        expect(subdeck.newFlashcards[0].front).toEqual("Q1");
        expect(subdeck.newFlashcards[1].front).toEqual("Q2");
        expect(subdeck.newFlashcards[2].front).toEqual("Q3");
        expect(subdeck.dueFlashcards.length).toEqual(0);
    });

    test("Multiple questions, multiple cards per question", async () => {
        let noteText: string = `#flashcards/test
Q1:::A1
Q2:::A2
Q3:::A3
`;
        let file: UnitTestSRFile = new UnitTestSRFile(noteText);
        let folderTopicPath = TopicPath.emptyPath;
        let note: Note = await parser.parse(file, folderTopicPath);
        let deck: Deck = Deck.emptyDeck;
        note.appendCardsToDeck(deck);
        let subdeck: Deck = deck.getDeck(new TopicPath(["flashcards", "test"]));
        expect(subdeck.newFlashcards.length).toEqual(6);
        let frontList = subdeck.newFlashcards.map((card) => card.front);

        expect(frontList).toEqual(["Q1", "A1", "Q2", "A2", "Q3", "A3"]);
        expect(subdeck.dueFlashcards.length).toEqual(0);
    });
});

describe("writeNoteFile", () => {
    test("Multiple questions, some with too many schedule details", async () => {
        let originalText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->
`;
        let file: UnitTestSRFile = new UnitTestSRFile(originalText);
        let note: Note = await noteFileLoader.load(file, TopicPath.emptyPath);

        await note.writeNoteFile(DEFAULT_SETTINGS);
        let updatedText: string = file.content;

        let expectedText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->
`;
        expect(updatedText).toEqual(expectedText);
    });
});
