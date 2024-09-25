import { EventRef, Menu, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import {
    SRSettingTab,
    SRSettings,
    DEFAULT_SETTINGS,
    upgradeSettings,
    SettingsUtil,
} from "src/settings";
import { REVIEW_QUEUE_VIEW_TYPE } from "src/gui/ReviewQueueListView";
import { t } from "src/lang/helpers";
import { appIcon } from "src/icons/appicon";
import { TopicPath } from "./TopicPath";
import { CardListType, Deck, DeckTreeFilter } from "./Deck";
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
import { QuestionPostponementList } from "./QuestionPostponementList";
import { TextDirection } from "./util/TextDirection";
import { convertToStringOrEmpty } from "./util/utils";
import { ReviewResponse } from "./algorithms/base/RepetitionItem";
import { SrsAlgorithm } from "./algorithms/base/SrsAlgorithm";
import { DataStore } from "./dataStore/base/DataStore";
import { DataStoreAlgorithm } from "./dataStoreAlgorithm/DataStoreAlgorithm";
import { DataStoreInNote_AlgorithmOsr } from "./dataStoreAlgorithm/DataStoreInNote_AlgorithmOsr";
import { DataStore_StoreInNote } from "./dataStore/storeInNote/DataStore_StoreInNote";
import { SrsAlgorithm_Osr } from "./algorithms/osr/SrsAlgorithm_Osr";
import { OsrAppCore } from "./OsrAppCore";
import { DEFAULT_DATA, PluginData } from "./PluginData";
import { NextNoteReviewHandler } from "./NextNoteReviewHandler";
import { OsrSidebar } from "./gui/OsrSidebar";
import { ObsidianVaultNoteLinkInfoFinder } from "./algorithms/osr/ObsidianVaultNoteLinkInfoFinder";
import { StatsModal } from "./gui/StatsModal";
import { FlashcardModal } from "./gui/FlashcardModal";
import { setDebugParser } from "./parser";
import { generateParser } from "./generateParser";

export default class SRPlugin extends Plugin {
    public data: PluginData;
    private osrAppCore: OsrAppCore;
    private osrSidebar: OsrSidebar;
    private nextNoteReviewHandler: NextNoteReviewHandler;

    private debouncedGenerateParserTimeout: number | null = null;

    private ribbonIcon: HTMLElement | null = null;
    private statusBar: HTMLElement | null = null;
    private fileMenuHandler:((menu:Menu,file:TAbstractFile, source:string, leaf?:WorkspaceLeaf)=>void);

    async onload(): Promise<void> {
        console.log("onload: Branch: feat-878-support-multiple-sched, Date: 2024-07-24");
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

    showFileMenuItems(status:boolean) {

        if(this.fileMenuHandler===undefined) { // define the handler if it was not defined yet
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

        if(status){
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
        DataStore.instance = new DataStore_StoreInNote(settings);
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

    showRibbonIcon(status:boolean) {
        if(!this.ribbonIcon) { // if it does not exit, we create it
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
        if(status) {
            this.ribbonIcon.style.display = "";
        } else {
            this.ribbonIcon.style.display = "none";
        }
    }

    showStatusBar(status:boolean) {
        if(!this.statusBar) { // if it does not exit, we create it
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
        if(status) {
            this.statusBar.style.display = "";
        } else {
            this.statusBar.style.display = "none";
        }
    }
}
