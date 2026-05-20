import { Plugin } from "obsidian";

import { SRSettings } from "src/settings";

export class SidebarManager {
    private plugin: Plugin;
    private settings: SRSettings;

    constructor(plugin: Plugin, settings: SRSettings) {
        this.plugin = plugin;
        this.settings = settings;
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
