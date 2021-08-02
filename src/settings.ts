import {
    Notice,
    PluginSettingTab,
    Setting,
    App,
    debounce,
    Platform,
} from "obsidian";
import type SRPlugin from "./main";
import { escapeRegexString } from "./utils";

const DEBOUNCE_TIMER_MS: number = 512;

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
    disableSinglelineCards: boolean;
    singlelineCardSeparator: string;
    disableSinglelineReversedCards: boolean;
    singlelineReversedCardSeparator: string;
    disableMultilineCards: boolean;
    multilineCardSeparator: string;
    disableMultilineReversedCards: boolean;
    multilineReversedCardSeparator: string;
    // notes
    tagsToReview: string[];
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
}

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardTags: ["#flashcards"],
    convertFoldersToDecks: false,
    cardCommentOnSameLine: false,
    burySiblingCards: false,
    showContextInCards: true,
    flashcardHeightPercentage: Platform.isDesktop ? 80 : 100,
    flashcardWidthPercentage: Platform.isDesktop ? 40 : 100,
    showFileNameInFileLink: false,
    randomizeCardOrder: true,
    disableClozeCards: false,
    disableSinglelineCards: false,
    singlelineCardSeparator: "::",
    disableSinglelineReversedCards: false,
    singlelineReversedCardSeparator: ":::",
    disableMultilineCards: false,
    multilineCardSeparator: "?",
    disableMultilineReversedCards: false,
    multilineReversedCardSeparator: "??",
    // notes
    tagsToReview: ["#review"],
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
};

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createDiv().innerHTML =
            "<h2>Spaced Repetition Plugin - Settings</h2>";

        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki">wiki</a>.';

        containerEl.createDiv().innerHTML = "<h3>Flashcards</h3>";

        new Setting(containerEl)
            .setName("Flashcard tags")
            .setDesc(
                "Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3."
            )
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.data.settings.flashcardTags.join(" "))
                    .onChange((value) => {
                        debounce(
                            async () => {
                                this.plugin.data.settings.flashcardTags =
                                    value.split(/\s+/);
                                await this.plugin.savePluginData();
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            );

        new Setting(containerEl)
            .setName("Convert folders to decks and subdecks?")
            .setDesc(
                "This is an alternative to the Flashcard tags option above."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.convertFoldersToDecks)
                    .onChange(async (value) => {
                        this.plugin.data.settings.convertFoldersToDecks = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(
                "Save scheduling comment on the same line as the flashcard's last line?"
            )
            .setDesc(
                "Turning this on will make the HTML comments not break list formatting."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.cardCommentOnSameLine)
                    .onChange(async (value) => {
                        this.plugin.data.settings.cardCommentOnSameLine = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Bury sibling cards until the next day?")
            .setDesc(
                "Siblings are cards generated from the same card text i.e. cloze deletions"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.burySiblingCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.burySiblingCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Show context in cards?")
            .setDesc("i.e. Title > Heading 1 > Subheading > ... > Subheading")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showContextInCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showContextInCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Flashcard Height Percentage")
            .setDesc(
                "[Desktop] Should be set to 100% if you have very large images"
            )
            .addSlider((slider) =>
                slider
                    .setLimits(10, 100, 5)
                    .setValue(
                        this.plugin.data.settings.flashcardHeightPercentage
                    )
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardHeightPercentage =
                            value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardHeightPercentage =
                            DEFAULT_SETTINGS.flashcardHeightPercentage;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Flashcard Width Percentage")
            .setDesc(
                "[Desktop] Should be set to 100% if you have very large images"
            )
            .addSlider((slider) =>
                slider
                    .setLimits(10, 100, 5)
                    .setValue(
                        this.plugin.data.settings.flashcardWidthPercentage
                    )
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardWidthPercentage =
                            value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.flashcardWidthPercentage =
                            DEFAULT_SETTINGS.flashcardWidthPercentage;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName(
                "Show file name instead of 'Open file' in flashcard review?"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.showFileNameInFileLink)
                    .onChange(async (value) => {
                        this.plugin.data.settings.showFileNameInFileLink =
                            value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Randomize card order during review?")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.randomizeCardOrder)
                    .onChange(async (value) => {
                        this.plugin.data.settings.randomizeCardOrder = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Disable cloze cards?")
            .setDesc(
                "If you're not currently using 'em & would like the plugin to run a tad faster."
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
            .setName("Separator for inline flashcards")
            .setDesc(
                "Note that after changing this you have to manually edit any flashcards you already have."
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.singlelineCardSeparator)
                    .onChange((value) => {
                        debounce(
                            async () => {
                                this.plugin.data.settings.singlelineCardSeparator =
                                    value;
                                await this.plugin.savePluginData();
                                this.plugin.singlelineCardRegex = new RegExp(
                                    `^(.+)${escapeRegexString(
                                        value
                                    )}(.+?)\\n?(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`,
                                    "gm"
                                );
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.singlelineCardSeparator =
                            DEFAULT_SETTINGS.singlelineCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Separator for multiline flashcards")
            .setDesc(
                "Note that after changing this you have to manually edit any flashcards you already have."
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.multilineCardSeparator)
                    .onChange((value) => {
                        debounce(
                            async () => {
                                this.plugin.data.settings.multilineCardSeparator =
                                    value;
                                await this.plugin.savePluginData();
                                this.plugin.multilineCardRegex = new RegExp(
                                    `^((?:.+\\n)+)${escapeRegexString(
                                        value
                                    )}\\n((?:.+?\\n?)+?)(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`,
                                    "gm"
                                );
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.multilineCardSeparator =
                            DEFAULT_SETTINGS.multilineCardSeparator;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        containerEl.createDiv().innerHTML = "<h3>Notes</h3>";

        new Setting(containerEl)
            .setName("Tags to review")
            .setDesc(
                "Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3."
            )
            .addTextArea((text) =>
                text
                    .setValue(this.plugin.data.settings.tagsToReview.join(" "))
                    .onChange((value) => {
                        debounce(
                            async () => {
                                this.plugin.data.settings.tagsToReview =
                                    value.split(/\s+/);
                                await this.plugin.savePluginData();
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            );

        new Setting(containerEl)
            .setName("Open a random note for review")
            .setDesc(
                "When you turn this off, notes are ordered by importance (PageRank)."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.openRandomNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.openRandomNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open next note automatically after a review")
            .setDesc("For faster reviews.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.autoNextNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.autoNextNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(
                "Disable review options in the file menu i.e. Review: Easy Good Hard"
            )
            .setDesc(
                "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        this.plugin.data.settings.disableFileMenuReviewOptions
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableFileMenuReviewOptions =
                            value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Maximum number of days to display on right panel")
            .setDesc("Reduce this for a cleaner interface.")
            .addText((text) =>
                text
                    .setValue(
                        this.plugin.data.settings.maxNDaysNotesReviewQueue.toString()
                    )
                    .onChange((value) => {
                        debounce(
                            async () => {
                                let numValue: number = Number.parseInt(value);
                                if (!isNaN(numValue)) {
                                    if (numValue < 1) {
                                        new Notice(
                                            "The number of days must be at least 1."
                                        );
                                        text.setValue(
                                            this.plugin.data.settings.maxNDaysNotesReviewQueue.toString()
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.maxNDaysNotesReviewQueue =
                                        numValue;
                                    await this.plugin.savePluginData();
                                } else {
                                    new Notice(
                                        "Please provide a valid number."
                                    );
                                }
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.maxNDaysNotesReviewQueue =
                            DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        containerEl.createDiv().innerHTML = "<h3>Algorithm</h3>";

        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki/Spaced-Repetition-Algorithm">algorithm implementation</a>.';

        new Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250.")
            .addText((text) =>
                text
                    .setValue(this.plugin.data.settings.baseEase.toString())
                    .onChange((value) => {
                        debounce(
                            async () => {
                                let numValue: number = Number.parseInt(value);
                                if (!isNaN(numValue)) {
                                    if (numValue < 130) {
                                        new Notice(
                                            "The base ease must be at least 130."
                                        );
                                        text.setValue(
                                            `${this.plugin.data.settings.baseEase}`
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.baseEase =
                                        numValue;
                                    await this.plugin.savePluginData();
                                } else {
                                    new Notice(
                                        "Please provide a valid number."
                                    );
                                }
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.baseEase =
                            DEFAULT_SETTINGS.baseEase;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Interval change when you review a flashcard/note as hard")
            .setDesc("newInterval = oldInterval * intervalChange / 100.")
            .addSlider((slider) =>
                slider
                    .setLimits(1, 99, 1)
                    .setValue(
                        this.plugin.data.settings.lapsesIntervalChange * 100
                    )
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.lapsesIntervalChange = value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.lapsesIntervalChange =
                            DEFAULT_SETTINGS.lapsesIntervalChange;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Easy bonus")
            .setDesc(
                "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%)."
            )
            .addText((text) =>
                text
                    .setValue(
                        (this.plugin.data.settings.easyBonus * 100).toString()
                    )
                    .onChange((value) => {
                        debounce(
                            async () => {
                                let numValue: number =
                                    Number.parseInt(value) / 100;
                                if (!isNaN(numValue)) {
                                    if (numValue < 1.0) {
                                        new Notice(
                                            "The easy bonus must be at least 100."
                                        );
                                        text.setValue(
                                            `${
                                                this.plugin.data.settings
                                                    .easyBonus * 100
                                            }`
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.easyBonus =
                                        numValue;
                                    await this.plugin.savePluginData();
                                } else {
                                    new Notice(
                                        "Please provide a valid number."
                                    );
                                }
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.easyBonus =
                            DEFAULT_SETTINGS.easyBonus;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Maximum Interval")
            .setDesc(
                "Allows you to place an upper limit on the interval (default = 100 years)."
            )
            .addText((text) =>
                text
                    .setValue(
                        this.plugin.data.settings.maximumInterval.toString()
                    )
                    .onChange((value) => {
                        debounce(
                            async () => {
                                let numValue: number = Number.parseInt(value);
                                if (!isNaN(numValue)) {
                                    if (numValue < 1) {
                                        new Notice(
                                            "The maximum interval must be at least 1 day."
                                        );
                                        text.setValue(
                                            this.plugin.data.settings.maximumInterval.toString()
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.maximumInterval =
                                        numValue;
                                    await this.plugin.savePluginData();
                                } else {
                                    new Notice(
                                        "Please provide a valid number."
                                    );
                                }
                            },
                            DEBOUNCE_TIMER_MS,
                            true
                        );
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.maximumInterval =
                            DEFAULT_SETTINGS.maximumInterval;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc(
                "Maximum contribution of the weighted ease of linked notes to the initial ease."
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
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.maxLinkFactor =
                            DEFAULT_SETTINGS.maxLinkFactor;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });
    }
}
