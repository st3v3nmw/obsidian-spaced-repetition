import { App, Plugin, WorkspaceLeaf } from "obsidian";

import { REVIEW_QUEUE_VIEW_TYPE, ReviewQueueListView } from "src/gui/review-queue-list-view";
import { NextNoteReviewHandler } from "src/next-note-review-handler";
import { SRSettings } from "src/settings";

export class OsrSidebar {
    private plugin: Plugin;
    private settings: SRSettings;
    private nextNoteReviewHandler: NextNoteReviewHandler;
    private reviewQueueListView: ReviewQueueListView;

    private get app(): App {
        return this.plugin.app;
    }

    constructor(
        plugin: Plugin,
        settings: SRSettings,
        nextNoteReviewHandler: NextNoteReviewHandler,
    ) {
        this.plugin = plugin;
        this.settings = settings;
        this.nextNoteReviewHandler = nextNoteReviewHandler;
    }

    redraw(): void {
        this.reviewQueueListView.redraw();
    }

    private getActiveLeaf(type: string): WorkspaceLeaf | null {
        const leaves = this.app.workspace.getLeavesOfType(type);
        if (leaves.length == 0) {
            return this.app.workspace.getRightLeaf(false);
        }

        return leaves[0];
    }

    init(): void {
        this.plugin.registerView(REVIEW_QUEUE_VIEW_TYPE, (leaf) => {
            return (this.reviewQueueListView = new ReviewQueueListView(
                leaf,
                this.nextNoteReviewHandler,
                this.settings,
            ));
        });
    }

    async activateReviewQueueViewPanel(): Promise<void> {
        if (this.settings.enableNoteReviewPaneOnStartup) {
            await this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE).setViewState({
                type: REVIEW_QUEUE_VIEW_TYPE,
                active: true,
            });
        }
    }

    async openReviewQueueView(): Promise<void> {
        const reviewQueueLeaf = this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE);
        this.app.workspace.revealLeaf(reviewQueueLeaf);
    }
}
