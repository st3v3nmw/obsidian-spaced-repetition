import { Notice, PluginSettingTab, Setting, App, Platform } from "obsidian";

import type SRPlugin from "src/main";
import { LogLevel } from "src/logger";
import { t } from "src/lang/helpers";

export interface SRSettings {
    // flashcards
    flashcardTags: string[];
    convertFoldersToDecks: boolean;
    cardCommentOnSameLine: boolean;
    burySiblingCards: boolean;
    showContextInCards: boolean;
    flashcardHeightPercentage: number;
    flashcardWidthPercentage: number;
    showFileNameInFileLink: boolean;
    randomizeCardOrder: boolean;
    disableClozeCards: boolean;
    singlelineCardSeparator: string;
    singlelineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    // notes
    tagsToReview: string[];
    noteFoldersToIgnore: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    disableFileMenuReviewOptions: boolean;
    maxNDaysNotesReviewQueue: number;
    // algorithm
    baseEase: number;
    lapsesIntervalChange: number;
    easyBonus: number;
    maximumInterval: number;
    maxLinkFactor: number;
    // logging
    logLevel: LogLevel;
}

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardTags: ["#flashcards"],
    convertFoldersToDecks: false,
    cardCommentOnSameLine: false,
    burySiblingCards: false,
    showContextInCards: true,
    flashcardHeightPercentage: Platform.isMobile ? 100 : 80,
    flashcardWidthPercentage: Platform.isMobile ? 100 : 40,
    showFileNameInFileLink: false,
    randomizeCardOrder: true,
    disableClozeCards: false,
    singlelineCardSeparator: "::",
    singlelineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    // notes
    tagsToReview: ["#review"],
    noteFoldersToIgnore: [],
    openRandomNote: false,
    autoNextNote: false,
    disableFileMenuReviewOptions: false,
    maxNDaysNotesReviewQueue: 365,
    // algorithm
    baseEase: 250,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
    maximumInterval: 36525,
    maxLinkFactor: 1.0,
    // logging
    logLevel: LogLevel.Warn,
};

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer: number = 0;
function applySettingsUpdate(callback: Function): void {
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
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createDiv().innerHTML =
            "<h2>" + t("Spaced Repetition Plugin - Settings") + "</h2>";

        containerEl.createDiv().innerHTML =
            t("For more information, check the") +
            ' <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki">' +
            t("wiki") +
            "</a>.";

        new Setting(containerEl)
            .setName(t("Folders to ignore"))
            .setDesc(t("Enter folder paths separated by newlines i.e. Templates Meta/Scripts"))
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

        containerEl.createDiv().innerHTML = "<h3>" + t("Flashcards") + "</h3>";

        new Setting(containerEl)
            .setName(t("Flashcard tags"))
            .setDesc(
                t("Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3.")
            )
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
            .setName(t("Convert folders to decks and subdecks?"))
            .setDesc(t("This is an alternative to the Flashcard tags option above."))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.convertFoldersToDecks)
                    .onChange(async (value) => {
                        this.plugin.data.settings.convertFoldersToDecks = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Save scheduling comment on the same line as the flashcard's last line?"))
            .setDesc(t("Turning this on will make the HTML comments not break list formatting."))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.cardCommentOnSameLine)
                    .onChange(async (value) => {
                        this.plugin.data.settings.cardCommentOnSameLine = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Bury sibling cards until the next day?"))
            .setDesc(t("Siblings are cards generated from the same card text i.e. cloze deletions"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.burySiblingCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.burySiblingCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Show context in cards?"))
            .setDesc(t("i.e. Title > Heading 1 > Subheading > ... > Subheading"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showContextInCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showContextInCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Flashcard Height Percentage"))
            .setDesc(t("Should be set to 100% on mobile or if you have very large images"))
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
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardHeightPercentage =
                            DEFAULT_SETTINGS.flashcardHeightPercentage;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Flashcard Width Percentage"))
            .setDesc(t("Should be set to 100% on mobile or if you have very large images"))
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
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardWidthPercentage =
                            DEFAULT_SETTINGS.flashcardWidthPercentage;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Show file name instead of 'Open file' in flashcard review?"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showFileNameInFileLink)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showFileNameInFileLink = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Randomize card order during review?"))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.randomizeCardOrder)
                    .onChange(async (value) => {
                        this.plugin.data.settings.randomizeCardOrder = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Disable cloze cards?"))
            .setDesc(
                t("If you're not currently using 'em & would like the plugin to run a tad faster.")
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.disableClozeCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableClozeCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Separator for inline flashcards"))
            .setDesc(
                t(
                    "Note that after changing this you have to manually edit any flashcards you already have."
                )
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.singlelineCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.singlelineCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.singlelineCardSeparator =
                            DEFAULT_SETTINGS.singlelineCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Separator for inline reversed flashcards"))
            .setDesc(
                t(
                    "Note that after changing this you have to manually edit any flashcards you already have."
                )
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.singlelineReversedCardSeparator)
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            this.plugin.data.settings.singlelineReversedCardSeparator = value;
                            await this.plugin.savePluginData();
                        });
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.singlelineReversedCardSeparator =
                            DEFAULT_SETTINGS.singlelineReversedCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Separator for multiline flashcards"))
            .setDesc(
                t(
                    "Note that after changing this you have to manually edit any flashcards you already have."
                )
            )
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
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.multilineCardSeparator =
                            DEFAULT_SETTINGS.multilineCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Separator for multiline reversed flashcards"))
            .setDesc(
                t(
                    "Note that after changing this you have to manually edit any flashcards you already have."
                )
            )
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
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.multilineReversedCardSeparator =
                            DEFAULT_SETTINGS.multilineReversedCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Clear cache?"))
            .setDesc(t("If you're having issues seeing some cards, try this."))
            .addButton((button) => {
                button.setButtonText(t("Clear cache")).onClick(async () => {
                    this.plugin.data.cache = {};
                    await this.plugin.savePluginData();
                    new Notice(t("Cache cleared"));
                });
            });

        containerEl.createDiv().innerHTML = "<h3>" + t("Notes") + "</h3>";

        new Setting(containerEl)
            .setName(t("Tags to review"))
            .setDesc(t("Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3."))
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
            .setName(t("Open a random note for review"))
            .setDesc(t("When you turn this off, notes are ordered by importance (PageRank)."))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.openRandomNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.openRandomNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Open next note automatically after a review"))
            .setDesc(t("For faster reviews."))
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.data.settings.autoNextNote).onChange(async (value) => {
                    this.plugin.data.settings.autoNextNote = value;
                    await this.plugin.savePluginData();
                })
            );

        new Setting(containerEl)
            .setName(t("Disable review options in the file menu i.e. Review: Easy Good Hard"))
            .setDesc(
                t(
                    "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this."
                )
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.disableFileMenuReviewOptions)
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableFileMenuReviewOptions = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(t("Maximum number of days to display on right panel"))
            .setDesc(t("Reduce this for a cleaner interface."))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.maxNDaysNotesReviewQueue.toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            let numValue: number = Number.parseInt(value);
                            if (!isNaN(numValue)) {
                                if (numValue < 1) {
                                    new Notice(t("The number of days must be at least 1."));
                                    text.setValue(
                                        this.plugin.data.settings.maxNDaysNotesReviewQueue.toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maxNDaysNotesReviewQueue = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("Please provide a valid number."));
                            }
                        });
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.maxNDaysNotesReviewQueue =
                            DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        containerEl.createDiv().innerHTML = "<h3>" + t("Algorithm") + "</h3>";

        containerEl.createDiv().innerHTML =
            t("For more information, check the") +
            ' <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki/Spaced-Repetition-Algorithm">' +
            t("algorithm implementation") +
            "</a>.";

        new Setting(containerEl)
            .setName(t("Base ease"))
            .setDesc(t("minimum = 130, preferrably approximately 250."))
            .addText((text) =>
                text.setValue(this.plugin.data.settings.baseEase.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        let numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 130) {
                                new Notice(t("The base ease must be at least 130."));
                                text.setValue(this.plugin.data.settings.baseEase.toString());
                                return;
                            }

                            this.plugin.data.settings.baseEase = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice(t("Please provide a valid number."));
                        }
                    });
                })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.baseEase = DEFAULT_SETTINGS.baseEase;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Interval change when you review a flashcard/note as hard"))
            .setDesc(t("newInterval = oldInterval * intervalChange / 100."))
            .addSlider((slider) =>
                slider
                    .setLimits(1, 99, 1)
                    .setValue(this.plugin.data.settings.lapsesIntervalChange * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.lapsesIntervalChange = value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.lapsesIntervalChange =
                            DEFAULT_SETTINGS.lapsesIntervalChange;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Easy bonus"))
            .setDesc(
                t(
                    "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%)."
                )
            )
            .addText((text) =>
                text
                    .setValue((this.plugin.data.settings.easyBonus * 100).toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            let numValue: number = Number.parseInt(value) / 100;
                            if (!isNaN(numValue)) {
                                if (numValue < 1.0) {
                                    new Notice(t("The easy bonus must be at least 100."));
                                    text.setValue(
                                        (this.plugin.data.settings.easyBonus * 100).toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.easyBonus = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("Please provide a valid number."));
                            }
                        });
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.easyBonus = DEFAULT_SETTINGS.easyBonus;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Maximum Interval"))
            .setDesc(t("Allows you to place an upper limit on the interval (default = 100 years)."))
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.maximumInterval.toString())
                    .onChange((value) => {
                        applySettingsUpdate(async () => {
                            let numValue: number = Number.parseInt(value);
                            if (!isNaN(numValue)) {
                                if (numValue < 1) {
                                    new Notice(t("The maximum interval must be at least 1 day."));
                                    text.setValue(
                                        this.plugin.data.settings.maximumInterval.toString()
                                    );
                                    return;
                                }

                                this.plugin.data.settings.maximumInterval = numValue;
                                await this.plugin.savePluginData();
                            } else {
                                new Notice(t("Please provide a valid number."));
                            }
                        });
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.maximumInterval =
                            DEFAULT_SETTINGS.maximumInterval;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(t("Maximum link contribution"))
            .setDesc(
                t("Maximum contribution of the weighted ease of linked notes to the initial ease.")
            )
            .addSlider((slider) =>
                slider
                    .setLimits(0, 100, 1)
                    .setValue(this.plugin.data.settings.maxLinkFactor * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.maxLinkFactor = value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("Reset to default"))
                    .onClick(async () => {
                        this.plugin.data.settings.maxLinkFactor = DEFAULT_SETTINGS.maxLinkFactor;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });
    }
}
