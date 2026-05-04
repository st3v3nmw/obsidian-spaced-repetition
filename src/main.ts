import { Notice, Platform, Plugin, TFile } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { SrsAlgorithmFsrs } from "src/algorithms/fsrs/srs-algorithm-fsrs";
import { ObsidianVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { OsrAppCore } from "src/core";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data-stores/base/data-store";
import { StoreInNotes } from "src/data-stores/notes/notes";
import { Deck, DeckTreeFilter } from "src/deck/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck/deck-tree-iterator";
import { TopicPath } from "src/deck/topic-path";
import { ISRFile, SrTFile } from "src/file";
import { t } from "src/lang/helpers";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/settings";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/ui/obsidian-ui-components/item-views/review-queue-list-view";
import { UIManager, UIState } from "src/ui/ui-manager";
import { CardParser } from "src/utils/parsers/card-parser";
import EmulatedPlatform from "src/utils/platform-detector";
import { convertToStringOrEmpty, TextDirection } from "src/utils/strings";

export default class SRPlugin extends Plugin {
    public data: PluginData;
    public osrAppCore: OsrAppCore;
    public uiManager: UIManager;

    public nextNoteReviewHandler: NextNoteReviewHandler;

    async onload(): Promise<void> {
        await this.loadPluginData();

        const noteReviewQueue = new NoteReviewQueue();
        this.nextNoteReviewHandler = new NextNoteReviewHandler(
            this.app,
            this.data.settings,
            noteReviewQueue,
        );

        const questionPostponementList: QuestionPostponementList = new QuestionPostponementList(
            this,
            this.data.settings,
            this.data.buryList,
        );
        await questionPostponementList.clearIfNewDay(this.data);

        const osrNoteLinkInfoFinder: ObsidianVaultNoteLinkInfoFinder =
            new ObsidianVaultNoteLinkInfoFinder(this.app.metadataCache);

        this.osrAppCore = new OsrAppCore(this.app);
        this.osrAppCore.init(
            questionPostponementList,
            osrNoteLinkInfoFinder,
            this.data.settings,
            this.onOsrVaultDataChanged.bind(this),
            noteReviewQueue,
        );

        this.uiManager = new UIManager(this);

        this.addPluginCommands();
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
                difficulty: this.data.settings.flashcardAgainText,
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
                difficulty: this.data.settings.flashcardHardText,
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
                difficulty: this.data.settings.flashcardGoodText,
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
                difficulty: this.data.settings.flashcardEasyText,
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
        if (this.data.settings.useCustomHotkeys) {
            this.addCustomHotkeys();
        }

        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("OPEN_NOTE_FOR_REVIEW"),
            callback: async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                    this.nextNoteReviewHandler.reviewNextNoteModal();
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-easy",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.data.settings.flashcardEasyText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Easy);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.data.settings.flashcardGoodText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Good);
                }
                return true;
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.data.settings.flashcardHardText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md") return false;

                if (!checking) {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Hard);
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
        const deckIterator: IDeckTreeIterator = SRPlugin.createDeckTreeIterator(this.data.settings);

        const reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            deckIterator,
            this.data.settings,
            SrsAlgorithm.getInstance(),
            this.osrAppCore.questionPostponementList,
            this.osrAppCore.dueDateFlashcardHistogram,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        return { reviewSequencer, mode: reviewMode };
    }

    public async getPreparedDecksForSingleNoteReview(
        file: TFile,
        mode: FlashcardReviewMode,
    ): Promise<{ deckTree: Deck; remainingDeckTree: Deck; mode: FlashcardReviewMode }> {
        const note: Note = await this.loadNote(file);

        const deckTree = new Deck("root", null);
        note.appendCardsToDeck(deckTree);
        const remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this.osrAppCore.questionPostponementList,
            deckTree,
            mode,
        );

        return { deckTree, remainingDeckTree, mode };
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

    async sync(): Promise<void> {
        if (this.osrAppCore.syncLock) {
            return;
        }

        const now = window.moment(Date.now());
        this.osrAppCore.defaultTextDirection = this.getObsidianRtlSetting();

        await this.osrAppCore.loadVault();

        if (this.data.settings.showSchedulingDebugMessages) {
            console.log(`SR: ${t("DECKS")}`, this.osrAppCore.reviewableDeckTree);
            console.log(
                "SR: " +
                    t("SYNC_TIME_TAKEN", {
                        t: Date.now() - now.valueOf(),
                    }),
            );
        }
    }

    private onOsrVaultDataChanged() {
        this.uiManager.updateStatusBar();
        if (this.data.settings.enableNoteReviewPaneOnStartup)
            this.uiManager.sidebarManager.redraw();
    }

    async loadNote(noteFile: TFile): Promise<Note> {
        const loader: NoteFileLoader = new NoteFileLoader(this.data.settings);
        const srFile: ISRFile = this.createSrTFile(noteFile);
        const folderTopicPath: TopicPath = TopicPath.getFolderPathFromFilename(
            srFile,
            this.data.settings,
        );

        const note: Note = await loader.load(
            this.createSrTFile(noteFile),
            this.getObsidianRtlSetting(),
            folderTopicPath,
        );
        if (note.hasChanged) {
            note.writeNoteFile(this.data.settings);
        }
        return note;
    }

    private getObsidianRtlSetting(): TextDirection {
        // Get the direction with Obsidian's own setting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v: any = (this.app.vault as any).getConfig("rightToLeft");
        return convertToStringOrEmpty(v) === "true" ? TextDirection.Rtl : TextDirection.Ltr;
    }

    async saveNoteReviewResponse(note: TFile, response: ReviewResponse): Promise<void> {
        const noteSrTFile: ISRFile = this.createSrTFile(note);

        if (SettingsUtil.isPathInNoteIgnoreFolder(this.data.settings, note.path)) {
            new Notice(t("NOTE_IN_IGNORED_FOLDER"));
            return;
        }

        const tags = noteSrTFile.getAllTagsFromCache();
        if (!SettingsUtil.isAnyTagANoteReviewTag(this.data.settings, tags)) {
            new Notice(t("PLEASE_TAG_NOTE"));
            return;
        }

        //
        await this.osrAppCore.saveNoteReviewResponse(noteSrTFile, response, this.data.settings);

        new Notice(t("RESPONSE_RECEIVED"));

        if (this.data.settings.autoNextNote) {
            this.nextNoteReviewHandler.autoReviewNextNote();
        }
    }

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, this.app.fileManager, note);
    }

    async loadPluginData(): Promise<void> {
        const loadedData: PluginData = await this.loadData();
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);
        CardParser.setDebugParser(this.data.settings.showParserDebugMessages);

        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    setupDataStoreAndAlgorithmInstances(settings: SRSettings) {
        // For now we can hardcode as we only support the one data store and one algorithm
        DataStore.instance = new StoreInNotes(settings);
        SrsAlgorithm.instance =
            settings.algorithm === Algorithm.FSRS
                ? new SrsAlgorithmFsrs(settings)
                : new SrsAlgorithmOsr(settings);
        DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);
    }
    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }
}
