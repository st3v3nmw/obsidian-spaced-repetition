import { Notice, Plugin, TAbstractFile, TFile, getAllTags, FrontMatterCache } from "obsidian";
import { SRSettingTab, SRSettings, DEFAULT_SETTINGS, upgradeSettings, SettingsUtil } from "src/settings";
import { FlashcardModal } from "src/gui/flashcard-modal";
import { StatsModal } from "src/gui/stats-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "src/gui/sidebar";
import { osrSchedule } from "src/algorithms/osr/NoteScheduling";
import { YAML_FRONT_MATTER_REGEX, SCHEDULING_INFO_REGEX } from "src/constants";
import { NoteReviewDeck } from "src/NoteReviewDeck";
import { t } from "src/lang/helpers";
import { appIcon } from "src/icons/appicon";
import { TopicPath } from "./TopicPath";
import { CardListType, Deck, DeckTreeFilter } from "./Deck";
import { Stats } from "./stats";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer as FlashcardReviewSequencer,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "./FlashcardReviewSequencer";
import {
    CardOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
    DeckOrder,
} from "./DeckTreeIterator";
import { Note } from "./Note";
import { NoteFileLoader } from "./NoteFileLoader";
import { ISRFile, SrTFile as SrTFile } from "./SRFile";
import { DeckTreeStatsCalculator } from "./DeckTreeStatsCalculator";
import { QuestionPostponementList } from "./QuestionPostponementList";
import { ReviewResponse } from "./algorithms/base/RepetitionItem";
import { SrsAlgorithm } from "./algorithms/base/SrsAlgorithm";
import { ObsidianVaultNoteLinkInfoFinder, OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { DataStore } from "./dataStore/base/DataStore";
import { DataStoreAlgorithm } from "./dataStoreAlgorithm/DataStoreAlgorithm";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { DataStoreInNote_AlgorithmOsr } from "./dataStoreAlgorithm/DataStoreInNote_AlgorithmOsr";
import { DataStore_StoreInNote } from "./dataStore/storeInNote/DataStore_StoreInNote";
import { SrsAlgorithm_Osr } from "./algorithms/osr/SrsAlgorithm_Osr";
import { OsrAppCore } from "./OsrAppCore";
import { DEFAULT_DATA, PluginData } from "./PluginData";
import { NextNoteReviewHandler } from "./NextNoteReviewHandler";



export default class SRPlugin extends Plugin {
    private statusBar: HTMLElement;
    private reviewQueueView: ReviewQueueListView;
    public data: PluginData;
    private osrAppCore: OsrAppCore;


    async onload(): Promise<void> {
        console.log("onload: Branch: feat-878-support-multiple-sched, Date: 2024-02-28");
        await this.loadPluginData();

        const questionPostponementList: QuestionPostponementList = new QuestionPostponementList(
            this,
            this.data.settings,
            this.data.buryList,
        );

        const osrNoteLinkInfoFinder: ObsidianVaultNoteLinkInfoFinder = new ObsidianVaultNoteLinkInfoFinder(this.app.metadataCache);

        this.osrAppCore = new OsrAppCore();
        this.osrAppCore.init(questionPostponementList, osrNoteLinkInfoFinder, this.data.settings,
            this.onOsrVaultDataChanged.bind(this),
        );

        appIcon();

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", t("OPEN_NOTE_FOR_REVIEW"));
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", async () => {
            if (!this.osrAppCore.syncLock) {
                await this.sync();
                this.osrAppCore.nextNoteReviewHandler.reviewNextNoteModal();
            }
        });

        this.addRibbonIcon("SpacedRepIcon", t("REVIEW_CARDS"), async () => {
            if (!this.osrAppCore.syncLock) {
                await this.sync();
                this.openFlashcardModal(
                    this.osrAppCore.reviewableDeckTree,
                    this.osrAppCore.remainingDeckTree,
                    FlashcardReviewMode.Review,
                );
            }
        });

        if (!this.data.settings.disableFileMenuReviewOptions) {
            this.registerEvent(
                this.app.workspace.on("file-menu", (menu, fileish: TAbstractFile) => {
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
                }),
            );
        }

        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("OPEN_NOTE_FOR_REVIEW"),
            callback: async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                    this.osrAppCore.nextNoteReviewHandler.reviewNextNoteModal();
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
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
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
                this.openFlashcardModal(this.osrAppCore.reviewableDeckTree, this.osrAppCore.reviewableDeckTree, FlashcardReviewMode.Cram);
            },
        });

        this.addCommand({
            id: "srs-review-flashcards-in-note",
            name: t("REVIEW_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.openFlashcardModalForSingleNote(openFile, FlashcardReviewMode.Review);
                }
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards-in-note",
            name: t("CRAM_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.openFlashcardModalForSingleNote(openFile, FlashcardReviewMode.Cram);
                }
            },
        });

        this.addCommand({
            id: "srs-view-stats",
            name: t("VIEW_STATS"),
            callback: async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                    new StatsModal(this.app, this).open();
                }
            },
        });

        this.addCommand({
            id: "srs-open-review-queue-view",
            name: t("OPEN_REVIEW_QUEUE_VIEW"),
            callback: async () => {
                await this.openReviewQueueView();
            },
        });

        this.addSettingTab(new SRSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(async () => {
            await this.initReviewQueueView();
            setTimeout(async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                }
            }, 2000);
        });
    }

    onunload(): void {
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
    }

    private async openFlashcardModalForSingleNote(
        noteFile: TFile,
        reviewMode: FlashcardReviewMode,
    ): Promise<void> {
        const note: Note = await this.loadNote(noteFile);

        const deckTree = new Deck("root", null);
        note.appendCardsToDeck(deckTree);
        const remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this.osrAppCore.questionPostponementList,
            deckTree,
            reviewMode,
        );
        this.openFlashcardModal(deckTree, remainingDeckTree, reviewMode);
    }

    private openFlashcardModal(
        fullDeckTree: Deck,
        remainingDeckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): void {
        const deckIterator = SRPlugin.createDeckTreeIterator(this.data.settings);
        const reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            deckIterator,
            this.data.settings,
            SrsAlgorithm.getInstance(),
            this.osrAppCore.questionPostponementList,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        new FlashcardModal(this.app, this, this.data.settings, reviewSequencer, reviewMode).open();
    }

    private static createDeckTreeIterator(settings: SRSettings, baseDeck: Deck): IDeckTreeIterator {
        let cardOrder: CardOrder = CardOrder[settings.flashcardCardOrder as keyof typeof CardOrder];
        if (cardOrder === undefined) cardOrder = CardOrder.DueFirstSequential;
        let deckOrder: DeckOrder = DeckOrder[settings.flashcardDeckOrder as keyof typeof DeckOrder];
        if (deckOrder === undefined) deckOrder = DeckOrder.PrevDeckComplete_Sequential;

        const iteratorOrder: IIteratorOrder = {
            deckOrder,
            cardOrder,
        };
        return new DeckTreeIterator(iteratorOrder, baseDeck);
    }

    async sync(): Promise<void> {
        if (this.osrAppCore.syncLock) {
            return;
        }

        const now = window.moment(Date.now());

        this.osrAppCore.loadVault();

        if (this.data.settings.showDebugMessages) {
            // TODO: console.log(`SR: ${t("EASES")}`, this.easeByPath.dict);
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
                dueFlashcardsCount: this.osrAppCore.remainingDeckTree.getCardCount(CardListType.All, true),
            }),
        );

        if (this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE)) this.reviewQueueView.redraw();
    }

    async loadNote(noteFile: TFile): Promise<Note> {
        const loader: NoteFileLoader = new NoteFileLoader(this.data.settings);
        const srFile: ISRFile = this.createSrTFile(noteFile);
        const folderTopicPath: TopicPath = TopicPath.getFolderPathFromFilename(
            srFile,
            this.data.settings,
        );

        const note: Note = await loader.load(this.createSrTFile(noteFile), folderTopicPath);
        if (note.hasChanged) {
            note.writeNoteFile(this.data.settings);
        }
        return note;
    }

    async saveNoteReviewResponse(note: TFile, response: ReviewResponse): Promise<void> {
        const noteSrTFile: ISRFile = this.createSrTFile(note);

        if (SettingsUtil.isPathInNoteIgnoreFolder(this.data.settings, note.path)) {
            new Notice(t("NOTE_IN_IGNORED_FOLDER"));
            return;
        }

        const tags = noteSrTFile.getAllTags();
        if (!SettingsUtil.isAnyTagANoteReviewTag(this.data.settings, tags)) {
            new Notice(t("PLEASE_TAG_NOTE"));
            return;
        }

        // 
        await this.osrAppCore.saveNoteReviewResponse(noteSrTFile, response, this.data.settings, this.data.buryList);

        new Notice(t("RESPONSE_RECEIVED"));
    }

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }

    async loadPluginData(): Promise<void> {
        const loadedData: PluginData = await this.loadData();
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);

        this.setupDataStoreAndAlgorithmInstances();
    }

    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }

    private getActiveLeaf(type: string): WorkspaceLeaf | null {
        const leaves = this.app.workspace.getLeavesOfType(type);
        if (leaves.length == 0) {
            return null;
        }

        return leaves[0];
    }

    private async initReviewQueueView() {

        this.registerView(
            REVIEW_QUEUE_VIEW_TYPE,
            (leaf) => {
                const nextNoteReviewHandler: NextNoteReviewHandler = new NextNoteReviewHandler(this.app, this.data.settings, this.app.workspace, this.osrAppCore.noteReviewQueue); 
                return this.reviewQueueView = new ReviewQueueListView(leaf, this.app, nextNoteReviewHandler, this.data.settings); 
            },
        );

        if (
            this.data.settings.enableNoteReviewPaneOnStartup &&
            this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE) == null
        ) {
            await this.activateReviewQueueViewPanel();
        }
    }

    private async activateReviewQueueViewPanel() {
        await this.app.workspace.getRightLeaf(false).setViewState({
            type: REVIEW_QUEUE_VIEW_TYPE,
            active: true,
        });
    }

    private async openReviewQueueView() {
        let reviewQueueLeaf = this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE);
        if (reviewQueueLeaf == null) {
            await this.activateReviewQueueViewPanel();
            reviewQueueLeaf = this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE);
        }

        if (reviewQueueLeaf !== null) {
            this.app.workspace.revealLeaf(reviewQueueLeaf);
            this.updateAndSortDueNotes();
        }
    }
}
