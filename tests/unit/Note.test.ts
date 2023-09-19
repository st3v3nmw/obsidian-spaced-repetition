import { NoteParser } from "src/NoteParser";
import { UnitTestSRFile } from "src/SRFile";
import { TopicPath } from "src/TopicPath";
import { Deck } from "src/Deck";
import { Note } from "src/Note";
import { Question } from "src/Question";
import { DEFAULT_SETTINGS } from "src/settings";

let parser: NoteParser = new NoteParser(DEFAULT_SETTINGS);
let refDate: Date = new Date(2023, 8, 6);

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

