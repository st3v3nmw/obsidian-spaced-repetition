import { TFile } from "obsidian";

import { OsrCore } from "src/data/core";
import { Deck } from "src/data/data-structures/deck/deck";
import { FlashcardReviewMode, IFlashcardReviewSequencer } from "src/flashcard-review-sequencer";
import SRPlugin from "src/main";

export class ReviewQueueLoader {
    private plugin: SRPlugin;
    private osrCore: OsrCore;
    private singleNote: TFile | null = null;
    private reviewMode: FlashcardReviewMode;

    constructor(
        plugin: SRPlugin,
        osrCore: OsrCore,
        singleNote: TFile | null,
        reviewMode: FlashcardReviewMode,
    ) {
        this.osrCore = osrCore;
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
        if (
            this.plugin === null ||
            this.plugin.dataManager === null ||
            this.plugin.dataManager.osrCore === null
        )
            throw new Error("SR plugin or OSR app core not initialized!!!");

        if (!this.plugin.dataManager.syncLock) {
            await this.plugin.dataManager.sync();
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
            deckTree = this.osrCore.reviewableDeckTree;
            remainingDeckTree =
                this.reviewMode === FlashcardReviewMode.Cram
                    ? this.osrCore.reviewableDeckTree
                    : this.osrCore.remainingDeckTree;
        }

        const reviewSequencerData = this.plugin.getPreparedReviewSequencer(
            deckTree,
            remainingDeckTree,
            this.reviewMode,
        );

        return reviewSequencerData.reviewSequencer;
    }
}
