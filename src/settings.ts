import { Notice, PluginSettingTab, Setting, App, Platform } from "obsidian";
import type SRPlugin from "src/main";
import { t } from "src/lang/helpers";

// https://github.com/martin-jw/obsidian-recall/blob/main/src/settings.ts
import SrsAlgorithm from "./algorithms";
import { DefaultAlgorithm } from "./algorithms/scheduling_default";
import { Sm2Algorithm } from "./algorithms/supermemo";
import { AnkiAlgorithm, AnkiData } from "./algorithms/anki";
import { FsrsAlgorithm, FsrsData } from "./algorithms/fsrs";
import ConfirmModal from "./modals/confirm";
import { FolderSuggest } from "./suggesters/FolderSuggester";
import { DateUtils } from "./utils_recall";
import deepcopy from "deepcopy";
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

export const algorithms: Record<string, SrsAlgorithm | null> = {
    Default: new DefaultAlgorithm(),
    Anki: new AnkiAlgorithm(),
    Fsrs: new FsrsAlgorithm(),
    SM2: new Sm2Algorithm(),
};

export enum algorithmNames {
    Default = "Default",
    Anki = "Anki",
    Fsrs = "Fsrs",
    SM2 = "SM2",
}

export interface SRSettings {
    // flashcards
    responseOptionBtnsText: Record<string, string[]>;
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
    intervalShowHide: boolean;
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
    responseOptionBtnsText: {
        Default: [t("RESET"), t("HARD"), t("GOOD"), t("EASY")],
        Fsrs: [t("RESET"), t("HARD"), t("GOOD"), t("EASY")],
        Anki: [t("RESET"), t("HARD"), t("GOOD"), t("EASY")],
        SM2: ["Blackout", "Incorrect", "Incorrect (Easy)", t("HARD"), t("GOOD"), t("EASY")],
    },
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
    intervalShowHide: true,
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
    algorithmSettings: { algorithm: Object.values(algorithms)[0].settings },
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
        // this.addNewPerDaySetting(containerEl);
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

        this.addIntervalShowHideSetting(containerEl);

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

        this.addResponseButtonTextSetting(containerEl);

        containerEl.createEl("h3", { text: `${t("ALGORITHM")}` });

        this.addAlgorithmSpecificDisplaySetting(containerEl);

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

                dropdown.onChange(async (val) => {
                    const loc = locationMap[val];
                    plugin.data.settings.dataLocation = loc;
                    plugin.store.moveStoreLocation();
                    plugin.data.settings.customFolder = plugin.store.getStorePath();
                    await plugin.savePluginData();
                    this.display();
                });
            });
    }

    addSpecifiedFolderSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;
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
                    .onClick(async () => {
                        plugin.data.settings.customFolder = cusFolder + "/" + cusFilename;
                        plugin.store.moveStoreLocation();
                        await plugin.savePluginData();
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
                const oldAlgo = plugin.data.settings.algorithm as algorithmNames;
                dropdown.setValue(plugin.data.settings.algorithm);
                dropdown.onChange((newValue) => {
                    if (newValue != plugin.data.settings.algorithm) {
                        new ConfirmModal(plugin.app, t("ALGORITHMS_CONFIRM"), async (confirmed) => {
                            if (confirmed) {
                                const result = this.algorithmSwitchData(
                                    oldAlgo,
                                    newValue as algorithmNames
                                );
                                if (!result) {
                                    dropdown.setValue(plugin.data.settings.algorithm);
                                    return;
                                }

                                plugin.data.settings.algorithm = newValue;
                                plugin.algorithm = algorithms[plugin.data.settings.algorithm];
                                plugin.algorithm.updateSettings(
                                    plugin,
                                    plugin.data.settings.algorithmSettings
                                );
                                plugin.savePluginData();
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                await this.app.plugins.disablePlugin(plugin.manifest.id);
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                await this.app.plugins.enablePlugin(plugin.manifest.id);
                                // this.app.setting.openTabById(plugin.manifest.id);

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

        // Add algorithm specific settings
        // containerEl.createEl("h3").innerText = "Trackfile Algorithm Settings";
        plugin.algorithm.displaySettings(containerEl, (settings: any) => {
            plugin.data.settings.algorithmSettings[plugin.data.settings.algorithm] = settings;
            plugin.savePluginData();
            this.display();
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

    addIntervalShowHideSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;

        new Setting(containerEl)
            .setName(t("INTERVAL_SHOWHIDE"))
            .setDesc(t("INTERVAL_SHOWHIDE_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(plugin.data.settings.intervalShowHide).onChange((newValue) => {
                    plugin.data.settings.intervalShowHide = newValue;
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

    addResponseButtonTextSetting(containerEl: HTMLElement) {
        const plugin = this.plugin;
        const options = plugin.algorithm.srsOptions();
        const algo = plugin.data.settings.algorithm;
        const btnText = this.plugin.data.settings.responseOptionBtnsText;

        if (btnText[algo] == null) {
            btnText[algo] = [];
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            options.forEach((opt, ind) => (btnText[algo][ind] = t(opt.toUpperCase())));
        }
        options.forEach((opt, ind) => {
            const btnTextEl = new Setting(containerEl)
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                .setName(t(opt.toUpperCase()))
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                .setDesc(t(opt.toUpperCase() + "_DESC"));
            btnTextEl.addText((text) =>
                text.setValue(btnText[algo][ind]).onChange((value) => {
                    applySettingsUpdate(async () => {
                        btnText[algo][ind] = value;
                        await this.plugin.savePluginData();
                    });
                })
            );
            btnTextEl.addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.plugin.data.settings.responseOptionBtnsText[algo][ind] =
                            DEFAULT_SETTINGS.responseOptionBtnsText[algo][ind];
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });
        });
    }

    async algorithmSwitchData(fromAlgo: algorithmNames, toAlgo: algorithmNames) {
        const plugin = this.plugin;
        let result = false;
        const items = plugin.store.data.items;

        const old_path = plugin.store.dataPath;

        await plugin.store.save(old_path + ".bak");
        plugin.store.pruneData();
        try {
            if (
                fromAlgo === algorithmNames.Anki ||
                fromAlgo === algorithmNames.Default ||
                fromAlgo === algorithmNames.SM2
            ) {
                if (toAlgo === algorithmNames.Fsrs) {
                    items.forEach((item) => {
                        if (item != null && item.data != null) {
                            const data = item.data as AnkiData;
                            const due = new Date(item.nextReview);
                            const lastview = new Date(
                                item.nextReview - data.lastInterval * DateUtils.DAYS_TO_MILLIS
                            );
                            const reps = item.timesReviewed;
                            const card = algorithms[algorithmNames.Fsrs].defaultData();
                            card.due = due;
                            card.reps = reps;
                            card.last_review = lastview;
                            item.data = deepcopy(card);
                        }
                    });
                }
            } else if (
                fromAlgo === algorithmNames.Fsrs &&
                (toAlgo === algorithmNames.Anki ||
                    toAlgo === algorithmNames.Default ||
                    toAlgo === algorithmNames.SM2)
            ) {
                items.forEach((item) => {
                    const data = item.data as FsrsData;
                    const lastitval =
                        (new Date(data.due).valueOf() - new Date(data.last_review).valueOf()) /
                        DateUtils.DAYS_TO_MILLIS;
                    const iter = data.reps;
                    const newdata = algorithms[algorithmNames.Default].defaultData();
                    newdata.lastInterval =
                        lastitval > newdata.lastInterval ? lastitval : newdata.lastInterval;
                    newdata.iteration = iter;
                    item.data = deepcopy(newdata);
                });
            }
            new Notice("转换完成，因算法参数不同，会导致后续复习间隔调整");
            result = true;
        } catch (error) {
            await plugin.store.load(old_path + ".bak");
            new Notice(error + "\n转换失败，已恢复旧算法及数据");
            console.log(error);
        }
        return result;
    }
}
