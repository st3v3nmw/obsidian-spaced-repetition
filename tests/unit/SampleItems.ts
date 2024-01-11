import { Card } from "src/Card";
import { Deck } from "src/Deck";
import { Note } from "src/Note";
import { NoteParser } from "src/NoteParser";
import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardType, Question } from "src/Question";
import { CardFrontBack, CardFrontBackUtil } from "src/QuestionType";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TopicPath } from "src/TopicPath";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";
import { CardOrder, DeckOrder, DeckTreeIterator } from "src/DeckTreeIterator";

export function createTest_NoteQuestionParser(settings: SRSettings): NoteQuestionParser {
    let questionParser: NoteQuestionParser = new NoteQuestionParser(settings);
    return questionParser;
}
export function createTest_NoteParser(): NoteParser {
    let result = new NoteParser(DEFAULT_SETTINGS);
    return result;
}
export const test_RefDate_20230906: Date = new Date(2023, 8, 6);

export class SampleItemDecks {
    static async createSingleLevelTree_NewCards(): Promise<Deck> {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        return await SampleItemDecks.createDeckFromText(text, new TopicPath(["flashcards"]));
    }

    static createScienceTree(): Deck {
        let deck: Deck = new Deck("Root", null);
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Electromagnetism"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Light"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Fluids"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Geometry"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Algebra", "Polynomials"]));
        return deck;
    }

    static async createDeckFromText(
        text: string,
        folderTopicPath: TopicPath = TopicPath.emptyPath,
    ): Promise<Deck> {
        let file: UnitTestSRFile = new UnitTestSRFile(text);
        return await this.createDeckFromFile(file, folderTopicPath);
    }

    static async createDeckAndIteratorFromText(
        text: string,
        folderTopicPath: TopicPath,
        cardOrder: CardOrder,
        deckOrder: DeckOrder,
    ): Promise<[Deck, DeckTreeIterator]> {
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, folderTopicPath);
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            {
                cardOrder,
                deckOrder,
            },
            deck,
        );
        return [deck, iterator];
    }

    static async createDeckFromFile(
        file: UnitTestSRFile,
        folderTopicPath: TopicPath = TopicPath.emptyPath,
    ): Promise<Deck> {
        let deck: Deck = new Deck("Root", null);
        let noteParser: NoteParser = createTest_NoteParser();
        let note: Note = await noteParser.parse(file, folderTopicPath);
        note.appendCardsToDeck(deck);
        return deck;
    }
}
