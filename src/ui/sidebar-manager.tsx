import { App, WorkspaceLeaf } from "obsidian";

import SRPlugin from "src/main";
import {
    REVIEW_QUEUE_VIEW_TYPE,
    ReviewQueueListView,
} from "src/ui/obsidian-ui-components/item-views/review-queue-list-view";

export class SidebarManager {
    private plugin: SRPlugin;
    private reviewQueueListView: ReviewQueueListView | null = null;

    private get app(): App {
        return this.plugin.app;
    }

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    redraw(): void {
        if (this.reviewQueueListView === null) return;
        this.reviewQueueListView.redraw();
    }

    private getActiveLeaf(type: string): WorkspaceLeaf | null {
        const leaves = this.app.workspace.getLeavesOfType(type);
        if (leaves.length === 0) {
            return this.app.workspace.getRightLeaf(false);
        }

        return leaves[0];
    }

    init(): void {
        this.plugin.registerView(REVIEW_QUEUE_VIEW_TYPE, (leaf) => {
            return (this.reviewQueueListView = new ReviewQueueListView(
                leaf,
                this.plugin.nextNoteReviewHandler,
                this.plugin.dataManager.data.settings,
                this.plugin,
            ));
        });
    }

    async activateReviewQueueViewPanel(): Promise<void> {
        if (this.plugin.dataManager.data.settings.enableNoteReviewPaneOnStartup) {
            const activeLeaf = this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE);
            if (!activeLeaf) return;

            await activeLeaf.setViewState({
                type: REVIEW_QUEUE_VIEW_TYPE,
                active: true,
            });
        }
    }

    async openReviewQueueView(): Promise<void> {
        const reviewQueueLeaf = this.getActiveLeaf(REVIEW_QUEUE_VIEW_TYPE);
        if (!reviewQueueLeaf) return;
        await this.app.workspace.revealLeaf(reviewQueueLeaf);
    }
}
