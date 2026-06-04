import { DataManager } from "src/data/data-manager";
import SRPlugin from "src/main";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import { UIManager, UIState } from "src/ui/ui-manager";

/**
 * Manages the periodic review-reminder loop.
 *
 * The reminder feature depends on loaded settings, synced review data, and a ready UI.
 * Running it earlier risks duplicate startup checks or reminders based on stale state.
 */
export class ReminderManager {
    private plugin: SRPlugin;
    private uiManager: UIManager;
    private dataManager: DataManager;

    private reviewReminderTimer: number | null = null;
    private isReviewReminderChecking: boolean = false;

    constructor(plugin: SRPlugin, uiManager: UIManager, dataManager: DataManager) {
        this.plugin = plugin;
        this.uiManager = uiManager;
        this.dataManager = dataManager;
    }

    /**
     * Restarts the periodic review-reminder loop once the plugin is fully initialized.
     *
     * The reminder feature depends on loaded settings, synced review data, and a ready UI.
     * Running it earlier risks duplicate startup checks or reminders based on stale state.
     */
    public restartReviewReminders() {
        this.stopReviewReminders();
        this.startReviewReminders();
    }

    /**
     * Starts the periodic review-reminder loop once the plugin is fully initialized.
     *
     * The reminder feature depends on loaded settings, synced review data, and a ready UI.
     * Running it earlier risks duplicate startup checks or reminders based on stale state.
     */
    private startReviewReminders() {
        if (!this.plugin.isInitialized || !this.dataManager.data.settings.enableReviewReminders) {
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
    public stopReviewReminders() {
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
            !this.plugin.isInitialized ||
            !this.plugin.isDataManagerLoaded() ||
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
            activeElement.instanceOf(HTMLTextAreaElement) ||
            activeElement.instanceOf(HTMLInputElement)
        ) {
            return true;
        }

        if (activeElement.instanceOf(HTMLElement)) {
            return (
                activeElement.isContentEditable ||
                activeElement.closest(".cm-editor, .markdown-source-view") !== null
            );
        }

        return false;
    }
}
