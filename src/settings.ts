import { App, Notice, Platform, PluginSettingTab, Setting } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
import { DataStoreName } from "src/data-stores/base/data-store";
import { createTabs, TabStructure } from "src/gui/tabs";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { setDebugParser } from "src/parser";
import { pathMatchesPattern } from "src/utils/fs";

export interface SRSettings {
    // flashcards
    flashcardEasyText: string;
    flashcardGoodText: string;
    flashcardHardText: string;
    reviewButtonDelay: number;
    flashcardTags: string[];
    convertFoldersToDecks: boolean;
    burySiblingCards: boolean;
    showContextInCards: boolean;
    flashcardHeightPercentage: number;
    flashcardWidthPercentage: number;
    randomizeCardOrder: boolean;
    flashcardCardOrder: string;
    flashcardDeckOrder: string;
    convertHighlightsToClozes: boolean;
    convertBoldTextToClozes: boolean;
    convertCurlyBracketsToClozes: boolean;
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string;
    editLaterTag: string;

    // notes
    enableNoteReviewPaneOnStartup: boolean;
    tagsToReview: string[];
    noteFoldersToIgnore: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    disableFileMenuReviewOptions: boolean;
    maxNDaysNotesReviewQueue: number;

    // UI preferences
    showRibbonIcon: boolean;
    showStatusBar: boolean;
    initiallyExpandAllSubdecksInTree: boolean;

    // algorithm
    algorithm: string;
    baseEase: number;
    lapsesIntervalChange: number;
    easyBonus: number;
    maximumInterval: number;
    maxLinkFactor: number;

    // storage
    dataStore: string;
    cardCommentOnSameLine: boolean;

    // logging
    showSchedulingDebugMessages: boolean;
    showParserDebugMessages: boolean;
}

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardEasyText: t("EASY"),
    flashcardGoodText: t("GOOD"),
    flashcardHardText: t("HARD"),
    reviewButtonDelay: 0,
    flashcardTags: ["#flashcards"],
    convertFoldersToDecks: false,
    burySiblingCards: false,
    showContextInCards: true,
    flashcardHeightPercentage: Platform.isMobile ? 100 : 80,
    flashcardWidthPercentage: Platform.isMobile ? 100 : 40,
    randomizeCardOrder: null,
    flashcardCardOrder: "DueFirstRandom",
    flashcardDeckOrder: "PrevDeckComplete_Sequential",
    convertHighlightsToClozes: true,
    convertBoldTextToClozes: false,
    convertCurlyBracketsToClozes: false,
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    multilineCardEndMarker: "",
    editLaterTag: "#edit-later",

    // notes
    enableNoteReviewPaneOnStartup: true,
    tagsToReview: ["#review"],
    noteFoldersToIgnore: ["**/*.excalidraw.md"],
    openRandomNote: false,
    autoNextNote: false,
    disableFileMenuReviewOptions: false,
    maxNDaysNotesReviewQueue: 365,

    // UI settings
    showRibbonIcon: true,
    showStatusBar: true,
    initiallyExpandAllSubdecksInTree: false,

    // algorithm
    algorithm: Algorithm.SM_2_OSR,
    baseEase: 250,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
    maximumInterval: 36525,
    maxLinkFactor: 1.0,

    // storage
    dataStore: DataStoreName.NOTES,
    cardCommentOnSameLine: false,

    // logging
    showSchedulingDebugMessages: false,
    showParserDebugMessages: false,
};

export function upgradeSettings(settings: SRSettings) {
    if (
        settings.randomizeCardOrder != null &&
        settings.flashcardCardOrder == null &&
        settings.flashcardDeckOrder == null
    ) {
        settings.flashcardCardOrder = settings.randomizeCardOrder
            ? "DueFirstRandom"
            : "DueFirstSequential";
        settings.flashcardDeckOrder = "PrevDeckComplete_Sequential";

        // After the upgrade, we don't need the old attribute any more
        settings.randomizeCardOrder = null;
    }
}

export class SettingsUtil {
    static isFlashcardTag(settings: SRSettings, tag: string): boolean {
        return SettingsUtil.isTagInList(settings.flashcardTags, tag);
    }

    static isPathInNoteIgnoreFolder(settings: SRSettings, path: string): boolean {
        return settings.noteFoldersToIgnore.some((folder) => pathMatchesPattern(path, folder));
    }

    static isAnyTagANoteReviewTag(settings: SRSettings, tags: string[]): boolean {
        for (const tag of tags) {
            if (
                settings.tagsToReview.some(
                    (tagToReview) => tag === tagToReview || tag.startsWith(tagToReview + "/"),
                )
            ) {
                return true;
            }
        }
        return false;
    }

    // Given a list of tags, return the subset that is in settings.tagsToReview
    static filterForNoteReviewTag(settings: SRSettings, tags: string[]): string[] {
        const result: string[] = [];
        for (const tagToReview of settings.tagsToReview) {
            if (tags.some((tag) => tag === tagToReview || tag.startsWith(tagToReview + "/"))) {
                result.push(tagToReview);
            }
        }
        return result;
    }

    private static isTagInList(tagList: string[], tag: string): boolean {
        for (const tagFromList of tagList) {
            if (tag === tagFromList || tag.startsWith(tagFromList + "/")) {
                return true;
            }
        }
        return false;
    }
}

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private tab_structure: TabStructure;

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

        this.tab_structure = createTabs(
            containerEl,
            {
                "main-flashcards": {
                    title: t("FLASHCARDS"),
                    icon: "SpacedRepIcon",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabFlashcards(container_element),
                },
                "main-notes": {
                    title: t("NOTES"),
                    icon: "book-text",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabNotes(container_element),
                },
                "main-algorithm": {
                    title: t("SCHEDULING"),
                    icon: "calendar",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabScheduling(container_element),
                },
                "main-ui-preferences": {
                    title: t("UI"),
                    icon: "presentation",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabUiPreferences(container_element),
                },
                "main-experimental": {
                    title: t("STATS_TITLE"),
                    icon: "bar-chart-3",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabExperimental(container_element),
                },
                "main-help": {
                    title: t("HELP"),
                    icon: "badge-help",
                    content_generator: (container_element: HTMLElement) =>
                        this.tabHelp(container_element),
                },
            },
            this.last_position.tab_name,
        );

        // KEEP THIS AFTER CREATING ALL ELEMENTS:
        // Scroll to the position when the settings modal was last open,
        //  but do it after content generating has finished.
        this.tab_structure.contentGeneratorPromises[this.tab_structure.active_tab_id].then(() => {
            this.rememberLastPosition(containerEl);
        });
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

        this.createSetting_FoldersToIgnore(containerEl);

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

                        // Need to redisplay as changing this setting affects the "deck order" setting
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
                              PrevDeckComplete_Sequential: t(
                                  "REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL",
                              ),
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
        new Setting(containerEl).setName(t("CONVERT_HIGHLIGHTS_TO_CLOZES")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertHighlightsToClozes)
                .onChange(async (value) => {
                    this.plugin.data.settings.convertHighlightsToClozes = value;
                    this.plugin.debouncedGenerateParser();
                    await this.plugin.savePluginData();
                }),
        );

        new Setting(containerEl).setName(t("CONVERT_BOLD_TEXT_TO_CLOZES")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertBoldTextToClozes)
                .onChange(async (value) => {
                    this.plugin.data.settings.convertBoldTextToClozes = value;
                    this.plugin.debouncedGenerateParser();
                    await this.plugin.savePluginData();
                }),
        );

        new Setting(containerEl)
            .setName(t("CONVERT_CURLY_BRACKETS_TO_CLOZES"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.convertCurlyBracketsToClozes)
                    .onChange(async (value) => {
                        this.plugin.data.settings.convertCurlyBracketsToClozes = value;
                        this.plugin.debouncedGenerateParser();
                        await this.plugin.savePluginData();
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
                            this.plugin.debouncedGenerateParser();
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
                        this.plugin.debouncedGenerateParser();
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
                            this.plugin.debouncedGenerateParser();
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
                        this.plugin.debouncedGenerateParser();
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
                            this.plugin.debouncedGenerateParser();
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
                        this.plugin.debouncedGenerateParser();
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
                            this.plugin.debouncedGenerateParser();
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
                        this.plugin.debouncedGenerateParser();
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
                            this.plugin.debouncedGenerateParser();
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
                        this.plugin.debouncedGenerateParser();
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

        this.createSetting_FoldersToIgnore(containerEl);

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

    private async createSetting_FoldersToIgnore(containerEl: HTMLElement): Promise<void> {
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
                algo_url: "https://www.stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
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

    private async tabExperimental(_: HTMLElement): Promise<void> {}

    private async tabHelp(containerEl: HTMLElement): Promise<void> {
        containerEl.createEl("h3", { text: `${t("HELP")}` });
        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("CHECK_WIKI", {
                wiki_url: "https://www.stephenmwangi.com/obsidian-spaced-repetition/",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("GITHUB_DISCUSSIONS", {
                discussions_url:
                    "https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("GITHUB_ISSUES", {
                issues_url: "https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/",
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
                github_project_url: "https://github.com/st3v3nmw/obsidian-spaced-repetition",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("CODE_CONTRIBUTION_INFO", {
                code_contribution_url:
                    "https://www.stephenmwangi.com/obsidian-spaced-repetition/contributing/#code",
            }),
        );

        containerEl.createEl("p").insertAdjacentHTML(
            "beforeend",
            t("TRANSLATION_CONTRIBUTION_INFO", {
                translation_contribution_url:
                    "https://www.stephenmwangi.com/obsidian-spaced-repetition/contributing/#translating",
            }),
        );
    }

    private last_position: {
        scroll_position: number;
        tab_name: string;
    } = {
        scroll_position: 0,
        tab_name: "main-flashcards",
    };
    private rememberLastPosition(container_element: HTMLElement) {
        const last_position = this.last_position;

        // Go to last position now
        this.tab_structure.buttons[last_position.tab_name].click();
        // Need to delay the scrolling a bit.
        // Without this, something else would override scrolling and scroll back to 0.
        container_element.scrollTo({
            top: this.last_position.scroll_position,
            behavior: "auto",
        });

        // Listen to changes
        container_element.addEventListener("scroll", (_) => {
            this.last_position.scroll_position = container_element.scrollTop;
        });
        for (const tab_name in this.tab_structure.buttons) {
            const button = this.tab_structure.buttons[tab_name];
            button.onClickEvent((_: MouseEvent) => {
                last_position.tab_name = tab_name;
            });
        }
    }
}
