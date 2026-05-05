import { Platform, Plugin, TFile } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { DataManager } from "src/data/data-manager";
import { DataStoreName } from "src/data-stores/base/data-store";
import { Deck, DeckTreeFilter } from "src/deck/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck/deck-tree-iterator";
import { t } from "src/lang/helpers";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { Note } from "src/note/note";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { SRSettings } from "src/settings";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/ui/obsidian-ui-components/item-views/review-queue-list-view";
import { UIManager, UIState } from "src/ui/ui-manager";
import EmulatedPlatform from "src/utils/platform-detector";
import { convertToStringOrEmpty, TextDirection } from "src/utils/strings";

export default class SRPlugin extends Plugin {
    public _uiManager: UIManager | null = null;
    public _dataManager: DataManager | null = null;

    public nextNoteReviewHandler: NextNoteReviewHandler | null = null;

    async onload(): Promise<void> {
        this.dataManager = new DataManager(this);
        await this.dataManager.loadData();

        const noteReviewQueue = new NoteReviewQueue();
        this.nextNoteReviewHandler = new NextNoteReviewHandler(
            this.app,
            this.dataManager.data.settings,
            noteReviewQueue,
        );

        this.dataManager.initOSRAppCore(noteReviewQueue, this.onOsrVaultDataChanged.bind(this));

        this.uiManager = new UIManager(this, this.dataManager);

        this.addPluginCommands();

        this.registerEvent(
            this.app.vault.on("rename", (file, oldPath) => {
                if (
                    this.dataManager.data.settings.dataStore === DataStoreName.PLUGIN_DATA &&
                    file instanceof TFile &&
                    this.dataManager.scheduleDataRepository !== null
                ) {
                    this.dataManager.scheduleDataRepository.renameFile(oldPath, file.path);
                }
            }),
        );
    }

    get uiManager(): UIManager {
        if (this._uiManager === null) throw new Error("UI manager not initialized!!!");
        return this._uiManager;
    }

    set uiManager(uiManager: UIManager) {
        this._uiManager = uiManager;
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

    public removeCustomHotkeys() {
        this.removeCommand("srs-card-review-again");
        this.removeCommand("srs-card-review-hard");
        this.removeCommand("srs-card-review-good");
        this.removeCommand("srs-card-review-easy");
        this.removeCommand("srs-card-review-show-answer");
        this.removeCommand("srs-card-review-reset");
        this.removeCommand("srs-card-review-skip");
    }

    public addCustomHotkeys() {
        this.addCommand({
            id: "srs-card-review-again",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardAgainText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardBack &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._processReview(ReviewResponse.Again);
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-hard",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardHardText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardBack &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._processReview(ReviewResponse.Hard);
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-good",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardGoodText,
            }),
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardBack &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._processReview(ReviewResponse.Good);
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-easy",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardEasyText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardBack &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._processReview(ReviewResponse.Easy);
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-show-answer",
            name: t("SHOW_ANSWER"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardFront &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._showAnswer();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-skip",
            name: t("SKIP"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    (this.uiManager.uiState === UIState.CardBack ||
                        this.uiManager.uiState === UIState.CardFront) &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._skipCurrentCard();
                    }
                    return true;
                }
                return false;
            },
        });

        this.addCommand({
            id: "srs-card-review-reset",
            name: t("RESET_CARD_PROGRESS"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.uiManager.uiState === UIState.CardBack &&
                    this.uiManager.isSRInFocus &&
                    this.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        document.activeElement !== null &&
                        (document.activeElement.nodeName === "TEXTAREA" ||
                            document.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        this.uiManager.contentManager._processReview(ReviewResponse.Reset);
                    }
                    return true;
                }
                return false;
            },
        });
    }

    private addPluginCommands() {
        if (
            this.dataManager.data.settings.useCustomHotkeys
        ) {
            this.addCustomHotkeys();
        }

        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("OPEN_NOTE_FOR_REVIEW"),
            callback: async () => {
                if (
                    !this.dataManager.osrAppCore.syncLock &&
                    this.nextNoteReviewHandler !== null
                ) {
                    await this.dataManager.sync();
                    this.nextNoteReviewHandler.reviewNextNoteModal();
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-easy",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardEasyText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.dataManager.saveNoteReviewResponse(openFile, ReviewResponse.Easy);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardGoodText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.dataManager.saveNoteReviewResponse(openFile, ReviewResponse.Good);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.dataManager.data.settings.flashcardHardText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.dataManager.saveNoteReviewResponse(openFile, ReviewResponse.Hard);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-review-flashcards",
            name: t("REVIEW_ALL_CARDS"),
            callback: async () => {
                await this.uiManager.openDeckContainer(FlashcardReviewMode.Review);
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards",
            name: t("CRAM_ALL_CARDS"),
            callback: async () => {
                await this.uiManager.openDeckContainer(FlashcardReviewMode.Cram);
            },
        });

        this.addCommand({
            id: "srs-review-flashcards-in-note",
            name: t("REVIEW_CARDS_IN_NOTE"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.uiManager.openDeckContainer(FlashcardReviewMode.Review, openFile);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards-in-note",
            name: t("CRAM_CARDS_IN_NOTE"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.uiManager.openDeckContainer(FlashcardReviewMode.Cram, openFile);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-open-review-queue-view",
            name: t("OPEN_REVIEW_QUEUE_VIEW"),
            callback: async () => {
                await this.uiManager.sidebarManager.openReviewQueueView();
            },
        });
    }

    onunload(): void {
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
        this.uiManager.destroy();
    }

    public getPreparedReviewSequencer(
        fullDeckTree: Deck,
        remainingDeckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): { reviewSequencer: IFlashcardReviewSequencer; mode: FlashcardReviewMode } {
        const deckIterator: IDeckTreeIterator = SRPlugin.createDeckTreeIterator(this.dataManager.data.settings);

        const reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            deckIterator,
            this.dataManager.data.settings,
            SrsAlgorithm.getInstance(),
            this.dataManager.osrAppCore.questionPostponementList,
            this.dataManager.osrAppCore.dueDateFlashcardHistogram,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        return { reviewSequencer, mode: reviewMode };
    }

    public async getPreparedDecksForSingleNoteReview(
        file: TFile,
        mode: FlashcardReviewMode,
    ): Promise<{ deckTree: Deck; remainingDeckTree: Deck; mode: FlashcardReviewMode }> {
        const note: Note = await this.dataManager.loadNote(file);

        const deckTree = new Deck("root", null);
        note.appendCardsToDeck(deckTree);
        const remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this.dataManager.osrAppCore.questionPostponementList,
            deckTree,
            mode,
        );

        return { deckTree, remainingDeckTree, mode };
    }

    /**
     * Gets the text direction setting for the current Obsidian instance.
     */
    public getObsidianRtlSetting(): TextDirection {
        // Get the direction with Obsidian's own setting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v: any = (this.app.vault as any).getConfig("rightToLeft");
        return convertToStringOrEmpty(v) === "true" ? TextDirection.Rtl : TextDirection.Ltr;
    }

    /**
     * Called when the OSR app core's data has changed.
     *
     * Anything that needs to be updated in the UI because of this change should be done here.
     */
    private onOsrVaultDataChanged() {
        this.uiManager.updateStatusBar();
        if (
            this.dataManager.data.settings.enableNoteReviewPaneOnStartup
        ) {
            this.uiManager.sidebarManager.redraw();
        }
    }

    private static createDeckTreeIterator(settings: SRSettings): IDeckTreeIterator {
        let cardOrder: CardOrder = CardOrder[settings.flashcardCardOrder as keyof typeof CardOrder];
        if (cardOrder === undefined) cardOrder = CardOrder.DueFirstSequential;
        let deckOrder: DeckOrder = DeckOrder[settings.flashcardDeckOrder as keyof typeof DeckOrder];
        if (deckOrder === undefined) deckOrder = DeckOrder.PrevDeckComplete_Sequential;

        const iteratorOrder: IIteratorOrder = {
            deckOrder,
            cardOrder,
        };
        return new DeckTreeIterator(iteratorOrder, null);
    }
}
