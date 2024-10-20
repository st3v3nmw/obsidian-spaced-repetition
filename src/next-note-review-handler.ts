import { App, Notice, TFile } from "obsidian";

import { ReviewDeckSelectionModal } from "src/gui/review-deck-selection-modal";
import { t } from "src/lang/helpers";
import { NoteReviewQueue } from "src/note-review-queue";
import { SRSettings } from "src/settings";

export class NextNoteReviewHandler {
    private app: App;
    private settings: SRSettings;
    private _noteReviewQueue: NoteReviewQueue;
    private _lastSelectedReviewDeck: string;

    get lastSelectedReviewDeck(): string {
        return this._lastSelectedReviewDeck;
    }

    get noteReviewQueue(): NoteReviewQueue {
        return this._noteReviewQueue;
    }

    constructor(app: App, settings: SRSettings, noteReviewQueue: NoteReviewQueue) {
        this.app = app;
        this.settings = settings;
        this._noteReviewQueue = noteReviewQueue;
    }

    async autoReviewNextNote(): Promise<void> {
        if (this.settings.autoNextNote) {
            if (!this._lastSelectedReviewDeck) {
                const reviewDeckKeys: string[] = this._noteReviewQueue.reviewDeckNameList;
                if (reviewDeckKeys.length > 0) this._lastSelectedReviewDeck = reviewDeckKeys[0];
                else {
                    // 2024-07-05 existing functionality: Code doesn't look at other decks
                    new Notice(t("ALL_CAUGHT_UP"));
                    return;
                }
            }
            this.reviewNextNote(this._lastSelectedReviewDeck);
        }
    }

    async reviewNextNoteModal(): Promise<void> {
        const reviewDeckNames: string[] = this._noteReviewQueue.reviewDeckNameList;

        if (reviewDeckNames.length === 1) {
            // There is only one deck, so no need to ask the user to make a selection
            this.reviewNextNote(reviewDeckNames[0]);
        } else {
            const deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }

    async reviewNextNote(deckKey: string): Promise<void> {
        if (!this._noteReviewQueue.reviewDeckNameList.contains(deckKey)) {
            new Notice(t("NO_DECK_EXISTS", { deckName: deckKey }));
            return;
        }

        this._lastSelectedReviewDeck = deckKey;
        const deck = this._noteReviewQueue.reviewDecks.get(deckKey);
        const notefile = deck.determineNextNote(this.settings.openRandomNote);

        if (notefile) {
            await this.openNote(deckKey, notefile.tfile);
        } else {
            new Notice(t("ALL_CAUGHT_UP"));
        }
    }

    async openNote(deckName: string, file: TFile): Promise<void> {
        this._lastSelectedReviewDeck = deckName;
        await this.app.workspace.getLeaf().openFile(file);
    }
}
