import { Deck } from "src/deck";
import { CardOrder, DeckOrder, DeckTreeIterator } from "src/deck-tree-iterator";
import { Note } from "src/note";
import { NoteParser } from "src/note-parser";
import { NoteQuestionParser } from "src/note-question-parser";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TopicPath } from "src/topic-path";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "./helpers/unit-test-file";

export function createTestNoteQuestionParser(settings: SRSettings): NoteQuestionParser {
    const questionParser: NoteQuestionParser = new NoteQuestionParser(settings);
    return questionParser;
}
export function createTestNoteParser(): NoteParser {
    const result = new NoteParser(DEFAULT_SETTINGS);
    return result;
}
export const testRefDate20230906: Date = new Date(2023, 8, 6);

export class SampleItemDecks {
    static async createSingleLevelTreeNewCards(): Promise<Deck> {
        const text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        return await SampleItemDecks.createDeckFromText(text, new TopicPath(["flashcards"]));
    }

    static createScienceTree(): Deck {
        const deck: Deck = new Deck("Root", null);
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
        const file: UnitTestSRFile = new UnitTestSRFile(text);
        return await this.createDeckFromFile(file, folderTopicPath);
    }

    static async createDeckAndIteratorFromText(
        text: string,
        folderTopicPath: TopicPath,
        cardOrder: CardOrder,
        deckOrder: DeckOrder,
    ): Promise<[Deck, DeckTreeIterator]> {
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, folderTopicPath);
        const iterator: DeckTreeIterator = new DeckTreeIterator(
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
        const deck: Deck = new Deck("Root", null);
        const noteParser: NoteParser = createTestNoteParser();
        const note: Note = await noteParser.parse(file, TextDirection.Ltr, folderTopicPath);
        note.appendCardsToDeck(deck);
        return deck;
    }
}
