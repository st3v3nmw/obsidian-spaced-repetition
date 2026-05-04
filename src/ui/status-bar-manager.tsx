import { request } from "obsidian";

import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import CounterStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/counter-statusbar-item";
import TextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/text-statusbar-item";

export type StatusBarItemPurpose = "card-review" | "note-review" | "update-available";
export const StatusBarItemTypesArray: ReadonlyArray<StatusBarItemPurpose> = [
    "card-review",
    "note-review",
    "update-available",
];

export default class StatusBarManager {
    protected statusBarItems: TextStatusBarItem[];
    protected plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        this.statusBarItems = [];

        this.createStatusBarItems();
    }

    setCount(count: number, showItems: boolean, statusBarItemType: StatusBarItemPurpose): void {
        const statusBarItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === statusBarItemType,
        );

        if (statusBarItem === undefined) return;

        (statusBarItem as CounterStatusBarItem).setCounter(count);
        if (showItems && count > 0) {
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    }

    showStatusBarItems(
        showItems: boolean, // Overrides all other settings
        showCardStatusBarItem?: boolean,
        showNoteStatusBarItem?: boolean,
        showUpdateAvailableStatusBarItem?: boolean,
    ): void {
        if (this.statusBarItems.length === 0) {
            this.createStatusBarItems();
        }

        const showCardItem =
            showCardStatusBarItem === undefined ? showItems : showCardStatusBarItem;
        const showNoteItem =
            showNoteStatusBarItem === undefined ? showItems : showNoteStatusBarItem;
        const showUpdateAvailableItem =
            showUpdateAvailableStatusBarItem === undefined
                ? showItems
                : showUpdateAvailableStatusBarItem;

        this.statusBarItems.forEach((statusBarItem) => {
            if (showItems) {
                if (
                    statusBarItem.getStatusBarItemType() === "update-available" &&
                    statusBarItem.getText() === ""
                ) {
                    statusBarItem.hide();
                    return;
                }

                switch (statusBarItem.getStatusBarItemType()) {
                    case "card-review":
                        if (showItems && showCardItem) {
                            statusBarItem.show();
                        } else {
                            statusBarItem.hide();
                        }
                        break;
                    case "note-review":
                        if (showItems && showNoteItem) {
                            statusBarItem.show();
                        } else {
                            statusBarItem.hide();
                        }
                        break;
                    case "update-available":
                        if (showItems && showUpdateAvailableItem) {
                            statusBarItem.show();
                        } else {
                            statusBarItem.hide();
                        }
                        break;
                    default:
                        statusBarItem.show();
                }
            } else {
                statusBarItem.hide();
            }
        });
    }

    private async createStatusBarItems(): Promise<void> {
        StatusBarItemTypesArray.forEach((statusBarItemType) => {
            let statusBarItem = undefined;

            switch (statusBarItemType) {
                case "card-review":
                    statusBarItem = new CounterStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "SpacedRepIcon",
                        show: false,
                        count: 0,
                        hideIcon: false,
                        text: " card(s) due",
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
                    statusBarItem = new CounterStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "lucide-file-clock",
                        show: false,
                        text: " note(s) due",
                        count: 0,
                        hideIcon: false,
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
                    statusBarItem = new TextStatusBarItem(this.plugin, statusBarItemType, {
                        icon: "lucide-circle-arrow-up",
                        show: false,
                        hideIcon: false,
                        text: "",
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

            if (updateItem !== undefined) {
                updateItem.setText("Spaced Repetition: new Update!");
            }
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
