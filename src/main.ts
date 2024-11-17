import { Menu, Notice, PaneType, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { ObsidianVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { OsrAppCore } from "src/core";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data-stores/base/data-store";
import { StoreInNotes } from "src/data-stores/notes/notes";
import { CardListType, Deck, DeckTreeFilter } from "src/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck-tree-iterator";
import { ISRFile, SrTFile } from "src/file";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/flashcard-review-sequencer";
import { FlashcardModal } from "src/gui/flashcard-modal";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/gui/review-queue-list-view";
import { SRSettingTab } from "src/gui/settings";
import { OsrSidebar } from "src/gui/sidebar";
import { appIcon } from "src/icons/app-icon";
import { t } from "src/lang/helpers";
import { NextNoteReviewHandler } from "src/next-note-review-handler";
import { Note } from "src/note";
import { NoteFileLoader } from "src/note-file-loader";
import { NoteReviewQueue } from "src/note-review-queue";
import { setDebugParser } from "src/parser";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { QuestionPostponementList } from "src/question-postponement-list";
import { DEFAULT_SETTINGS, SettingsUtil, SRSettings, upgradeSettings } from "src/settings";
import { TopicPath } from "src/topic-path";
import { convertToStringOrEmpty, TextDirection } from "src/utils/strings";

import { TabbedViewType } from "src/utils/types";
import { TABBED_SR_ITEM_VIEW, TabbedSRItemView } from "src/gui/tabbed-space-repetition-view";

export default class SRPlugin extends Plugin {
    public data: PluginData;
    public osrAppCore: OsrAppCore;
    private osrSidebar: OsrSidebar;
    private nextNoteReviewHandler: NextNoteReviewHandler;

    private chosenReviewModeForTabbedView: FlashcardReviewMode;
    private chosenSingleNoteForTabbedView: TFile;

    private tabbedViewTypes: TabbedViewType[] = [
        {
            type: TABBED_SR_ITEM_VIEW,
            viewCreator: (leaf) =>
                new TabbedSRItemView(leaf, this, async () => {
                    // Tabbed views cant get params on open call, so we have to do it here
                    // This allows us to load the data from inside the view when the open function is called

                    if (this.chosenSingleNoteForTabbedView !== undefined) {
                        const singleNoteDeckData = await this.getPrepareDecksForSingleNoteReview(
                            this.chosenSingleNoteForTabbedView,
                            this.chosenReviewModeForTabbedView,
                        );

                        return this.getPreparedReviewSequencer(
                            singleNoteDeckData.deckTree,
                            singleNoteDeckData.remainingDeckTree,
                            singleNoteDeckData.mode,
                        );
                    }

                    const fullDeckTree: Deck = this.osrAppCore.reviewableDeckTree;
                    const remainingDeckTree: Deck =
                        this.chosenReviewModeForTabbedView === FlashcardReviewMode.Cram
                            ? this.osrAppCore.reviewableDeckTree
                            : this.osrAppCore.remainingDeckTree;

                    return this.getPreparedReviewSequencer(
                        fullDeckTree,
                        remainingDeckTree,
                        this.chosenReviewModeForTabbedView,
                    );
                }),
        },
    ];

    private ribbonIcon: HTMLElement | null = null;
    private statusBar: HTMLElement | null = null;
    private fileMenuHandler: (
        menu: Menu,
        file: TAbstractFile,
        source: string,
        leaf?: WorkspaceLeaf,
    ) => void;

    async onload(): Promise<void> {
        // Closes all still open views when the plugin is loaded, because it causes bugs / empty windows otherwise
        this.app.workspace.onLayoutReady(async () => {
            this.detachAllTabbedLeaves();
        });

        await this.loadPluginData();

        const noteReviewQueue = new NoteReviewQueue();
        this.nextNoteReviewHandler = new NextNoteReviewHandler(
            this.app,
            this.data.settings,
            noteReviewQueue,
        );

        this.osrSidebar = new OsrSidebar(this, this.data.settings, this.nextNoteReviewHandler);
        this.osrSidebar.init();
        this.app.workspace.onLayoutReady(async () => {
            await this.osrSidebar.activateReviewQueueViewPanel();
            setTimeout(async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                }
            }, 2000);
        });

        const questionPostponementList: QuestionPostponementList = new QuestionPostponementList(
            this,
            this.data.settings,
            this.data.buryList,
        );

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

        appIcon();

        this.registerTabbedViews();

        this.showStatusBar(this.data.settings.showStatusBar);

        this.showRibbonIcon(this.data.settings.showRibbonIcon);

        this.showFileMenuItems(!this.data.settings.disableFileMenuReviewOptions);

        this.addPluginCommands();

        this.addSettingTab(new SRSettingTab(this.app, this));
    }

    showFileMenuItems(status: boolean) {
        // define the handler if it was not defined yet
        if (this.fileMenuHandler === undefined) {
            this.fileMenuHandler = (menu, fileish: TAbstractFile) => {
                if (fileish instanceof TFile && fileish.extension === "md") {
                    menu.addItem((item) => {
                        item.setTitle(
                            t("REVIEW_DIFFICULTY_FILE_MENU", {
                                difficulty: this.data.settings.flashcardEasyText,
                            }),
                        )
                            .setIcon("SpacedRepIcon")
                            .onClick(() => {
                                this.saveNoteReviewResponse(fileish, ReviewResponse.Easy);
                            });
                    });

                    menu.addItem((item) => {
                        item.setTitle(
                            t("REVIEW_DIFFICULTY_FILE_MENU", {
                                difficulty: this.data.settings.flashcardGoodText,
                            }),
                        )
                            .setIcon("SpacedRepIcon")
                            .onClick(() => {
                                this.saveNoteReviewResponse(fileish, ReviewResponse.Good);
                            });
                    });

                    menu.addItem((item) => {
                        item.setTitle(
                            t("REVIEW_DIFFICULTY_FILE_MENU", {
                                difficulty: this.data.settings.flashcardHardText,
                            }),
                        )
                            .setIcon("SpacedRepIcon")
                            .onClick(() => {
                                this.saveNoteReviewResponse(fileish, ReviewResponse.Hard);
                            });
                    });
                }
            };
        }

        if (status) {
            this.registerEvent(this.app.workspace.on("file-menu", this.fileMenuHandler));
        } else {
            this.app.workspace.off("file-menu", this.fileMenuHandler);
        }
    }

    private addPluginCommands() {
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
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Easy);
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.data.settings.flashcardGoodText,
            }),
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Good);
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: t("REVIEW_NOTE_DIFFICULTY_CMD", {
                difficulty: this.data.settings.flashcardHardText,
            }),
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveNoteReviewResponse(openFile, ReviewResponse.Hard);
                }
            },
        });

        this.addCommand({
            id: "srs-review-flashcards",
            name: t("REVIEW_ALL_CARDS"),
            callback: async () => {
                if (this.osrAppCore.syncLock) {
                    return;
                }
                await this.sync();

                if (this.data.settings.openViewInNewTab) {
                    this.chosenReviewModeForTabbedView = FlashcardReviewMode.Review;
                    this.openTabbedSRView();
                } else {
                    this.openFlashcardModal(
                        this.osrAppCore.reviewableDeckTree,
                        this.osrAppCore.remainingDeckTree,
                        FlashcardReviewMode.Review,
                    );
                }
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards",
            name: t("CRAM_ALL_CARDS"),
            callback: async () => {
                await this.sync();
                if (this.data.settings.openViewInNewTab) {
                    this.chosenReviewModeForTabbedView = FlashcardReviewMode.Cram;
                    this.openTabbedSRView();
                } else {
                    this.openFlashcardModal(
                        this.osrAppCore.reviewableDeckTree,
                        this.osrAppCore.reviewableDeckTree,
                        FlashcardReviewMode.Cram,
                    );
                }
            },
        });

        this.addCommand({
            id: "srs-review-flashcards-in-note",
            name: t("REVIEW_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (!openFile || openFile.extension !== "md") {
                    return;
                }

                if (this.data.settings.openViewInNewTab) {
                    this.chosenReviewModeForTabbedView = FlashcardReviewMode.Review;
                    this.chosenSingleNoteForTabbedView = openFile;
                    this.openTabbedSRView();
                } else {
                    this.openFlashcardModalForSingleNote(openFile, FlashcardReviewMode.Review);
                }
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards-in-note",
            name: t("CRAM_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (!openFile || openFile.extension !== "md") {
                    return;
                }

                if (this.data.settings.openViewInNewTab) {
                    this.chosenReviewModeForTabbedView = FlashcardReviewMode.Cram;
                    this.chosenSingleNoteForTabbedView = openFile;
                    this.openTabbedSRView();
                } else {
                    this.openFlashcardModalForSingleNote(openFile, FlashcardReviewMode.Cram);
                }
            },
        });

        this.addCommand({
            id: "srs-open-review-queue-view",
            name: t("OPEN_REVIEW_QUEUE_VIEW"),
            callback: async () => {
                await this.osrSidebar.openReviewQueueView();
            },
        });
    }

    onunload(): void {
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
        this.detachAllTabbedLeaves();
    }

    private getPreparedReviewSequencer(
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
        this.chosenReviewModeForTabbedView = undefined;
        return { reviewSequencer, mode: reviewMode };
    }

    private async getPrepareDecksForSingleNoteReview(
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

        this.chosenSingleNoteForTabbedView = undefined;

        return { deckTree, remainingDeckTree, mode };
    }

    private forEachTabbedViewType(callback: (type: TabbedViewType) => void) {
        this.tabbedViewTypes.forEach((type) => callback(type));
    }

    private registerTabbedViews() {
        this.forEachTabbedViewType((viewType) =>
            this.registerView(viewType.type, viewType.viewCreator),
        );
    }

    private detachAllTabbedLeaves() {
        this.forEachTabbedViewType((viewType) => {
            this.app.workspace.detachLeavesOfType(viewType.type);
        });
    }

    private async openTabbedSRView() {
        await this.openTabbedView(TABBED_SR_ITEM_VIEW, true);
    }

    private async openTabbedView(type: string, newLeaf?: PaneType | boolean) {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(type);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf as a tab
            leaf = workspace.getLeaf(newLeaf);
            if (leaf !== null) {
                await leaf.setViewState({ type: type, active: true });
            }
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf !== null) {
            workspace.revealLeaf(leaf);
        }
    }

    private async openFlashcardModalForSingleNote(
        noteFile: TFile,
        reviewMode: FlashcardReviewMode,
    ): Promise<void> {
        const singleNoteDeckData = await this.getPrepareDecksForSingleNoteReview(
            noteFile,
            reviewMode,
        );
        this.openFlashcardModal(
            singleNoteDeckData.deckTree,
            singleNoteDeckData.remainingDeckTree,
            reviewMode,
        );
    }
    private openFlashcardModal(
        fullDeckTree: Deck,
        remainingDeckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): void {
        const reviewSequencerData = this.getPreparedReviewSequencer(
            fullDeckTree,
            remainingDeckTree,
            reviewMode,
        );
        new FlashcardModal(
            this.app,
            this,
            this.data.settings,
            reviewSequencerData.reviewSequencer,
            reviewSequencerData.mode,
        ).open();
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
        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.osrAppCore.noteReviewQueue.dueNotesCount,
                dueFlashcardsCount: this.osrAppCore.remainingDeckTree.getCardCount(
                    CardListType.All,
                    true,
                ),
            }),
        );

        if (this.data.settings.enableNoteReviewPaneOnStartup) this.osrSidebar.redraw();
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
        return convertToStringOrEmpty(v) == "true" ? TextDirection.Rtl : TextDirection.Ltr;
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
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }

    async loadPluginData(): Promise<void> {
        const loadedData: PluginData = await this.loadData();
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);
        setDebugParser(this.data.settings.showParserDebugMessages);

        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    setupDataStoreAndAlgorithmInstances(settings: SRSettings) {
        // For now we can hardcode as we only support the one data store and one algorithm
        DataStore.instance = new StoreInNotes(settings);
        SrsAlgorithm.instance = new SrsAlgorithmOsr(settings);
        DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);
    }
    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }

    showRibbonIcon(status: boolean) {
        // if it does not exist, we create it
        if (!this.ribbonIcon) {
            this.ribbonIcon = this.addRibbonIcon("SpacedRepIcon", t("REVIEW_CARDS"), async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                    this.openFlashcardModal(
                        this.osrAppCore.reviewableDeckTree,
                        this.osrAppCore.remainingDeckTree,
                        FlashcardReviewMode.Review,
                    );
                }
            });
        }
        if (status) {
            this.ribbonIcon.style.display = "";
        } else {
            this.ribbonIcon.style.display = "none";
        }
    }

    showStatusBar(status: boolean) {
        // if it does not exist, we create it
        if (!this.statusBar) {
            this.statusBar = this.addStatusBarItem();
            this.statusBar.classList.add("mod-clickable");
            this.statusBar.setAttribute("aria-label", t("OPEN_NOTE_FOR_REVIEW"));
            this.statusBar.setAttribute("aria-label-position", "top");
            this.statusBar.addEventListener("click", async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                    this.nextNoteReviewHandler.reviewNextNoteModal();
                }
            });
        }

        if (status) {
            this.statusBar.style.display = "";
        } else {
            this.statusBar.style.display = "none";
        }
    }
}
