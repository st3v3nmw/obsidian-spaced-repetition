import { TFile } from "obsidian";

import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { OsrAppCore } from "src/core";
import { Deck } from "src/deck/deck";
import SRPlugin from "src/main";

export class ReviewQueueLoader {
    private plugin: SRPlugin;
    private osrAppCore: OsrAppCore;
    private singleNote: TFile | null = null;
    private reviewMode: FlashcardReviewMode;

    constructor(
        plugin: SRPlugin,
        osrAppCore: OsrAppCore,
        singleNote: TFile | null,
        reviewMode: FlashcardReviewMode,
    ) {
        this.osrAppCore = osrAppCore;
        this.singleNote = singleNote;
        this.reviewMode = reviewMode;
        this.plugin = plugin;
    }

    public getSingleNote(): TFile | null {
        return this.singleNote;
    }

    public getReviewMode(): FlashcardReviewMode {
        return this.reviewMode;
    }

    setReviewMode(reviewMode: FlashcardReviewMode) {
        this.reviewMode = reviewMode;
    }

    public async loadReviewQueue(): Promise<IFlashcardReviewSequencer> {
        if (!this.plugin.osrAppCore.syncLock) {
            await this.plugin.sync();
        }

        let deckTree: Deck;
        let remainingDeckTree: Deck;

        if (this.singleNote) {
            const singleNoteDeckData = await this.plugin.getPreparedDecksForSingleNoteReview(
                this.singleNote,
                this.reviewMode,
            );

            deckTree = singleNoteDeckData.deckTree;
            remainingDeckTree = singleNoteDeckData.remainingDeckTree;
        } else {
            deckTree = this.osrAppCore.reviewableDeckTree;
            remainingDeckTree =
                this.reviewMode === FlashcardReviewMode.Cram
                    ? this.osrAppCore.reviewableDeckTree
                    : this.osrAppCore.remainingDeckTree;
        }

        const reviewSequencerData = this.plugin.getPreparedReviewSequencer(
            deckTree,
            remainingDeckTree,
            this.reviewMode,
        );

        return reviewSequencerData.reviewSequencer;
    }
}
