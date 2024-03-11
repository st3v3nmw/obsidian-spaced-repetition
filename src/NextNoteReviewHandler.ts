import { App, Notice, Workspace } from "obsidian";
import { SRSettings } from "./settings";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { t } from "./lang/helpers";
import { ReviewDeckSelectionModal } from "./gui/ReviewDeckSelectionModal";

export class NextNoteReviewHandler {
    private app: App;
    private settings: SRSettings;
    private workspace: Workspace;
    public noteReviewQueue: NoteReviewQueue;
    public lastSelectedReviewDeck: string;
    
    constructor(app: App, settings: SRSettings, workspace: Workspace, noteReviewQueue: NoteReviewQueue) {
        this.app = app;
        this.settings = settings;
        this.workspace = workspace;
        this.noteReviewQueue = noteReviewQueue;
    }
   
    async autoReviewNextNote(): Promise<void> {
        if (this.settings.autoNextNote) {
            if (!this.lastSelectedReviewDeck) {
                const reviewDeckKeys: string[] = Object.keys(this.noteReviewQueue.reviewDecks);
                if (reviewDeckKeys.length > 0) this.lastSelectedReviewDeck = reviewDeckKeys[0];
                else {
                    new Notice(t("ALL_CAUGHT_UP"));
                    return;
                }
            }
            this.reviewNextNote(this.lastSelectedReviewDeck);
        }
    }

    async reviewNextNoteModal(): Promise<void> {
        const reviewDeckNames: string[] = Object.keys(this.noteReviewQueue.reviewDecks);

        if (reviewDeckNames.length === 1) {
            this.reviewNextNote(reviewDeckNames[0]);
        } else {
            const deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }

    async reviewNextNote(deckKey: string): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(this.noteReviewQueue.reviewDecks, deckKey)) {
            new Notice(t("NO_DECK_EXISTS", { deckName: deckKey }));
            return;
        }

        this.lastSelectedReviewDeck = deckKey;
        const deck = this.noteReviewQueue.reviewDecks.get(deckKey);

        if (deck.dueNotesCount > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.dueNotesCount)
                : 0;
            await this.workspace.getLeaf().openFile(deck.scheduledNotes[index].note.tfile);
            return;
        }

        if (deck.newNotes.length > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
            this.workspace.getLeaf().openFile(deck.newNotes[index].tfile);
            return;
        }

        new Notice(t("ALL_CAUGHT_UP"));
    }

}