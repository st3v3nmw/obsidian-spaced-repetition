import { request } from "obsidian";

import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import IconTextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/icon-text-statusbar-item";

export type StatusBarItemType = "card-review" | "note-review" | "update-available";
export const StatusBarItemTypesArray: ReadonlyArray<StatusBarItemType> = [
    "card-review",
    "note-review",
    "update-available",
];

export default class StatusBarManager {
    protected statusBarItems: IconTextStatusBarItem[];
    protected plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        this.statusBarItems = [];

        this.createStatusBarItems();
    }

    setText(
        text: string | string[],
        showItems: boolean,
        statusBarItemType: StatusBarItemType,
    ): void {
        const statusBarItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === statusBarItemType,
        );
        if (statusBarItem !== undefined) {
            statusBarItem.setText(text);
            if (showItems) {
                statusBarItem.show();
            } else {
                statusBarItem.hide();
            }
        }
    }

    showStatusBarItems(state: boolean): void {
        if (state === true && this.statusBarItems.length === 0) {
            this.createStatusBarItems();
            this.statusBarItems.forEach((statusBarItem) => {
                statusBarItem.show();
            });
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
            if (state) {
                statusBarItem.show();
            } else {
                statusBarItem.hide();
            }
        }
    }

    showUpdateAvailableItemIfAvailable(): void {
        const updateItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === "update-available",
        );

        if (
            updateItem !== undefined &&
            updateItem.getText() !== undefined &&
            updateItem.getText() !== ""
        ) {
            updateItem.show();
        }
    }

    private async createStatusBarItems(): Promise<void> {
        StatusBarItemTypesArray.forEach((statusBarItemType) => {
            let statusBarItem = undefined;

            switch (statusBarItemType) {
                case "card-review":
                    statusBarItem = new IconTextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "SpacedRepIcon",
                        show: false,
                        tooltip: t("OPEN_DECK_FOR_REVIEW"),
                        tooltipPosition: "top",
                        onClick: async () => {
                            await this.plugin.uiManager.openDeckContainer(
                                FlashcardReviewMode.Review,
                            );
                        },
                    });
                    break;
                case "note-review":
                    statusBarItem = new IconTextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "lucide-file-clock",
                        show: false,
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
                        tooltip: t("UPDATE_AVAILABLE"),
                        tooltipPosition: "top",
                    });
                    break;
            }

            this.statusBarItems.push(statusBarItem);
        });

        if (this.plugin.manifest.version !== (await this.getNewestVersion())) {
            const updateItem = this.statusBarItems.find(
                (statusBarItem) => statusBarItem.getStatusBarItemType() === "update-available",
            );

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
