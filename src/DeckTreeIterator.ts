import { Card } from "./card";
import { Deck } from "./deck";

export interface IDeckTreeIterator {
    get currentDeck(): Deck;
    get currentCard(): Card;
    setTree(remainingTree: Deck): void;
    setDeck(deck: Deck): void;
    nextCard(): boolean;
}

export class DeckTreeSequentialIterator implements IDeckTreeIterator {
    setDeck(deck: Deck): void {

    }

    nextCard(): boolean {
        if (this.newFlashcards.length + this.dueFlashcards.length === 0) {
            if (this.dueFlashcardsCount + this.newFlashcardsCount > 0) {
                for (const deck of this.subdecks) {
                    if (deck.dueFlashcardsCount + deck.newFlashcardsCount > 0) {
                        modal.currentDeck = deck;
                        deck.nextCard(modal);
                        return;
                    }
                }
            }

            if (this.parent == modal.checkDeck) {
                modal.plugin.data.historyDeck = "";
                modal.decksList();
            } else {
                this.parent.nextCard(modal);
            }
            return;
        }
    }
}