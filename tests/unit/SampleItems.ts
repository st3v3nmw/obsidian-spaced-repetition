import { Deck } from "src/deck";
import { CardType, Question } from "src/question";
import { CardFrontBack, CardFrontBackUtil } from "src/question-type";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";

export class SampleItemDecks {
    static createScienceTree(): Deck {
        let deck: Deck = new Deck("Root", null);
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Electromagnetism"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Light"]));
        deck.getOrCreateDeck(new TopicPath(["Science", "Physics", "Fluids"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Geometry"]));
        deck.getOrCreateDeck(new TopicPath(["Math", "Algebra", "Polynomials"]));
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

    createElectromagnetismCards(): Card[] {
        let text: string = "What is the phenomenon called when electric charge is transferred between two objects when they contact or slide against each other::Triboelectric effect";
        let list: CardFrontBack[] = CardFrontBackUtil.expand(CardType.SingleLineBasic, text, DEFAULT_SETTINGS);
    }
}


