import { App, Notice, TFile, Workspace } from "obsidian";
import { SRSettings } from "./settings";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { t } from "./lang/helpers";
import { ReviewDeckSelectionModal } from "./gui/ReviewDeckSelectionModal";

export class NextNoteReviewHandler {
    private app: App;
    private settings: SRSettings;
    private workspace: Workspace;
    private _noteReviewQueue: NoteReviewQueue;
    private _lastSelectedReviewDeck: string;

    get lastSelectedReviewDeck(): string {
        return this._lastSelectedReviewDeck;
    }

    get noteReviewQueue(): NoteReviewQueue {
        return this._noteReviewQueue;
    }
    
    constructor(app: App, settings: SRSettings, workspace: Workspace, noteReviewQueue: NoteReviewQueue) {
        this.app = app;
        this.settings = settings;
        this.workspace = workspace;
        this._noteReviewQueue = noteReviewQueue;
    }
   
    async autoReviewNextNote(): Promise<void> {
        if (this.settings.autoNextNote) {
            if (!this._lastSelectedReviewDeck) {
                const reviewDeckKeys: string[] = Object.keys(this._noteReviewQueue.reviewDecks);
                if (reviewDeckKeys.length > 0) this._lastSelectedReviewDeck = reviewDeckKeys[0];
                else {
                    new Notice(t("ALL_CAUGHT_UP"));
                    return;
                }
            }
            this.reviewNextNote(this._lastSelectedReviewDeck);
        }
    }

    async reviewNextNoteModal(): Promise<void> {
        const reviewDeckNames: string[] = Object.keys(this._noteReviewQueue.reviewDecks);

        if (reviewDeckNames.length === 1) {
            this.reviewNextNote(reviewDeckNames[0]);
        } else {
            const deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }

    async reviewNextNote(deckKey: string): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(this._noteReviewQueue.reviewDecks, deckKey)) {
            new Notice(t("NO_DECK_EXISTS", { deckName: deckKey }));
            return;
        }

        this._lastSelectedReviewDeck = deckKey;
        const deck = this._noteReviewQueue.reviewDecks.get(deckKey);

        if (deck.dueNotesCount > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.dueNotesCount)
                : 0;
            await this.openNote(deckKey, deck.scheduledNotes[index].note.tfile);
            return;
        }

        if (deck.newNotes.length > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
                await this.openNote(deckKey, deck.newNotes[index].tfile);
            return;
        }

        new Notice(t("ALL_CAUGHT_UP"));
    }

    async openNote(deckName: string, file: TFile): Promise<void> {
        this._lastSelectedReviewDeck = deckName;
        await this.app.workspace.getLeaf().openFile(file);
    }
}