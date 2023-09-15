import { Card } from "src/Card";
import { Deck } from "src/Deck";
import { Note } from "src/Note";
import { NoteParser } from "src/NoteParser";
import { IQuestionContextFinder, NoteQuestionParser, NullImpl_IQuestionContextFinder } from "src/NoteQuestionParser";
import { CardType, Question } from "src/Question";
import { CardFrontBack, CardFrontBackUtil } from "src/QuestionType";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { UnitTestSRFile } from "src/SRFile";
import { TopicPath } from "src/TopicPath";

export function createTest_NoteQuestionParser(settings: SRSettings) : NoteQuestionParser {
    let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
    let questionParser: NoteQuestionParser = new NoteQuestionParser(settings, questionContextFinder);
    return questionParser;
}
export function createTest_NoteParser() : NoteParser {
    let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
    let result = new NoteParser(DEFAULT_SETTINGS, questionContextFinder);
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

    static async createDeckFromText(text: string, folderTopicPath: TopicPath): Promise<Deck> {
        let file: UnitTestSRFile = new UnitTestSRFile(text);
        return await this.createDeckFromFile(file, folderTopicPath);
    }

    static async createDeckFromFile(file: UnitTestSRFile, folderTopicPath: TopicPath): Promise<Deck> {
        let deck: Deck = new Deck("Root", null);
        let topicPath: TopicPath = TopicPath.emptyPath;
        let noteParser: NoteParser = createTest_NoteParser();
        let note: Note = await noteParser.parse(file, folderTopicPath);
        note.appendCardsToDeck(deck);
        return deck;
    }

}


