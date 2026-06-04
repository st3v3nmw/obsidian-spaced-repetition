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
import { DebugLoggerInstance } from "src/data/debug-logger";
import { PluginDataError, PluginDataManager } from "src/data/plugin-data-manager";
import { SRSettings } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
import { LocaleManagerInstance } from "src/lang/locale-manager";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { Note } from "src/note/note";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/scheduling/flashcard-review-sequencer";
import { ReminderManager } from "src/scheduling/reminder-manager";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/ui/obsidian-ui-components/item-views/review-queue-list-view";
import { UIManager } from "src/ui/ui-manager";
import { TextDirection } from "src/utils/strings";

export default class SRPlugin extends Plugin {
    private _uiManager: UIManager | null = null;
    private _dataManager: DataManager | null = null;

    private _nextNoteReviewHandler: NextNoteReviewHandler | null = null;
    private _commandManager: CommandManager | null = null;
    private _reminderManager: ReminderManager | null = null;
    public isInitialized: boolean = false;

    async onload(): Promise<void> {
        try {
            // Load the plugin data and settings first, as other components depend on it being available during their initialization.
            const pluginDataManager = new PluginDataManager(this);
            await pluginDataManager.loadData();

            const settingsManager = new SettingsManager(
                pluginDataManager.pluginData.settings,
                async (settings: SRSettings) => {
                    await pluginDataManager.writeSettings(settings);
                },
            );

            this.dataManager = new DataManager(this, pluginDataManager, settingsManager);
            const uiManager = new UIManager(this, settingsManager);
            this.uiManager = uiManager;
            this.commandManager = new CommandManager(this, settingsManager, uiManager);

            this.app.workspace.onLayoutReady(async () => {
                this.dataManager.loadData();

                // Set the preferred locale if it is not the default
                if (settingsManager.settings.preferredLocale !== "-") {
                    LocaleManagerInstance.getInstance().currentLocale =
                        settingsManager.settings.preferredLocale;
                }

                const noteReviewQueue = new NoteReviewQueue();
                this._nextNoteReviewHandler = new NextNoteReviewHandler(
                    this.app,
                    settingsManager.settings,
                    noteReviewQueue,
                );

                await this.dataManager.initOSRCore(noteReviewQueue, async () => {
                    await this.onOsrVaultDataChanged();
                });

                await this.uiManager.onLayoutReady();
                this.commandManager.onLayoutReady();
                this._reminderManager = new ReminderManager(this, this.uiManager, this.dataManager);

                this.isInitialized = true;
                this._reminderManager.restartReviewReminders();
            });
        } catch (error) {
            if (error instanceof PluginDataError || error instanceof Error) {
                console.warn("SRPlugin: Error in onLoad", error.message);
                DebugLoggerInstance.getInstance().log(
                    "SRPlugin: Error in onLoad: " + error.message,
                    "error",
                );
            } else {
                console.warn("SRPlugin: Error in onLoad");
                DebugLoggerInstance.getInstance().log("SRPlugin: Error in onLoad", "error");
            }
        }
    }

    get reminderManager(): ReminderManager {
        if (this._reminderManager === null) throw new Error("Reminder manager not initialized!!!");
        return this._reminderManager;
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
        this.reminderManager.stopReviewReminders();
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
        this.uiManager.destroy();
        this.commandManager.onunload();
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
