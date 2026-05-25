import { Platform, TFile } from "obsidian";

import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import { UIState } from "src/ui/ui-manager";
import EmulatedPlatform from "src/utils/platform-detector";

export class CommandManager {
    private plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    /**
     * register all the plugin commands once the plugin is loaded
     */
    public onLayoutReady() {
        if (this.plugin.dataManager.data.settings.useCustomHotkeys) {
            this.addCustomHotkeys();
        }

        this.addPluginCommands();
    }

    /**
     * remove all the plugin commands once the plugin is unloaded
     */
    public onunload() {
        this.removeCustomHotkeys();
    }

    /**
     * remove all the hotkeys
     */
    public removeCustomHotkeys() {
        this.plugin.removeCommand("srs-card-review-again");
        this.plugin.removeCommand("srs-card-review-hard");
        this.plugin.removeCommand("srs-card-review-good");
        this.plugin.removeCommand("srs-card-review-easy");
        this.plugin.removeCommand("srs-card-review-show-answer");
        this.plugin.removeCommand("srs-card-review-reset");
        this.plugin.removeCommand("srs-card-review-skip");
    }

    /**
     * add all the hotkeys
     */
    public addCustomHotkeys() {
        this.plugin.addCommand({
            id: "srs-card-review-again",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.plugin.dataManager.data.settings.flashcardAgainText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._processReview(
                            ReviewResponse.Again,
                        );
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-hard",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.plugin.dataManager.data.settings.flashcardHardText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._processReview(
                            ReviewResponse.Hard,
                        );
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-good",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.plugin.dataManager.data.settings.flashcardGoodText,
            }),
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._processReview(
                            ReviewResponse.Good,
                        );
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-easy",
            name: t("REVIEW_CARD_DIFFICULTY_CMD", {
                difficulty: this.plugin.dataManager.data.settings.flashcardEasyText,
            }),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._processReview(
                            ReviewResponse.Easy,
                        );
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-show-answer",
            name: t("SHOW_ANSWER"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardFront &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._showAnswer();
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-skip",
            name: t("SKIP"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    (this.plugin.uiManager.uiState === UIState.CardBack ||
                        this.plugin.uiManager.uiState === UIState.CardFront) &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._skipCurrentCard();
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-reset",
            name: t("RESET_CARD_PROGRESS"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._processReview(
                            ReviewResponse.Reset,
                        );
                    }
                    return true;
                }
                return false;
            },
        });

        this.plugin.addCommand({
            id: "srs-card-review-reset",
            name: t("OPEN_IN_BACKGROUND"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                if (
                    this.plugin.isInitialized &&
                    this.plugin.uiManager.uiState === UIState.CardBack &&
                    this.plugin.uiManager.isSRInFocus &&
                    this.plugin.uiManager.contentManager !== null &&
                    !(
                        Platform.isMobile || // No keyboard events on mobile
                        EmulatedPlatform().isMobile
                    ) &&
                    !(
                        activeDocument.activeElement !== null &&
                        (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                            activeDocument.activeElement.nodeName === "INPUT")
                    )
                ) {
                    if (!checking) {
                        void this.plugin.uiManager.contentManager._jumpToCurrentCard();
                    }
                    return true;
                }
                return false;
            },
        });
    }

    /**
     * add all the plugin commands
     */
    private addPluginCommands() {
        this.plugin.addCommand({
            id: "srs-review-flashcards",
            name: t("REVIEW_ALL_CARDS"),
            callback: async () => {
                if (!this.plugin.isInitialized) return;
                await this.plugin.uiManager.openDeckContainer(FlashcardReviewMode.Review);
            },
        });

        this.plugin.addCommand({
            id: "srs-cram-flashcards",
            name: t("CRAM_ALL_CARDS"),
            callback: async () => {
                if (!this.plugin.isInitialized) return;
                await this.plugin.uiManager.openDeckContainer(FlashcardReviewMode.Cram);
            },
        });

        this.plugin.addCommand({
            id: "srs-review-flashcards-in-note",
            name: t("REVIEW_CARDS_IN_NOTE"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.plugin.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md" || !this.plugin.isInitialized)
                    return false;

                if (!checking) {
                    void this.plugin.uiManager.openDeckContainer(
                        FlashcardReviewMode.Review,
                        openFile,
                    );
                }
                return true;
            },
        });

        this.plugin.addCommand({
            id: "srs-cram-flashcards-in-note",
            name: t("CRAM_CARDS_IN_NOTE"),
            repeatable: false,
            checkCallback: (checking: boolean) => {
                const openFile: TFile | null = this.plugin.app.workspace.getActiveFile();

                if (openFile === null || openFile.extension !== "md" || !this.plugin.isInitialized)
                    return false;

                if (!checking) {
                    void this.plugin.uiManager.openDeckContainer(
                        FlashcardReviewMode.Cram,
                        openFile,
                    );
                }
                return true;
            },
        });
    }
}
