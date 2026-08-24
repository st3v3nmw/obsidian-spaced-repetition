import "src/ui/obsidian-ui-components/item-views/review-queue-list-view.css";
import { ItemView, Menu, setIcon, TFile, WorkspaceLeaf } from "obsidian";

import { TICKS_PER_DAY } from "src/data/constants";
import { DataStore } from "src/data/data-store/base/data-store";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SRSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { NoteReviewDeck } from "src/note/note-review-deck";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { getListWindow, NOTE_REVIEW_LIST_BATCH_SIZE } from "src/ui/note-review-list-window";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { formatDateWithMoment } from "src/utils/dates";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

interface ScheduledNoteGroup {
    dueUnix: number;
    title: string;
    notes: ISRNoteTFile[];
}

export class ReviewQueueListView extends ItemView {
    private get noteReviewQueue(): NoteReviewQueue {
        return this.nextNoteReviewHandler.noteReviewQueue;
    }
    private settings: SRSettings;
    private nextNoteReviewHandler: NextNoteReviewHandler;
    private headerEl: HTMLElement | null = null;
    private treeEl: HTMLElement | null = null;
    private plugin: SRPlugin;
    private redrawFrameId: number | null = null;
    private redrawWindow: Window | null = null;
    private visibleFileLimits = new Map<string, number>();

    constructor(
        leaf: WorkspaceLeaf,
        nextNoteReviewHandler: NextNoteReviewHandler,
        settings: SRSettings,
        plugin: SRPlugin,
    ) {
        super(leaf);

        this.nextNoteReviewHandler = nextNoteReviewHandler;
        this.settings = settings;
        this.plugin = plugin;

        if (this.settings.enableNoteReviewPaneOnStartup) {
            this.registerEvent(this.app.workspace.on("file-open", () => this.requestRedraw()));
            this.registerEvent(this.app.vault.on("rename", () => this.requestRedraw()));
        }
    }

    public getViewType(): string {
        return REVIEW_QUEUE_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return t("NOTES_REVIEW_QUEUE");
    }

    public getIcon(): string {
        return "SpacedRepIcon";
    }

    protected onOpen(): Promise<void> {
        this.redraw();

        return Promise.resolve();
    }

    protected onClose(): Promise<void> {
        this.cancelScheduledRedraw();

        return Promise.resolve();
    }

    public onHeaderMenu(menu: Menu): void {
        menu.addItem((item) => {
            item.setTitle(t("CLOSE"))
                .setIcon("cross")
                .onClick(() => {
                    this.app.workspace.detachLeavesOfType(REVIEW_QUEUE_VIEW_TYPE);
                });
        });
    }

    public requestRedraw(): void {
        if (!this.containerEl.isConnected || this.redrawFrameId !== null) return;

        const ownerWindow = this.containerEl.ownerDocument.defaultView;
        if (!ownerWindow) {
            this.redraw();
            return;
        }

        this.redrawWindow = ownerWindow;
        this.redrawFrameId = ownerWindow.requestAnimationFrame(() => {
            this.redrawFrameId = null;
            this.redrawWindow = null;

            if (this.containerEl.isConnected) this.redraw();
        });
    }

    private cancelScheduledRedraw(): void {
        if (this.redrawFrameId !== null && this.redrawWindow !== null) {
            this.redrawWindow.cancelAnimationFrame(this.redrawFrameId);
        }
        this.redrawFrameId = null;
        this.redrawWindow = null;
    }

    public redraw(): void {
        this.cancelScheduledRedraw();
        this.contentEl.empty();
        this.contentEl.addClass("sr-note-review-page");

        this.headerEl = this.contentEl.createDiv("sr-note-review-header");
        const titleWrapper = this.headerEl.createDiv("sr-note-review-header-title-wrapper");

        const titleIcon = titleWrapper.createDiv("sr-note-review-header-title-icon");
        setIcon(titleIcon, "lucide-file-clock");

        titleWrapper.createDiv("sr-note-review-header-title").setText(t("OPEN_NOTE_FOR_REVIEW"));

        const subTitleWrapper = this.contentEl.createDiv("sr-note-review-header-subtitle-wrapper");
        subTitleWrapper
            .createDiv("sr-note-review-header-subtitle")
            .setText(
                !this.noteReviewQueue.reviewDecks || this.noteReviewQueue.reviewDecks.size === 0
                    ? t("NOTE_REVIEW_QUEUE_EMPTY_HINT")
                    : t("NOTE_REVIEW_QUEUE_HINT"),
            );

        this.treeEl = this.contentEl.createDiv("tree-item nav-folder mod-root");

        if (!this.noteReviewQueue.reviewDecks) return;
        const activeFilePath = this.app.workspace.getActiveFile()?.path ?? null;
        this.createTree(this.treeEl, activeFilePath);
    }

    private createTree(parentEl: HTMLElement, activeFilePath: string | null): void {
        const childrenEl: HTMLElement = parentEl.createDiv(
            "tree-item-children nav-folder-children",
        );

        for (const [deckKey, deck] of this.noteReviewQueue.reviewDecks) {
            this.createDeckTreeItem(childrenEl, deckKey, deck, activeFilePath);
        }
    }

    private createDeckTreeItem(
        parentEl: HTMLElement,
        deckKey: string,
        deck: NoteReviewDeck,
        activeFilePath: string | null,
    ): void {
        if (this.deckContainsActiveFile(deck, activeFilePath)) {
            deck.activeFolders.add(deckKey);
        }

        const deckCollapsed = !deck.activeFolders.has(deckKey);
        let deckContentsCreated = false;

        this.createFolder(parentEl, deckKey, deckCollapsed, deck, (deckFolderEl) => {
            if (deckContentsCreated) return;
            deckContentsCreated = true;

            if (deck.newNotes.length > 0) {
                this.createNewNotesFolder(deckFolderEl, deck, activeFilePath);
            }
            if (deck.scheduledNotes.length > 0) {
                this.createScheduledNotesFolder(deckFolderEl, deck, activeFilePath);
            }
        });
    }

    private createNewNotesFolder(
        parentEl: HTMLElement,
        deck: NoteReviewDeck,
        activeFilePath: string | null,
    ): void {
        const folderTitle = t("NEW");
        if (deck.newNotes.some((note) => note.path === activeFilePath)) {
            deck.activeFolders.add(folderTitle);
        }

        const windowKey = `${deck.deckName}\u0000new`;
        let folderContentsCreated = false;

        this.createFolder(
            parentEl,
            folderTitle,
            !deck.activeFolders.has(folderTitle),
            deck,
            (childrenEl) => {
                if (folderContentsCreated) return;
                folderContentsCreated = true;
                this.renderFilesWindow(childrenEl, deck.newNotes, activeFilePath, deck, windowKey);
            },
        );
    }

    private createScheduledNotesFolder(
        parentEl: HTMLElement,
        deck: NoteReviewDeck,
        activeFilePath: string | null,
    ): void {
        for (const group of this.getScheduledNoteGroups(deck)) {
            if (group.notes.some((note) => note.path === activeFilePath)) {
                deck.activeFolders.add(group.title);
            }

            const windowKey = `${deck.deckName}\u0000scheduled:${group.dueUnix}`;
            let folderContentsCreated = false;

            this.createFolder(
                parentEl,
                group.title,
                !deck.activeFolders.has(group.title),
                deck,
                (childrenEl) => {
                    if (folderContentsCreated) return;
                    folderContentsCreated = true;
                    this.renderFilesWindow(
                        childrenEl,
                        group.notes,
                        activeFilePath,
                        deck,
                        windowKey,
                    );
                },
            );
        }
    }

    private getScheduledNoteGroups(deck: NoteReviewDeck): ScheduledNoteGroup[] {
        const groups: ScheduledNoteGroup[] = [];
        const now: number = Date.now();
        const maxDaysToRender: number = this.settings.maxNDaysNotesReviewQueue;

        for (const sNote of deck.scheduledNotes) {
            const existingGroup = groups[groups.length - 1];
            if (existingGroup?.dueUnix === sNote.dueUnix) {
                existingGroup.notes.push(sNote.note);
                continue;
            }

            const nDays: number = Math.ceil((sNote.dueUnix - now) / TICKS_PER_DAY);
            if (nDays > maxDaysToRender) break;

            let folderTitle: string;
            if (nDays === -1) {
                folderTitle = t("YESTERDAY");
            } else if (nDays === 0) {
                folderTitle = t("TODAY");
            } else if (nDays === 1) {
                folderTitle = t("TOMORROW");
            } else {
                folderTitle = formatDateWithMoment(
                    sNote.dueUnix,
                    this.settings.preferredDateFormatForNoteReviewQueue,
                );
            }

            groups.push({
                dueUnix: sNote.dueUnix,
                title: folderTitle,
                notes: [sNote.note],
            });
        }

        return groups;
    }

    private deckContainsActiveFile(deck: NoteReviewDeck, activeFilePath: string | null): boolean {
        if (activeFilePath === null) return false;

        return (
            deck.newNotes.some((note) => note.path === activeFilePath) ||
            deck.scheduledNotes.some((note) => note.note.path === activeFilePath)
        );
    }

    private renderFilesWindow(
        parentEl: HTMLElement,
        notes: readonly ISRNoteTFile[],
        activeFilePath: string | null,
        deck: NoteReviewDeck,
        windowKey: string,
    ): void {
        parentEl.empty();

        const requestedLimit = this.visibleFileLimits.get(windowKey) ?? NOTE_REVIEW_LIST_BATCH_SIZE;
        const activeIndex = activeFilePath
            ? notes.findIndex((note) => note.path === activeFilePath)
            : -1;
        const listWindow = getListWindow(notes, requestedLimit, activeIndex);

        for (const note of listWindow.items) {
            this.createFile(parentEl, note.tfile, note.path === activeFilePath, deck);
        }

        if (listWindow.remainingCount === 0) return;

        const nextBatchCount = Math.min(
            NOTE_REVIEW_LIST_BATCH_SIZE,
            notes.length - listWindow.prefixCount,
        );
        const loadMoreEl = parentEl.createDiv(
            "tree-item-self nav-file-title sr-note-review-load-more is-clickable",
        );
        loadMoreEl.setAttribute("role", "button");
        loadMoreEl.setAttribute("tabindex", "0");
        loadMoreEl.setAttribute("aria-label", `+${nextBatchCount}`);

        const loadMoreIconEl = loadMoreEl.createDiv("sr-note-review-load-more-icon");
        setIcon(loadMoreIconEl, "chevrons-down");
        loadMoreEl
            .createDiv("tree-item-inner sr-note-review-load-more-count")
            .setText(`${listWindow.items.length} / ${notes.length} · +${nextBatchCount}`);

        const loadNextBatch = (): void => {
            this.visibleFileLimits.set(
                windowKey,
                listWindow.prefixCount + NOTE_REVIEW_LIST_BATCH_SIZE,
            );
            this.renderFilesWindow(parentEl, notes, activeFilePath, deck, windowKey);
        };

        loadMoreEl.onClickEvent((event) => {
            event.preventDefault();
            event.stopPropagation();
            loadNextBatch();
        });
        loadMoreEl.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            loadNextBatch();
        });
    }

    private createFolder(
        parentEl: HTMLElement,
        folderTitle: string,
        collapsed: boolean,
        deck: NoteReviewDeck,
        onExpand?: (childrenEl: HTMLElement) => void,
    ): HTMLElement {
        const folderEl: HTMLDivElement = parentEl.createDiv("tree-item nav-folder");
        const folderTitleEl: HTMLDivElement = folderEl.createDiv("tree-item-self nav-folder-title");
        folderTitleEl.classList.add("is-clickable");
        folderTitleEl.setAttribute("aria-expanded", String(!collapsed));
        const childrenEl: HTMLDivElement = folderEl.createDiv(
            "tree-item-children nav-folder-children",
        );
        const collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
            "tree-item-icon collapse-icon nav-folder-collapse-indicator",
        );
        setIcon(collapseIconEl, "chevron-down");

        folderTitleEl.createDiv("tree-item-inner nav-folder-title-content").setText(folderTitle);

        this.changeFolderFolding(folderEl, collapsed);

        folderTitleEl.onClickEvent(() => {
            const shouldCollapse = !folderEl.hasClass("is-collapsed");
            this.changeFolderFolding(folderEl, shouldCollapse);
            folderTitleEl.setAttribute("aria-expanded", String(!shouldCollapse));

            if (shouldCollapse) {
                deck.activeFolders.delete(folderTitle);
            } else {
                deck.activeFolders.add(folderTitle);
                onExpand?.(childrenEl);
            }
        });

        if (!collapsed) onExpand?.(childrenEl);

        return folderEl;
    }

    private createFile(
        parentEl: HTMLElement,
        file: TFile,
        fileElActive: boolean,
        deck: NoteReviewDeck,
    ): void {
        const navFileEl: HTMLElement = parentEl.createDiv("nav-file");

        const navFileTitle: HTMLElement = navFileEl.createDiv("tree-item-self nav-file-title");
        navFileTitle.addClass("is-clickable");

        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }

        const navFileTitleInner: HTMLElement = navFileTitle.createDiv(
            "tree-item-inner nav-file-title-content",
        );
        navFileTitleInner.setText(file.basename);
        navFileTitleInner.addEventListener(
            "click",
            (event: MouseEvent) => {
                event.preventDefault();
                void this.nextNoteReviewHandler.openNote(deck.deckName, file);
                return false;
            },
            false,
        );

        const navFileContextBtn: HTMLElement = navFileTitle.createDiv(
            "sr-review-context-btn clickable-icon",
        );
        setIcon(navFileContextBtn, "ellipsis-vertical");
        navFileContextBtn.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            const fileMenu: Menu = new Menu();
            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardEasyText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Easy,
                        );
                    });
            });

            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardGoodText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Good,
                        );
                    });
            });

            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardHardText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Hard,
                        );
                    });
            });

            fileMenu.addSeparator();

            if (this.plugin.dataManager.data.settings.showDeleteButtonInFileMenu) {
                fileMenu.addItem((item) => {
                    item.setTitle(t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"))
                        .setIcon("trash")
                        .setWarning(true)
                        .onClick(() => {
                            new ConfirmationModal(
                                this.plugin.app,
                                t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"),
                                t("CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION"),
                                t("NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS"),
                                async () => {
                                    await DataStore.instance.fileModifier.deleteNoteSchedulingDataInNote(
                                        file,
                                        this.plugin.dataManager.data.settings
                                            .deleteTagsOnSchedulingDataDeletion,
                                        this.plugin.dataManager.data.settings.tagsToReview,
                                    );
                                },
                            ).open();
                        });
                });
            }

            fileMenu.showAtPosition({
                x: event.pageX,
                y: event.pageY,
            });
            fileMenu.showAtMouseEvent(event);

            return false;
        });
    }

    private changeFolderFolding(folderEl: HTMLElement, collapsed = false): void {
        const childEl = folderEl.firstElementChild?.firstElementChild || null;
        const childrenEl = folderEl.getElementsByClassName(
            "tree-item-children nav-folder-children",
        )[0] as HTMLElement | undefined;
        if (collapsed && !folderEl.hasClass("is-collapsed")) {
            folderEl.addClass("is-collapsed");
            if (childEl) childEl.classList.add("is-collapsed");
        } else {
            folderEl.removeClass("is-collapsed");
            if (childEl) childEl.classList.remove("is-collapsed");
        }
        childrenEl?.setCssProps({ display: collapsed ? "none" : "block" });
    }
}
