import { Plugin, TFile } from "obsidian";

import { CommandManager } from "src/command-manager";
import { DataManager } from "src/data/data-manager";
import { Deck, DeckTreeFilter } from "src/data/data-structures/deck/deck";
import {
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
    RepItemOrder,
} from "src/data/data-structures/deck/deck-tree-iterator";
import { SRSettings } from "src/data/settings";
import { LocaleManagerInstance } from "src/lang/locale-manager";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { Note } from "src/note/note";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/scheduling/flashcard-review-sequencer";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/ui/obsidian-ui-components/item-views/review-queue-list-view";
import { UIManager, UIState } from "src/ui/ui-manager";
import { TextDirection } from "src/utils/strings";

export default class SRPlugin extends Plugin {
    private _uiManager: UIManager | null = null;
    private _dataManager: DataManager | null = null;

    private _nextNoteReviewHandler: NextNoteReviewHandler | null = null;
    private _commandManager: CommandManager | null = null;
    public isInitialized: boolean = false;
    private reviewReminderTimer: number | null = null;
    private isReviewReminderChecking: boolean = false;

    onload(): void {
        this.uiManager = new UIManager(this);
        this.commandManager = new CommandManager(this);

        this.app.workspace.onLayoutReady(async () => {
            this.dataManager = new DataManager(this);
            await this.dataManager.loadData();

            // Set the preferred locale if it is not the default
            if (this.dataManager.data.settings.preferredLocale !== "-") {
                LocaleManagerInstance.getInstance().currentLocale =
                    this.dataManager.data.settings.preferredLocale;
            }

            const noteReviewQueue = new NoteReviewQueue();
            this._nextNoteReviewHandler = new NextNoteReviewHandler(
                this.app,
                this.dataManager.data.settings,
                noteReviewQueue,
            );

            await this.dataManager.initOSRCore(noteReviewQueue, async () => {
                await this.onOsrVaultDataChanged();
            });

            await this.uiManager.onLayoutReady();
            this.commandManager.onLayoutReady();

            this.isInitialized = true;
            this.restartReviewReminders();
        });
    }

    get uiManager(): UIManager {
        if (this._uiManager === null) throw new Error("UI manager not initialized!!!");
        return this._uiManager;
    }

    set uiManager(uiManager: UIManager) {
        this._uiManager = uiManager;
    }

    get nextNoteReviewHandler(): NextNoteReviewHandler {
        if (this._nextNoteReviewHandler === null)
            throw new Error("Next note review handler not initialized!!!");
        return this._nextNoteReviewHandler;
    }

    get commandManager(): CommandManager {
        if (this._commandManager === null) throw new Error("Command manager not initialized!!!");
        return this._commandManager;
    }

    set commandManager(commandManager: CommandManager) {
        this._commandManager = commandManager;
    }

    isUiManagerLoaded(): boolean {
        return this._uiManager !== null;
    }

    get dataManager(): DataManager {
        if (this._dataManager === null) throw new Error("Data manager not initialized!!!");
        return this._dataManager;
    }

    set dataManager(dataManager: DataManager) {
        this._dataManager = dataManager;
    }

    isDataManagerLoaded(): boolean {
        return this._dataManager !== null;
    }

    onunload(): void {
        this.stopReviewReminders();
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
        this.uiManager.destroy();
        this.commandManager.onunload();
    }

    public restartReviewReminders() {
        this.stopReviewReminders();
        this.startReviewReminders();
    }

    public addCustomHotkeys() {
        this.commandManager.addCustomHotkeys();
    }

    public removeCustomHotkeys() {
        this.commandManager.removeCustomHotkeys();
    }

    public getPreparedReviewSequencer(
        fullDeckTree: Deck,
        remainingDeckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): { reviewSequencer: IFlashcardReviewSequencer; mode: FlashcardReviewMode } {
        const deckIterator: IDeckTreeIterator = SRPlugin.createDeckTreeIterator(
            this.dataManager.data.settings,
        );

        const reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            deckIterator,
            this.dataManager.data.settings,
            SRAlgorithm.getInstance(),
            this.dataManager.osrCore.questionPostponementList,
            this.dataManager.osrCore.dueDateFlashcardHistogram,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        return { reviewSequencer, mode: reviewMode };
    }

    public async getPreparedDecksForSingleNoteReview(
        file: TFile,
        mode: FlashcardReviewMode,
    ): Promise<{ deckTree: Deck; remainingDeckTree: Deck; mode: FlashcardReviewMode }> {
        const note: Note | null = await this.dataManager.loadNote(file);

        const deckTree = new Deck("root", null);
        if (note) {
            note.appendCardsToDeck(deckTree);
        }
        const remainingDeckTree = DeckTreeFilter.filterForRemainingRepItems(
            this.dataManager.osrCore.questionPostponementList,
            deckTree,
            mode,
        );

        return { deckTree, remainingDeckTree, mode };
    }

    /**
     * Gets the text direction setting for the current Obsidian instance.
     */
    public getObsidianRtlSetting(): TextDirection {
        return activeDocument.body.hasClass("mod-rtl") ? TextDirection.Rtl : TextDirection.Ltr;
    }

    /**
     * Called when the OSR app core's data has changed.
     *
     * Anything that needs to be updated in the UI because of this change should be done here.
     */
    private async onOsrVaultDataChanged() {
        await this.uiManager.updateStatusBar();
        if (this.dataManager.data.settings.enableNoteReviewPaneOnStartup) {
            this.uiManager.sidebarManager.redraw();
        }
    }

    /**
     * Starts the periodic review-reminder loop once the plugin is fully initialized.
     *
     * The reminder feature depends on loaded settings, synced review data, and a ready UI.
     * Running it earlier risks duplicate startup checks or reminders based on stale state.
     */
    private startReviewReminders() {
        if (!this.isInitialized || !this.dataManager.data.settings.enableReviewReminders) {
            return;
        }

        if (this.dataManager.data.settings.reviewReminderCheckOnStartup) {
            // Startup checking is a one-shot pass. The periodic interval below remains the only
            // long-lived scheduler so reminder timing stays predictable.
            void this.checkReviewReminders();
        }

        const intervalMinutes = Math.min(
            Math.max(this.dataManager.data.settings.reviewReminderIntervalMinutes, 1),
            1440,
        );
        this.reviewReminderTimer = window.setInterval(
            () => {
                void this.checkReviewReminders();
            },
            intervalMinutes * 60 * 1000,
        );
    }

    /**
     * Stops the reminder interval and clears the in-flight guard.
     *
     * The guard is reset here as well so that disabling and immediately re-enabling reminders
     * never leaves the scheduler stuck in a "currently checking" state.
     */
    private stopReviewReminders() {
        if (this.reviewReminderTimer !== null) {
            window.clearInterval(this.reviewReminderTimer);
            this.reviewReminderTimer = null;
        }
        this.isReviewReminderChecking = false;
    }

    /**
     * Performs a single reminder check.
     *
     * We intentionally short-circuit when SR is already open, the user is editing text, or a
     * sync is already running. In those states, a reminder would be either redundant or
     * disruptive, and auto-opening review would compete with the user's current context.
     */
    private async checkReviewReminders() {
        if (
            !this.isInitialized ||
            !this.isDataManagerLoaded() ||
            !this.dataManager.isOsrCoreLoaded() ||
            this.isReviewReminderChecking ||
            !this.dataManager.data.settings.enableReviewReminders
        ) {
            return;
        }

        if (this.uiManager.uiState !== UIState.Closed || this.uiManager.isSRInFocus) {
            return;
        }

        if (this.isUserEditingText() || this.dataManager.syncLock) {
            return;
        }

        this.isReviewReminderChecking = true;
        try {
            await this.dataManager.sync();

            const remainingDeckTree = this.dataManager.osrCore.remainingDeckTree;
            if (remainingDeckTree === null) {
                return;
            }

            const reviewCardCount = remainingDeckTree.getDistinctRepItemCount(
                RepItemState.AnyItem,
                true,
            );
            if (
                reviewCardCount <= 0 ||
                this.uiManager.uiState !== UIState.Closed ||
                this.uiManager.isSRInFocus ||
                this.isUserEditingText()
            ) {
                return;
            }

            await this.uiManager.notifyReviewReminder();

            if (this.dataManager.data.settings.reviewReminderAutoOpen) {
                // Attention and navigation are separate concerns: users can keep the reminder
                // signal without consenting to review auto-open, or enable both together.
                await this.uiManager.openDeckContainer(FlashcardReviewMode.Review);
            }
        } finally {
            this.isReviewReminderChecking = false;
        }
    }

    /**
     * Detects whether the user is actively typing in Obsidian.
     *
     * The reminder flow uses this to avoid stealing focus or opening review while the user is in
     * a text field, contenteditable surface, or CodeMirror-backed editor.
     */
    private isUserEditingText(): boolean {
        const activeElement = activeDocument.activeElement;
        if (activeElement === null) {
            return false;
        }

        if (
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLInputElement
        ) {
            return true;
        }

        if (activeElement instanceof HTMLElement) {
            return (
                activeElement.isContentEditable ||
                activeElement.closest(".cm-editor, .markdown-source-view") !== null
            );
        }

        return false;
    }

    private static createDeckTreeIterator(settings: SRSettings): IDeckTreeIterator {
        let cardOrder: RepItemOrder =
            RepItemOrder[settings.flashcardCardOrder as keyof typeof RepItemOrder];
        if (cardOrder === undefined) cardOrder = RepItemOrder.DueFirstSequential;
        let deckOrder: DeckOrder = DeckOrder[settings.flashcardDeckOrder as keyof typeof DeckOrder];
        if (deckOrder === undefined) deckOrder = DeckOrder.PrevDeckComplete_Sequential;

        const iteratorOrder: IIteratorOrder = {
            deckOrder,
            repItemOrder: cardOrder,
        };
        return new DeckTreeIterator(iteratorOrder, null);
    }
}
