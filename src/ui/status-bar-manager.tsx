import { Platform, request } from "obsidian";

import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import IconTextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/icon-text-statusbar-item";
import EmulatedPlatform from "src/utils/platform-detector";

export type StatusBarItemType = "card-review" | "note-review" | "update-available";
export const StatusBarItemTypesArray: ReadonlyArray<StatusBarItemType> = [
    "card-review",
    "note-review",
    "update-available",
];

export default class StatusBarManager {
    protected statusBarItems: IconTextStatusBarItem[];
    protected plugin: SRPlugin;

    constructor(plugin: SRPlugin, showItems?: boolean) {
        this.plugin = plugin;
        this.statusBarItems = [];

        this.createStatusBarItems(showItems);
    }

    setText(text: string | string[], statusBarItemType: StatusBarItemType): void {
        const statusBarItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === statusBarItemType,
        );
        if (statusBarItem !== undefined) {
            statusBarItem.setText(text);
        }
    }

    showStatusBarItems(state: boolean): void {
        if (state === true && this.statusBarItems.length === 0) {
            this.createStatusBarItems(state);
        } else if (state === true && this.statusBarItems.length > 0) {
            this.statusBarItems.forEach((statusBarItem) => {
                if (statusBarItem.getStatusBarItemType() !== "update-available")
                    statusBarItem.show();
            });
        } else {
            this.statusBarItems.forEach((statusBarItem) => {
                statusBarItem.hide();
            });
        }
    }

    showStatusBarItem(state: boolean, statusBarItemType: StatusBarItemType): void {
        const statusBarItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === statusBarItemType,
        );
        if (statusBarItem !== undefined) {
            statusBarItem.show();
        }
    }

    private async createStatusBarItems(showItems: boolean): Promise<void> {
        StatusBarItemTypesArray.forEach((statusBarItemType) => {
            let statusBarItem = undefined;

            switch (statusBarItemType) {
                case "card-review":
                    statusBarItem = new IconTextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "SpacedRepIcon",
                        show: showItems,
                        tooltip: "Open deck for review", // TODO: Translate
                        tooltipPosition: "top",
                        onClick: async () => {
                            if (!this.plugin.osrAppCore.syncLock) {
                                await this.plugin.sync();
                                const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                                const openInNewTab =
                                    (!isMobile && this.plugin.data.settings.openViewInNewTab) ||
                                    (isMobile && this.plugin.data.settings.openViewInNewTabMobile);

                                if (openInNewTab) {
                                    this.plugin.uiManager.tabViewManager.openSRTabView(
                                        this.plugin.osrAppCore,
                                        FlashcardReviewMode.Review,
                                    );
                                } else {
                                    this.plugin.openFlashcardModal(
                                        this.plugin.osrAppCore.reviewableDeckTree,
                                        this.plugin.osrAppCore.remainingDeckTree,
                                        FlashcardReviewMode.Review,
                                    );
                                }
                            }
                        },
                    });
                    break;
                case "note-review":
                    statusBarItem = new IconTextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "lucide-file-clock",
                        show: showItems,
                        tooltip: t("OPEN_NOTE_FOR_REVIEW"),
                        tooltipPosition: "top",
                        onClick: async () => {
                            if (!this.plugin.osrAppCore.syncLock) {
                                await this.plugin.sync();
                                this.plugin.nextNoteReviewHandler.reviewNextNoteModal();
                            }
                        },
                    });
                    break;
                case "update-available":
                    statusBarItem = new IconTextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "lucide-circle-arrow-up",
                        show: false,
                        tooltip: "Update available",
                        tooltipPosition: "top",
                    });
                    break;
            }

            this.statusBarItems.push(statusBarItem);
        });

        if (showItems && this.plugin.manifest.version !== (await this.getNewestVersion())) {
            const updateItem = this.statusBarItems.find(
                (statusBarItem) => statusBarItem.getStatusBarItemType() === "update-available",
            );

            updateItem.show();
            updateItem.setText("Spaced Repetition: new Update!");
        }
    }

    private async getNewestVersion(): Promise<string> {
        // Copied from https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/master/src/utils/utils.ts
        try {
            const gitAPIrequest = async () => {
                return JSON.parse(
                    await request({
                        url: "https://api.github.com/repos/st3v3nmw/obsidian-spaced-repetition/releases?per_page=15&page=1",
                    }),
                );
            };

            const latestVersion = (await gitAPIrequest())
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((el: any) => !el.draft && !el.prerelease)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((el: any) => {
                    return {
                        version: el.tag_name,
                        published: new Date(el.published_at),
                    };
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((el: any) => el.version.match(/^\d+\.\d+\.\d+$/))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((el1: any, el2: any) => el2.published - el1.published)[0].version as string;

            return latestVersion;
        } catch (e) {
            console.log({ error: e });
            return this.plugin.manifest.version;
        }
    }
}
