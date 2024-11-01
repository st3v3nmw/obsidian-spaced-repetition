import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import { StatisticsView } from "src/gui/statistics";
import { createTabs, TabStructure } from "src/gui/tabs";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { setDebugParser } from "src/parser";
import { DEFAULT_SETTINGS } from "src/settings";

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private tabStructure: TabStructure;
    private statistics: StatisticsView;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const header = containerEl.createEl("h4", {
            text: `${t("SETTINGS_HEADER")}`,
        });
        header.addClass("sr-centered");

        this.tabStructure = createTabs(
            containerEl,
            {
                "main-flashcards": {
                    title: t("FLASHCARDS"),
                    icon: "SpacedRepIcon",
                    contentGenerator: (containerElement: HTMLElement) =>
                        this.tabFlashcards(containerElement),
                },
                "main-notes": {
                    title: t("NOTES"),
                    icon: "book-text",
                    contentGenerator: (containerElement: HTMLElement) =>
                        this.tabNotes(containerElement),
                },
                "main-algorithm": {
                    title: t("SCHEDULING"),
                    icon: "calendar",
                    contentGenerator: (containerElement: HTMLElement) =>
                        this.tabScheduling(containerElement),
                },
                "main-ui-preferences": {
                    title: t("UI"),
                    icon: "presentation",
                    contentGenerator: (containerElement: HTMLElement) =>
                        this.tabUiPreferences(containerElement),
                },
                "main-statistics": {
                    title: t("STATS_TITLE"),
                    icon: "bar-chart-3",
                    contentGenerator: async (containerElement: HTMLElement): Promise<void> => {
                        if (this.plugin.osrAppCore.cardStats == null) {
                            await this.plugin.sync();
                        }

                        this.statistics = new StatisticsView(
                            containerElement,
                            this.plugin.osrAppCore,
                        );
                        this.statistics.render();
                    },
                },
                "main-help": {
                    title: t("HELP"),
                    icon: "badge-help",
                    contentGenerator: (containerElement: HTMLElement) =>
                        this.tabHelp(containerElement),
                },
            },
            this.lastPosition.tabName,
        );

        // KEEP THIS AFTER CREATING ALL ELEMENTS:
        // Scroll to the position when the settings modal was last open,
        //  but do it after content generating has finished.
        this.tabStructure.contentGeneratorPromises[this.tabStructure.activeTabId].then(() => {
            this.rememberLastPosition(containerEl);
        });
    }

    hide(): void {
        this.statistics.destroy();
        this.containerEl.empty();
    }

    private async tabFlashcards(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: t("GROUP_TAGS_FOLDERS") });
        new Setting(containerEl)
            .setName(t("FLASHCARD_TAGS"))
            .setDesc(t("FLASHCARD_TAGS_DESC"))
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.data.settings.flashcardTags.join(" "))
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.flashcardTags = value.split(/\s+/);
                            await this.plugin.savePluginData();
                        });
                    }),
            );

        new Setting(containerEl)
            .setName(t("CONVERT_FOLDERS_TO_DECKS"))
            .setDesc(t("CONVERT_FOLDERS_TO_DECKS_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.convertFoldersToDecks)
                    .onChange(async (value) => {
                        this.plugin.data.settings.convertFoldersToDecks = value;
                        await this.plugin.savePluginData();
                    }),
            );

        this.createSettingFoldersToIgnore(containerEl);

        containerEl.createEl("h3", { text: t("GROUP_FLASHCARD_REVIEW") });
        new Setting(containerEl)
            .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
            .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.burySiblingCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.burySiblingCards = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl)
            .setName(t("REVIEW_CARD_ORDER_WITHIN_DECK"))
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        NewFirstSequential: t("REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL"),
                        DueFirstSequential: t("REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL"),
                        NewFirstRandom: t("REVIEW_CARD_ORDER_NEW_FIRST_RANDOM"),
                        DueFirstRandom: t("REVIEW_CARD_ORDER_DUE_FIRST_RANDOM"),
                        EveryCardRandomDeckAndCard: t("REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD"),
                    })
                    .setValue(this.plugin.data.settings.flashcardCardOrder)
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardCardOrder = value;
                        await this.plugin.savePluginData();

                        this.display();
                    }),
            );

        const deckOrderEnabled: boolean =
            this.plugin.data.settings.flashcardCardOrder != "EveryCardRandomDeckAndCard";
        new Setting(containerEl).setName(t("REVIEW_DECK_ORDER")).addDropdown((dropdown) =>
            dropdown
                .addOptions(
                    deckOrderEnabled
                        ? {
                              // eslint-disable-next-line camelcase
                              PrevDeckComplete_Sequential: t(
                                  "REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL",
                              ),
                              // eslint-disable-next-line camelcase
                              PrevDeckComplete_Random: t(
                                  "REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM",
                              ),
                          }
                        : {
                              EveryCardRandomDeckAndCard: t(
                                  "REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD",
                              ),
                          },
                )
                .setValue(
                    deckOrderEnabled
                        ? this.plugin.data.settings.flashcardDeckOrder
                        : "EveryCardRandomDeckAndCard",
                )
                .setDisabled(!deckOrderEnabled)
                .onChange(async (value) => {
                    this.plugin.data.settings.flashcardDeckOrder = value;
                    await this.plugin.savePluginData();
                }),
        );

        containerEl.createEl("h3", { text: t("GROUP_FLASHCARD_SEPARATORS") });
        const convertHighlightsToClozesEl = new Setting(containerEl).setName(
            t("CONVERT_HIGHLIGHTS_TO_CLOZES"),
        );
        convertHighlightsToClozesEl.descEl.insertAdjacentHTML(
            "beforeend",
            t("CONVERT_HIGHLIGHTS_TO_CLOZES_DESC", { defaultPattern: "==[123;;]answer[;;hint]==" }),
        );
        convertHighlightsToClozesEl.addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertHighlightsToClozes)
                .onChange(async (value) => {
                    const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                    const clozePatternSet = new Set(this.plugin.data.settings.clozePatterns);

                    if (value) {
                        clozePatternSet.add(defaultHightlightPattern);
                    } else {
                        clozePatternSet.delete(defaultHightlightPattern);
                    }

                    this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                    this.plugin.data.settings.convertHighlightsToClozes = value;
                    await this.plugin.savePluginData();

                    this.display();
                }),
        );

        const convertBoldTextToClozesEl = new Setting(containerEl).setName(
            t("CONVERT_BOLD_TEXT_TO_CLOZES"),
        );
        convertBoldTextToClozesEl.descEl.insertAdjacentHTML(
            "beforeend",
            t("CONVERT_BOLD_TEXT_TO_CLOZES_DESC", { defaultPattern: "**[123;;]answer[;;hint]**" }),
        );
        convertBoldTextToClozesEl.addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertBoldTextToClozes)
                .onChange(async (value) => {
                    const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                    const clozePatternSet = new Set(this.plugin.data.settings.clozePatterns);

                    if (value) {
                        clozePatternSet.add(defaultBoldPattern);
                    } else {
                        clozePatternSet.delete(defaultBoldPattern);
                    }

                    this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                    this.plugin.data.settings.convertBoldTextToClozes = value;
                    await this.plugin.savePluginData();

                    this.display();
                }),
        );

        const convertCurlyBracketsToClozesEl = new Setting(containerEl).setName(
            t("CONVERT_CURLY_BRACKETS_TO_CLOZES"),
        );
        convertCurlyBracketsToClozesEl.descEl.insertAdjacentHTML(
            "beforeend",
            t("CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC", {
                defaultPattern: "{{[123;;]answer[;;hint]}}",
            }),
        );
        convertCurlyBracketsToClozesEl.addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertCurlyBracketsToClozes)
                .onChange(async (value) => {
                    const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";
                    const clozePatternSet = new Set(this.plugin.data.settings.clozePatterns);

                    if (value) {
                        clozePatternSet.add(defaultCurlyBracketsPattern);
                    } else {
                        clozePatternSet.delete(defaultCurlyBracketsPattern);
                    }

                    this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                    this.plugin.data.settings.convertCurlyBracketsToClozes = value;
                    await this.plugin.savePluginData();

                    this.display();
                }),
        );

        const clozePatternsEl = new Setting(containerEl).setName(t("CLOZE_PATTERNS"));
        clozePatternsEl.descEl.insertAdjacentHTML(
            "beforeend",
            t("CLOZE_PATTERNS_DESC", {
                docsUrl:
                    "https://www.stephenmwangi.com/obsidian-spaced-repetition/flashcards/cloze-cards/#cloze-types",
            }),
        );
        clozePatternsEl.addTextArea((text) =>
            text
                .setPlaceholder(
                    "Example:\n==[123;;]answer[;;hint]==\n**[123;;]answer[;;hint]**\n{{[123;;]answer[;;hint]}}",
                )
                .setValue(this.plugin.data.settings.clozePatterns.join("\n"))
                .onChange((value) => {
                    applySettingsUpdate(async () => {
                        const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                        const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                        const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";

                        const clozePatternSet = new Set(
                            value
                                .split(/\n+/)
                                .map((v) => v.trim())
                                .filter((v) => v),
                        );

                        if (clozePatternSet.has(defaultHightlightPattern)) {
                            this.plugin.data.settings.convertHighlightsToClozes = true;
                        } else {
                            this.plugin.data.settings.convertHighlightsToClozes = false;
                        }

                        if (clozePatternSet.has(defaultBoldPattern)) {
                            this.plugin.data.settings.convertBoldTextToClozes = true;
                        } else {
                            this.plugin.data.settings.convertBoldTextToClozes = false;
                        }

                        if (clozePatternSet.has(defaultCurlyBracketsPattern)) {
                            this.plugin.data.settings.convertCurlyBracketsToClozes = true;
                        } else {
                            this.plugin.data.settings.convertCurlyBracketsToClozes = false;
                        }

                        this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                        await this.plugin.savePluginData();
                    });
                }),
        );

        new Setting(containerEl)
            .setName(t("INLINE_CARDS_SEPARATOR"))
            .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.singleLineCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.singleLineCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.singleLineCardSeparator =
                            DEFAULT_SETTINGS.singleLineCardSeparator;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("INLINE_REVERSED_CARDS_SEPARATOR"))
            .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.singleLineReversedCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.singleLineReversedCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.singleLineReversedCardSeparator =
                            DEFAULT_SETTINGS.singleLineReversedCardSeparator;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("MULTILINE_CARDS_SEPARATOR"))
            .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.multilineCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.multilineCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.multilineCardSeparator =
                            DEFAULT_SETTINGS.multilineCardSeparator;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("MULTILINE_REVERSED_CARDS_SEPARATOR"))
            .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.multilineReversedCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.multilineReversedCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.multilineReversedCardSeparator =
                            DEFAULT_SETTINGS.multilineReversedCardSeparator;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("MULTILINE_CARDS_END_MARKER"))
            .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.multilineCardEndMarker)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.multilineCardEndMarker = value;
                            await this.plugin.savePluginData();
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.multilineCardEndMarker =
                            DEFAULT_SETTINGS.multilineCardEndMarker;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });
    }

    private async tabNotes(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: t("GROUP_TAGS_FOLDERS") });
        new Setting(containerEl)
            .setName(t("TAGS_TO_REVIEW"))
            .setDesc(t("TAGS_TO_REVIEW_DESC"))
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.data.settings.tagsToReview.join(" "))
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.tagsToReview = value.split(/\s+/);
                            await this.plugin.savePluginData();
                        });
                    }),
            );

        this.createSettingFoldersToIgnore(containerEl);

        containerEl.createEl("h3", { text: t("NOTES_REVIEW_QUEUE") });
        new Setting(containerEl).setName(t("AUTO_NEXT_NOTE")).addToggle((toggle) =>
            toggle.setValue(this.plugin.data.settings.autoNextNote).onChange(async (value) => {
                this.plugin.data.settings.autoNextNote = value;
                await this.plugin.savePluginData();
            }),
        );

        new Setting(containerEl)
            .setName(t("OPEN_RANDOM_NOTE"))
            .setDesc(t("OPEN_RANDOM_NOTE_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.openRandomNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.openRandomNote = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl).setName(t("REVIEW_PANE_ON_STARTUP")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.enableNoteReviewPaneOnStartup)
                .onChange(async (value) => {
                    this.plugin.data.settings.enableNoteReviewPaneOnStartup = value;
                    await this.plugin.savePluginData();
                }),
        );

        new Setting(containerEl)
            .setName(t("MAX_N_DAYS_REVIEW_QUEUE"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.maxNDaysNotesReviewQueue.toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            const numValue: number = Number.parseInt(value);
                            if (!isNaN(numValue)) {
                                if (numValue < 1) {
                                    new Notice(t("MIN_ONE_DAY"));
                                    text.setValue(
                                        this.plugin.data.settings.maxNDaysNotesReviewQueue.toString(),
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maxNDaysNotesReviewQueue = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.maxNDaysNotesReviewQueue =
                            DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });
    }

    private async createSettingFoldersToIgnore(containerEl: HTMLElement): Promise<void> {
        new Setting(containerEl)
            .setName(t("FOLDERS_TO_IGNORE"))
            .setDesc(t("FOLDERS_TO_IGNORE_DESC"))
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.data.settings.noteFoldersToIgnore.join("\n"))
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.noteFoldersToIgnore = value
                                .split(/\n+/)
                                .map((v) => v.trim())
                                .filter((v) => v);
                            await this.plugin.savePluginData();

                            this.display();
                        });
                    }),
            );
    }

    private async tabUiPreferences(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: t("OBSIDIAN_INTEGRATION") });
        new Setting(containerEl)
            .setName(t("SHOW_RIBBON_ICON"))
            .setDesc(t("SHOW_RIBBON_ICON_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showRibbonIcon)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showRibbonIcon = value;
                        await this.plugin.savePluginData();
                        this.plugin.showRibbonIcon(value);
                    }),
            );

        new Setting(containerEl)
            .setName(t("SHOW_STATUS_BAR"))
            .setDesc(t("SHOW_STATUS_BAR_DESC"))
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.data.settings.showStatusBar).onChange(async (value) => {
                    this.plugin.data.settings.showStatusBar = value;
                    await this.plugin.savePluginData();
                    this.plugin.showStatusBar(value);
                }),
            );

        new Setting(containerEl)
            .setName(t("ENABLE_FILE_MENU_REVIEW_OPTIONS"))
            .setDesc(t("ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(!this.plugin.data.settings.disableFileMenuReviewOptions)
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableFileMenuReviewOptions = !value;
                        await this.plugin.savePluginData();
                        this.plugin.showFileMenuItems(value);
                    }),
            );

        containerEl.createEl("h3", { text: t("FLASHCARDS") });
        new Setting(containerEl)
            .setName(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE"))
            .setDesc(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.initiallyExpandAllSubdecksInTree)
                    .onChange(async (value) => {
                        this.plugin.data.settings.initiallyExpandAllSubdecksInTree = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl)
            .setName(t("SHOW_CARD_CONTEXT"))
            .setDesc(t("SHOW_CARD_CONTEXT_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showContextInCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showContextInCards = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl)
            .setName(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS"))
            .setDesc(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showIntervalInReviewButtons)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showIntervalInReviewButtons = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl)
            .setName(t("CARD_MODAL_HEIGHT_PERCENT"))
            .setDesc(t("CARD_MODAL_SIZE_PERCENT_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(10, 100, 5)
                    .setValue(this.plugin.data.settings.flashcardHeightPercentage)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardHeightPercentage = value;
                        await this.plugin.savePluginData();
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardHeightPercentage =
                            DEFAULT_SETTINGS.flashcardHeightPercentage;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("CARD_MODAL_WIDTH_PERCENT"))
            .setDesc(t("CARD_MODAL_SIZE_PERCENT_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(10, 100, 5)
                    .setValue(this.plugin.data.settings.flashcardWidthPercentage)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardWidthPercentage = value;
                        await this.plugin.savePluginData();
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardWidthPercentage =
                            DEFAULT_SETTINGS.flashcardWidthPercentage;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        containerEl.createEl("h3", { text: t("GROUP_FLASHCARDS_NOTES") });
        new Setting(containerEl)
            .setName(t("FLASHCARD_EASY_LABEL"))
            .setDesc(t("FLASHCARD_EASY_DESC"))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.flashcardEasyText).onChange((value) => {
                    applySettingsUpdate(async () => {
                        this.plugin.data.settings.flashcardEasyText = value;
                        await this.plugin.savePluginData();
                    });
                }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardEasyText =
                            DEFAULT_SETTINGS.flashcardEasyText;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("FLASHCARD_GOOD_LABEL"))
            .setDesc(t("FLASHCARD_GOOD_DESC"))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.flashcardGoodText).onChange((value) => {
                    applySettingsUpdate(async () => {
                        this.plugin.data.settings.flashcardGoodText = value;
                        await this.plugin.savePluginData();
                    });
                }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardGoodText =
                            DEFAULT_SETTINGS.flashcardGoodText;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("FLASHCARD_HARD_LABEL"))
            .setDesc(t("FLASHCARD_HARD_DESC"))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.flashcardHardText).onChange((value) => {
                    applySettingsUpdate(async () => {
                        this.plugin.data.settings.flashcardHardText = value;
                        await this.plugin.savePluginData();
                    });
                }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardHardText =
                            DEFAULT_SETTINGS.flashcardHardText;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("REVIEW_BUTTON_DELAY"))
            .setDesc(t("REVIEW_BUTTON_DELAY_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(0, 5000, 100)
                    .setValue(this.plugin.data.settings.reviewButtonDelay)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.data.settings.reviewButtonDelay = value;
                        await this.plugin.savePluginData();
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.reviewButtonDelay =
                            DEFAULT_SETTINGS.reviewButtonDelay;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });
    }

    private async tabScheduling(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: t("ALGORITHM") });
        const algoSettingEl = new Setting(containerEl).setName(t("ALGORITHM"));
        algoSettingEl.descEl.insertAdjacentHTML(
            "beforeend",
            t("CHECK_ALGORITHM_WIKI", {
                algoUrl: "https://www.stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
            }),
        );
        algoSettingEl.addDropdown((dropdown) =>
            dropdown
                .addOptions({
                    "SM-2-OSR": t("SM2_OSR_VARIANT"),
                })
                .setValue(this.plugin.data.settings.algorithm)
                .onChange(async (value) => {
                    this.plugin.data.settings.algorithm = value;
                    await this.plugin.savePluginData();
                }),
        );

        new Setting(containerEl)
            .setName(t("BASE_EASE"))
            .setDesc(t("BASE_EASE_DESC"))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.baseEase.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 130) {
                                new Notice(t("BASE_EASE_MIN_WARNING"));
                                text.setValue(this.plugin.data.settings.baseEase.toString());
                                return;
                            }

                            this.plugin.data.settings.baseEase = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice(t("VALID_NUMBER_WARNING"));
                        }
                    });
                }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.baseEase = DEFAULT_SETTINGS.baseEase;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("LAPSE_INTERVAL_CHANGE"))
            .setDesc(t("LAPSE_INTERVAL_CHANGE_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(1, 99, 1)
                    .setValue(this.plugin.data.settings.lapsesIntervalChange * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.lapsesIntervalChange = value / 100;
                        await this.plugin.savePluginData();
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.lapsesIntervalChange =
                            DEFAULT_SETTINGS.lapsesIntervalChange;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("EASY_BONUS"))
            .setDesc(t("EASY_BONUS_DESC"))
            .addText((text) =>
                text
                    .setValue((this.plugin.data.settings.easyBonus * 100).toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            const numValue: number = Number.parseInt(value) / 100;
                            if (!isNaN(numValue)) {
                                if (numValue < 1.0) {
                                    new Notice(t("EASY_BONUS_MIN_WARNING"));
                                    text.setValue(
                                        (this.plugin.data.settings.easyBonus * 100).toString(),
                                    );
                                    return;
                                }

                                this.plugin.data.settings.easyBonus = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.easyBonus = DEFAULT_SETTINGS.easyBonus;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("LOAD_BALANCE"))
            .setDesc(t("LOAD_BALANCE_DESC"))
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.data.settings.loadBalance).onChange(async (value) => {
                    this.plugin.data.settings.loadBalance = value;
                    await this.plugin.savePluginData();
                }),
            );

        new Setting(containerEl)
            .setName(t("MAX_INTERVAL"))
            .setDesc(t("MAX_INTERVAL_DESC"))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.maximumInterval.toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            const numValue: number = Number.parseInt(value);
                            if (!isNaN(numValue)) {
                                if (numValue < 1) {
                                    new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                    text.setValue(
                                        this.plugin.data.settings.maximumInterval.toString(),
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maximumInterval = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.maximumInterval =
                            DEFAULT_SETTINGS.maximumInterval;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("MAX_LINK_CONTRIB"))
            .setDesc(t("MAX_LINK_CONTRIB_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(0, 100, 1)
                    .setValue(this.plugin.data.settings.maxLinkFactor * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.maxLinkFactor = value / 100;
                        await this.plugin.savePluginData();
                    }),
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.maxLinkFactor = DEFAULT_SETTINGS.maxLinkFactor;
                        await this.plugin.savePluginData();

                        this.display();
                    });
            });

        containerEl.createEl("h3", { text: t("GROUP_DATA_STORAGE") });
        new Setting(containerEl)
            .setName(t("GROUP_DATA_STORAGE"))
            .setDesc(t("GROUP_DATA_STORAGE_DESC"))
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        NOTES: t("STORE_IN_NOTES"),
                    })
                    .setValue(this.plugin.data.settings.dataStore)
                    .onChange(async (value) => {
                        this.plugin.data.settings.dataStore = value;
                        await this.plugin.savePluginData();
                    }),
            );

        new Setting(containerEl)
            .setName(t("INLINE_SCHEDULING_COMMENTS"))
            .setDesc(t("INLINE_SCHEDULING_COMMENTS_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.cardCommentOnSameLine)
                    .onChange(async (value) => {
                        this.plugin.data.settings.cardCommentOnSameLine = value;
                        await this.plugin.savePluginData();
                    }),
            );
    }

    private async tabHelp(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: `${t("HELP")}` });
        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("CHECK_WIKI", {
                wikiUrl: "https://www.stephenmwangi.com/obsidian-spaced-repetition/",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("GITHUB_DISCUSSIONS", {
                discussionsUrl:
                    "https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("GITHUB_ISSUES", {
                issuesUrl: "https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/",
            }),
        );

        containerEl.createEl("h3", { text: `${t("LOGGING")}` });
        new Setting(containerEl).setName(t("DISPLAY_SCHEDULING_DEBUG_INFO")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.showSchedulingDebugMessages)
                .onChange(async (value) => {
                    this.plugin.data.settings.showSchedulingDebugMessages = value;
                    await this.plugin.savePluginData();
                }),
        );

        new Setting(containerEl).setName(t("DISPLAY_PARSER_DEBUG_INFO")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.showParserDebugMessages)
                .onChange(async (value) => {
                    this.plugin.data.settings.showParserDebugMessages = value;
                    setDebugParser(this.plugin.data.settings.showParserDebugMessages);
                    await this.plugin.savePluginData();
                }),
        );

        containerEl.createEl("h3", { text: t("GROUP_CONTRIBUTING") });
        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("GITHUB_SOURCE_CODE", {
                githubProjectUrl: "https://github.com/st3v3nmw/obsidian-spaced-repetition",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("CODE_CONTRIBUTION_INFO", {
                codeContributionUrl:
                    "https://www.stephenmwangi.com/obsidian-spaced-repetition/contributing/#code",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("TRANSLATION_CONTRIBUTION_INFO", {
                translationContributionUrl:
                    "https://www.stephenmwangi.com/obsidian-spaced-repetition/contributing/#translating",
            }),
        );
    }

    private lastPosition: {
        scrollPosition: number;
        tabName: string;
    } = {
        scrollPosition: 0,
        tabName: "main-flashcards",
    };
    private rememberLastPosition(containerElement: HTMLElement) {
        const lastPosition = this.lastPosition;

        // Go to last position now
        this.tabStructure.buttons[lastPosition.tabName].click();
        // Need to delay the scrolling a bit.
        // Without this, something else would override scrolling and scroll back to 0.
        containerElement.scrollTo({
            top: this.lastPosition.scrollPosition,
            behavior: "auto",
        });

        // Listen to changes
        containerElement.addEventListener("scroll", (_) => {
            this.lastPosition.scrollPosition = containerElement.scrollTop;
        });
        for (const tabName in this.tabStructure.buttons) {
            const button = this.tabStructure.buttons[tabName];
            button.onClickEvent((_: MouseEvent) => {
                lastPosition.tabName = tabName;
            });
        }
    }
}
