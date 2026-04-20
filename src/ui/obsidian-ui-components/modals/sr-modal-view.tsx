import "src/ui/obsidian-ui-components/modals/modal-view.css";
import { App, Modal, Platform } from "obsidian";

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import EmulatedPlatform from "src/utils/platform-detector";

export class SRModalView extends Modal {
    private contentManager: ContentManager;
    private plugin: SRPlugin;
    private resizeObserver: ResizeObserver | null = null;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewQueueLoader: ReviewQueueLoader,
    ) {
        super(app);
        this.plugin = plugin;

        // Setup base containers
        if (Platform.isMobile || EmulatedPlatform().isMobile) {
            this.setModalSize(
                settings.flashcardHeightPercentageMobile,
                settings.flashcardWidthPercentageMobile,
            );
        } else {
            this.setModalSize(
                settings.flashcardHeightPercentage,
                settings.flashcardWidthPercentage,
            );

            this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
            this.resizeObserver.observe(this.modalEl);
        }

        this.modalEl.setAttribute("id", "sr-modal-view");
        this.modalEl.addClass("sr-view");

        this.contentEl.addClass("sr-modal-content");

        // Init static elements in views
        this.contentManager = new ContentManager(
            app,
            plugin,
            reviewQueueLoader,
            settings,
            this.contentEl,
            this.close.bind(this),
        );
    }

    onOpen(): void {
        this.contentManager.open();
    }

    onClose(): void {
        this.contentManager.close();
    }

    private onResize(entries: ResizeObserverEntry[]) {
        const modalEl = entries[0].target as HTMLElement;
        const parent = modalEl.parentElement;

        if (parent === null) return;

        const elementHeight = modalEl.offsetHeight;
        const parentHeight = parent.offsetHeight;
        const heightPercent = (elementHeight / parentHeight) * 100;

        const elementWidth = modalEl.offsetWidth;
        const parentWidth = parent.offsetWidth;
        const widthPercent = (elementWidth / parentWidth) * 100;

        this.saveSizeToSettings(
            heightPercent,
            widthPercent,
            Platform.isMobile || EmulatedPlatform().isMobile,
        );
    }

    private setModalSize(heightPercent: number, widthPercent: number) {
        this.modalEl.style.height = heightPercent + "%";
        this.modalEl.style.width = widthPercent + "%";
        if (
            parseInt(this.modalEl.style.height.split("%")[0]) >= 100 ||
            parseInt(this.modalEl.style.width.split("%")[0]) >= 100
        ) {
            this.modalEl.style.borderRadius = "0";
        }
    }

    private async saveSizeToSettings(
        heightPercent: number,
        widthPercent: number,
        isMobile: boolean,
    ) {
        if (isNaN(heightPercent) || isNaN(widthPercent)) return;

        if (isMobile) {
            this.plugin.data.settings.flashcardHeightPercentageMobile = heightPercent;
            this.plugin.data.settings.flashcardWidthPercentageMobile = widthPercent;
        } else {
            this.plugin.data.settings.flashcardHeightPercentage = heightPercent;
            this.plugin.data.settings.flashcardWidthPercentage = widthPercent;
        }
        await this.plugin.savePluginData();
    }
}
