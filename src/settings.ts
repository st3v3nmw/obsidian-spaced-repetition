import { Notice, PluginSettingTab, Setting, App, Platform } from "obsidian";
import type SRPlugin from "src/main";
import { t } from "src/lang/helpers";

// https://github.com/martin-jw/obsidian-recall/blob/main/src/settings.ts
import SrsAlgorithm from "./algorithms";
import { Sm2Algorithm } from "./algorithms/supermemo";
import { AnkiAlgorithm } from "./algorithms/anki";
import ConfirmModal from "./modals/confirm";
import { FolderSuggest } from "./suggesters/FolderSuggester";
// recall trackfile
export enum DataLocation {
    PluginFolder = "In Plugin Folder",
    RootFolder = "In Vault Folder",
    SpecifiedFolder = "In the folder specified below",
    SaveOnNoteFile = "Save On Note File",
}

const locationMap: Record<string, DataLocation> = {
    "In Vault Folder": DataLocation.RootFolder,
    "In Plugin Folder": DataLocation.PluginFolder,
    "In the folder specified below": DataLocation.SpecifiedFolder,
    "Save On Note File": DataLocation.SaveOnNoteFile,
};

export const algorithms: Record<string, SrsAlgorithm> = {
    Anki: new AnkiAlgorithm(),
    SM2: new Sm2Algorithm(),
};

export interface SRSettings {
    // flashcards
    flashcardEasyText: string;
    flashcardGoodText: string;
    flashcardHardText: string;
    flashcardTags: string[];
    convertFoldersToDecks: boolean;
    cardCommentOnSameLine: boolean;
    burySiblingCards: boolean;
    showContextInCards: boolean;
    flashcardHeightPercentage: number;
    flashcardWidthPercentage: number;
    randomizeCardOrder: boolean;
    convertHighlightsToClozes: boolean;
    convertBoldTextToClozes: boolean;
    convertCurlyBracketsToClozes: boolean;
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    editLaterTag: string;
    // notes
    enableNoteReviewPaneOnStartup: boolean;
    tagsToReview: string[];
    noteFoldersToIgnore: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    reviewResponseFloatBar: boolean;
    reviewingNoteDirectly: boolean;
    disableFileMenuReviewOptions: boolean;
    maxNDaysNotesReviewQueue: number;
    // UI preferences
    initiallyExpandAllSubdecksInTree: boolean;
    // algorithm
    baseEase: number;
    lapsesIntervalChange: number;
    easyBonus: number;
    maximumInterval: number;
    maxLinkFactor: number;
    // logging
    showDebugMessages: boolean;

    // trackfile: https://github.com/martin-jw/obsidian-recall/blob/main/src/settings.ts
    dataLocation: DataLocation;
    customFolder: string;
    maxNewPerDay: number;
    repeatItems: boolean;
    trackedNoteToDecks: boolean;
    algorithm: string;
    algorithmSettings: any;
}

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardEasyText: t("EASY"),
    flashcardGoodText: t("GOOD"),
    flashcardHardText: t("HARD"),
    flashcardTags: ["#flashcards"],
    convertFoldersToDecks: false,
    cardCommentOnSameLine: false,
    burySiblingCards: false,
    showContextInCards: true,
    flashcardHeightPercentage: Platform.isMobile ? 100 : 80,
    flashcardWidthPercentage: Platform.isMobile ? 100 : 40,
    randomizeCardOrder: true,
    convertHighlightsToClozes: true,
    convertBoldTextToClozes: false,
    convertCurlyBracketsToClozes: false,
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    editLaterTag: "#edit-later",
    // notes
    enableNoteReviewPaneOnStartup: true,
    tagsToReview: ["#review"],
    noteFoldersToIgnore: [],
    openRandomNote: false,
    autoNextNote: false,
    reviewResponseFloatBar: false,
    reviewingNoteDirectly: false,
    disableFileMenuReviewOptions: false,
    maxNDaysNotesReviewQueue: 365,
    // UI settings
    initiallyExpandAllSubdecksInTree: false,
    // algorithm
    baseEase: 250,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
    maximumInterval: 36525,
    maxLinkFactor: 1.0,
    // logging
    showDebugMessages: false,

    // trackfile: https://github.com/martin-jw/obsidian-recall/blob/main/src/settings.ts
    dataLocation: DataLocation.PluginFolder,
    customFolder: "",
    maxNewPerDay: 20,
    repeatItems: true,
    trackedNoteToDecks: false,
    algorithm: Object.keys(algorithms)[0],
    algorithmSettings: Object.values(algorithms)[0].settings,
};

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const header = containerEl.createEl("h1", { text: `${t("SETTINGS_HEADER")}` });
        header.addClass("sr-centered");

        containerEl.createDiv().innerHTML = t("CHECK_WIKI", {
            wiki_url: "https://www.stephenmwangi.com/obsidian-spaced-repetition/",
        });

        // trackfile_setting
        // https://github.com/martin-jw/obsidian-recall/blob/main/src/settings.ts
        this.addDataLocationSettings(containerEl);
        if (this.plugin.data.settings.dataLocation === DataLocation.SpecifiedFolder) {
            this.plugin.data.settings.customFolder = this.plugin.store.dataPath;
            this.addSpecifiedFolderSetting(containerEl);
        }
        this.addAlgorithmSetting(containerEl);
        this.addNewPerDaySetting(containerEl);
        this.addRepeatItemsSetting(containerEl);
        this.addTrackedNoteToDecksSetting(containerEl);
        this.addReviewResponseFloatBarSetting(containerEl);

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
                        });
                    })
            );

        containerEl.createEl("h3", { text: `${t("FLASHCARDS")}` });

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
                    })
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
                    })
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
                    })
            );

        new Setting(containerEl)
            .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
            .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.burySiblingCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.burySiblingCards = value;
                        await this.plugin.savePluginData();
                    })
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
                    })
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
                    })
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
                    })
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

        new Setting(containerEl).setName(t("RANDOMIZE_CARD_ORDER")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.randomizeCardOrder)
                .onChange(async (value) => {
                    this.plugin.data.settings.randomizeCardOrder = value;
                    await this.plugin.savePluginData();
                })
        );

        new Setting(containerEl).setName(t("CONVERT_HIGHLIGHTS_TO_CLOZES")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertHighlightsToClozes)
                .onChange(async (value) => {
                    this.plugin.data.settings.convertHighlightsToClozes = value;
                    await this.plugin.savePluginData();
                })
        );

        new Setting(containerEl).setName(t("CONVERT_BOLD_TEXT_TO_CLOZES")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.convertBoldTextToClozes)
                .onChange(async (value) => {
                    this.plugin.data.settings.convertBoldTextToClozes = value;
                    await this.plugin.savePluginData();
                })
        );

        new Setting(containerEl)
            .setName(t("CONVERT_CURLY_BRACKETS_TO_CLOZES"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.convertCurlyBracketsToClozes)
                    .onChange(async (value) => {
                        this.plugin.data.settings.convertCurlyBracketsToClozes = value;
                        await this.plugin.savePluginData();
                    })
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
                    })
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
                    })
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
                    })
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
                    })
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
            .setName(t("FLASHCARD_EASY_LABEL"))
            .setDesc(t("FLASHCARD_EASY_DESC"))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.flashcardEasyText).onChange((value) => {
                    applySettingsUpdate(async () => {
                        this.plugin.data.settings.flashcardEasyText = value;
                        await this.plugin.savePluginData();
                    });
                })
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
                })
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
                })
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

        containerEl.createEl("h3", { text: `${t("NOTES")}` });

        new Setting(containerEl).setName(t("REVIEW_PANE_ON_STARTUP")).addToggle((toggle) =>
            toggle
                .setValue(this.plugin.data.settings.enableNoteReviewPaneOnStartup)
                .onChange(async (value) => {
                    this.plugin.data.settings.enableNoteReviewPaneOnStartup = value;
                    await this.plugin.savePluginData();
                })
        );

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
                    })
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
                    })
            );

        new Setting(containerEl).setName(t("AUTO_NEXT_NOTE")).addToggle((toggle) =>
            toggle.setValue(this.plugin.data.settings.autoNextNote).onChange(async (value) => {
                this.plugin.data.settings.autoNextNote = value;
                await this.plugin.savePluginData();
            })
        );

        this.addReviewNoteDirectlySetting(containerEl);

        new Setting(containerEl)
            .setName(t("DISABLE_FILE_MENU_REVIEW_OPTIONS"))
            .setDesc(t("DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.disableFileMenuReviewOptions)
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableFileMenuReviewOptions = value;
                        await this.plugin.savePluginData();
                    })
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
                                        this.plugin.data.settings.maxNDaysNotesReviewQueue.toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maxNDaysNotesReviewQueue = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    })
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

        containerEl.createEl("h3", { text: `${t("UI_PREFERENCES")}` });

        new Setting(containerEl)
            .setName(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE"))
            .setDesc(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.initiallyExpandAllSubdecksInTree)
                    .onChange(async (value) => {
                        this.plugin.data.settings.initiallyExpandAllSubdecksInTree = value;
                        await this.plugin.savePluginData();
                    })
            );

        containerEl.createEl("h3", { text: `${t("ALGORITHM")}` });
        containerEl.createDiv().innerHTML = t("CHECK_ALGORITHM_WIKI", {
            algo_url: "https://www.stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
        });

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
                })
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
                    })
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
                                        (this.plugin.data.settings.easyBonus * 100).toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.easyBonus = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    })
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
                                        this.plugin.data.settings.maximumInterval.toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maximumInterval = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("VALID_NUMBER_WARNING"));
                            }
                        });
                    })
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
                    })
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

        // this.addAlgorithmSpecificDisplaySetting(containerEl);

        containerEl.createEl("h3", { text: `${t("LOGGING")}` });
        new Setting(containerEl).setName(t("DISPLAY_DEBUG_INFO")).addToggle((toggle) =>
            toggle.setValue(this.plugin.data.settings.showDebugMessages).onChange(async (value) => {
                this.plugin.data.settings.showDebugMessages = value;
                await this.plugin.savePluginData();
            })
        );
    }

    addDataLocationSettings(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("DATA_LOC"))
            .setDesc(t("DATA_LOC_DESC"))
            .addDropdown((dropdown) => {
                Object.values(DataLocation).forEach((val) => {
                    dropdown.addOption(val, val);
                });
                dropdown.setValue(plugin.data.settings.dataLocation);

                dropdown.onChange((val) => {
                    const loc = locationMap[val];
                    plugin.data.settings.dataLocation = loc;
                    if (loc === DataLocation.SpecifiedFolder) {
                        console.debug("plugin.store.dataPath", plugin.store.dataPath);
                        plugin.data.settings.customFolder = plugin.store.dataPath;
                    }
                    plugin.store.moveStoreLocation();
                    plugin.savePluginData();
                    this.display();
                });
            });
    }

    addSpecifiedFolderSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;
        console.debug("plugin.data.settings.customFolder", plugin.data.settings.customFolder);
        const fder_index = plugin.data.settings.customFolder.lastIndexOf("/");
        let cusFolder = plugin.data.settings.customFolder.substring(0, fder_index);
        const cusFilename = plugin.data.settings.customFolder.substring(fder_index + 1);

        new Setting(containerEl)
            .setName(t("DATA_FOLDER"))
            // .setDesc('Folder for `tracked_files.json`')
            .addSearch((cb) => {
                new FolderSuggest(cb.inputEl);
                cb.setPlaceholder("Example: folder1/folder2")
                    .setValue(cusFolder)
                    .onChange((new_folder) => {
                        cusFolder = new_folder;
                        cb.setValue(cusFolder);
                    });
            })
            .addButton((btn) =>
                btn
                    .setButtonText("save")
                    .setCta()
                    .onClick(() => {
                        plugin.data.settings.customFolder = cusFolder + "/" + cusFilename;
                        plugin.store.moveStoreLocation();
                        plugin.savePluginData();
                        this.display();
                    })
            );
    }

    addNewPerDaySetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("NEW_PER_DAY"))
            .setDesc(t("NEW_PER_DAY_DESC"))
            .addText((text) =>
                text
                    .setPlaceholder("New Per Day")
                    .setValue(plugin.data.settings.maxNewPerDay.toString())
                    .onChange((newValue) => {
                        const newPerDay = Number(newValue);

                        if (isNaN(newPerDay)) {
                            new Notice(t("NEW_PER_DAY_NAN"));
                            return;
                        }

                        if (newPerDay < -1) {
                            new Notice(t("NEW_PER_DAY_NEG"));
                            return;
                        }

                        plugin.data.settings.maxNewPerDay = newPerDay;
                        plugin.savePluginData();
                    })
            );
    }

    addRepeatItemsSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;
        new Setting(containerEl)
            .setName(t("REPEAT_ITEMS"))
            .setDesc(t("REPEAT_ITEMS_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.data.settings.repeatItems);
                toggle.onChange(async (value) => {
                    plugin.data.settings.repeatItems = value;
                    await plugin.savePluginData();
                });
            });
    }

    addAlgorithmSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("ALGORITHM"))
            .addDropdown((dropdown) => {
                Object.keys(algorithms).forEach((val) => {
                    dropdown.addOption(val, val);
                });
                dropdown.setValue(plugin.data.settings.algorithm);
                dropdown.onChange((newValue) => {
                    if (newValue != plugin.data.settings.algorithm) {
                        new ConfirmModal(plugin.app, t("ALGORITHMS_CONFIRM"), (confirmed) => {
                            if (confirmed) {
                                plugin.data.settings.algorithm = newValue;
                                plugin.savePluginData();
                                this.display();
                            } else {
                                dropdown.setValue(plugin.data.settings.algorithm);
                            }
                        }).open();
                    }
                });
            })
            .settingEl.querySelector(".setting-item-description").innerHTML = t("ALGORITHMS_DESC");
    }

    addAlgorithmSpecificDisplaySetting(containerEl: HTMLElement) {
        const plugin = this.plugin;
        if (plugin.data.settings.algorithm === "Default") {
            return;
        }
        // Add algorithm specific settings
        containerEl.createEl("h3").innerText = "Trackfile Algorithm Settings";
        this.plugin.algorithm.displaySettings(containerEl, (settings: any) => {
            this.plugin.data.settings.algorithmSettings = settings;
            this.plugin.saveData(this.plugin.data.settings);
        });
    }

    addTrackedNoteToDecksSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("CONVERT_TRACKED_TO_DECK"))
            .setDesc(t("CONVERT_FOLDERS_TO_DECKS_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(plugin.data.settings.trackedNoteToDecks).onChange((newValue) => {
                    plugin.data.settings.trackedNoteToDecks = newValue;
                    plugin.savePluginData();
                });
            });
    }

    addReviewResponseFloatBarSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("REVIEW_FLOATBAR"))
            .setDesc(t("REVIEW_FLOATBAR_DESC"))
            .addToggle((toggle) => {
                toggle
                    .setValue(plugin.data.settings.reviewResponseFloatBar)
                    .onChange((newValue) => {
                        plugin.data.settings.reviewResponseFloatBar = newValue;
                        plugin.savePluginData();
                    });
            });
    }

    addReviewNoteDirectlySetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("REVIEW_NOTE_DIRECTLY"))
            .setDesc(t("REVIEW_NOTE_DIRECTLY_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(plugin.data.settings.reviewingNoteDirectly).onChange((newValue) => {
                    plugin.data.settings.reviewingNoteDirectly = newValue;
                    plugin.savePluginData();
                });
            });
    }
}
