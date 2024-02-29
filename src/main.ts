import { Notice, Plugin, TAbstractFile, TFile, getAllTags, FrontMatterCache } from "obsidian";

import { SRSettingTab, SRSettings, DEFAULT_SETTINGS, upgradeSettings, SettingsUtil } from "src/settings";
import { FlashcardModal } from "src/gui/flashcard-modal";
import { StatsModal } from "src/gui/stats-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "src/gui/sidebar";
import { osrSchedule } from "src/algorithms/osr/NoteScheduling";
import { YAML_FRONT_MATTER_REGEX, SCHEDULING_INFO_REGEX } from "src/constants";
import { NoteReviewDeck, ReviewDeckSelectionModal } from "src/NoteReviewDeck";
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
    IteratorDeckSource,
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
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";
import { DataStoreAlgorithm } from "./dataStoreAlgorithm/DataStoreAlgorithm";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { DataStoreInNote_AlgorithmOsr } from "./dataStoreAlgorithm/DataStoreInNote_AlgorithmOsr";
import { DataStore_StoreInNote } from "./dataStore/storeInNote/DataStore_StoreInNote";
import { SrsAlgorithm_Osr } from "./algorithms/osr/SrsAlgorithm_Osr";
import { NoteEaseList } from "./NoteEaseList";
import { OsrVaultData } from "./OsrVaultData";
import { DEFAULT_DATA, PluginData } from "./PluginData";



export default class SRPlugin extends Plugin {
    private statusBar: HTMLElement;
    private reviewQueueView: ReviewQueueListView;
    public data: PluginData;
    private osrVaultData: OsrVaultData;


    async onload(): Promise<void> {
        console.log("onload: Branch: feat-878-support-multiple-sched, Date: 2024-02-28");
        await this.loadPluginData();
        this.osrVaultData = new OsrVaultData();
        this.osrVaultData.init(this, this.data.settings,
            this.data.buryList,
        );

        appIcon();

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", t("OPEN_NOTE_FOR_REVIEW"));
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", async () => {
            if (!this.osrVaultData.syncLock) {
                await this.sync();
                this.osrVaultData.noteReviewQueue.reviewNextNoteModal();
            }
        });

        this.addRibbonIcon("SpacedRepIcon", t("REVIEW_CARDS"), async () => {
            if (!this.osrVaultData.syncLock) {
                await this.sync();
                this.openFlashcardModal(
                    this.osrVaultData.reviewableDeckTree,
                    this.osrVaultData.remainingDeckTree,
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
                if (!this.osrVaultData.syncLock) {
                    await this.sync();
                    this.osrVaultData.noteReviewQueue.reviewNextNoteModal();
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
                if (!this.osrVaultData.syncLock) {
                    await this.sync();
                    this.openFlashcardModal(
                        this.osrVaultData.reviewableDeckTree,
                        this.osrVaultData.remainingDeckTree,
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
                this.openFlashcardModal(this.osrVaultData.reviewableDeckTree, this.osrVaultData.reviewableDeckTree, FlashcardReviewMode.Cram);
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
                if (!this.osrVaultData.syncLock) {
                    await this.sync();
                    new StatsModal(this.app, this).open();
                }
            },
        });

        this.addSettingTab(new SRSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.initView();
            setTimeout(async () => {
                if (!this.osrVaultData.syncLock) {
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
        const noteSrTFile: ISRFile = this.createSrTFile(noteFile);
        const topicPath: TopicPath = this.findTopicPath(noteSrTFile);
        const note: Note = await this.osrVaultData.loadNote(noteSrTFile, topicPath);

        const deckTree = new Deck("root", null);
        note.appendCardsToDeck(deckTree);
        const remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this.osrVaultData.questionPostponementList,
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
            this.osrVaultData.questionPostponementList,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        new FlashcardModal(this.app, this, this.data.settings, reviewSequencer, reviewMode).open();
    }

    private static createDeckTreeIterator(settings: SRSettings): IDeckTreeIterator {
        let cardOrder: CardOrder = CardOrder[settings.flashcardCardOrder as keyof typeof CardOrder];
        if (cardOrder === undefined) cardOrder = CardOrder.DueFirstSequential;
        let deckOrder: DeckOrder = DeckOrder[settings.flashcardDeckOrder as keyof typeof DeckOrder];
        if (deckOrder === undefined) deckOrder = DeckOrder.PrevDeckComplete_Sequential;
        console.log(`createDeckTreeIterator: CardOrder: ${cardOrder}, DeckOrder: ${deckOrder}`);

        const iteratorOrder: IIteratorOrder = {
            deckOrder,
            cardOrder,
        };
        return new DeckTreeIterator(iteratorOrder, IteratorDeckSource.UpdatedByIterator);
    }

    async sync(): Promise<void> {
        if (this.osrVaultData.syncLock) {
            return;
        }

        if (this.osrVaultData.questionPostponementList.clearIfNewDay(this.data)) {
            // The following isn't needed for plug-in functionality; but can aid during debugging
            await this.savePluginData();
        }
        const now = window.moment(Date.now());

        this.osrVaultData.sync(this.app, this.data.settings);

        if (this.data.settings.showDebugMessages) {
            // TODO: console.log(`SR: ${t("EASES")}`, this.easeByPath.dict);
            console.log(`SR: ${t("DECKS")}`, this.osrVaultData.reviewableDeckTree);
            console.log(
                "SR: " +
                    t("SYNC_TIME_TAKEN", {
                        t: Date.now() - now.valueOf(),
                    }),
            );
        }
    }

    private updateAndSortDueNotes() {
        this.noteReviewQueue.determineScheduleInfo(this.osrNoteGraph);

        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.osrVaultData.noteReviewQueue.dueNotesCount,
                dueFlashcardsCount: this.osrVaultData.remainingDeckTree.getCardCount(CardListType.All, true),
            }),
        );

        if (this.data.settings.enableNoteReviewPaneOnStartup) this.reviewQueueView.redraw();
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
        const buryListChanged: boolean = await this.osrVaultData.saveNoteReviewResponse(noteSrTFile, response, this.data.settings, this.data.buryList);
        if (buryListChanged) {
            await this.savePluginData();
        }

        // Update note's properties to update our due notes.
        // Algorithm
        this.noteReviewQueue.updateScheduleInfo(noteSrTFile, updatedNoteSchedule);

        this.updateAndSortDueNotes();

        new Notice(t("RESPONSE_RECEIVED"));
    }

    private onOsrVault

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }

    findTopicPath(note: ISRFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.data.settings);
    }

    async loadPluginData(): Promise<void> {
        const loadedData: PluginData = await this.loadData();
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this.data = Object.assign({}, DEFAULT_DATA, loadedData);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);

        this.setupDataStoreAndAlgorithmInstances();
    }

    setupDataStoreAndAlgorithmInstances(): void {
        const settings: SRSettings = this.data.settings;
        DataStore.instance = new DataStore_StoreInNote(settings);
        DataStoreAlgorithm.instance = new DataStoreInNote_AlgorithmOsr(settings);
        SrsAlgorithm.instance = new SrsAlgorithm_Osr(settings, this.osrVaultData.easeByPath);
    }

    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }

    initView(): void {
        this.registerView(
            REVIEW_QUEUE_VIEW_TYPE,
            (leaf) => (this.reviewQueueView = new ReviewQueueListView(leaf, this.app, this.noteReviewQueue, this.data.settings)),
        );

        if (
            this.data.settings.enableNoteReviewPaneOnStartup &&
            app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).length == 0
        ) {
            this.app.workspace.getRightLeaf(false).setViewState({
                type: REVIEW_QUEUE_VIEW_TYPE,
                active: true,
            });
        }
    }
}
