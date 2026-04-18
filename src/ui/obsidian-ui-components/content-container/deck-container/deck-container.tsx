import "src/ui/obsidian-ui-components/content-container/deck-container/deck-container.css";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { IFlashcardReviewSequencer as IFlashcardReviewSequencer } from "src/card/flashcard-review-sequencer";
import { Deck } from "src/deck/deck";
import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import DeckListComponent from "src/ui/obsidian-ui-components/content-container/deck-container/deck-list";
import DeckListHeaderComponent from "src/ui/obsidian-ui-components/content-container/deck-container/deck-list-header";

export class DeckContainer {
    public plugin: SRPlugin;

    private containerEl: HTMLDivElement;
    private deckList: DeckListComponent;

    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private startReviewOfDeck: (deck: Deck) => void;

    constructor(
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        parentEl: HTMLElement,
        startReviewOfDeck: (deck: Deck) => void,
        closeModal?: () => void,
    ) {
        // Init properties
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.startReviewOfDeck = startReviewOfDeck;

        // Build ui
        this.containerEl = parentEl.createDiv();
        this.containerEl.addClasses(["sr-container", "sr-deck-container", "sr-is-hidden"]);

        new DeckListHeaderComponent(this.containerEl, closeModal);

        this.deckList = new DeckListComponent(this.containerEl);
    }

    /**
     * Shows the DeckListView & rerenders dynamic elements
     */
    show(): void {
        // Redraw in case the stats have changed
        this.deckList.redraw(this.reviewSequencer, this.settings, this.startReviewOfDeck);

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

    /**
     * Closes the DeckListView
     */
    close() {
        this.hide();
    }
}
