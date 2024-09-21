import { Menu, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { ObsidianVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { SrsAlgorithm_Osr } from "src/algorithms/osr/srs-algorithm-osr";
import { OsrAppCore } from "src/app-core";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNote_AlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DataStore } from "src/data-stores/base/data-store";
import { StoreInNote } from "src/data-stores/store-in-note/note";
import { CardListType, Deck, DeckTreeFilter } from "src/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck-tree-iterator";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/flashcard-review-sequencer";
import { FlashcardModal } from "src/gui/flashcard-modal";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/gui/review-queue-list-view";
import { OsrSidebar } from "src/gui/sidebar";
import { StatsModal } from "src/gui/stats-modal";
import { appIcon } from "src/icons/app-icon";
import { t } from "src/lang/helpers";
import { NextNoteReviewHandler } from "src/next-note-review-handler";
import { Note } from "src/note";
import { NoteFileLoader } from "src/note-file-loader";
import { generateParser, setDebugParser } from "src/parser";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { QuestionPostponementList } from "src/question-postponement-list";
import {
    DEFAULT_SETTINGS,
    SettingsUtil,
    SRSettings,
    SRSettingTab,
    upgradeSettings,
} from "src/settings";
import { ISRFile, SrTFile as SrTFile } from "src/sr-file";
import { TopicPath } from "src/topic-path";
import { TextDirection } from "src/utils/text-direction";
import { convertToStringOrEmpty } from "src/utils/utils";

export default class SRPlugin extends Plugin {
    public data: PluginData;
    private osrAppCore: OsrAppCore;
    private osrSidebar: OsrSidebar;
    private nextNoteReviewHandler: NextNoteReviewHandler;

    private debouncedGenerateParserTimeout: number | null = null;

    private ribbonIcon: HTMLElement | null = null;
    private statusBar: HTMLElement | null = null;
    private fileMenuHandler: (
        menu: Menu,
        file: TAbstractFile,
        source: string,
        leaf?: WorkspaceLeaf,
    ) => void;

    async onload(): Promise<void> {
        await this.loadPluginData();

        this.initLogicClasses();

        this.initGuiItems();
    }

    private initLogicClasses() {
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
        );
    }

    private initGuiItems() {
        this.nextNoteReviewHandler = new NextNoteReviewHandler(
            this.app,
            this.data.settings,
            this.app.workspace,
            this.osrAppCore.noteReviewQueue,
        );
        appIcon();

        this.showStatusBar(this.data.settings.showStatusBar);

        this.showRibbonIcon(this.data.settings.showRibbonIcon);

        this.showFileMenuItems(!this.data.settings.disableFileMenuReviewOptions);

        this.addPluginCommands();

        this.addSettingTab(new SRSettingTab(this.app, this));

        this.osrSidebar = new OsrSidebar(this, this.data.settings, this.nextNoteReviewHandler);
        this.app.workspace.onLayoutReady(async () => {
            await this.osrSidebar.init();
            setTimeout(async () => {
                if (!this.osrAppCore.syncLock) {
                    await this.sync();
                }
            }, 2000);
        });
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
                this.openFlashcardModal(
                    this.osrAppCore.reviewableDeckTree,
                    this.osrAppCore.reviewableDeckTree,
                    FlashcardReviewMode.Cram,
                );
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
                    new StatsModal(this.app, this.osrAppCore).open();
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
            this.osrAppCore.dueDateFlashcardHistogram,
        );

        reviewSequencer.setDeckTree(fullDeckTree, remainingDeckTree);
        new FlashcardModal(this.app, this, this.data.settings, reviewSequencer, reviewMode).open();
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

        if (this.data.settings.showDebugMessages) {
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
        this.osrSidebar.redraw();
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
        setDebugParser(this.data.settings.showPaserDebugMessages);

        this.setupDataStoreAndAlgorithmInstances(this.data.settings);
    }

    setupDataStoreAndAlgorithmInstances(settings: SRSettings) {
        // For now we can hardcoded as we only support the one data store and one algorithm
        DataStore.instance = new StoreInNote(settings);
        SrsAlgorithm.instance = new SrsAlgorithm_Osr(settings);
        DataStoreAlgorithm.instance = new DataStoreInNote_AlgorithmOsr(settings);
    }

    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }

    async debouncedGenerateParser(timeout_ms = 250) {
        if (this.debouncedGenerateParserTimeout) {
            clearTimeout(this.debouncedGenerateParserTimeout);
        }

        this.debouncedGenerateParserTimeout = window.setTimeout(async () => {
            const parserOptions = {
                singleLineCardSeparator: this.data.settings.singleLineCardSeparator,
                singleLineReversedCardSeparator: this.data.settings.singleLineReversedCardSeparator,
                multilineCardSeparator: this.data.settings.multilineCardSeparator,
                multilineReversedCardSeparator: this.data.settings.multilineReversedCardSeparator,
                multilineCardEndMarker: this.data.settings.multilineCardEndMarker,
                convertHighlightsToClozes: this.data.settings.convertHighlightsToClozes,
                convertBoldTextToClozes: this.data.settings.convertBoldTextToClozes,
                convertCurlyBracketsToClozes: this.data.settings.convertCurlyBracketsToClozes,
            };
            generateParser(parserOptions);
            this.debouncedGenerateParserTimeout = null;
        }, timeout_ms);
    }

    showRibbonIcon(status: boolean) {
        // if it does not exit, we create it
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
        // if it does not exit, we create it
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
