import "src/ui/obsidian-ui-components/modals/modal-view.css";
import { App, Modal, Platform } from "obsidian";

import { SettingsManager } from "src/data/settings-manager";
import type SRPlugin from "src/main";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import EmulatedPlatform from "src/utils/platform-detector";

export class SRModalView extends Modal {
    private contentManager: ContentManager;
    private plugin: SRPlugin;
    private settingsManager: SettingsManager;
    private resizeObserver: ResizeObserver | null = null;

    constructor(
        app: App,
        plugin: SRPlugin,
        settingsManager: SettingsManager,
        reviewQueueLoader: ReviewQueueLoader,
    ) {
        super(app);
        this.plugin = plugin;
        this.settingsManager = settingsManager;

        // Setup base containers
        if (Platform.isMobile || EmulatedPlatform().isMobile) {
            this.setModalSize(
                this.settingsManager.settings.flashcardHeightPercentageMobile,
                this.settingsManager.settings.flashcardWidthPercentageMobile,
            );
        } else {
            this.setModalSize(
                this.settingsManager.settings.flashcardHeightPercentage,
                this.settingsManager.settings.flashcardWidthPercentage,
            );

            this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
                void this.onResize(entries);
            });
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
            this.settingsManager.settings,
            this.contentEl,
            () => {
                this.close();
            },
        );
        this.plugin.uiManager.setContentManager(this.contentManager);
    }

    onOpen(): void {
        void this.contentManager.open();
    }

    onClose(): void {
        this.contentManager.close();
    }

    private async onResize(entries: ResizeObserverEntry[]) {
        const modalEl = entries[0].target as HTMLElement;
        const parent = modalEl.parentElement;

        if (parent === null) return;

        const elementHeight = modalEl.offsetHeight;
        const parentHeight = parent.offsetHeight;
        const heightPercent = (elementHeight / parentHeight) * 100;

        const elementWidth = modalEl.offsetWidth;
        const parentWidth = parent.offsetWidth;
        const widthPercent = (elementWidth / parentWidth) * 100;

        this.setRoundedModalCorners(!(heightPercent >= 100 || widthPercent >= 100));

        await this.saveSizeToSettings(
            heightPercent,
            widthPercent,
            Platform.isMobile || EmulatedPlatform().isMobile,
        );
    }

    private setRoundedModalCorners(rounded: boolean) {
        this.modalEl.setCssProps({ "border-Radius": rounded ? "var(--modal-radius)" : "0" });
    }

    private setModalSize(heightPercent: number, widthPercent: number) {
        this.modalEl.setCssProps({ height: heightPercent + "%" });
        this.modalEl.setCssProps({ width: widthPercent + "%" });

        this.setRoundedModalCorners(
            !(
                parseInt(this.modalEl.getCssPropertyValue("height").split("%")[0]) >= 100 ||
                parseInt(this.modalEl.getCssPropertyValue("width").split("%")[0]) >= 100
            ),
        );
    }

    private async saveSizeToSettings(
        heightPercent: number,
        widthPercent: number,
        isMobile: boolean,
    ) {
        if (isNaN(heightPercent) || isNaN(widthPercent)) return;

        if (isMobile) {
            this.settingsManager.settings.flashcardHeightPercentageMobile = heightPercent;
            this.settingsManager.settings.flashcardWidthPercentageMobile = widthPercent;
        } else {
            this.settingsManager.settings.flashcardHeightPercentage = heightPercent;
            this.settingsManager.settings.flashcardWidthPercentage = widthPercent;
        }
        await this.plugin.dataManager.savePluginData();
    }
}
