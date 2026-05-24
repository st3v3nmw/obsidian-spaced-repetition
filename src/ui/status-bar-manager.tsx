import { request } from "obsidian";

import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import CounterStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/counter-statusbar-item";
import TextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/text-statusbar-item";

export type StatusBarItemPurpose = "card-review" | "note-review" | "update-available";
export const StatusBarItemTypesArray: ReadonlyArray<StatusBarItemPurpose> = [
    "card-review",
    "note-review",
    "update-available",
];

export default class StatusBarManager {
    private statusBarItems: TextStatusBarItem[];
    protected plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        this.statusBarItems = [];
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

    async showStatusBarItems(
        showItems: boolean, // Overrides all other settings
        showCardStatusBarItem?: boolean,
        showNoteStatusBarItem?: boolean,
        showUpdateAvailableStatusBarItem?: boolean,
    ): Promise<void> {
        if (this.statusBarItems.length === 0) {
            await this.createStatusBarItems();
        }

        const showCardItem =
            showCardStatusBarItem === undefined ? showItems : showCardStatusBarItem;
        const showNoteItem =
            showNoteStatusBarItem === undefined ? showItems : showNoteStatusBarItem;
        const showUpdateAvailableItem =
            showUpdateAvailableStatusBarItem === undefined
                ? showItems
                : showUpdateAvailableStatusBarItem;

        for (const statusBarItem of this.statusBarItems) {
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
                        // Disable the fetching of the version number if the statusbar items are disabled
                        if (showItems && showUpdateAvailableItem) {
                            await this.checkAndUpdatePluginVersion().then((_) => {
                                statusBarItem.show();
                            });
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
        }
    }

    async createStatusBarItems(): Promise<void> {
        if (this.statusBarItems.length > 0) return;

        for (const statusBarItemType of StatusBarItemTypesArray) {
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
                            if (this.plugin.uiManager === null)
                                throw new Error("UI manager not initialized!!!");
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
                            if (
                                this.plugin.dataManager === null ||
                                this.plugin.dataManager.osrCore === null
                            )
                                throw new Error("SR plugin or OSR app core not initialized!!!");
                            if (this.plugin.nextNoteReviewHandler === null)
                                throw new Error("Next note review handler not initialized!!!");

                            if (!this.plugin.dataManager.syncLock) {
                                await this.plugin.dataManager.sync();
                                await this.plugin.nextNoteReviewHandler.reviewNextNoteModal();
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
        }

        // Disable the fetching of the version number if the statusbar items are disabled
        if (
            this.plugin.dataManager.data.settings.showStatusBar &&
            this.plugin.dataManager.data.settings.showUpdateAvailableStatusBarItem
        ) {
            await this.checkAndUpdatePluginVersion();
        }
    }

    private async checkAndUpdatePluginVersion() {
        // Set update statusbar item, if the versions miss match
        const newestVersion: string = await this.getNewestVersion();

        if (this.plugin.manifest.version === newestVersion) return;

        const updateItem = this.statusBarItems.find(
            (statusBarItem) => statusBarItem.getStatusBarItemType() === "update-available",
        );

        if (updateItem !== undefined) {
            updateItem.setText("Spaced Repetition: new Update!");
        }
    }

    private async getNewestVersion(): Promise<string> {
        try {
            const response: string = await request({
                url: "https://api.github.com/repos/st3v3nmw/obsidian-spaced-repetition/releases/latest",
            });
            return (await JSON.parse(response)).tag_name as string;
        } catch (e) {
            console.error(e);
            return this.plugin.manifest.version;
        }
    }
}
