import SRPlugin from "src/main";

export class SidebarManager {
    private plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    redraw(): void {
        // No-op since review queue view is removed
    }

    init(): void {
        // No-op since review queue view is removed
    }

    async activateReviewQueueViewPanel(): Promise<void> {
        // No-op since review queue view is removed
    }

    async openReviewQueueView(): Promise<void> {
        // No-op since review queue view is removed
    }
}
