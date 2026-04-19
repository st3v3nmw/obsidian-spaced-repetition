import "src/ui/obsidian-ui-components/modals/modal-view.css";
import { App, Modal, Platform } from "obsidian";

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import EmulatedPlatform from "src/utils/platform-detector";

export class SRModalView extends Modal {
    private contentManager: ContentManager;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewQueueLoader: ReviewQueueLoader,
    ) {
        super(app);

        // Setup base containers
        if (Platform.isMobile || EmulatedPlatform().isMobile) {
            this.modalEl.style.height = settings.flashcardHeightPercentageMobile + "%";
            this.modalEl.style.maxHeight = settings.flashcardHeightPercentageMobile + "%";
            this.modalEl.style.width = settings.flashcardWidthPercentageMobile + "%";
            this.modalEl.style.maxWidth = settings.flashcardWidthPercentageMobile + "%";
        } else {
            this.modalEl.style.height = settings.flashcardHeightPercentage + "%";
            this.modalEl.style.maxHeight = settings.flashcardHeightPercentage + "%";
            this.modalEl.style.width = settings.flashcardWidthPercentage + "%";
            this.modalEl.style.maxWidth = settings.flashcardWidthPercentage + "%";
        }
        this.modalEl.setAttribute("id", "sr-modal-view");
        this.modalEl.addClass("sr-view");

        if (
            parseInt(this.modalEl.style.height.split("%")[0]) >= 100 ||
            parseInt(this.modalEl.style.width.split("%")[0]) >= 100
        ) {
            this.modalEl.style.borderRadius = "0";
        }

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
}
