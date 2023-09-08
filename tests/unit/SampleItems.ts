import { Card } from "src/card";
import { Deck } from "src/deck";
import { Note } from "src/note";
import { NoteParser } from "src/NoteParser";
import { IQuestionContextFinder, NoteQuestionParser, NullImpl_IQuestionContextFinder } from "src/NoteQuestionParser";
import { CardType, Question } from "src/question";
import { CardFrontBack, CardFrontBackUtil } from "src/QuestionType";
import { DEFAULT_SETTINGS } from "src/settings";
import { UnitTestSRFile } from "src/SRFile";
import { TopicPath } from "src/TopicPath";

let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
let questionParser: NoteQuestionParser = new NoteQuestionParser(DEFAULT_SETTINGS, questionContextFinder);
let refDate: Date = new Date(2000, 0, 1);

export class SampleItemDecks {
    static async createSingleLevelTree_NewCards(): Promise<Deck> {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        return await SampleItemDecks.createDeckFromNote(text, new TopicPath(["flashcards"]));
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

    static async createDeckFromNote(text: string, noteTopicPath: TopicPath): Promise<Deck> {
        let deck: Deck = new Deck("Root", null);
        let file: UnitTestSRFile = new UnitTestSRFile(text);
        let topicPath: TopicPath = TopicPath.emptyPath;
        let noteParser: NoteParser = new NoteParser(DEFAULT_SETTINGS, questionContextFinder, noteTopicPath);
        let note: Note = await noteParser.parse(file, noteTopicPath, refDate);
        note.appendCardsToDeck(deck);
        return deck;
    }


}

export class SampleItemCards {
    createScienceQuestions(): Deck {
        let deck: Deck = SampleItemDecks.createScienceTree();


        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Electromagnetism"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Light"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Fluids"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Geometry"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Algebra", "Polynomials"]));
        return deck;
    }

    /* createElectromagnetismCards(): Card[] {
        let text: string = "What is the phenomenon called when electric charge is transferred between two objects when they contact or slide against each other::Triboelectric effect";
        let list: CardFrontBack[] = CardFrontBackUtil.expand(CardType.SingleLineBasic, text, DEFAULT_SETTINGS);
    } */
}


