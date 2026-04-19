import "src/ui/obsidian-ui-components/content-container/deck-container/deck-container.css";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { IFlashcardReviewSequencer as IFlashcardReviewSequencer } from "src/card/flashcard-review-sequencer";
import { Deck } from "src/deck/deck";
import { SRSettings } from "src/settings";
import DeckListComponent from "src/ui/obsidian-ui-components/content-container/deck-container/deck-list";
import DeckListHeaderComponent from "src/ui/obsidian-ui-components/content-container/deck-container/deck-list-header";

export class DeckContainer {
    private containerEl: HTMLDivElement;
    private deckList: DeckListComponent;

    constructor(
        parentEl: HTMLElement,
        startReviewOfDeck: (deck: Deck) => void,
        closeModal?: () => void,
    ) {
        // Build ui
        this.containerEl = parentEl.createDiv();
        this.containerEl.addClasses(["sr-container", "sr-deck-container", "sr-is-hidden"]);

        new DeckListHeaderComponent(this.containerEl, closeModal);

        this.deckList = new DeckListComponent(this.containerEl, startReviewOfDeck);
    }

    /**
     * Shows the DeckListView & rerenders dynamic elements
     */
    show(reviewSequencer: IFlashcardReviewSequencer, settings: SRSettings) {
        // Redraw in case the stats have changed
        this.deckList.redraw(reviewSequencer, settings);

        if (this.containerEl.hasClass("sr-is-hidden")) {
            this.containerEl.removeClass("sr-is-hidden");
        }
    }

    /**
     * Hides the DeckListView
     */
    hide() {
        if (!this.containerEl.hasClass("sr-is-hidden")) {
            this.containerEl.addClass("sr-is-hidden");
        }
    }

    redrawWithNewData(reviewSequencer: IFlashcardReviewSequencer, settings: SRSettings) {
        this.deckList.redraw(reviewSequencer, settings);
    }
}
