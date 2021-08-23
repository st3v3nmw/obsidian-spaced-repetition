'use strict';

var obsidian = require('obsidian');

function forOwn(object, callback) {
    if ((typeof object === 'object') && (typeof callback === 'function')) {
        for (var key in object) {
            if (object.hasOwnProperty(key) === true) {
                if (callback(key, object[key]) === false) {
                    break;
                }
            }
        }
    }
}

var lib = (function () {
    var self = {
        count: 0,
        edges: {},
        nodes: {}
    };

    self.link = function (source, target, weight) {
        if ((isFinite(weight) !== true) || (weight === null)) {
            weight = 1;
        }
        
        weight = parseFloat(weight);

        if (self.nodes.hasOwnProperty(source) !== true) {
            self.count++;
            self.nodes[source] = {
                weight: 0,
                outbound: 0
            };
        }

        self.nodes[source].outbound += weight;

        if (self.nodes.hasOwnProperty(target) !== true) {
            self.count++;
            self.nodes[target] = {
                weight: 0,
                outbound: 0
            };
        }

        if (self.edges.hasOwnProperty(source) !== true) {
            self.edges[source] = {};
        }

        if (self.edges[source].hasOwnProperty(target) !== true) {
            self.edges[source][target] = 0;
        }

        self.edges[source][target] += weight;
    };

    self.rank = function (alpha, epsilon, callback) {
        var delta = 1,
            inverse = 1 / self.count;

        forOwn(self.edges, function (source) {
            if (self.nodes[source].outbound > 0) {
                forOwn(self.edges[source], function (target) {
                    self.edges[source][target] /= self.nodes[source].outbound;
                });
            }
        });

        forOwn(self.nodes, function (key) {
            self.nodes[key].weight = inverse;
        });

        while (delta > epsilon) {
            var leak = 0,
                nodes = {};

            forOwn(self.nodes, function (key, value) {
                nodes[key] = value.weight;

                if (value.outbound === 0) {
                    leak += value.weight;
                }

                self.nodes[key].weight = 0;
            });

            leak *= alpha;

            forOwn(self.nodes, function (source) {
                forOwn(self.edges[source], function (target, weight) {
                    self.nodes[target].weight += alpha * nodes[source] * weight;
                });

                self.nodes[source].weight += (1 - alpha) * inverse + leak * inverse;
            });

            delta = 0;

            forOwn(self.nodes, function (key, value) {
                delta += Math.abs(value.weight - nodes[key]);
            });
        }

        forOwn(self.nodes, function (key) {
            return callback(key, self.nodes[key].weight);
        });
    };

    self.reset = function () {
        self.count = 0;
        self.edges = {};
        self.nodes = {};
    };

    return self;
})();

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Info"] = 0] = "Info";
    LogLevel[LogLevel["Warn"] = 1] = "Warn";
    LogLevel[LogLevel["Error"] = 2] = "Error";
})(LogLevel || (LogLevel = {}));
const createLogger = (console, logLevel) => {
    let info, warn;
    if (logLevel === LogLevel.Info)
        info = Function.prototype.bind.call(console.info, console, "SR:");
    else
        info = (..._) => { };
    if (logLevel <= LogLevel.Warn)
        warn = Function.prototype.bind.call(console.warn, console, "SR:");
    else
        warn = (..._) => { };
    let error = Function.prototype.bind.call(console.error, console, "SR:");
    return { info, warn, error };
};

// العربية
var ar = {};

// čeština
var cz = {};

// Dansk
var da = {};

// Deutsch
var de = {};

// English
var en = {
    // flashcard-modal.ts
    Decks: "Decks",
    "Open file": "Open file",
    "Due cards": "Due cards",
    "New cards": "New cards",
    "Total cards": "Total cards",
    "Reset card's progress": "Reset card's progress",
    Hard: "Hard",
    Good: "Good",
    Easy: "Easy",
    "Show Answer": "Show Answer",
    "Card's progress has been reset.": "Card's progress has been reset.",
    // main.ts
    "Open a note for review": "Open a note for review",
    "Review flashcards": "Review flashcards",
    "Review: Easy": "Review: Easy",
    "Review: Good": "Review: Good",
    "Review: Hard": "Review: Hard",
    "Review note as easy": "Review note as easy",
    "Review note as good": "Review note as good",
    "Review note as hard": "Review note as hard",
    "View statistics": "View statistics",
    note: "note",
    notes: "notes",
    card: "card",
    cards: "cards",
    "Please tag the note appropriately for reviewing (in settings).": "Please tag the note appropriately for reviewing (in settings).",
    "You're all caught up now :D.": "You're all caught up now :D.",
    "Response received.": "Response received.",
    // scheduling.ts
    day: "day",
    days: "days",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
    // settings.ts
    Notes: "Notes",
    Flashcards: "Flashcards",
    "Spaced Repetition Plugin - Settings": "Spaced Repetition Plugin - Settings",
    "For more information, check the": "For more information, check the",
    wiki: "wiki",
    "algorithm implementation": "algorithm implementation",
    "Flashcard tags": "Flashcard tags",
    "Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3.": "Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3.",
    "Convert folders to decks and subdecks?": "Convert folders to decks and subdecks?",
    "This is an alternative to the Flashcard tags option above.": "This is an alternative to the Flashcard tags option above.",
    "Save scheduling comment on the same line as the flashcard's last line?": "Save scheduling comment on the same line as the flashcard's last line?",
    "Turning this on will make the HTML comments not break list formatting.": "Turning this on will make the HTML comments not break list formatting.",
    "Bury sibling cards until the next day?": "Bury sibling cards until the next day?",
    "Siblings are cards generated from the same card text i.e. cloze deletions": "Siblings are cards generated from the same card text i.e. cloze deletions",
    "Show context in cards?": "Show context in cards?",
    "i.e. Title > Heading 1 > Subheading > ... > Subheading": "i.e. Title > Heading 1 > Subheading > ... > Subheading",
    "Flashcard Height Percentage": "Flashcard Height Percentage",
    "Should be set to 100% on mobile or if you have very large images": "Should be set to 100% on mobile or if you have very large images",
    "Reset to default": "Reset to default",
    "Flashcard Width Percentage": "Flashcard Width Percentage",
    "Show file name instead of 'Open file' in flashcard review?": "Show file name instead of 'Open file' in flashcard review?",
    "Randomize card order during review?": "Randomize card order during review?",
    "Disable cloze cards?": "Disable cloze cards?",
    "If you're not currently using 'em & would like the plugin to run a tad faster.": "If you're not currently using 'em & would like the plugin to run a tad faster.",
    "Separator for inline flashcards": "Separator for inline flashcards",
    "Separator for inline reversed flashcards": "Separator for inline reversed flashcards",
    "Separator for multiline reversed flashcards": "Separator for multiline reversed flashcards",
    "Note that after changing this you have to manually edit any flashcards you already have.": "Note that after changing this you have to manually edit any flashcards you already have.",
    "Separator for multiline flashcards": "Separator for multiline flashcards",
    "Clear cache?": "Clear cache?",
    "Clear cache": "Clear cache",
    "Cache cleared": "Cache cleared",
    "If you're having issues seeing some cards, try this.": "If you're having issues seeing some cards, try this.",
    "Tags to review": "Tags to review",
    "Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3.": "Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3.",
    "Open a random note for review": "Open a random note for review",
    "When you turn this off, notes are ordered by importance (PageRank).": "When you turn this off, notes are ordered by importance (PageRank).",
    "Open next note automatically after a review": "Open next note automatically after a review",
    "For faster reviews.": "For faster reviews.",
    "Disable review options in the file menu i.e. Review: Easy Good Hard": "Disable review options in the file menu i.e. Review: Easy Good Hard",
    "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.": "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.",
    "Maximum number of days to display on right panel": "Maximum number of days to display on right panel",
    "Reduce this for a cleaner interface.": "Reduce this for a cleaner interface.",
    "The number of days must be at least 1.": "The number of days must be at least 1.",
    "Please provide a valid number.": "Please provide a valid number.",
    Algorithm: "Algorithm",
    "Base ease": "Base ease",
    "minimum = 130, preferrably approximately 250.": "minimum = 130, preferrably approximately 250.",
    "The base ease must be at least 130.": "The base ease must be at least 130.",
    "Interval change when you review a flashcard/note as hard": "Interval change when you review a flashcard/note as hard",
    "newInterval = oldInterval * intervalChange / 100.": "newInterval = oldInterval * intervalChange / 100.",
    "Easy bonus": "Easy bonus",
    "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%).": "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%).",
    "The easy bonus must be at least 100.": "The easy bonus must be at least 100.",
    "Maximum Interval": "Maximum Interval",
    "Allows you to place an upper limit on the interval (default = 100 years).": "Allows you to place an upper limit on the interval (default = 100 years).",
    "The maximum interval must be at least 1 day.": "The maximum interval must be at least 1 day.",
    "Maximum link contribution": "Maximum link contribution",
    "Maximum contribution of the weighted ease of linked notes to the initial ease.": "Maximum contribution of the weighted ease of linked notes to the initial ease.",
    // sidebar.ts
    New: "New",
    Yesterday: "Yesterday",
    Today: "Today",
    Tomorrow: "Tomorrow",
    "Notes Review Queue": "Notes Review Queue",
    Close: "Close",
    // stats-modal.ts
    Statistics: "Statistics",
    "Note that this requires the Obsidian Charts plugin to work": "Note that this requires the Obsidian Charts plugin to work",
    Forecast: "Forecast",
    "The number of cards due in the future": "The number of cards due in the future",
    "Number of cards": "Number of cards",
    Scheduled: "Scheduled",
    Review: "Review",
    due: "due",
    Days: "Days",
    "Card Types": "Card Types",
    Intervals: "Intervals",
    "Delays until reviews are shown again": "Delays until reviews are shown again",
    "Count": "Count",
    "Eases": "Eases",
    "Folders to ignore": "Folders to ignore",
    "Enter folder paths separated by newlines i.e. Templates Meta/Scripts": "Enter folder paths separated by newlines i.e. Templates Meta/Scripts",
    "Note is saved under ignored folder (check settings).": "Note is saved under ignored folder (check settings).",
};

// British English
var enGB = {};

// Español
var es = {};

// français
var fr = {};

// हिन्दी
var hi = {};

// Bahasa Indonesia
var id = {};

// Italiano
var it = {};

// 日本語
var ja = {};

// 한국어
var ko = {};

// Nederlands
var nl = {};

// Norsk
var no = {};

// język polski
var pl = {};

// Português
var pt = {};

// Português do Brasil
// Brazilian Portuguese
var ptBR = {};

// Română
var ro = {};

// русский
var ru = {};

// Türkçe
var tr = {};

// 简体中文
var zhCN = {};

// 繁體中文
var zhTW = {};

// https://github.com/mgmeyers/obsidian-kanban/blob/93014c2512507fde9eafd241e8d4368a8dfdf853/src/lang/helpers.ts
const localeMap = {
    ar,
    cs: cz,
    da,
    de,
    en,
    "en-gb": enGB,
    es,
    fr,
    hi,
    id,
    it,
    ja,
    ko,
    nl,
    nn: no,
    pl,
    pt,
    "pt-br": ptBR,
    ro,
    ru,
    tr,
    "zh-cn": zhCN,
    "zh-tw": zhTW,
};
const locale = localeMap[obsidian.moment.locale()];
function t(str) {
    if (!locale) {
        console.error("Error: SRS locale not found", obsidian.moment.locale());
    }
    return (locale && locale[str]) || en[str];
}

const DEFAULT_SETTINGS = {
    // flashcards
    flashcardTags: ["#flashcards"],
    convertFoldersToDecks: false,
    cardCommentOnSameLine: false,
    burySiblingCards: false,
    showContextInCards: true,
    flashcardHeightPercentage: obsidian.Platform.isMobile ? 100 : 80,
    flashcardWidthPercentage: obsidian.Platform.isMobile ? 100 : 40,
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
let applyDebounceTimer = 0;
function applySettingsUpdate(callback) {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}
class SRSettingTab extends obsidian.PluginSettingTab {
    plugin;
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createDiv().innerHTML =
            "<h2>" + t("Spaced Repetition Plugin - Settings") + "</h2>";
        containerEl.createDiv().innerHTML =
            t("For more information, check the") +
                ' <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki">' +
                t("wiki") +
                "</a>.";
        new obsidian.Setting(containerEl)
            .setName(t("Folders to ignore"))
            .setDesc(t("Enter folder paths separated by newlines i.e. Templates Meta/Scripts"))
            .addTextArea((text) => text
            .setValue(this.plugin.data.settings.noteFoldersToIgnore.join("\n"))
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.noteFoldersToIgnore = value
                    .split(/\n+/)
                    .map((v) => v.trim())
                    .filter((v) => v);
                await this.plugin.savePluginData();
            });
        }));
        containerEl.createDiv().innerHTML = "<h3>" + t("Flashcards") + "</h3>";
        new obsidian.Setting(containerEl)
            .setName(t("Flashcard tags"))
            .setDesc(t("Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3."))
            .addTextArea((text) => text
            .setValue(this.plugin.data.settings.flashcardTags.join(" "))
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.flashcardTags = value.split(/\s+/);
                await this.plugin.savePluginData();
            });
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Convert folders to decks and subdecks?"))
            .setDesc(t("This is an alternative to the Flashcard tags option above."))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.convertFoldersToDecks)
            .onChange(async (value) => {
            this.plugin.data.settings.convertFoldersToDecks = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Save scheduling comment on the same line as the flashcard's last line?"))
            .setDesc(t("Turning this on will make the HTML comments not break list formatting."))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.cardCommentOnSameLine)
            .onChange(async (value) => {
            this.plugin.data.settings.cardCommentOnSameLine = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Bury sibling cards until the next day?"))
            .setDesc(t("Siblings are cards generated from the same card text i.e. cloze deletions"))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.burySiblingCards)
            .onChange(async (value) => {
            this.plugin.data.settings.burySiblingCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Show context in cards?"))
            .setDesc(t("i.e. Title > Heading 1 > Subheading > ... > Subheading"))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.showContextInCards)
            .onChange(async (value) => {
            this.plugin.data.settings.showContextInCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Flashcard Height Percentage"))
            .setDesc(t("Should be set to 100% on mobile or if you have very large images"))
            .addSlider((slider) => slider
            .setLimits(10, 100, 5)
            .setValue(this.plugin.data.settings.flashcardHeightPercentage)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.flashcardHeightPercentage = value;
            await this.plugin.savePluginData();
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Flashcard Width Percentage"))
            .setDesc(t("Should be set to 100% on mobile or if you have very large images"))
            .addSlider((slider) => slider
            .setLimits(10, 100, 5)
            .setValue(this.plugin.data.settings.flashcardWidthPercentage)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.flashcardWidthPercentage = value;
            await this.plugin.savePluginData();
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Show file name instead of 'Open file' in flashcard review?"))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.showFileNameInFileLink)
            .onChange(async (value) => {
            this.plugin.data.settings.showFileNameInFileLink = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Randomize card order during review?"))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.randomizeCardOrder)
            .onChange(async (value) => {
            this.plugin.data.settings.randomizeCardOrder = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Disable cloze cards?"))
            .setDesc(t("If you're not currently using 'em & would like the plugin to run a tad faster."))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.disableClozeCards)
            .onChange(async (value) => {
            this.plugin.data.settings.disableClozeCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Separator for inline flashcards"))
            .setDesc(t("Note that after changing this you have to manually edit any flashcards you already have."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.singlelineCardSeparator)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.singlelineCardSeparator = value;
                await this.plugin.savePluginData();
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Separator for inline reversed flashcards"))
            .setDesc(t("Note that after changing this you have to manually edit any flashcards you already have."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.singlelineReversedCardSeparator)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.singlelineReversedCardSeparator = value;
                await this.plugin.savePluginData();
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Separator for multiline flashcards"))
            .setDesc(t("Note that after changing this you have to manually edit any flashcards you already have."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.multilineCardSeparator)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.multilineCardSeparator = value;
                await this.plugin.savePluginData();
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Separator for multiline reversed flashcards"))
            .setDesc(t("Note that after changing this you have to manually edit any flashcards you already have."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.multilineReversedCardSeparator)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.multilineReversedCardSeparator = value;
                await this.plugin.savePluginData();
            });
        }))
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
        containerEl.createDiv().innerHTML = "<h3>" + t("Notes") + "</h3>";
        new obsidian.Setting(containerEl)
            .setName(t("Tags to review"))
            .setDesc(t("Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3."))
            .addTextArea((text) => text
            .setValue(this.plugin.data.settings.tagsToReview.join(" "))
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.tagsToReview = value.split(/\s+/);
                await this.plugin.savePluginData();
            });
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Open a random note for review"))
            .setDesc(t("When you turn this off, notes are ordered by importance (PageRank)."))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.openRandomNote)
            .onChange(async (value) => {
            this.plugin.data.settings.openRandomNote = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Open next note automatically after a review"))
            .setDesc(t("For faster reviews."))
            .addToggle((toggle) => toggle.setValue(this.plugin.data.settings.autoNextNote).onChange(async (value) => {
            this.plugin.data.settings.autoNextNote = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Disable review options in the file menu i.e. Review: Easy Good Hard"))
            .setDesc(t("After disabling, you can review using the command hotkeys. Reload Obsidian after changing this."))
            .addToggle((toggle) => toggle
            .setValue(this.plugin.data.settings.disableFileMenuReviewOptions)
            .onChange(async (value) => {
            this.plugin.data.settings.disableFileMenuReviewOptions = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName(t("Maximum number of days to display on right panel"))
            .setDesc(t("Reduce this for a cleaner interface."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.maxNDaysNotesReviewQueue.toString())
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 1) {
                        new obsidian.Notice(t("The number of days must be at least 1."));
                        text.setValue(this.plugin.data.settings.maxNDaysNotesReviewQueue.toString());
                        return;
                    }
                    this.plugin.data.settings.maxNDaysNotesReviewQueue = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice(t("Please provide a valid number."));
                }
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Base ease"))
            .setDesc(t("minimum = 130, preferrably approximately 250."))
            .addText((text) => text.setValue(this.plugin.data.settings.baseEase.toString()).onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 130) {
                        new obsidian.Notice(t("The base ease must be at least 130."));
                        text.setValue(this.plugin.data.settings.baseEase.toString());
                        return;
                    }
                    this.plugin.data.settings.baseEase = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice(t("Please provide a valid number."));
                }
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Interval change when you review a flashcard/note as hard"))
            .setDesc(t("newInterval = oldInterval * intervalChange / 100."))
            .addSlider((slider) => slider
            .setLimits(1, 99, 1)
            .setValue(this.plugin.data.settings.lapsesIntervalChange * 100)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.lapsesIntervalChange = value;
            await this.plugin.savePluginData();
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Easy bonus"))
            .setDesc(t("The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%)."))
            .addText((text) => text
            .setValue((this.plugin.data.settings.easyBonus * 100).toString())
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value) / 100;
                if (!isNaN(numValue)) {
                    if (numValue < 1.0) {
                        new obsidian.Notice(t("The easy bonus must be at least 100."));
                        text.setValue((this.plugin.data.settings.easyBonus * 100).toString());
                        return;
                    }
                    this.plugin.data.settings.easyBonus = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice(t("Please provide a valid number."));
                }
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Maximum Interval"))
            .setDesc(t("Allows you to place an upper limit on the interval (default = 100 years)."))
            .addText((text) => text
            .setValue(this.plugin.data.settings.maximumInterval.toString())
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 1) {
                        new obsidian.Notice(t("The maximum interval must be at least 1 day."));
                        text.setValue(this.plugin.data.settings.maximumInterval.toString());
                        return;
                    }
                    this.plugin.data.settings.maximumInterval = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice(t("Please provide a valid number."));
                }
            });
        }))
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
        new obsidian.Setting(containerEl)
            .setName(t("Maximum link contribution"))
            .setDesc(t("Maximum contribution of the weighted ease of linked notes to the initial ease."))
            .addSlider((slider) => slider
            .setLimits(0, 100, 1)
            .setValue(this.plugin.data.settings.maxLinkFactor * 100)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.maxLinkFactor = value;
            await this.plugin.savePluginData();
        }))
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

var ReviewResponse;
(function (ReviewResponse) {
    ReviewResponse[ReviewResponse["Easy"] = 0] = "Easy";
    ReviewResponse[ReviewResponse["Good"] = 1] = "Good";
    ReviewResponse[ReviewResponse["Hard"] = 2] = "Hard";
    ReviewResponse[ReviewResponse["Reset"] = 3] = "Reset";
})(ReviewResponse || (ReviewResponse = {}));
function schedule(response, interval, ease, delayBeforeReview, settingsObj, dueDates) {
    delayBeforeReview = Math.max(0, Math.floor(delayBeforeReview / (24 * 3600 * 1000)));
    if (response === ReviewResponse.Easy) {
        ease += 20;
        interval = ((interval + delayBeforeReview) * ease) / 100;
        interval *= settingsObj.easyBonus;
    }
    else if (response === ReviewResponse.Good) {
        interval = ((interval + delayBeforeReview / 2) * ease) / 100;
    }
    else if (response === ReviewResponse.Hard) {
        ease = Math.max(130, ease - 20);
        interval = Math.max(1, (interval + delayBeforeReview / 4) * settingsObj.lapsesIntervalChange);
    }
    // replaces random fuzz with load balancing over the fuzz interval
    if (dueDates !== undefined) {
        interval = Math.round(interval);
        if (!dueDates.hasOwnProperty(interval)) {
            dueDates[interval] = 0;
        }
        let fuzzRange;
        // disable fuzzing for small intervals
        if (interval <= 4) {
            fuzzRange = [interval, interval];
        }
        else {
            let fuzz;
            if (interval < 7)
                fuzz = 1;
            else if (interval < 30)
                fuzz = Math.max(2, Math.floor(interval * 0.15));
            else
                fuzz = Math.max(4, Math.floor(interval * 0.05));
            fuzzRange = [interval - fuzz, interval + fuzz];
        }
        for (let ivl = fuzzRange[0]; ivl <= fuzzRange[1]; ivl++) {
            if (!dueDates.hasOwnProperty(ivl)) {
                dueDates[ivl] = 0;
            }
            if (dueDates[ivl] < dueDates[interval]) {
                interval = ivl;
            }
        }
        dueDates[interval]++;
    }
    interval = Math.min(interval, settingsObj.maximumInterval);
    return { interval: Math.round(interval * 10) / 10, ease };
}
function textInterval(interval, isMobile) {
    let m = Math.round(interval / 3) / 10, y = Math.round(interval / 36.5) / 10;
    if (isMobile) {
        if (interval < 30)
            return `${interval}d`;
        else if (interval < 365)
            return `${m}m`;
        else
            return `${y}y`;
    }
    else {
        if (interval < 30) {
            return interval === 1.0 ? "1.0 " + t("day") : interval.toString() + " " + t("days");
        }
        else if (interval < 365) {
            return m === 1.0 ? "1.0 " + t("month") : m.toString() + " " + t("months");
        }
        else {
            return y === 1.0 ? "1.0 " + t("year") : y.toString() + " " + t("years");
        }
    }
}

// https://github.com/obsidianmd/obsidian-api/issues/13
// flashcards
var CardType;
(function (CardType) {
    CardType[CardType["SingleLineBasic"] = 0] = "SingleLineBasic";
    CardType[CardType["SingleLineReversed"] = 1] = "SingleLineReversed";
    CardType[CardType["MultiLineBasic"] = 2] = "MultiLineBasic";
    CardType[CardType["MultiLineReversed"] = 3] = "MultiLineReversed";
    CardType[CardType["Cloze"] = 4] = "Cloze";
})(CardType || (CardType = {}));

const SCHEDULING_INFO_REGEX = /^---\n((?:.*\n)*)sr-due: (.+)\nsr-interval: (\d+)\nsr-ease: (\d+)\n((?:.*\n)*)---/;
const YAML_FRONT_MATTER_REGEX = /^---\n((?:.*\n)*?)---/;
const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),(\d+),(\d+)-->/gm;
const OBSIDIAN_CHARTS_ID = "obsidian-charts";
const CROSS_HAIRS_ICON = `<path style=" stroke:none;fill-rule:nonzero;fill:currentColor;fill-opacity:1;" d="M 99.921875 47.941406 L 93.074219 47.941406 C 92.84375 42.03125 91.390625 36.238281 88.800781 30.921875 L 85.367188 32.582031 C 87.667969 37.355469 88.964844 42.550781 89.183594 47.84375 L 82.238281 47.84375 C 82.097656 44.617188 81.589844 41.417969 80.734375 38.304688 L 77.050781 39.335938 C 77.808594 42.089844 78.261719 44.917969 78.40625 47.769531 L 65.871094 47.769531 C 64.914062 40.507812 59.144531 34.832031 51.871094 33.996094 L 51.871094 21.386719 C 54.816406 21.507812 57.742188 21.960938 60.585938 22.738281 L 61.617188 19.058594 C 58.4375 18.191406 55.164062 17.691406 51.871094 17.570312 L 51.871094 10.550781 C 57.164062 10.769531 62.355469 12.066406 67.132812 14.363281 L 68.789062 10.929688 C 63.5 8.382812 57.738281 6.953125 51.871094 6.734375 L 51.871094 0.0390625 L 48.054688 0.0390625 L 48.054688 6.734375 C 42.179688 6.976562 36.417969 8.433594 31.132812 11.007812 L 32.792969 14.441406 C 37.566406 12.140625 42.761719 10.84375 48.054688 10.625 L 48.054688 17.570312 C 44.828125 17.714844 41.628906 18.21875 38.515625 19.078125 L 39.546875 22.757812 C 42.324219 21.988281 45.175781 21.53125 48.054688 21.386719 L 48.054688 34.03125 C 40.796875 34.949219 35.089844 40.679688 34.203125 47.941406 L 21.5 47.941406 C 21.632812 45.042969 22.089844 42.171875 22.855469 39.375 L 19.171875 38.34375 C 18.3125 41.457031 17.808594 44.65625 17.664062 47.882812 L 10.664062 47.882812 C 10.882812 42.589844 12.179688 37.394531 14.480469 32.621094 L 11.121094 30.921875 C 8.535156 36.238281 7.078125 42.03125 6.847656 47.941406 L 0 47.941406 L 0 51.753906 L 6.847656 51.753906 C 7.089844 57.636719 8.542969 63.402344 11.121094 68.695312 L 14.554688 67.035156 C 12.257812 62.261719 10.957031 57.066406 10.738281 51.773438 L 17.742188 51.773438 C 17.855469 55.042969 18.34375 58.289062 19.191406 61.445312 L 22.871094 60.414062 C 22.089844 57.5625 21.628906 54.632812 21.5 51.679688 L 34.203125 51.679688 C 35.058594 58.96875 40.773438 64.738281 48.054688 65.660156 L 48.054688 78.308594 C 45.105469 78.1875 42.183594 77.730469 39.335938 76.957031 L 38.304688 80.636719 C 41.488281 81.511719 44.757812 82.015625 48.054688 82.144531 L 48.054688 89.144531 C 42.761719 88.925781 37.566406 87.628906 32.792969 85.328125 L 31.132812 88.765625 C 36.425781 91.3125 42.183594 92.742188 48.054688 92.960938 L 48.054688 99.960938 L 51.871094 99.960938 L 51.871094 92.960938 C 57.75 92.71875 63.519531 91.265625 68.808594 88.6875 L 67.132812 85.253906 C 62.355469 87.550781 57.164062 88.851562 51.871094 89.070312 L 51.871094 82.125 C 55.09375 81.980469 58.292969 81.476562 61.40625 80.617188 L 60.378906 76.9375 C 57.574219 77.703125 54.695312 78.15625 51.792969 78.289062 L 51.792969 65.679688 C 59.121094 64.828125 64.910156 59.0625 65.796875 51.734375 L 78.367188 51.734375 C 78.25 54.734375 77.789062 57.710938 76.992188 60.605469 L 80.675781 61.636719 C 81.558594 58.40625 82.066406 55.082031 82.183594 51.734375 L 89.261719 51.734375 C 89.042969 57.03125 87.742188 62.222656 85.445312 66.996094 L 88.878906 68.65625 C 91.457031 63.367188 92.910156 57.597656 93.152344 51.71875 L 100 51.71875 Z M 62.019531 51.734375 C 61.183594 56.945312 57.085938 61.023438 51.871094 61.828125 L 51.871094 57.515625 L 48.054688 57.515625 L 48.054688 61.808594 C 42.910156 60.949219 38.886719 56.902344 38.058594 51.753906 L 42.332031 51.753906 L 42.332031 47.941406 L 38.058594 47.941406 C 38.886719 42.789062 42.910156 38.746094 48.054688 37.886719 L 48.054688 42.179688 L 51.871094 42.179688 L 51.871094 37.847656 C 57.078125 38.648438 61.179688 42.71875 62.019531 47.921875 L 57.707031 47.921875 L 57.707031 51.734375 Z M 62.019531 51.734375 "/>`;
const COLLAPSE_ICON = `<svg viewBox="0 0 100 100" width="8" height="8" class="right-triangle"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>`;

/**
 * Returns an array of the keys of an object with type `(keyof T)[]`
 * instead of `string[]`
 * Please see https://stackoverflow.com/a/59459000 for more details
 *
 * @param obj - An object
 * @returns An array of the keys of `obj` with type `(keyof T)[]`
 */
const getKeysPreserveType = Object.keys;
/**
 * Escapes the input string so that it can be converted to a regex
 * while making sure that symbols like `?` and `*` aren't interpreted
 * as regex specials.
 * Please see https://stackoverflow.com/a/6969486 for more details
 *
 * @param str - The string to be escaped
 * @returns The escaped string
 */
const escapeRegexString = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Returns the cyrb53 hash (hex string) of the input string
 * Please see https://stackoverflow.com/a/52171480 for more details
 *
 * @param str - The string to be hashed
 * @param seed - The seed for the cyrb53 function
 * @returns The cyrb53 hash (hex string) of `str` seeded using `seed`
 */
function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
/**
 * Removes legacy <key, value> pairs that no longer need to be saved
 *
 * @param currentData - Data to clean up
 * @param defaultData - Template to lookup currently used keys from
 * @returns the cleaned up record
 */
function removeLegacyKeys(currentData, defaultData) {
    for (let key of Object.keys(currentData)) {
        if (!defaultData.hasOwnProperty(key)) {
            delete currentData[key];
        }
    }
    return currentData;
}

var FlashcardModalMode;
(function (FlashcardModalMode) {
    FlashcardModalMode[FlashcardModalMode["DecksList"] = 0] = "DecksList";
    FlashcardModalMode[FlashcardModalMode["Front"] = 1] = "Front";
    FlashcardModalMode[FlashcardModalMode["Back"] = 2] = "Back";
    FlashcardModalMode[FlashcardModalMode["Closed"] = 3] = "Closed";
})(FlashcardModalMode || (FlashcardModalMode = {}));
class FlashcardModal extends obsidian.Modal {
    plugin;
    answerBtn;
    flashcardView;
    hardBtn;
    goodBtn;
    easyBtn;
    responseDiv;
    fileLinkView;
    resetLinkView;
    contextView;
    currentCard;
    currentCardIdx;
    currentDeck;
    checkDeck;
    mode;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.titleEl.setText(t("Decks"));
        if (obsidian.Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
        this.modalEl.style.height = this.plugin.data.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.width = this.plugin.data.settings.flashcardWidthPercentage + "%";
        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");
        document.body.onkeypress = (e) => {
            if (this.mode !== FlashcardModalMode.DecksList) {
                if (this.mode !== FlashcardModalMode.Closed && e.code === "KeyS") {
                    this.currentDeck.deleteFlashcardAtIndex(this.currentCardIdx, this.currentCard.isDue);
                    this.burySiblingCards(false);
                    this.currentDeck.nextCard(this);
                }
                else if (this.mode === FlashcardModalMode.Front &&
                    (e.code === "Space" || e.code === "Enter")) {
                    this.showAnswer();
                }
                else if (this.mode === FlashcardModalMode.Back) {
                    if (e.code === "Numpad1" || e.code === "Digit1") {
                        this.processReview(ReviewResponse.Hard);
                    }
                    else if (e.code === "Numpad2" || e.code === "Digit2" || e.code === "Space") {
                        this.processReview(ReviewResponse.Good);
                    }
                    else if (e.code === "Numpad3" || e.code === "Digit3") {
                        this.processReview(ReviewResponse.Easy);
                    }
                    else if (e.code === "Numpad0" || e.code === "Digit0") {
                        this.processReview(ReviewResponse.Reset);
                    }
                }
            }
        };
    }
    onOpen() {
        this.decksList();
    }
    onClose() {
        this.mode = FlashcardModalMode.Closed;
    }
    decksList() {
        this.mode = FlashcardModalMode.DecksList;
        this.titleEl.setText(t("Decks"));
        this.titleEl.innerHTML +=
            '<p style="margin:0px;line-height:12px;">' +
                '<span style="background-color:#4caf50;color:#ffffff;" aria-label="' +
                t("Due cards") +
                '" class="tag-pane-tag-count tree-item-flair">' +
                this.plugin.deckTree.dueFlashcardsCount +
                "</span>" +
                '<span style="background-color:#2196f3;" aria-label="' +
                t("New cards") +
                '" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
                this.plugin.deckTree.newFlashcardsCount +
                "</span>" +
                '<span style="background-color:#ff7043;" aria-label="' +
                t("Total cards") +
                '" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
                this.plugin.deckTree.totalFlashcards +
                "</span>" +
                "</p>";
        this.contentEl.innerHTML = "";
        this.contentEl.setAttribute("id", "sr-flashcard-view");
        for (let deck of this.plugin.deckTree.subdecks) {
            deck.render(this.contentEl, this);
        }
    }
    setupCardsView() {
        this.contentEl.innerHTML = "";
        this.fileLinkView = this.contentEl.createDiv("sr-link");
        this.fileLinkView.setText(t("Open file"));
        if (this.plugin.data.settings.showFileNameInFileLink) {
            this.fileLinkView.setAttribute("aria-label", t("Open file"));
        }
        this.fileLinkView.addEventListener("click", async (_) => {
            this.close();
            await this.plugin.app.workspace.activeLeaf.openFile(this.currentCard.note);
            let activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            activeView.editor.setCursor({
                line: this.currentCard.lineNo,
                ch: 0,
            });
        });
        this.resetLinkView = this.contentEl.createDiv("sr-link");
        this.resetLinkView.setText(t("Reset card's progress"));
        this.resetLinkView.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Reset);
        });
        this.resetLinkView.style.float = "right";
        if (this.plugin.data.settings.showContextInCards) {
            this.contextView = this.contentEl.createDiv();
            this.contextView.setAttribute("id", "sr-context");
        }
        this.flashcardView = this.contentEl.createDiv("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");
        this.responseDiv = this.contentEl.createDiv("sr-response");
        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText(t("Hard"));
        this.hardBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);
        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText(t("Good"));
        this.goodBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);
        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText(t("Easy"));
        this.easyBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";
        this.answerBtn = this.contentEl.createDiv();
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText(t("Show Answer"));
        this.answerBtn.addEventListener("click", (_) => {
            this.showAnswer();
        });
    }
    showAnswer() {
        this.mode = FlashcardModalMode.Back;
        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";
        if (this.currentCard.isDue) {
            this.resetLinkView.style.display = "inline-block";
        }
        if (this.currentCard.cardType !== CardType.Cloze) {
            let hr = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        }
        else {
            this.flashcardView.innerHTML = "";
        }
        this.renderMarkdownWrapper(this.currentCard.back, this.flashcardView);
    }
    async processReview(response) {
        let interval, ease, due;
        this.currentDeck.deleteFlashcardAtIndex(this.currentCardIdx, this.currentCard.isDue);
        if (response !== ReviewResponse.Reset) {
            // scheduled card
            if (this.currentCard.isDue) {
                let schedObj = schedule(response, this.currentCard.interval, this.currentCard.ease, this.currentCard.delayBeforeReview, this.plugin.data.settings, this.plugin.dueDatesFlashcards);
                interval = schedObj.interval;
                ease = schedObj.ease;
            }
            else {
                let schedObj = schedule(response, 1, this.plugin.data.settings.baseEase, 0, this.plugin.data.settings, this.plugin.dueDatesFlashcards);
                interval = schedObj.interval;
                ease = schedObj.ease;
            }
            due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        }
        else {
            this.currentCard.interval = 1.0;
            this.currentCard.ease = this.plugin.data.settings.baseEase;
            if (this.currentCard.isDue) {
                this.currentDeck.dueFlashcards.push(this.currentCard);
            }
            else {
                this.currentDeck.newFlashcards.push(this.currentCard);
            }
            due = window.moment(Date.now());
            new obsidian.Notice(t("Card's progress has been reset."));
            this.currentDeck.nextCard(this);
            return;
        }
        let dueString = due.format("YYYY-MM-DD");
        let fileText = await this.app.vault.read(this.currentCard.note);
        let replacementRegex = new RegExp(escapeRegexString(this.currentCard.cardText), "gm");
        let sep = this.plugin.data.settings.cardCommentOnSameLine ? " " : "\n";
        // Override separator if last block is a codeblock
        if (this.currentCard.cardText.endsWith("```") && sep !== "\n") {
            sep = "\n";
        }
        // check if we're adding scheduling information to the flashcard
        // for the first time
        if (this.currentCard.cardText.lastIndexOf("<!--SR:") === -1) {
            this.currentCard.cardText =
                this.currentCard.cardText + sep + `<!--SR:!${dueString},${interval},${ease}-->`;
        }
        else {
            let scheduling = [
                ...this.currentCard.cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
            ];
            if (scheduling.length === 0) {
                scheduling = [...this.currentCard.cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
            }
            let currCardSched = ["0", dueString, interval.toString(), ease.toString()];
            if (this.currentCard.isDue) {
                scheduling[this.currentCard.siblingIdx] = currCardSched;
            }
            else {
                scheduling.push(currCardSched);
            }
            this.currentCard.cardText = this.currentCard.cardText.replace(/<!--SR:.+-->/gm, "");
            this.currentCard.cardText += "<!--SR:";
            for (let i = 0; i < scheduling.length; i++) {
                this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
            }
            this.currentCard.cardText += "-->";
        }
        fileText = fileText.replace(replacementRegex, (_) => this.currentCard.cardText);
        for (let sibling of this.currentCard.siblings) {
            sibling.cardText = this.currentCard.cardText;
        }
        if (this.plugin.data.settings.burySiblingCards) {
            this.burySiblingCards(true);
        }
        await this.app.vault.modify(this.currentCard.note, fileText);
        this.currentDeck.nextCard(this);
    }
    async burySiblingCards(tillNextDay) {
        if (tillNextDay) {
            this.plugin.data.buryList.push(cyrb53(this.currentCard.cardText));
            await this.plugin.savePluginData();
        }
        for (let sibling of this.currentCard.siblings) {
            let dueIdx = this.currentDeck.dueFlashcards.indexOf(sibling);
            let newIdx = this.currentDeck.newFlashcards.indexOf(sibling);
            if (dueIdx !== -1)
                this.currentDeck.deleteFlashcardAtIndex(dueIdx, this.currentDeck.dueFlashcards[dueIdx].isDue);
            else if (newIdx !== -1)
                this.currentDeck.deleteFlashcardAtIndex(newIdx, this.currentDeck.newFlashcards[newIdx].isDue);
        }
    }
    // slightly modified version of the renderMarkdown function in
    // https://github.com/mgmeyers/obsidian-kanban/blob/main/src/KanbanView.tsx
    async renderMarkdownWrapper(markdownString, containerEl) {
        obsidian.MarkdownRenderer.renderMarkdown(markdownString, containerEl, this.currentCard.note.path, this.plugin);
        containerEl.findAll(".internal-embed").forEach((el) => {
            let src = el.getAttribute("src");
            let target = typeof src === "string" &&
                this.plugin.app.metadataCache.getFirstLinkpathDest(src, this.currentCard.note.path);
            if (target instanceof obsidian.TFile && target.extension !== "md") {
                el.innerText = "";
                el.createEl("img", {
                    attr: {
                        src: this.plugin.app.vault.getResourcePath(target),
                    },
                }, (img) => {
                    if (el.hasAttribute("width"))
                        img.setAttribute("width", el.getAttribute("width"));
                    else
                        img.setAttribute("width", "100%");
                    if (el.hasAttribute("alt"))
                        img.setAttribute("alt", el.getAttribute("alt"));
                });
                el.addClasses(["image-embed", "is-loaded"]);
            }
            // file does not exist
            // display dead link
            if (target === null) {
                el.innerText = src;
            }
        });
    }
}
class Deck {
    deckName;
    newFlashcards;
    newFlashcardsCount = 0; // counts those in subdecks too
    dueFlashcards;
    dueFlashcardsCount = 0; // counts those in subdecks too
    totalFlashcards = 0; // counts those in subdecks too
    subdecks;
    parent;
    constructor(deckName, parent) {
        this.deckName = deckName;
        this.newFlashcards = [];
        this.newFlashcardsCount = 0;
        this.dueFlashcards = [];
        this.dueFlashcardsCount = 0;
        this.totalFlashcards = 0;
        this.subdecks = [];
        this.parent = parent;
    }
    createDeck(deckPath) {
        if (deckPath.length === 0) {
            return;
        }
        let deckName = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.createDeck(deckPath);
                return;
            }
        }
        let deck = new Deck(deckName, this);
        this.subdecks.push(deck);
        deck.createDeck(deckPath);
    }
    insertFlashcard(deckPath, cardObj) {
        if (cardObj.isDue) {
            this.dueFlashcardsCount++;
        }
        else {
            this.newFlashcardsCount++;
        }
        this.totalFlashcards++;
        if (deckPath.length === 0) {
            if (cardObj.isDue) {
                this.dueFlashcards.push(cardObj);
            }
            else {
                this.newFlashcards.push(cardObj);
            }
            return;
        }
        let deckName = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.insertFlashcard(deckPath, cardObj);
                return;
            }
        }
    }
    // count flashcards that have either been buried
    // or aren't due yet
    countFlashcard(deckPath, n = 1) {
        this.totalFlashcards += n;
        let deckName = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.countFlashcard(deckPath, n);
                return;
            }
        }
    }
    deleteFlashcardAtIndex(index, cardIsDue) {
        if (cardIsDue) {
            this.dueFlashcards.splice(index, 1);
        }
        else {
            this.newFlashcards.splice(index, 1);
        }
        let deck = this;
        while (deck !== null) {
            if (cardIsDue) {
                deck.dueFlashcardsCount--;
            }
            else {
                deck.newFlashcardsCount--;
            }
            deck = deck.parent;
        }
    }
    sortSubdecksList() {
        this.subdecks.sort((a, b) => {
            if (a.deckName < b.deckName) {
                return -1;
            }
            else if (a.deckName > b.deckName) {
                return 1;
            }
            return 0;
        });
        for (let deck of this.subdecks) {
            deck.sortSubdecksList();
        }
    }
    render(containerEl, modal) {
        let deckView = containerEl.createDiv("tree-item");
        let deckViewSelf = deckView.createDiv("tree-item-self tag-pane-tag is-clickable");
        let collapsed = true;
        let collapseIconEl = null;
        if (this.subdecks.length > 0) {
            collapseIconEl = deckViewSelf.createDiv("tree-item-icon collapse-icon");
            collapseIconEl.innerHTML = COLLAPSE_ICON;
            collapseIconEl.childNodes[0].style.transform = "rotate(-90deg)";
        }
        let deckViewInner = deckViewSelf.createDiv("tree-item-inner");
        deckViewInner.addEventListener("click", (_) => {
            modal.currentDeck = this;
            modal.checkDeck = this.parent;
            modal.setupCardsView();
            this.nextCard(modal);
        });
        let deckViewInnerText = deckViewInner.createDiv("tag-pane-tag-text");
        deckViewInnerText.innerHTML += `<span class="tag-pane-tag-self">${this.deckName}</span>`;
        let deckViewOuter = deckViewSelf.createDiv("tree-item-flair-outer");
        deckViewOuter.innerHTML +=
            '<span style="background-color:#4caf50;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
                this.dueFlashcardsCount +
                "</span>" +
                '<span style="background-color:#2196f3;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
                this.newFlashcardsCount +
                "</span>" +
                '<span style="background-color:#ff7043;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
                this.totalFlashcards +
                "</span>";
        let deckViewChildren = deckView.createDiv("tree-item-children");
        deckViewChildren.style.display = "none";
        if (this.subdecks.length > 0) {
            collapseIconEl.addEventListener("click", (_) => {
                if (collapsed) {
                    collapseIconEl.childNodes[0].style.transform = "";
                    deckViewChildren.style.display = "block";
                }
                else {
                    collapseIconEl.childNodes[0].style.transform =
                        "rotate(-90deg)";
                    deckViewChildren.style.display = "none";
                }
                collapsed = !collapsed;
            });
        }
        for (let deck of this.subdecks) {
            deck.render(deckViewChildren, modal);
        }
    }
    nextCard(modal) {
        if (this.newFlashcards.length + this.dueFlashcards.length === 0) {
            if (this.dueFlashcardsCount + this.newFlashcardsCount > 0) {
                for (let deck of this.subdecks) {
                    if (deck.dueFlashcardsCount + deck.newFlashcardsCount > 0) {
                        modal.currentDeck = deck;
                        deck.nextCard(modal);
                        return;
                    }
                }
            }
            if (this.parent == modal.checkDeck) {
                modal.decksList();
            }
            else {
                this.parent.nextCard(modal);
            }
            return;
        }
        modal.responseDiv.style.display = "none";
        modal.resetLinkView.style.display = "none";
        modal.titleEl.setText(`${this.deckName} - ${this.dueFlashcardsCount + this.newFlashcardsCount}`);
        modal.answerBtn.style.display = "initial";
        modal.flashcardView.innerHTML = "";
        modal.mode = FlashcardModalMode.Front;
        if (this.dueFlashcards.length > 0) {
            if (modal.plugin.data.settings.randomizeCardOrder) {
                modal.currentCardIdx = Math.floor(Math.random() * this.dueFlashcards.length);
            }
            else {
                modal.currentCardIdx = 0;
            }
            modal.currentCard = this.dueFlashcards[modal.currentCardIdx];
            modal.renderMarkdownWrapper(modal.currentCard.front, modal.flashcardView);
            let hardInterval = schedule(ReviewResponse.Hard, modal.currentCard.interval, modal.currentCard.ease, modal.currentCard.delayBeforeReview, modal.plugin.data.settings).interval;
            let goodInterval = schedule(ReviewResponse.Good, modal.currentCard.interval, modal.currentCard.ease, modal.currentCard.delayBeforeReview, modal.plugin.data.settings).interval;
            let easyInterval = schedule(ReviewResponse.Easy, modal.currentCard.interval, modal.currentCard.ease, modal.currentCard.delayBeforeReview, modal.plugin.data.settings).interval;
            if (obsidian.Platform.isMobile) {
                modal.hardBtn.setText(textInterval(hardInterval, true));
                modal.goodBtn.setText(textInterval(goodInterval, true));
                modal.easyBtn.setText(textInterval(easyInterval, true));
            }
            else {
                modal.hardBtn.setText(t("Hard") + " - " + textInterval(hardInterval, false));
                modal.goodBtn.setText(t("Good") + " - " + textInterval(goodInterval, false));
                modal.easyBtn.setText(t("Easy") + " - " + textInterval(easyInterval, false));
            }
        }
        else if (this.newFlashcards.length > 0) {
            if (modal.plugin.data.settings.randomizeCardOrder) {
                modal.currentCardIdx = Math.floor(Math.random() * this.newFlashcards.length);
                // look for first unscheduled sibling
                let card = this.newFlashcards[modal.currentCardIdx];
                for (let siblingCard of card.siblings) {
                    if (!siblingCard.isDue) {
                        modal.currentCardIdx += siblingCard.siblingIdx - card.siblingIdx;
                        break;
                    }
                }
            }
            else {
                modal.currentCardIdx = 0;
            }
            modal.currentCard = this.newFlashcards[modal.currentCardIdx];
            modal.renderMarkdownWrapper(modal.currentCard.front, modal.flashcardView);
            if (obsidian.Platform.isMobile) {
                modal.hardBtn.setText("1.0d");
                modal.goodBtn.setText("2.5d");
                modal.easyBtn.setText("3.5d");
            }
            else {
                modal.hardBtn.setText(t("Hard") + " - 1.0 " + t("day"));
                modal.goodBtn.setText(t("Good") + " - 2.5 " + t("days"));
                modal.easyBtn.setText(t("Easy") + " - 3.5 " + t("days"));
            }
        }
        if (modal.plugin.data.settings.showContextInCards)
            modal.contextView.setText(modal.currentCard.context);
        if (modal.plugin.data.settings.showFileNameInFileLink)
            modal.fileLinkView.setText(modal.currentCard.note.basename);
    }
}

class StatsModal extends obsidian.Modal {
    plugin;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.titleEl.setText(t("Statistics"));
        this.modalEl.style.height = "100%";
        this.modalEl.style.width = "100%";
        if (obsidian.Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
    }
    onOpen() {
        let { contentEl } = this;
        // @ts-ignore: Property 'plugins' does not exist on type 'App'
        if (!this.app.plugins.enabledPlugins.has(OBSIDIAN_CHARTS_ID)) {
            contentEl.innerHTML +=
                "<div style='text-align:center'>" +
                    "<span>" +
                    t("Note that this requires the Obsidian Charts plugin to work") +
                    "</span>" +
                    "</div>";
            return;
        }
        let text = "";
        // Add forecast
        let maxN = Math.max(...getKeysPreserveType(this.plugin.dueDatesFlashcards));
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            if (!this.plugin.dueDatesFlashcards.hasOwnProperty(dueOffset)) {
                this.plugin.dueDatesFlashcards[dueOffset] = 0;
            }
        }
        let dueDatesFlashcardsCopy = { 0: 0 };
        for (let [dueOffset, dueCount] of Object.entries(this.plugin.dueDatesFlashcards)) {
            if (dueOffset <= 0) {
                dueDatesFlashcardsCopy[0] += dueCount;
            }
            else {
                dueDatesFlashcardsCopy[dueOffset] = dueCount;
            }
        }
        let cardStats = this.plugin.cardStats;
        let scheduledCount = cardStats.youngCount + cardStats.matureCount;
        maxN = Math.max(maxN, 1);
        // let the horrors begin LOL
        text +=
            "\n<div style='text-align:center'>" +
                "<h2 style='text-align:center'>" +
                t("Forecast") +
                "</h2>" +
                "<h4 style='text-align:center'>" +
                t("The number of cards due in the future") +
                "</h4>" +
                "</div>\n\n" +
                "```chart\n" +
                "\ttype: bar\n" +
                `\tlabels: [${Object.keys(dueDatesFlashcardsCopy)}]\n` +
                "\tseries:\n" +
                "\t\t- title: " +
                t("Scheduled") +
                `\n\t\t  data: [${Object.values(dueDatesFlashcardsCopy)}]\n` +
                "\txTitle: " +
                t("Days") +
                "\n\tyTitle: " +
                t("Number of cards") +
                "\n\tlegend: false\n" +
                "\tstacked: true\n" +
                "````\n" +
                "\n<div style='text-align:center'>" +
                `Average: ${(scheduledCount / maxN).toFixed(1)} reviews/day` +
                "</div>";
        maxN = Math.max(...getKeysPreserveType(cardStats.intervals));
        for (let interval = 0; interval <= maxN; interval++) {
            if (!cardStats.intervals.hasOwnProperty(interval)) {
                cardStats.intervals[interval] = 0;
            }
        }
        // Add intervals
        let average_interval = textInterval(Math.round((Object.entries(cardStats.intervals)
            .map(([interval, count]) => interval * count)
            .reduce((a, b) => a + b) /
            scheduledCount) *
            10) / 10, false), longest_interval = textInterval(Math.max(...getKeysPreserveType(cardStats.intervals)), false);
        text +=
            "\n<div style='text-align:center'>" +
                "<h2 style='text-align:center'>" +
                t("Intervals") +
                "</h2>" +
                "<h4 style='text-align:center'>" +
                t("Delays until reviews are shown again") +
                "</h4>" +
                "</div>\n\n" +
                "```chart\n" +
                "\ttype: bar\n" +
                `\tlabels: [${Object.keys(cardStats.intervals)}]\n` +
                "\tseries:\n" +
                "\t\t- title: " +
                t("Count") +
                `\n\t\t  data: [${Object.values(cardStats.intervals)}]\n` +
                "\txTitle: " +
                t("Days") +
                "\n\tyTitle: " +
                t("Number of cards") +
                "\n\tlegend: false\n" +
                "\tstacked: true\n" +
                "````\n" +
                "\n<div style='text-align:center'>" +
                `Average interval: ${average_interval}, ` +
                `Longest interval: ${longest_interval}` +
                "</div>";
        // Add eases
        let average_ease = Math.round(Object.entries(cardStats.eases)
            .map(([ease, count]) => ease * count)
            .reduce((a, b) => a + b) / scheduledCount);
        text +=
            "\n<div style='text-align:center'>" +
                "<h2 style='text-align:center'>" +
                t("Eases") +
                "</h2>" +
                "</div>\n\n" +
                "```chart\n" +
                "\ttype: bar\n" +
                `\tlabels: [${Object.keys(cardStats.eases)}]\n` +
                "\tseries:\n" +
                "\t\t- title: " +
                t("Count") +
                `\n\t\t  data: [${Object.values(cardStats.eases)}]\n` +
                "\txTitle: " +
                t("Days") +
                "\n\tyTitle: " +
                t("Number of cards") +
                "\n\tlegend: false\n" +
                "\tstacked: true\n" +
                "````\n" +
                "\n<div style='text-align:center'>" +
                `Average ease: ${average_ease}` +
                "</div>";
        // Add card types
        let totalCards = this.plugin.deckTree.totalFlashcards;
        text +=
            "\n<div style='text-align:center'>" +
                "<h2 style='text-align:center'>" +
                t("Card Types") +
                "</h2>" +
                "</div>\n\n" +
                "```chart\n" +
                "\ttype: pie\n" +
                `\tlabels: ['New - ${Math.round((cardStats.newCount / totalCards) * 100)}%', 'Young - ${Math.round((cardStats.youngCount / totalCards) * 100)}%', 'Mature - ${Math.round((cardStats.matureCount / totalCards) * 100)}%']\n` +
                `\tseries:\n` +
                `\t\t- data: [${cardStats.newCount}, ${cardStats.youngCount}, ${cardStats.matureCount}]\n` +
                "\twidth: 40%\n" +
                "\tlabelColors: true\n" +
                "```\n" +
                "\n<div style='text-align:center'>" +
                `Total cards: ${totalCards}` +
                "</div>";
        obsidian.MarkdownRenderer.renderMarkdown(text, contentEl, "", this.plugin);
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";
class ReviewQueueListView extends obsidian.ItemView {
    plugin;
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.registerEvent(this.app.workspace.on("file-open", (_) => this.redraw()));
        this.registerEvent(this.app.vault.on("rename", (_) => this.redraw()));
    }
    getViewType() {
        return REVIEW_QUEUE_VIEW_TYPE;
    }
    getDisplayText() {
        return t("Notes Review Queue");
    }
    getIcon() {
        return "crosshairs";
    }
    onHeaderMenu(menu) {
        menu.addItem((item) => {
            item.setTitle(t("Close"))
                .setIcon("cross")
                .onClick(() => {
                this.app.workspace.detachLeavesOfType(REVIEW_QUEUE_VIEW_TYPE);
            });
        });
    }
    redraw() {
        let openFile = this.app.workspace.getActiveFile();
        let rootEl = createDiv("nav-folder mod-root"), childrenEl = rootEl.createDiv("nav-folder-children");
        for (let deckKey in this.plugin.reviewDecks) {
            let deck = this.plugin.reviewDecks[deckKey];
            let deckFolderEl = this.createRightPaneFolder(childrenEl, deckKey, false, deck).getElementsByClassName("nav-folder-children")[0];
            if (deck.newNotes.length > 0) {
                let newNotesFolderEl = this.createRightPaneFolder(deckFolderEl, t("New"), !deck.activeFolders.has(t("New")), deck);
                for (let newFile of deck.newNotes) {
                    this.createRightPaneFile(newNotesFolderEl, newFile, openFile && newFile.path === openFile.path, !deck.activeFolders.has(t("New")));
                }
            }
            if (deck.scheduledNotes.length > 0) {
                let now = Date.now();
                let currUnix = -1;
                let schedFolderEl = null, folderTitle = "";
                let maxDaysToRender = this.plugin.data.settings.maxNDaysNotesReviewQueue;
                for (let sNote of deck.scheduledNotes) {
                    if (sNote.dueUnix != currUnix) {
                        let nDays = Math.ceil((sNote.dueUnix - now) / (24 * 3600 * 1000));
                        if (nDays > maxDaysToRender) {
                            break;
                        }
                        folderTitle =
                            nDays == -1
                                ? t("Yesterday")
                                : nDays == 0
                                    ? t("Today")
                                    : nDays == 1
                                        ? t("Tomorrow")
                                        : new Date(sNote.dueUnix).toDateString();
                        schedFolderEl = this.createRightPaneFolder(deckFolderEl, folderTitle, !deck.activeFolders.has(folderTitle), deck);
                        currUnix = sNote.dueUnix;
                    }
                    this.createRightPaneFile(schedFolderEl, sNote.note, openFile && sNote.note.path === openFile.path, !deck.activeFolders.has(folderTitle));
                }
            }
        }
        let contentEl = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }
    createRightPaneFolder(parentEl, folderTitle, collapsed, deck) {
        let folderEl = parentEl.createDiv("nav-folder"), folderTitleEl = folderEl.createDiv("nav-folder-title"), childrenEl = folderEl.createDiv("nav-folder-children"), collapseIconEl = folderTitleEl.createDiv("nav-folder-collapse-indicator collapse-icon");
        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed) {
            collapseIconEl.childNodes[0].style.transform = "rotate(-90deg)";
        }
        folderTitleEl.createDiv("nav-folder-title-content").setText(folderTitle);
        folderTitleEl.onClickEvent((_) => {
            for (let child of childrenEl.childNodes) {
                if (child.style.display === "block" || child.style.display === "") {
                    child.style.display = "none";
                    collapseIconEl.childNodes[0].style.transform =
                        "rotate(-90deg)";
                    deck.activeFolders.delete(folderTitle);
                }
                else {
                    child.style.display = "block";
                    collapseIconEl.childNodes[0].style.transform = "";
                    deck.activeFolders.add(folderTitle);
                }
            }
        });
        return folderEl;
    }
    createRightPaneFile(folderEl, file, fileElActive, hidden) {
        let navFileEl = folderEl
            .getElementsByClassName("nav-folder-children")[0]
            .createDiv("nav-file");
        if (hidden) {
            navFileEl.style.display = "none";
        }
        let navFileTitle = navFileEl.createDiv("nav-file-title");
        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }
        navFileTitle.createDiv("nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener("click", (event) => {
            event.preventDefault();
            this.app.workspace.activeLeaf.openFile(file);
            return false;
        }, false);
        navFileTitle.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            let fileMenu = new obsidian.Menu(this.app);
            this.app.workspace.trigger("file-menu", fileMenu, file, "my-context-menu", null);
            fileMenu.showAtPosition({
                x: event.pageX,
                y: event.pageY,
            });
            return false;
        }, false);
    }
}

class ReviewDeck {
    deckName;
    newNotes = [];
    scheduledNotes = [];
    activeFolders;
    dueNotesCount = 0;
    constructor(name) {
        this.deckName = name;
        this.activeFolders = new Set([t("Today")]);
    }
    sortNotes(pageranks) {
        // sort new notes by importance
        this.newNotes = this.newNotes.sort((a, b) => (pageranks[b.path] || 0) - (pageranks[a.path] || 0));
        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort((a, b) => {
            let result = a.dueUnix - b.dueUnix;
            if (result != 0) {
                return result;
            }
            return (pageranks[b.note.path] || 0) - (pageranks[a.note.path] || 0);
        });
    }
}
class ReviewDeckSelectionModal extends obsidian.FuzzySuggestModal {
    deckKeys = [];
    submitCallback;
    constructor(app, deckKeys) {
        super(app);
        this.deckKeys = deckKeys;
    }
    getItems() {
        return this.deckKeys;
    }
    getItemText(item) {
        return item;
    }
    onChooseItem(deckKey, _) {
        this.close();
        this.submitCallback(deckKey);
    }
}

/**
 * Returns flashcards found in `text`
 *
 * @param text - The text to extract flashcards from
 * @param singlelineCardSeparator - Separator for inline basic cards
 * @param singlelineReversedCardSeparator - Separator for inline reversed cards
 * @param multilineCardSeparator - Separator for multiline basic cards
 * @param multilineReversedCardSeparator - Separator for multiline basic card
 * @returns An array of [CardType, card text, line number] tuples
 */
function parse(text, singlelineCardSeparator, singlelineReversedCardSeparator, multilineCardSeparator, multilineReversedCardSeparator) {
    let cardText = "";
    let cards = [];
    let cardType = null;
    let lineNo = 0;
    let lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) {
            if (cardType) {
                cards.push([cardType, cardText, lineNo]);
                cardType = null;
            }
            cardText = "";
            continue;
        }
        else if (lines[i].startsWith("<!--") && !lines[i].startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !lines[i + 1].includes("-->"))
                i++;
            i++;
            continue;
        }
        if (cardText.length > 0) {
            cardText += "\n";
        }
        cardText += lines[i];
        if (lines[i].includes(singlelineReversedCardSeparator) ||
            lines[i].includes(singlelineCardSeparator)) {
            cardType = lines[i].includes(singlelineReversedCardSeparator)
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            cardText = lines[i];
            lineNo = i;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            cards.push([cardType, cardText, lineNo]);
            cardType = null;
            cardText = "";
        }
        else if (cardType === null && /==.*?==/gm.test(lines[i])) {
            cardType = CardType.Cloze;
            lineNo = i;
        }
        else if (lines[i] === multilineCardSeparator) {
            cardType = CardType.MultiLineBasic;
            lineNo = i;
        }
        else if (lines[i] === multilineReversedCardSeparator) {
            cardType = CardType.MultiLineReversed;
            lineNo = i;
        }
        else if (lines[i].startsWith("```")) {
            while (i + 1 < lines.length && !lines[i + 1].startsWith("```")) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + "```";
            i++;
        }
    }
    if (cardType && cardText) {
        cards.push([cardType, cardText, lineNo]);
    }
    return cards;
}

const DEFAULT_DATA = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
};
class SRPlugin extends obsidian.Plugin {
    statusBar;
    reviewQueueView;
    data;
    logger;
    reviewDecks = {};
    lastSelectedReviewDeck;
    newNotes = [];
    scheduledNotes = [];
    easeByPath = {};
    incomingLinks = {};
    pageranks = {};
    dueNotesCount = 0;
    dueDatesNotes = {}; // Record<# of days in future, due count>
    deckTree = new Deck("root", null);
    dueDatesFlashcards = {}; // Record<# of days in future, due count>
    cardStats;
    // prevent calling these functions if another instance is already running
    notesSyncLock = false;
    flashcardsSyncLock = false;
    async onload() {
        await this.loadPluginData();
        this.logger = createLogger(console, this.data.settings.logLevel);
        obsidian.addIcon("crosshairs", CROSS_HAIRS_ICON);
        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", t("Open a note for review"));
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_) => {
            if (!this.notesSyncLock) {
                this.sync();
                this.reviewNextNoteModal();
            }
        });
        this.addRibbonIcon("crosshairs", t("Review flashcards"), async () => {
            if (!this.flashcardsSyncLock) {
                await this.flashcards_sync();
                new FlashcardModal(this.app, this).open();
            }
        });
        this.registerView(REVIEW_QUEUE_VIEW_TYPE, (leaf) => (this.reviewQueueView = new ReviewQueueListView(leaf, this)));
        if (!this.data.settings.disableFileMenuReviewOptions) {
            this.registerEvent(this.app.workspace.on("file-menu", (menu, fileish) => {
                if (fileish instanceof obsidian.TFile && fileish.extension === "md") {
                    menu.addItem((item) => {
                        item.setTitle(t("Review: Easy"))
                            .setIcon("crosshairs")
                            .onClick((_) => {
                            this.saveReviewResponse(fileish, ReviewResponse.Easy);
                        });
                    });
                    menu.addItem((item) => {
                        item.setTitle(t("Review: Good"))
                            .setIcon("crosshairs")
                            .onClick((_) => {
                            this.saveReviewResponse(fileish, ReviewResponse.Good);
                        });
                    });
                    menu.addItem((item) => {
                        item.setTitle(t("Review: Hard"))
                            .setIcon("crosshairs")
                            .onClick((_) => {
                            this.saveReviewResponse(fileish, ReviewResponse.Hard);
                        });
                    });
                }
            }));
        }
        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("Open a note for review"),
            callback: () => {
                if (!this.notesSyncLock) {
                    this.sync();
                    this.reviewNextNoteModal();
                }
            },
        });
        this.addCommand({
            id: "srs-note-review-easy",
            name: t("Review note as easy"),
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
            },
        });
        this.addCommand({
            id: "srs-note-review-good",
            name: t("Review note as good"),
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
            },
        });
        this.addCommand({
            id: "srs-note-review-hard",
            name: t("Review note as hard"),
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
            },
        });
        this.addCommand({
            id: "srs-review-flashcards",
            name: t("Review flashcards"),
            callback: async () => {
                if (!this.flashcardsSyncLock) {
                    await this.flashcards_sync();
                    new FlashcardModal(this.app, this).open();
                }
            },
        });
        this.addCommand({
            id: "srs-view-stats",
            name: t("View statistics"),
            callback: async () => {
                if (!this.flashcardsSyncLock) {
                    await this.flashcards_sync();
                    new StatsModal(this.app, this).open();
                }
            },
        });
        this.addSettingTab(new SRSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(() => {
            this.initView();
            setTimeout(() => this.sync(), 2000);
            setTimeout(() => this.flashcards_sync(), 2000);
        });
    }
    onunload() {
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
    }
    async sync() {
        if (this.notesSyncLock) {
            return;
        }
        this.notesSyncLock = true;
        let notes = this.app.vault.getMarkdownFiles();
        lib.reset();
        this.easeByPath = {};
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;
        this.dueDatesNotes = {};
        this.reviewDecks = {};
        let now = Date.now();
        for (let note of notes) {
            if (this.incomingLinks[note.path] === undefined) {
                this.incomingLinks[note.path] = [];
            }
            let links = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let targetPath in links) {
                if (this.incomingLinks[targetPath] === undefined)
                    this.incomingLinks[targetPath] = [];
                // markdown files only
                if (targetPath.split(".").pop().toLowerCase() === "md") {
                    this.incomingLinks[targetPath].push({
                        sourcePath: note.path,
                        linkCount: links[targetPath],
                    });
                    lib.link(note.path, targetPath, links[targetPath]);
                }
            }
            if (this.data.settings.noteFoldersToIgnore.some((folder) => note.path.startsWith(folder))) {
                continue;
            }
            let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
            let frontmatter = fileCachedData.frontmatter || {};
            let tags = obsidian.getAllTags(fileCachedData) || [];
            let shouldIgnore = true;
            for (let tag of tags) {
                if (this.data.settings.tagsToReview.some((tagToReview) => tag === tagToReview || tag.startsWith(tagToReview + "/"))) {
                    if (!this.reviewDecks.hasOwnProperty(tag)) {
                        this.reviewDecks[tag] = new ReviewDeck(tag);
                    }
                    shouldIgnore = false;
                    break;
                }
            }
            if (shouldIgnore) {
                continue;
            }
            // file has no scheduling information
            if (!(frontmatter.hasOwnProperty("sr-due") &&
                frontmatter.hasOwnProperty("sr-interval") &&
                frontmatter.hasOwnProperty("sr-ease"))) {
                for (let tag of tags) {
                    if (this.reviewDecks.hasOwnProperty(tag)) {
                        this.reviewDecks[tag].newNotes.push(note);
                    }
                }
                continue;
            }
            let dueUnix = window
                .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                .valueOf();
            for (let tag of tags) {
                if (this.reviewDecks.hasOwnProperty(tag)) {
                    this.reviewDecks[tag].scheduledNotes.push({ note, dueUnix });
                    if (dueUnix <= now) {
                        this.reviewDecks[tag].dueNotesCount++;
                    }
                }
            }
            this.easeByPath[note.path] = frontmatter["sr-ease"];
            if (dueUnix <= now) {
                this.dueNotesCount++;
            }
            let nDays = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
            if (!this.dueDatesNotes.hasOwnProperty(nDays)) {
                this.dueDatesNotes[nDays] = 0;
            }
            this.dueDatesNotes[nDays]++;
        }
        lib.rank(0.85, 0.000001, (node, rank) => {
            this.pageranks[node] = rank * 10000;
        });
        for (let deckKey in this.reviewDecks) {
            this.reviewDecks[deckKey].sortNotes(this.pageranks);
        }
        let noteCountText = this.dueNotesCount === 1 ? t("note") : t("notes");
        let cardCountText = this.deckTree.dueFlashcardsCount === 1 ? t("card") : t("cards");
        this.statusBar.setText(t("Review") +
            `: ${this.dueNotesCount} ${noteCountText}, ` +
            `${this.deckTree.dueFlashcardsCount} ${cardCountText} ` +
            t("due"));
        this.reviewQueueView.redraw();
        this.notesSyncLock = false;
    }
    async saveReviewResponse(note, response) {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || {};
        let tags = obsidian.getAllTags(fileCachedData) || [];
        if (this.data.settings.noteFoldersToIgnore.some((folder) => note.path.startsWith(folder))) {
            new obsidian.Notice(t("Note is saved under ignored folder (check settings)."));
            return;
        }
        let shouldIgnore = true;
        for (let tag of tags) {
            if (this.data.settings.tagsToReview.some((tagToReview) => tag === tagToReview || tag.startsWith(tagToReview + "/"))) {
                shouldIgnore = false;
                break;
            }
        }
        if (shouldIgnore) {
            new obsidian.Notice(t("Please tag the note appropriately for reviewing (in settings)."));
            return;
        }
        let fileText = await this.app.vault.read(note);
        let ease, interval, delayBeforeReview, now = Date.now();
        // new note
        if (!(frontmatter.hasOwnProperty("sr-due") &&
            frontmatter.hasOwnProperty("sr-interval") &&
            frontmatter.hasOwnProperty("sr-ease"))) {
            let linkTotal = 0, linkPGTotal = 0, totalLinkCount = 0;
            for (let statObj of this.incomingLinks[note.path] || []) {
                let ease = this.easeByPath[statObj.sourcePath];
                if (ease) {
                    linkTotal += statObj.linkCount * this.pageranks[statObj.sourcePath] * ease;
                    linkPGTotal += this.pageranks[statObj.sourcePath] * statObj.linkCount;
                    totalLinkCount += statObj.linkCount;
                }
            }
            let outgoingLinks = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let linkedFilePath in outgoingLinks) {
                let ease = this.easeByPath[linkedFilePath];
                if (ease) {
                    linkTotal +=
                        outgoingLinks[linkedFilePath] * this.pageranks[linkedFilePath] * ease;
                    linkPGTotal += this.pageranks[linkedFilePath] * outgoingLinks[linkedFilePath];
                    totalLinkCount += outgoingLinks[linkedFilePath];
                }
            }
            let linkContribution = this.data.settings.maxLinkFactor *
                Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
            ease = Math.round((1.0 - linkContribution) * this.data.settings.baseEase +
                (totalLinkCount > 0
                    ? (linkContribution * linkTotal) / linkPGTotal
                    : linkContribution * this.data.settings.baseEase));
            interval = 1;
            delayBeforeReview = 0;
        }
        else {
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
            delayBeforeReview =
                now -
                    window
                        .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                        .valueOf();
        }
        let schedObj = schedule(response, interval, ease, delayBeforeReview, this.data.settings, this.dueDatesNotes);
        interval = schedObj.interval;
        ease = schedObj.ease;
        let due = window.moment(now + interval * 24 * 3600 * 1000);
        let dueString = due.format("YYYY-MM-DD");
        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(SCHEDULING_INFO_REGEX, `---\n${schedulingInfo[1]}sr-due: ${dueString}\n` +
                `sr-interval: ${interval}\nsr-ease: ${ease}\n` +
                `${schedulingInfo[5]}---`);
        }
        else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(YAML_FRONT_MATTER_REGEX, `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                `sr-interval: ${interval}\nsr-ease: ${ease}\n---`);
        }
        else {
            fileText =
                `---\nsr-due: ${dueString}\nsr-interval: ${interval}\n` +
                    `sr-ease: ${ease}\n---\n\n${fileText}`;
        }
        if (this.data.settings.burySiblingCards) {
            await this.findFlashcards(note, [], true); // bury all cards in current note
            await this.savePluginData();
        }
        await this.app.vault.modify(note, fileText);
        new obsidian.Notice(t("Response received."));
        setTimeout(() => {
            if (!this.notesSyncLock) {
                this.sync();
                if (this.data.settings.autoNextNote) {
                    this.reviewNextNote(this.lastSelectedReviewDeck);
                }
            }
        }, 500);
    }
    async reviewNextNoteModal() {
        let reviewDeckNames = Object.keys(this.reviewDecks);
        if (reviewDeckNames.length === 1) {
            this.reviewNextNote(reviewDeckNames[0]);
        }
        else {
            let deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }
    async reviewNextNote(deckKey) {
        if (!this.reviewDecks.hasOwnProperty(deckKey)) {
            new obsidian.Notice("No deck exists for " + deckKey);
            return;
        }
        this.lastSelectedReviewDeck = deckKey;
        let deck = this.reviewDecks[deckKey];
        if (deck.dueNotesCount > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * deck.dueNotesCount)
                : 0;
            this.app.workspace.activeLeaf.openFile(deck.scheduledNotes[index].note);
            return;
        }
        if (deck.newNotes.length > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
            this.app.workspace.activeLeaf.openFile(deck.newNotes[index]);
            return;
        }
        new obsidian.Notice(t("You're all caught up now :D."));
    }
    async flashcards_sync() {
        if (this.flashcardsSyncLock) {
            return;
        }
        this.flashcardsSyncLock = true;
        let notes = this.app.vault.getMarkdownFiles();
        this.deckTree = new Deck("root", null);
        this.dueDatesFlashcards = {};
        this.cardStats = {
            eases: {},
            intervals: {},
            newCount: 0,
            youngCount: 0,
            matureCount: 0,
        };
        let now = window.moment(Date.now());
        let todayDate = now.format("YYYY-MM-DD");
        // clear list if we've changed dates
        if (todayDate !== this.data.buryDate) {
            this.data.buryDate = todayDate;
            this.data.buryList = [];
        }
        let notePathsSet = new Set();
        for (let note of notes) {
            if (this.data.settings.noteFoldersToIgnore.some((folder) => note.path.startsWith(folder))) {
                continue;
            }
            notePathsSet.add(note.path);
            // find deck path
            let deckPath = [];
            if (this.data.settings.convertFoldersToDecks) {
                deckPath = note.path.split("/");
                deckPath.pop(); // remove filename
                if (deckPath.length === 0) {
                    deckPath = ["/"];
                }
            }
            else {
                let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
                let tags = obsidian.getAllTags(fileCachedData) || [];
                outer: for (let tagToReview of this.data.settings.flashcardTags) {
                    for (let tag of tags) {
                        if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                            deckPath = tag.substring(1).split("/");
                            break outer;
                        }
                    }
                }
            }
            if (deckPath.length === 0)
                continue;
            await this.findFlashcards(note, deckPath);
        }
        this.logger.info(`Flashcard sync took ${Date.now() - now.valueOf()}ms`);
        // sort the deck names
        this.deckTree.sortSubdecksList();
        let noteCountText = this.dueNotesCount === 1 ? t("note") : t("notes");
        let cardCountText = this.deckTree.dueFlashcardsCount === 1 ? t("card") : t("cards");
        this.statusBar.setText(t("Review") +
            `: ${this.dueNotesCount} ${noteCountText}, ` +
            `${this.deckTree.dueFlashcardsCount} ${cardCountText} ` +
            t("due"));
        this.flashcardsSyncLock = false;
    }
    async findFlashcards(note, deckPath, buryOnly = false) {
        let fileText = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings = fileCachedData.headings || [];
        let fileChanged = false, deckAdded = false;
        let now = Date.now();
        let parsedCards = parse(fileText, this.data.settings.singlelineCardSeparator, this.data.settings.singlelineReversedCardSeparator, this.data.settings.multilineCardSeparator, this.data.settings.multilineReversedCardSeparator);
        for (let parsedCard of parsedCards) {
            let cardType = parsedCard[0], cardText = parsedCard[1], lineNo = parsedCard[2];
            if (cardType === CardType.Cloze && this.data.settings.disableClozeCards) {
                continue;
            }
            let cardTextHash = cyrb53(cardText);
            if (buryOnly) {
                this.data.buryList.push(cardTextHash);
                continue;
            }
            if (!deckAdded) {
                this.deckTree.createDeck([...deckPath]);
                deckAdded = true;
            }
            let siblingMatches = [];
            if (cardType === CardType.Cloze) {
                let front, back;
                for (let m of cardText.matchAll(/==(.*?)==/gm)) {
                    let deletionStart = m.index, deletionEnd = deletionStart + m[0].length;
                    front =
                        cardText.substring(0, deletionStart) +
                            "<span style='color:#2196f3'>[...]</span>" +
                            cardText.substring(deletionEnd);
                    front = front.replace(/==/gm, "");
                    back =
                        cardText.substring(0, deletionStart) +
                            "<span style='color:#2196f3'>" +
                            cardText.substring(deletionStart, deletionEnd) +
                            "</span>" +
                            cardText.substring(deletionEnd);
                    back = back.replace(/==/gm, "");
                    siblingMatches.push([front, back]);
                }
            }
            else {
                let idx;
                if (cardType === CardType.SingleLineBasic) {
                    idx = cardText.indexOf(this.data.settings.singlelineCardSeparator);
                    siblingMatches.push([
                        cardText.substring(0, idx),
                        cardText.substring(idx + this.data.settings.singlelineCardSeparator.length),
                    ]);
                }
                else if (cardType === CardType.SingleLineReversed) {
                    idx = cardText.indexOf(this.data.settings.singlelineReversedCardSeparator);
                    let side1 = cardText.substring(0, idx), side2 = cardText.substring(idx + this.data.settings.singlelineReversedCardSeparator.length);
                    siblingMatches.push([side1, side2]);
                    siblingMatches.push([side2, side1]);
                }
                else if (cardType === CardType.MultiLineBasic) {
                    idx = cardText.indexOf("\n" + this.data.settings.multilineCardSeparator + "\n");
                    siblingMatches.push([
                        cardText.substring(0, idx),
                        cardText.substring(idx + 2 + this.data.settings.multilineCardSeparator.length),
                    ]);
                }
                else if (cardType === CardType.MultiLineReversed) {
                    idx = cardText.indexOf("\n" + this.data.settings.multilineReversedCardSeparator + "\n");
                    let side1 = cardText.substring(0, idx), side2 = cardText.substring(idx + 2 + this.data.settings.multilineReversedCardSeparator.length);
                    siblingMatches.push([side1, side2]);
                    siblingMatches.push([side2, side1]);
                }
            }
            let scheduling = [...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
            if (scheduling.length === 0)
                scheduling = [...cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
            // we have some extra scheduling dates to delete
            if (scheduling.length > siblingMatches.length) {
                let idxSched = cardText.lastIndexOf("<!--SR:") + 7;
                let newCardText = cardText.substring(0, idxSched);
                for (let i = 0; i < siblingMatches.length; i++)
                    newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                newCardText += "-->";
                let replacementRegex = new RegExp(escapeRegexString(cardText), "gm");
                fileText = fileText.replace(replacementRegex, (_) => newCardText);
                fileChanged = true;
            }
            let context = this.data.settings.showContextInCards
                ? getCardContext(lineNo, headings)
                : "";
            let siblings = [];
            for (let i = 0; i < siblingMatches.length; i++) {
                let front = siblingMatches[i][0].trim(), back = siblingMatches[i][1].trim();
                let cardObj = {
                    isDue: i < scheduling.length,
                    note,
                    lineNo,
                    front,
                    back,
                    cardText,
                    context,
                    cardType,
                    siblingIdx: i,
                    siblings,
                };
                // card scheduled
                if (i < scheduling.length) {
                    let dueUnix = window
                        .moment(scheduling[i][1], ["YYYY-MM-DD", "DD-MM-YYYY"])
                        .valueOf();
                    let nDays = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
                    if (!this.dueDatesFlashcards.hasOwnProperty(nDays)) {
                        this.dueDatesFlashcards[nDays] = 0;
                    }
                    this.dueDatesFlashcards[nDays]++;
                    let interval = parseInt(scheduling[i][2]), ease = parseInt(scheduling[i][3]);
                    if (!this.cardStats.intervals.hasOwnProperty(interval)) {
                        this.cardStats.intervals[interval] = 0;
                    }
                    this.cardStats.intervals[interval]++;
                    if (!this.cardStats.eases.hasOwnProperty(ease)) {
                        this.cardStats.eases[ease] = 0;
                    }
                    this.cardStats.eases[ease]++;
                    if (interval >= 21) {
                        this.cardStats.matureCount++;
                    }
                    else {
                        this.cardStats.youngCount++;
                    }
                    if (this.data.buryList.includes(cardTextHash)) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                    if (dueUnix <= now) {
                        cardObj.interval = interval;
                        cardObj.ease = ease;
                        cardObj.delayBeforeReview = now - dueUnix;
                        this.deckTree.insertFlashcard([...deckPath], cardObj);
                    }
                    else {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                }
                else {
                    this.cardStats.newCount++;
                    if (this.data.buryList.includes(cyrb53(cardText))) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                }
                siblings.push(cardObj);
            }
        }
        if (fileChanged) {
            await this.app.vault.modify(note, fileText);
        }
    }
    async loadPluginData() {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
        this.data = removeLegacyKeys(this.data, DEFAULT_DATA);
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);
        this.data.settings = removeLegacyKeys(this.data.settings, DEFAULT_SETTINGS);
    }
    async savePluginData() {
        await this.saveData(this.data);
    }
    initView() {
        if (this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).length) {
            return;
        }
        this.app.workspace.getRightLeaf(false).setViewState({
            type: REVIEW_QUEUE_VIEW_TYPE,
            active: true,
        });
    }
}
function getCardContext(cardLine, headings) {
    let stack = [];
    for (let heading of headings) {
        if (heading.position.start.line > cardLine) {
            break;
        }
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
            stack.pop();
        }
        stack.push(heading);
    }
    let context = "";
    for (let headingObj of stack) {
        headingObj.heading = headingObj.heading.replace(/\[\^\d+\]/gm, "").trim();
        context += headingObj.heading + " > ";
    }
    return context.slice(0, -3);
}

module.exports = SRPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3BhZ2VyYW5rLmpzL2xpYi9pbmRleC5qcyIsInNyYy9sb2dnZXIudHMiLCJzcmMvbGFuZy9sb2NhbGUvYXIudHMiLCJzcmMvbGFuZy9sb2NhbGUvY3oudHMiLCJzcmMvbGFuZy9sb2NhbGUvZGEudHMiLCJzcmMvbGFuZy9sb2NhbGUvZGUudHMiLCJzcmMvbGFuZy9sb2NhbGUvZW4udHMiLCJzcmMvbGFuZy9sb2NhbGUvZW4tZ2IudHMiLCJzcmMvbGFuZy9sb2NhbGUvZXMudHMiLCJzcmMvbGFuZy9sb2NhbGUvZnIudHMiLCJzcmMvbGFuZy9sb2NhbGUvaGkudHMiLCJzcmMvbGFuZy9sb2NhbGUvaWQudHMiLCJzcmMvbGFuZy9sb2NhbGUvaXQudHMiLCJzcmMvbGFuZy9sb2NhbGUvamEudHMiLCJzcmMvbGFuZy9sb2NhbGUva28udHMiLCJzcmMvbGFuZy9sb2NhbGUvbmwudHMiLCJzcmMvbGFuZy9sb2NhbGUvbm8udHMiLCJzcmMvbGFuZy9sb2NhbGUvcGwudHMiLCJzcmMvbGFuZy9sb2NhbGUvcHQudHMiLCJzcmMvbGFuZy9sb2NhbGUvcHQtYnIudHMiLCJzcmMvbGFuZy9sb2NhbGUvcm8udHMiLCJzcmMvbGFuZy9sb2NhbGUvcnUudHMiLCJzcmMvbGFuZy9sb2NhbGUvdHIudHMiLCJzcmMvbGFuZy9sb2NhbGUvemgtY24udHMiLCJzcmMvbGFuZy9sb2NhbGUvemgtdHcudHMiLCJzcmMvbGFuZy9oZWxwZXJzLnRzIiwic3JjL3NldHRpbmdzLnRzIiwic3JjL3NjaGVkdWxpbmcudHMiLCJzcmMvdHlwZXMudHMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL3V0aWxzLnRzIiwic3JjL2ZsYXNoY2FyZC1tb2RhbC50cyIsInNyYy9zdGF0cy1tb2RhbC50cyIsInNyYy9zaWRlYmFyLnRzIiwic3JjL3Jldmlldy1kZWNrLnRzIiwic3JjL3BhcnNlci50cyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZm9yT3duKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICBpZiAoKHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnKSAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2soa2V5LCBvYmplY3Rba2V5XSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0ge1xuICAgICAgICBjb3VudDogMCxcbiAgICAgICAgZWRnZXM6IHt9LFxuICAgICAgICBub2Rlczoge31cbiAgICB9O1xuXG4gICAgc2VsZi5saW5rID0gZnVuY3Rpb24gKHNvdXJjZSwgdGFyZ2V0LCB3ZWlnaHQpIHtcbiAgICAgICAgaWYgKChpc0Zpbml0ZSh3ZWlnaHQpICE9PSB0cnVlKSB8fCAod2VpZ2h0ID09PSBudWxsKSkge1xuICAgICAgICAgICAgd2VpZ2h0ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgd2VpZ2h0ID0gcGFyc2VGbG9hdCh3ZWlnaHQpO1xuXG4gICAgICAgIGlmIChzZWxmLm5vZGVzLmhhc093blByb3BlcnR5KHNvdXJjZSkgIT09IHRydWUpIHtcbiAgICAgICAgICAgIHNlbGYuY291bnQrKztcbiAgICAgICAgICAgIHNlbGYubm9kZXNbc291cmNlXSA9IHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgb3V0Ym91bmQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLm5vZGVzW3NvdXJjZV0ub3V0Ym91bmQgKz0gd2VpZ2h0O1xuXG4gICAgICAgIGlmIChzZWxmLm5vZGVzLmhhc093blByb3BlcnR5KHRhcmdldCkgIT09IHRydWUpIHtcbiAgICAgICAgICAgIHNlbGYuY291bnQrKztcbiAgICAgICAgICAgIHNlbGYubm9kZXNbdGFyZ2V0XSA9IHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgb3V0Ym91bmQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5lZGdlcy5oYXNPd25Qcm9wZXJ0eShzb3VyY2UpICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzW3NvdXJjZV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLmVkZ2VzW3NvdXJjZV0uaGFzT3duUHJvcGVydHkodGFyZ2V0KSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2VsZi5lZGdlc1tzb3VyY2VdW3RhcmdldF0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5lZGdlc1tzb3VyY2VdW3RhcmdldF0gKz0gd2VpZ2h0O1xuICAgIH07XG5cbiAgICBzZWxmLnJhbmsgPSBmdW5jdGlvbiAoYWxwaGEsIGVwc2lsb24sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkZWx0YSA9IDEsXG4gICAgICAgICAgICBpbnZlcnNlID0gMSAvIHNlbGYuY291bnQ7XG5cbiAgICAgICAgZm9yT3duKHNlbGYuZWRnZXMsIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLm5vZGVzW3NvdXJjZV0ub3V0Ym91bmQgPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yT3duKHNlbGYuZWRnZXNbc291cmNlXSwgZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmVkZ2VzW3NvdXJjZV1bdGFyZ2V0XSAvPSBzZWxmLm5vZGVzW3NvdXJjZV0ub3V0Ym91bmQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvck93bihzZWxmLm5vZGVzLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBzZWxmLm5vZGVzW2tleV0ud2VpZ2h0ID0gaW52ZXJzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2hpbGUgKGRlbHRhID4gZXBzaWxvbikge1xuICAgICAgICAgICAgdmFyIGxlYWsgPSAwLFxuICAgICAgICAgICAgICAgIG5vZGVzID0ge307XG5cbiAgICAgICAgICAgIGZvck93bihzZWxmLm5vZGVzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIG5vZGVzW2tleV0gPSB2YWx1ZS53ZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUub3V0Ym91bmQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGVhayArPSB2YWx1ZS53ZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZi5ub2Rlc1trZXldLndlaWdodCA9IDA7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGVhayAqPSBhbHBoYTtcblxuICAgICAgICAgICAgZm9yT3duKHNlbGYubm9kZXMsIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3JPd24oc2VsZi5lZGdlc1tzb3VyY2VdLCBmdW5jdGlvbiAodGFyZ2V0LCB3ZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5ub2Rlc1t0YXJnZXRdLndlaWdodCArPSBhbHBoYSAqIG5vZGVzW3NvdXJjZV0gKiB3ZWlnaHQ7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLm5vZGVzW3NvdXJjZV0ud2VpZ2h0ICs9ICgxIC0gYWxwaGEpICogaW52ZXJzZSArIGxlYWsgKiBpbnZlcnNlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGRlbHRhID0gMDtcblxuICAgICAgICAgICAgZm9yT3duKHNlbGYubm9kZXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZGVsdGEgKz0gTWF0aC5hYnModmFsdWUud2VpZ2h0IC0gbm9kZXNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvck93bihzZWxmLm5vZGVzLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soa2V5LCBzZWxmLm5vZGVzW2tleV0ud2VpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuY291bnQgPSAwO1xuICAgICAgICBzZWxmLmVkZ2VzID0ge307XG4gICAgICAgIHNlbGYubm9kZXMgPSB7fTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHNlbGY7XG59KSgpO1xuIiwiZXhwb3J0IGVudW0gTG9nTGV2ZWwge1xyXG4gICAgSW5mbyxcclxuICAgIFdhcm4sXHJcbiAgICBFcnJvcixcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMb2dnZXIge1xyXG4gICAgaW5mbzogRnVuY3Rpb247XHJcbiAgICB3YXJuOiBGdW5jdGlvbjtcclxuICAgIGVycm9yOiBGdW5jdGlvbjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUxvZ2dlciA9IChjb25zb2xlOiBDb25zb2xlLCBsb2dMZXZlbDogTG9nTGV2ZWwpOiBMb2dnZXIgPT4ge1xyXG4gICAgbGV0IGluZm86IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbjtcclxuXHJcbiAgICBpZiAobG9nTGV2ZWwgPT09IExvZ0xldmVsLkluZm8pXHJcbiAgICAgICAgaW5mbyA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZS5pbmZvLCBjb25zb2xlLCBcIlNSOlwiKTtcclxuICAgIGVsc2UgaW5mbyA9ICguLi5fOiBhbnlbXSkgPT4ge307XHJcblxyXG4gICAgaWYgKGxvZ0xldmVsIDw9IExvZ0xldmVsLldhcm4pXHJcbiAgICAgICAgd2FybiA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZS53YXJuLCBjb25zb2xlLCBcIlNSOlwiKTtcclxuICAgIGVsc2Ugd2FybiA9ICguLi5fOiBhbnlbXSkgPT4ge307XHJcblxyXG4gICAgbGV0IGVycm9yOiBGdW5jdGlvbiA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZS5lcnJvciwgY29uc29sZSwgXCJTUjpcIik7XHJcblxyXG4gICAgcmV0dXJuIHsgaW5mbywgd2FybiwgZXJyb3IgfTtcclxufTtcclxuIiwiLy8g2KfZhNi52LHYqNmK2KlcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG4iLCIvLyDEjWXFoXRpbmFcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG4iLCIvLyBEYW5za1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIERldXRzY2hcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG4iLCIvLyBFbmdsaXNoXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICAvLyBmbGFzaGNhcmQtbW9kYWwudHNcclxuICAgIERlY2tzOiBcIkRlY2tzXCIsXHJcbiAgICBcIk9wZW4gZmlsZVwiOiBcIk9wZW4gZmlsZVwiLFxyXG4gICAgXCJEdWUgY2FyZHNcIjogXCJEdWUgY2FyZHNcIixcclxuICAgIFwiTmV3IGNhcmRzXCI6IFwiTmV3IGNhcmRzXCIsXHJcbiAgICBcIlRvdGFsIGNhcmRzXCI6IFwiVG90YWwgY2FyZHNcIixcclxuICAgIFwiUmVzZXQgY2FyZCdzIHByb2dyZXNzXCI6IFwiUmVzZXQgY2FyZCdzIHByb2dyZXNzXCIsXHJcbiAgICBIYXJkOiBcIkhhcmRcIixcclxuICAgIEdvb2Q6IFwiR29vZFwiLFxyXG4gICAgRWFzeTogXCJFYXN5XCIsXHJcbiAgICBcIlNob3cgQW5zd2VyXCI6IFwiU2hvdyBBbnN3ZXJcIixcclxuICAgIFwiQ2FyZCdzIHByb2dyZXNzIGhhcyBiZWVuIHJlc2V0LlwiOiBcIkNhcmQncyBwcm9ncmVzcyBoYXMgYmVlbiByZXNldC5cIixcclxuXHJcbiAgICAvLyBtYWluLnRzXHJcbiAgICBcIk9wZW4gYSBub3RlIGZvciByZXZpZXdcIjogXCJPcGVuIGEgbm90ZSBmb3IgcmV2aWV3XCIsXHJcbiAgICBcIlJldmlldyBmbGFzaGNhcmRzXCI6IFwiUmV2aWV3IGZsYXNoY2FyZHNcIixcclxuICAgIFwiUmV2aWV3OiBFYXN5XCI6IFwiUmV2aWV3OiBFYXN5XCIsXHJcbiAgICBcIlJldmlldzogR29vZFwiOiBcIlJldmlldzogR29vZFwiLFxyXG4gICAgXCJSZXZpZXc6IEhhcmRcIjogXCJSZXZpZXc6IEhhcmRcIixcclxuICAgIFwiUmV2aWV3IG5vdGUgYXMgZWFzeVwiOiBcIlJldmlldyBub3RlIGFzIGVhc3lcIixcclxuICAgIFwiUmV2aWV3IG5vdGUgYXMgZ29vZFwiOiBcIlJldmlldyBub3RlIGFzIGdvb2RcIixcclxuICAgIFwiUmV2aWV3IG5vdGUgYXMgaGFyZFwiOiBcIlJldmlldyBub3RlIGFzIGhhcmRcIixcclxuICAgIFwiVmlldyBzdGF0aXN0aWNzXCI6IFwiVmlldyBzdGF0aXN0aWNzXCIsXHJcbiAgICBub3RlOiBcIm5vdGVcIixcclxuICAgIG5vdGVzOiBcIm5vdGVzXCIsXHJcbiAgICBjYXJkOiBcImNhcmRcIixcclxuICAgIGNhcmRzOiBcImNhcmRzXCIsXHJcbiAgICBcIlBsZWFzZSB0YWcgdGhlIG5vdGUgYXBwcm9wcmlhdGVseSBmb3IgcmV2aWV3aW5nIChpbiBzZXR0aW5ncykuXCI6XHJcbiAgICAgICAgXCJQbGVhc2UgdGFnIHRoZSBub3RlIGFwcHJvcHJpYXRlbHkgZm9yIHJldmlld2luZyAoaW4gc2V0dGluZ3MpLlwiLFxyXG4gICAgXCJZb3UncmUgYWxsIGNhdWdodCB1cCBub3cgOkQuXCI6IFwiWW91J3JlIGFsbCBjYXVnaHQgdXAgbm93IDpELlwiLFxyXG4gICAgXCJSZXNwb25zZSByZWNlaXZlZC5cIjogXCJSZXNwb25zZSByZWNlaXZlZC5cIixcclxuXHJcbiAgICAvLyBzY2hlZHVsaW5nLnRzXHJcbiAgICBkYXk6IFwiZGF5XCIsXHJcbiAgICBkYXlzOiBcImRheXNcIixcclxuICAgIG1vbnRoOiBcIm1vbnRoXCIsXHJcbiAgICBtb250aHM6IFwibW9udGhzXCIsXHJcbiAgICB5ZWFyOiBcInllYXJcIixcclxuICAgIHllYXJzOiBcInllYXJzXCIsXHJcblxyXG4gICAgLy8gc2V0dGluZ3MudHNcclxuICAgIE5vdGVzOiBcIk5vdGVzXCIsXHJcbiAgICBGbGFzaGNhcmRzOiBcIkZsYXNoY2FyZHNcIixcclxuICAgIFwiU3BhY2VkIFJlcGV0aXRpb24gUGx1Z2luIC0gU2V0dGluZ3NcIjogXCJTcGFjZWQgUmVwZXRpdGlvbiBQbHVnaW4gLSBTZXR0aW5nc1wiLFxyXG4gICAgXCJGb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2sgdGhlXCI6IFwiRm9yIG1vcmUgaW5mb3JtYXRpb24sIGNoZWNrIHRoZVwiLFxyXG4gICAgd2lraTogXCJ3aWtpXCIsXHJcbiAgICBcImFsZ29yaXRobSBpbXBsZW1lbnRhdGlvblwiOiBcImFsZ29yaXRobSBpbXBsZW1lbnRhdGlvblwiLFxyXG4gICAgXCJGbGFzaGNhcmQgdGFnc1wiOiBcIkZsYXNoY2FyZCB0YWdzXCIsXHJcbiAgICBcIkVudGVyIHRhZ3Mgc2VwYXJhdGVkIGJ5IHNwYWNlcyBvciBuZXdsaW5lcyBpLmUuICNmbGFzaGNhcmRzICNkZWNrMiAjZGVjazMuXCI6XHJcbiAgICAgICAgXCJFbnRlciB0YWdzIHNlcGFyYXRlZCBieSBzcGFjZXMgb3IgbmV3bGluZXMgaS5lLiAjZmxhc2hjYXJkcyAjZGVjazIgI2RlY2szLlwiLFxyXG4gICAgXCJDb252ZXJ0IGZvbGRlcnMgdG8gZGVja3MgYW5kIHN1YmRlY2tzP1wiOiBcIkNvbnZlcnQgZm9sZGVycyB0byBkZWNrcyBhbmQgc3ViZGVja3M/XCIsXHJcbiAgICBcIlRoaXMgaXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIEZsYXNoY2FyZCB0YWdzIG9wdGlvbiBhYm92ZS5cIjpcclxuICAgICAgICBcIlRoaXMgaXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIEZsYXNoY2FyZCB0YWdzIG9wdGlvbiBhYm92ZS5cIixcclxuICAgIFwiU2F2ZSBzY2hlZHVsaW5nIGNvbW1lbnQgb24gdGhlIHNhbWUgbGluZSBhcyB0aGUgZmxhc2hjYXJkJ3MgbGFzdCBsaW5lP1wiOlxyXG4gICAgICAgIFwiU2F2ZSBzY2hlZHVsaW5nIGNvbW1lbnQgb24gdGhlIHNhbWUgbGluZSBhcyB0aGUgZmxhc2hjYXJkJ3MgbGFzdCBsaW5lP1wiLFxyXG4gICAgXCJUdXJuaW5nIHRoaXMgb24gd2lsbCBtYWtlIHRoZSBIVE1MIGNvbW1lbnRzIG5vdCBicmVhayBsaXN0IGZvcm1hdHRpbmcuXCI6XHJcbiAgICAgICAgXCJUdXJuaW5nIHRoaXMgb24gd2lsbCBtYWtlIHRoZSBIVE1MIGNvbW1lbnRzIG5vdCBicmVhayBsaXN0IGZvcm1hdHRpbmcuXCIsXHJcbiAgICBcIkJ1cnkgc2libGluZyBjYXJkcyB1bnRpbCB0aGUgbmV4dCBkYXk/XCI6IFwiQnVyeSBzaWJsaW5nIGNhcmRzIHVudGlsIHRoZSBuZXh0IGRheT9cIixcclxuICAgIFwiU2libGluZ3MgYXJlIGNhcmRzIGdlbmVyYXRlZCBmcm9tIHRoZSBzYW1lIGNhcmQgdGV4dCBpLmUuIGNsb3plIGRlbGV0aW9uc1wiOlxyXG4gICAgICAgIFwiU2libGluZ3MgYXJlIGNhcmRzIGdlbmVyYXRlZCBmcm9tIHRoZSBzYW1lIGNhcmQgdGV4dCBpLmUuIGNsb3plIGRlbGV0aW9uc1wiLFxyXG4gICAgXCJTaG93IGNvbnRleHQgaW4gY2FyZHM/XCI6IFwiU2hvdyBjb250ZXh0IGluIGNhcmRzP1wiLFxyXG4gICAgXCJpLmUuIFRpdGxlID4gSGVhZGluZyAxID4gU3ViaGVhZGluZyA+IC4uLiA+IFN1YmhlYWRpbmdcIjpcclxuICAgICAgICBcImkuZS4gVGl0bGUgPiBIZWFkaW5nIDEgPiBTdWJoZWFkaW5nID4gLi4uID4gU3ViaGVhZGluZ1wiLFxyXG4gICAgXCJGbGFzaGNhcmQgSGVpZ2h0IFBlcmNlbnRhZ2VcIjogXCJGbGFzaGNhcmQgSGVpZ2h0IFBlcmNlbnRhZ2VcIixcclxuICAgIFwiU2hvdWxkIGJlIHNldCB0byAxMDAlIG9uIG1vYmlsZSBvciBpZiB5b3UgaGF2ZSB2ZXJ5IGxhcmdlIGltYWdlc1wiOlxyXG4gICAgICAgIFwiU2hvdWxkIGJlIHNldCB0byAxMDAlIG9uIG1vYmlsZSBvciBpZiB5b3UgaGF2ZSB2ZXJ5IGxhcmdlIGltYWdlc1wiLFxyXG4gICAgXCJSZXNldCB0byBkZWZhdWx0XCI6IFwiUmVzZXQgdG8gZGVmYXVsdFwiLFxyXG4gICAgXCJGbGFzaGNhcmQgV2lkdGggUGVyY2VudGFnZVwiOiBcIkZsYXNoY2FyZCBXaWR0aCBQZXJjZW50YWdlXCIsXHJcbiAgICBcIlNob3cgZmlsZSBuYW1lIGluc3RlYWQgb2YgJ09wZW4gZmlsZScgaW4gZmxhc2hjYXJkIHJldmlldz9cIjpcclxuICAgICAgICBcIlNob3cgZmlsZSBuYW1lIGluc3RlYWQgb2YgJ09wZW4gZmlsZScgaW4gZmxhc2hjYXJkIHJldmlldz9cIixcclxuICAgIFwiUmFuZG9taXplIGNhcmQgb3JkZXIgZHVyaW5nIHJldmlldz9cIjogXCJSYW5kb21pemUgY2FyZCBvcmRlciBkdXJpbmcgcmV2aWV3P1wiLFxyXG4gICAgXCJEaXNhYmxlIGNsb3plIGNhcmRzP1wiOiBcIkRpc2FibGUgY2xvemUgY2FyZHM/XCIsXHJcbiAgICBcIklmIHlvdSdyZSBub3QgY3VycmVudGx5IHVzaW5nICdlbSAmIHdvdWxkIGxpa2UgdGhlIHBsdWdpbiB0byBydW4gYSB0YWQgZmFzdGVyLlwiOlxyXG4gICAgICAgIFwiSWYgeW91J3JlIG5vdCBjdXJyZW50bHkgdXNpbmcgJ2VtICYgd291bGQgbGlrZSB0aGUgcGx1Z2luIHRvIHJ1biBhIHRhZCBmYXN0ZXIuXCIsXHJcbiAgICBcIlNlcGFyYXRvciBmb3IgaW5saW5lIGZsYXNoY2FyZHNcIjogXCJTZXBhcmF0b3IgZm9yIGlubGluZSBmbGFzaGNhcmRzXCIsXHJcbiAgICBcIlNlcGFyYXRvciBmb3IgaW5saW5lIHJldmVyc2VkIGZsYXNoY2FyZHNcIjogXCJTZXBhcmF0b3IgZm9yIGlubGluZSByZXZlcnNlZCBmbGFzaGNhcmRzXCIsXHJcbiAgICBcIlNlcGFyYXRvciBmb3IgbXVsdGlsaW5lIHJldmVyc2VkIGZsYXNoY2FyZHNcIjogXCJTZXBhcmF0b3IgZm9yIG11bHRpbGluZSByZXZlcnNlZCBmbGFzaGNhcmRzXCIsXHJcbiAgICBcIk5vdGUgdGhhdCBhZnRlciBjaGFuZ2luZyB0aGlzIHlvdSBoYXZlIHRvIG1hbnVhbGx5IGVkaXQgYW55IGZsYXNoY2FyZHMgeW91IGFscmVhZHkgaGF2ZS5cIjpcclxuICAgICAgICBcIk5vdGUgdGhhdCBhZnRlciBjaGFuZ2luZyB0aGlzIHlvdSBoYXZlIHRvIG1hbnVhbGx5IGVkaXQgYW55IGZsYXNoY2FyZHMgeW91IGFscmVhZHkgaGF2ZS5cIixcclxuICAgIFwiU2VwYXJhdG9yIGZvciBtdWx0aWxpbmUgZmxhc2hjYXJkc1wiOiBcIlNlcGFyYXRvciBmb3IgbXVsdGlsaW5lIGZsYXNoY2FyZHNcIixcclxuICAgIFwiQ2xlYXIgY2FjaGU/XCI6IFwiQ2xlYXIgY2FjaGU/XCIsXHJcbiAgICBcIkNsZWFyIGNhY2hlXCI6IFwiQ2xlYXIgY2FjaGVcIixcclxuICAgIFwiQ2FjaGUgY2xlYXJlZFwiOiBcIkNhY2hlIGNsZWFyZWRcIixcclxuICAgIFwiSWYgeW91J3JlIGhhdmluZyBpc3N1ZXMgc2VlaW5nIHNvbWUgY2FyZHMsIHRyeSB0aGlzLlwiOlxyXG4gICAgICAgIFwiSWYgeW91J3JlIGhhdmluZyBpc3N1ZXMgc2VlaW5nIHNvbWUgY2FyZHMsIHRyeSB0aGlzLlwiLFxyXG4gICAgXCJUYWdzIHRvIHJldmlld1wiOiBcIlRhZ3MgdG8gcmV2aWV3XCIsXHJcbiAgICBcIkVudGVyIHRhZ3Mgc2VwYXJhdGVkIGJ5IHNwYWNlcyBvciBuZXdsaW5lcyBpLmUuICNyZXZpZXcgI3RhZzIgI3RhZzMuXCI6XHJcbiAgICAgICAgXCJFbnRlciB0YWdzIHNlcGFyYXRlZCBieSBzcGFjZXMgb3IgbmV3bGluZXMgaS5lLiAjcmV2aWV3ICN0YWcyICN0YWczLlwiLFxyXG4gICAgXCJPcGVuIGEgcmFuZG9tIG5vdGUgZm9yIHJldmlld1wiOiBcIk9wZW4gYSByYW5kb20gbm90ZSBmb3IgcmV2aWV3XCIsXHJcbiAgICBcIldoZW4geW91IHR1cm4gdGhpcyBvZmYsIG5vdGVzIGFyZSBvcmRlcmVkIGJ5IGltcG9ydGFuY2UgKFBhZ2VSYW5rKS5cIjpcclxuICAgICAgICBcIldoZW4geW91IHR1cm4gdGhpcyBvZmYsIG5vdGVzIGFyZSBvcmRlcmVkIGJ5IGltcG9ydGFuY2UgKFBhZ2VSYW5rKS5cIixcclxuICAgIFwiT3BlbiBuZXh0IG5vdGUgYXV0b21hdGljYWxseSBhZnRlciBhIHJldmlld1wiOiBcIk9wZW4gbmV4dCBub3RlIGF1dG9tYXRpY2FsbHkgYWZ0ZXIgYSByZXZpZXdcIixcclxuICAgIFwiRm9yIGZhc3RlciByZXZpZXdzLlwiOiBcIkZvciBmYXN0ZXIgcmV2aWV3cy5cIixcclxuICAgIFwiRGlzYWJsZSByZXZpZXcgb3B0aW9ucyBpbiB0aGUgZmlsZSBtZW51IGkuZS4gUmV2aWV3OiBFYXN5IEdvb2QgSGFyZFwiOlxyXG4gICAgICAgIFwiRGlzYWJsZSByZXZpZXcgb3B0aW9ucyBpbiB0aGUgZmlsZSBtZW51IGkuZS4gUmV2aWV3OiBFYXN5IEdvb2QgSGFyZFwiLFxyXG4gICAgXCJBZnRlciBkaXNhYmxpbmcsIHlvdSBjYW4gcmV2aWV3IHVzaW5nIHRoZSBjb21tYW5kIGhvdGtleXMuIFJlbG9hZCBPYnNpZGlhbiBhZnRlciBjaGFuZ2luZyB0aGlzLlwiOlxyXG4gICAgICAgIFwiQWZ0ZXIgZGlzYWJsaW5nLCB5b3UgY2FuIHJldmlldyB1c2luZyB0aGUgY29tbWFuZCBob3RrZXlzLiBSZWxvYWQgT2JzaWRpYW4gYWZ0ZXIgY2hhbmdpbmcgdGhpcy5cIixcclxuICAgIFwiTWF4aW11bSBudW1iZXIgb2YgZGF5cyB0byBkaXNwbGF5IG9uIHJpZ2h0IHBhbmVsXCI6XHJcbiAgICAgICAgXCJNYXhpbXVtIG51bWJlciBvZiBkYXlzIHRvIGRpc3BsYXkgb24gcmlnaHQgcGFuZWxcIixcclxuICAgIFwiUmVkdWNlIHRoaXMgZm9yIGEgY2xlYW5lciBpbnRlcmZhY2UuXCI6IFwiUmVkdWNlIHRoaXMgZm9yIGEgY2xlYW5lciBpbnRlcmZhY2UuXCIsXHJcbiAgICBcIlRoZSBudW1iZXIgb2YgZGF5cyBtdXN0IGJlIGF0IGxlYXN0IDEuXCI6IFwiVGhlIG51bWJlciBvZiBkYXlzIG11c3QgYmUgYXQgbGVhc3QgMS5cIixcclxuICAgIFwiUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBudW1iZXIuXCI6IFwiUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBudW1iZXIuXCIsXHJcbiAgICBBbGdvcml0aG06IFwiQWxnb3JpdGhtXCIsXHJcbiAgICBcIkJhc2UgZWFzZVwiOiBcIkJhc2UgZWFzZVwiLFxyXG4gICAgXCJtaW5pbXVtID0gMTMwLCBwcmVmZXJyYWJseSBhcHByb3hpbWF0ZWx5IDI1MC5cIjpcclxuICAgICAgICBcIm1pbmltdW0gPSAxMzAsIHByZWZlcnJhYmx5IGFwcHJveGltYXRlbHkgMjUwLlwiLFxyXG4gICAgXCJUaGUgYmFzZSBlYXNlIG11c3QgYmUgYXQgbGVhc3QgMTMwLlwiOiBcIlRoZSBiYXNlIGVhc2UgbXVzdCBiZSBhdCBsZWFzdCAxMzAuXCIsXHJcbiAgICBcIkludGVydmFsIGNoYW5nZSB3aGVuIHlvdSByZXZpZXcgYSBmbGFzaGNhcmQvbm90ZSBhcyBoYXJkXCI6XHJcbiAgICAgICAgXCJJbnRlcnZhbCBjaGFuZ2Ugd2hlbiB5b3UgcmV2aWV3IGEgZmxhc2hjYXJkL25vdGUgYXMgaGFyZFwiLFxyXG4gICAgXCJuZXdJbnRlcnZhbCA9IG9sZEludGVydmFsICogaW50ZXJ2YWxDaGFuZ2UgLyAxMDAuXCI6XHJcbiAgICAgICAgXCJuZXdJbnRlcnZhbCA9IG9sZEludGVydmFsICogaW50ZXJ2YWxDaGFuZ2UgLyAxMDAuXCIsXHJcbiAgICBcIkVhc3kgYm9udXNcIjogXCJFYXN5IGJvbnVzXCIsXHJcbiAgICBcIlRoZSBlYXN5IGJvbnVzIGFsbG93cyB5b3UgdG8gc2V0IHRoZSBkaWZmZXJlbmNlIGluIGludGVydmFscyBiZXR3ZWVuIGFuc3dlcmluZyBHb29kIGFuZCBFYXN5IG9uIGEgZmxhc2hjYXJkL25vdGUgKG1pbmltdW0gPSAxMDAlKS5cIjpcclxuICAgICAgICBcIlRoZSBlYXN5IGJvbnVzIGFsbG93cyB5b3UgdG8gc2V0IHRoZSBkaWZmZXJlbmNlIGluIGludGVydmFscyBiZXR3ZWVuIGFuc3dlcmluZyBHb29kIGFuZCBFYXN5IG9uIGEgZmxhc2hjYXJkL25vdGUgKG1pbmltdW0gPSAxMDAlKS5cIixcclxuICAgIFwiVGhlIGVhc3kgYm9udXMgbXVzdCBiZSBhdCBsZWFzdCAxMDAuXCI6IFwiVGhlIGVhc3kgYm9udXMgbXVzdCBiZSBhdCBsZWFzdCAxMDAuXCIsXHJcbiAgICBcIk1heGltdW0gSW50ZXJ2YWxcIjogXCJNYXhpbXVtIEludGVydmFsXCIsXHJcbiAgICBcIkFsbG93cyB5b3UgdG8gcGxhY2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGludGVydmFsIChkZWZhdWx0ID0gMTAwIHllYXJzKS5cIjpcclxuICAgICAgICBcIkFsbG93cyB5b3UgdG8gcGxhY2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGludGVydmFsIChkZWZhdWx0ID0gMTAwIHllYXJzKS5cIixcclxuICAgIFwiVGhlIG1heGltdW0gaW50ZXJ2YWwgbXVzdCBiZSBhdCBsZWFzdCAxIGRheS5cIjogXCJUaGUgbWF4aW11bSBpbnRlcnZhbCBtdXN0IGJlIGF0IGxlYXN0IDEgZGF5LlwiLFxyXG4gICAgXCJNYXhpbXVtIGxpbmsgY29udHJpYnV0aW9uXCI6IFwiTWF4aW11bSBsaW5rIGNvbnRyaWJ1dGlvblwiLFxyXG4gICAgXCJNYXhpbXVtIGNvbnRyaWJ1dGlvbiBvZiB0aGUgd2VpZ2h0ZWQgZWFzZSBvZiBsaW5rZWQgbm90ZXMgdG8gdGhlIGluaXRpYWwgZWFzZS5cIjpcclxuICAgICAgICBcIk1heGltdW0gY29udHJpYnV0aW9uIG9mIHRoZSB3ZWlnaHRlZCBlYXNlIG9mIGxpbmtlZCBub3RlcyB0byB0aGUgaW5pdGlhbCBlYXNlLlwiLFxyXG5cclxuICAgIC8vIHNpZGViYXIudHNcclxuICAgIE5ldzogXCJOZXdcIixcclxuICAgIFllc3RlcmRheTogXCJZZXN0ZXJkYXlcIixcclxuICAgIFRvZGF5OiBcIlRvZGF5XCIsXHJcbiAgICBUb21vcnJvdzogXCJUb21vcnJvd1wiLFxyXG4gICAgXCJOb3RlcyBSZXZpZXcgUXVldWVcIjogXCJOb3RlcyBSZXZpZXcgUXVldWVcIixcclxuICAgIENsb3NlOiBcIkNsb3NlXCIsXHJcblxyXG4gICAgLy8gc3RhdHMtbW9kYWwudHNcclxuICAgIFN0YXRpc3RpY3M6IFwiU3RhdGlzdGljc1wiLFxyXG4gICAgXCJOb3RlIHRoYXQgdGhpcyByZXF1aXJlcyB0aGUgT2JzaWRpYW4gQ2hhcnRzIHBsdWdpbiB0byB3b3JrXCI6XHJcbiAgICAgICAgXCJOb3RlIHRoYXQgdGhpcyByZXF1aXJlcyB0aGUgT2JzaWRpYW4gQ2hhcnRzIHBsdWdpbiB0byB3b3JrXCIsXHJcbiAgICBGb3JlY2FzdDogXCJGb3JlY2FzdFwiLFxyXG4gICAgXCJUaGUgbnVtYmVyIG9mIGNhcmRzIGR1ZSBpbiB0aGUgZnV0dXJlXCI6IFwiVGhlIG51bWJlciBvZiBjYXJkcyBkdWUgaW4gdGhlIGZ1dHVyZVwiLFxyXG4gICAgXCJOdW1iZXIgb2YgY2FyZHNcIjogXCJOdW1iZXIgb2YgY2FyZHNcIixcclxuICAgIFNjaGVkdWxlZDogXCJTY2hlZHVsZWRcIixcclxuICAgIFJldmlldzogXCJSZXZpZXdcIixcclxuICAgIGR1ZTogXCJkdWVcIixcclxuICAgIERheXM6IFwiRGF5c1wiLFxyXG4gICAgXCJDYXJkIFR5cGVzXCI6IFwiQ2FyZCBUeXBlc1wiLFxyXG4gICAgSW50ZXJ2YWxzOiBcIkludGVydmFsc1wiLFxyXG4gICAgXCJEZWxheXMgdW50aWwgcmV2aWV3cyBhcmUgc2hvd24gYWdhaW5cIjogXCJEZWxheXMgdW50aWwgcmV2aWV3cyBhcmUgc2hvd24gYWdhaW5cIixcclxuICAgIFwiQ291bnRcIjogXCJDb3VudFwiLFxyXG4gICAgXCJFYXNlc1wiOiBcIkVhc2VzXCIsXHJcblxyXG4gICAgXCJGb2xkZXJzIHRvIGlnbm9yZVwiOiBcIkZvbGRlcnMgdG8gaWdub3JlXCIsXHJcbiAgICBcIkVudGVyIGZvbGRlciBwYXRocyBzZXBhcmF0ZWQgYnkgbmV3bGluZXMgaS5lLiBUZW1wbGF0ZXMgTWV0YS9TY3JpcHRzXCI6XHJcbiAgICAgICAgXCJFbnRlciBmb2xkZXIgcGF0aHMgc2VwYXJhdGVkIGJ5IG5ld2xpbmVzIGkuZS4gVGVtcGxhdGVzIE1ldGEvU2NyaXB0c1wiLFxyXG4gICAgXCJOb3RlIGlzIHNhdmVkIHVuZGVyIGlnbm9yZWQgZm9sZGVyIChjaGVjayBzZXR0aW5ncykuXCI6XHJcbiAgICAgICAgXCJOb3RlIGlzIHNhdmVkIHVuZGVyIGlnbm9yZWQgZm9sZGVyIChjaGVjayBzZXR0aW5ncykuXCIsXHJcbn07XHJcbiIsIi8vIEJyaXRpc2ggRW5nbGlzaFxyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIEVzcGHDsW9sXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8gZnJhbsOnYWlzXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8g4KS54KS/4KSo4KWN4KSm4KWAXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8gQmFoYXNhIEluZG9uZXNpYVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIEl0YWxpYW5vXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8g5pel5pys6KqeXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8g7ZWc6rWt7Ja0XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8gTmVkZXJsYW5kc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIE5vcnNrXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8gasSZenlrIHBvbHNraVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIFBvcnR1Z3XDqnNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG4iLCIvLyBQb3J0dWd1w6pzIGRvIEJyYXNpbFxyXG4vLyBCcmF6aWxpYW4gUG9ydHVndWVzZVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIFJvbcOibsSDXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7fTtcclxuIiwiLy8g0YDRg9GB0YHQutC40LlcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG4iLCIvLyBUw7xya8OnZVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIOeugOS9k+S4reaWh1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIOe5gemrlOS4reaWh1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge307XHJcbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZ21leWVycy9vYnNpZGlhbi1rYW5iYW4vYmxvYi85MzAxNGMyNTEyNTA3ZmRlOWVhZmQyNDFlOGQ0MzY4YThkZmRmODUzL3NyYy9sYW5nL2hlbHBlcnMudHNcclxuXHJcbmltcG9ydCB7IG1vbWVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgYXIgZnJvbSBcIi4vbG9jYWxlL2FyXCI7XHJcbmltcG9ydCBjeiBmcm9tIFwiLi9sb2NhbGUvY3pcIjtcclxuaW1wb3J0IGRhIGZyb20gXCIuL2xvY2FsZS9kYVwiO1xyXG5pbXBvcnQgZGUgZnJvbSBcIi4vbG9jYWxlL2RlXCI7XHJcbmltcG9ydCBlbiBmcm9tIFwiLi9sb2NhbGUvZW5cIjtcclxuaW1wb3J0IGVuR0IgZnJvbSBcIi4vbG9jYWxlL2VuLWdiXCI7XHJcbmltcG9ydCBlcyBmcm9tIFwiLi9sb2NhbGUvZXNcIjtcclxuaW1wb3J0IGZyIGZyb20gXCIuL2xvY2FsZS9mclwiO1xyXG5pbXBvcnQgaGkgZnJvbSBcIi4vbG9jYWxlL2hpXCI7XHJcbmltcG9ydCBpZCBmcm9tIFwiLi9sb2NhbGUvaWRcIjtcclxuaW1wb3J0IGl0IGZyb20gXCIuL2xvY2FsZS9pdFwiO1xyXG5pbXBvcnQgamEgZnJvbSBcIi4vbG9jYWxlL2phXCI7XHJcbmltcG9ydCBrbyBmcm9tIFwiLi9sb2NhbGUva29cIjtcclxuaW1wb3J0IG5sIGZyb20gXCIuL2xvY2FsZS9ubFwiO1xyXG5pbXBvcnQgbm8gZnJvbSBcIi4vbG9jYWxlL25vXCI7XHJcbmltcG9ydCBwbCBmcm9tIFwiLi9sb2NhbGUvcGxcIjtcclxuaW1wb3J0IHB0IGZyb20gXCIuL2xvY2FsZS9wdFwiO1xyXG5pbXBvcnQgcHRCUiBmcm9tIFwiLi9sb2NhbGUvcHQtYnJcIjtcclxuaW1wb3J0IHJvIGZyb20gXCIuL2xvY2FsZS9yb1wiO1xyXG5pbXBvcnQgcnUgZnJvbSBcIi4vbG9jYWxlL3J1XCI7XHJcbmltcG9ydCB0ciBmcm9tIFwiLi9sb2NhbGUvdHJcIjtcclxuaW1wb3J0IHpoQ04gZnJvbSBcIi4vbG9jYWxlL3poLWNuXCI7XHJcbmltcG9ydCB6aFRXIGZyb20gXCIuL2xvY2FsZS96aC10d1wiO1xyXG5cclxuY29uc3QgbG9jYWxlTWFwOiB7IFtrOiBzdHJpbmddOiBQYXJ0aWFsPHR5cGVvZiBlbj4gfSA9IHtcclxuICAgIGFyLFxyXG4gICAgY3M6IGN6LFxyXG4gICAgZGEsXHJcbiAgICBkZSxcclxuICAgIGVuLFxyXG4gICAgXCJlbi1nYlwiOiBlbkdCLFxyXG4gICAgZXMsXHJcbiAgICBmcixcclxuICAgIGhpLFxyXG4gICAgaWQsXHJcbiAgICBpdCxcclxuICAgIGphLFxyXG4gICAga28sXHJcbiAgICBubCxcclxuICAgIG5uOiBubyxcclxuICAgIHBsLFxyXG4gICAgcHQsXHJcbiAgICBcInB0LWJyXCI6IHB0QlIsXHJcbiAgICBybyxcclxuICAgIHJ1LFxyXG4gICAgdHIsXHJcbiAgICBcInpoLWNuXCI6IHpoQ04sXHJcbiAgICBcInpoLXR3XCI6IHpoVFcsXHJcbn07XHJcblxyXG5jb25zdCBsb2NhbGUgPSBsb2NhbGVNYXBbbW9tZW50LmxvY2FsZSgpXTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0KHN0cjoga2V5b2YgdHlwZW9mIGVuKTogc3RyaW5nIHtcclxuICAgIGlmICghbG9jYWxlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yOiBTUlMgbG9jYWxlIG5vdCBmb3VuZFwiLCBtb21lbnQubG9jYWxlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAobG9jYWxlICYmIGxvY2FsZVtzdHJdKSB8fCBlbltzdHJdO1xyXG59XHJcbiIsImltcG9ydCB7IE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgQXBwLCBQbGF0Zm9ybSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuaW1wb3J0IHR5cGUgU1JQbHVnaW4gZnJvbSBcInNyYy9tYWluXCI7XHJcbmltcG9ydCB7IExvZ0xldmVsIH0gZnJvbSBcInNyYy9sb2dnZXJcIjtcclxuaW1wb3J0IHsgdCB9IGZyb20gXCJzcmMvbGFuZy9oZWxwZXJzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNSU2V0dGluZ3Mge1xyXG4gICAgLy8gZmxhc2hjYXJkc1xyXG4gICAgZmxhc2hjYXJkVGFnczogc3RyaW5nW107XHJcbiAgICBjb252ZXJ0Rm9sZGVyc1RvRGVja3M6IGJvb2xlYW47XHJcbiAgICBjYXJkQ29tbWVudE9uU2FtZUxpbmU6IGJvb2xlYW47XHJcbiAgICBidXJ5U2libGluZ0NhcmRzOiBib29sZWFuO1xyXG4gICAgc2hvd0NvbnRleHRJbkNhcmRzOiBib29sZWFuO1xyXG4gICAgZmxhc2hjYXJkSGVpZ2h0UGVyY2VudGFnZTogbnVtYmVyO1xyXG4gICAgZmxhc2hjYXJkV2lkdGhQZXJjZW50YWdlOiBudW1iZXI7XHJcbiAgICBzaG93RmlsZU5hbWVJbkZpbGVMaW5rOiBib29sZWFuO1xyXG4gICAgcmFuZG9taXplQ2FyZE9yZGVyOiBib29sZWFuO1xyXG4gICAgZGlzYWJsZUNsb3plQ2FyZHM6IGJvb2xlYW47XHJcbiAgICBzaW5nbGVsaW5lQ2FyZFNlcGFyYXRvcjogc3RyaW5nO1xyXG4gICAgc2luZ2xlbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjogc3RyaW5nO1xyXG4gICAgbXVsdGlsaW5lQ2FyZFNlcGFyYXRvcjogc3RyaW5nO1xyXG4gICAgbXVsdGlsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yOiBzdHJpbmc7XHJcbiAgICAvLyBub3Rlc1xyXG4gICAgdGFnc1RvUmV2aWV3OiBzdHJpbmdbXTtcclxuICAgIG5vdGVGb2xkZXJzVG9JZ25vcmU6IHN0cmluZ1tdO1xyXG4gICAgb3BlblJhbmRvbU5vdGU6IGJvb2xlYW47XHJcbiAgICBhdXRvTmV4dE5vdGU6IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlRmlsZU1lbnVSZXZpZXdPcHRpb25zOiBib29sZWFuO1xyXG4gICAgbWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlOiBudW1iZXI7XHJcbiAgICAvLyBhbGdvcml0aG1cclxuICAgIGJhc2VFYXNlOiBudW1iZXI7XHJcbiAgICBsYXBzZXNJbnRlcnZhbENoYW5nZTogbnVtYmVyO1xyXG4gICAgZWFzeUJvbnVzOiBudW1iZXI7XHJcbiAgICBtYXhpbXVtSW50ZXJ2YWw6IG51bWJlcjtcclxuICAgIG1heExpbmtGYWN0b3I6IG51bWJlcjtcclxuICAgIC8vIGxvZ2dpbmdcclxuICAgIGxvZ0xldmVsOiBMb2dMZXZlbDtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNSU2V0dGluZ3MgPSB7XHJcbiAgICAvLyBmbGFzaGNhcmRzXHJcbiAgICBmbGFzaGNhcmRUYWdzOiBbXCIjZmxhc2hjYXJkc1wiXSxcclxuICAgIGNvbnZlcnRGb2xkZXJzVG9EZWNrczogZmFsc2UsXHJcbiAgICBjYXJkQ29tbWVudE9uU2FtZUxpbmU6IGZhbHNlLFxyXG4gICAgYnVyeVNpYmxpbmdDYXJkczogZmFsc2UsXHJcbiAgICBzaG93Q29udGV4dEluQ2FyZHM6IHRydWUsXHJcbiAgICBmbGFzaGNhcmRIZWlnaHRQZXJjZW50YWdlOiBQbGF0Zm9ybS5pc01vYmlsZSA/IDEwMCA6IDgwLFxyXG4gICAgZmxhc2hjYXJkV2lkdGhQZXJjZW50YWdlOiBQbGF0Zm9ybS5pc01vYmlsZSA/IDEwMCA6IDQwLFxyXG4gICAgc2hvd0ZpbGVOYW1lSW5GaWxlTGluazogZmFsc2UsXHJcbiAgICByYW5kb21pemVDYXJkT3JkZXI6IHRydWUsXHJcbiAgICBkaXNhYmxlQ2xvemVDYXJkczogZmFsc2UsXHJcbiAgICBzaW5nbGVsaW5lQ2FyZFNlcGFyYXRvcjogXCI6OlwiLFxyXG4gICAgc2luZ2xlbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjogXCI6OjpcIixcclxuICAgIG11bHRpbGluZUNhcmRTZXBhcmF0b3I6IFwiP1wiLFxyXG4gICAgbXVsdGlsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yOiBcIj8/XCIsXHJcbiAgICAvLyBub3Rlc1xyXG4gICAgdGFnc1RvUmV2aWV3OiBbXCIjcmV2aWV3XCJdLFxyXG4gICAgbm90ZUZvbGRlcnNUb0lnbm9yZTogW10sXHJcbiAgICBvcGVuUmFuZG9tTm90ZTogZmFsc2UsXHJcbiAgICBhdXRvTmV4dE5vdGU6IGZhbHNlLFxyXG4gICAgZGlzYWJsZUZpbGVNZW51UmV2aWV3T3B0aW9uczogZmFsc2UsXHJcbiAgICBtYXhORGF5c05vdGVzUmV2aWV3UXVldWU6IDM2NSxcclxuICAgIC8vIGFsZ29yaXRobVxyXG4gICAgYmFzZUVhc2U6IDI1MCxcclxuICAgIGxhcHNlc0ludGVydmFsQ2hhbmdlOiAwLjUsXHJcbiAgICBlYXN5Qm9udXM6IDEuMyxcclxuICAgIG1heGltdW1JbnRlcnZhbDogMzY1MjUsXHJcbiAgICBtYXhMaW5rRmFjdG9yOiAxLjAsXHJcbiAgICAvLyBsb2dnaW5nXHJcbiAgICBsb2dMZXZlbDogTG9nTGV2ZWwuV2FybixcclxufTtcclxuXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZ21leWVycy9vYnNpZGlhbi1rYW5iYW4vYmxvYi9tYWluL3NyYy9TZXR0aW5ncy50c1xyXG5sZXQgYXBwbHlEZWJvdW5jZVRpbWVyOiBudW1iZXIgPSAwO1xyXG5mdW5jdGlvbiBhcHBseVNldHRpbmdzVXBkYXRlKGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xyXG4gICAgY2xlYXJUaW1lb3V0KGFwcGx5RGVib3VuY2VUaW1lcik7XHJcbiAgICBhcHBseURlYm91bmNlVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgNTEyKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNSU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xyXG4gICAgcHJpdmF0ZSBwbHVnaW46IFNSUGx1Z2luO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFNSUGx1Z2luKSB7XHJcbiAgICAgICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xyXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3BsYXkoKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZURpdigpLmlubmVySFRNTCA9XHJcbiAgICAgICAgICAgIFwiPGgyPlwiICsgdChcIlNwYWNlZCBSZXBldGl0aW9uIFBsdWdpbiAtIFNldHRpbmdzXCIpICsgXCI8L2gyPlwiO1xyXG5cclxuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoKS5pbm5lckhUTUwgPVxyXG4gICAgICAgICAgICB0KFwiRm9yIG1vcmUgaW5mb3JtYXRpb24sIGNoZWNrIHRoZVwiKSArXHJcbiAgICAgICAgICAgICcgPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9zdDN2M25tdy9vYnNpZGlhbi1zcGFjZWQtcmVwZXRpdGlvbi93aWtpXCI+JyArXHJcbiAgICAgICAgICAgIHQoXCJ3aWtpXCIpICtcclxuICAgICAgICAgICAgXCI8L2E+LlwiO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIkZvbGRlcnMgdG8gaWdub3JlXCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiRW50ZXIgZm9sZGVyIHBhdGhzIHNlcGFyYXRlZCBieSBuZXdsaW5lcyBpLmUuIFRlbXBsYXRlcyBNZXRhL1NjcmlwdHNcIikpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5ub3RlRm9sZGVyc1RvSWdub3JlLmpvaW4oXCJcXG5cIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Mubm90ZUZvbGRlcnNUb0lnbm9yZSA9IHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KC9cXG4rLylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh2KSA9PiB2LnRyaW0oKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKCh2KSA9PiB2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZURpdigpLmlubmVySFRNTCA9IFwiPGgzPlwiICsgdChcIkZsYXNoY2FyZHNcIikgKyBcIjwvaDM+XCI7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0KFwiRmxhc2hjYXJkIHRhZ3NcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgdChcIkVudGVyIHRhZ3Mgc2VwYXJhdGVkIGJ5IHNwYWNlcyBvciBuZXdsaW5lcyBpLmUuICNmbGFzaGNhcmRzICNkZWNrMiAjZGVjazMuXCIpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmZsYXNoY2FyZFRhZ3Muam9pbihcIiBcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkVGFncyA9IHZhbHVlLnNwbGl0KC9cXHMrLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIkNvbnZlcnQgZm9sZGVycyB0byBkZWNrcyBhbmQgc3ViZGVja3M/XCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiVGhpcyBpcyBhbiBhbHRlcm5hdGl2ZSB0byB0aGUgRmxhc2hjYXJkIHRhZ3Mgb3B0aW9uIGFib3ZlLlwiKSlcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuY29udmVydEZvbGRlcnNUb0RlY2tzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5jb252ZXJ0Rm9sZGVyc1RvRGVja3MgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIlNhdmUgc2NoZWR1bGluZyBjb21tZW50IG9uIHRoZSBzYW1lIGxpbmUgYXMgdGhlIGZsYXNoY2FyZCdzIGxhc3QgbGluZT9cIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHQoXCJUdXJuaW5nIHRoaXMgb24gd2lsbCBtYWtlIHRoZSBIVE1MIGNvbW1lbnRzIG5vdCBicmVhayBsaXN0IGZvcm1hdHRpbmcuXCIpKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5jYXJkQ29tbWVudE9uU2FtZUxpbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmNhcmRDb21tZW50T25TYW1lTGluZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0KFwiQnVyeSBzaWJsaW5nIGNhcmRzIHVudGlsIHRoZSBuZXh0IGRheT9cIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHQoXCJTaWJsaW5ncyBhcmUgY2FyZHMgZ2VuZXJhdGVkIGZyb20gdGhlIHNhbWUgY2FyZCB0ZXh0IGkuZS4gY2xvemUgZGVsZXRpb25zXCIpKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5idXJ5U2libGluZ0NhcmRzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5idXJ5U2libGluZ0NhcmRzID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJTaG93IGNvbnRleHQgaW4gY2FyZHM/XCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiaS5lLiBUaXRsZSA+IEhlYWRpbmcgMSA+IFN1YmhlYWRpbmcgPiAuLi4gPiBTdWJoZWFkaW5nXCIpKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zaG93Q29udGV4dEluQ2FyZHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNob3dDb250ZXh0SW5DYXJkcyA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0KFwiRmxhc2hjYXJkIEhlaWdodCBQZXJjZW50YWdlXCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiU2hvdWxkIGJlIHNldCB0byAxMDAlIG9uIG1vYmlsZSBvciBpZiB5b3UgaGF2ZSB2ZXJ5IGxhcmdlIGltYWdlc1wiKSlcclxuICAgICAgICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PlxyXG4gICAgICAgICAgICAgICAgc2xpZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldExpbWl0cygxMCwgMTAwLCA1KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmZsYXNoY2FyZEhlaWdodFBlcmNlbnRhZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkSGVpZ2h0UGVyY2VudGFnZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkSGVpZ2h0UGVyY2VudGFnZSA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLmZsYXNoY2FyZEhlaWdodFBlcmNlbnRhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJGbGFzaGNhcmQgV2lkdGggUGVyY2VudGFnZVwiKSlcclxuICAgICAgICAgICAgLnNldERlc2ModChcIlNob3VsZCBiZSBzZXQgdG8gMTAwJSBvbiBtb2JpbGUgb3IgaWYgeW91IGhhdmUgdmVyeSBsYXJnZSBpbWFnZXNcIikpXHJcbiAgICAgICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT5cclxuICAgICAgICAgICAgICAgIHNsaWRlclxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRMaW1pdHMoMTAsIDEwMCwgNSlcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5mbGFzaGNhcmRXaWR0aFBlcmNlbnRhZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkV2lkdGhQZXJjZW50YWdlID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGJ1dHRvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJyZXNldFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHQoXCJSZXNldCB0byBkZWZhdWx0XCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5mbGFzaGNhcmRXaWR0aFBlcmNlbnRhZ2UgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5mbGFzaGNhcmRXaWR0aFBlcmNlbnRhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJTaG93IGZpbGUgbmFtZSBpbnN0ZWFkIG9mICdPcGVuIGZpbGUnIGluIGZsYXNoY2FyZCByZXZpZXc/XCIpKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zaG93RmlsZU5hbWVJbkZpbGVMaW5rKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zaG93RmlsZU5hbWVJbkZpbGVMaW5rID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJSYW5kb21pemUgY2FyZCBvcmRlciBkdXJpbmcgcmV2aWV3P1wiKSlcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MucmFuZG9taXplQ2FyZE9yZGVyKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5yYW5kb21pemVDYXJkT3JkZXIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIkRpc2FibGUgY2xvemUgY2FyZHM/XCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcclxuICAgICAgICAgICAgICAgIHQoXCJJZiB5b3UncmUgbm90IGN1cnJlbnRseSB1c2luZyAnZW0gJiB3b3VsZCBsaWtlIHRoZSBwbHVnaW4gdG8gcnVuIGEgdGFkIGZhc3Rlci5cIilcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5kaXNhYmxlQ2xvemVDYXJkcylcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZGlzYWJsZUNsb3plQ2FyZHMgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIlNlcGFyYXRvciBmb3IgaW5saW5lIGZsYXNoY2FyZHNcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgdChcclxuICAgICAgICAgICAgICAgICAgICBcIk5vdGUgdGhhdCBhZnRlciBjaGFuZ2luZyB0aGlzIHlvdSBoYXZlIHRvIG1hbnVhbGx5IGVkaXQgYW55IGZsYXNoY2FyZHMgeW91IGFscmVhZHkgaGF2ZS5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInJlc2V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodChcIlJlc2V0IHRvIGRlZmF1bHRcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERFRkFVTFRfU0VUVElOR1Muc2luZ2xlbGluZUNhcmRTZXBhcmF0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJTZXBhcmF0b3IgZm9yIGlubGluZSByZXZlcnNlZCBmbGFzaGNhcmRzXCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcclxuICAgICAgICAgICAgICAgIHQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOb3RlIHRoYXQgYWZ0ZXIgY2hhbmdpbmcgdGhpcyB5b3UgaGF2ZSB0byBtYW51YWxseSBlZGl0IGFueSBmbGFzaGNhcmRzIHlvdSBhbHJlYWR5IGhhdmUuXCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Muc2luZ2xlbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvciA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLnNpbmdsZWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJTZXBhcmF0b3IgZm9yIG11bHRpbGluZSBmbGFzaGNhcmRzXCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcclxuICAgICAgICAgICAgICAgIHQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOb3RlIHRoYXQgYWZ0ZXIgY2hhbmdpbmcgdGhpcyB5b3UgaGF2ZSB0byBtYW51YWxseSBlZGl0IGFueSBmbGFzaGNhcmRzIHlvdSBhbHJlYWR5IGhhdmUuXCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVDYXJkU2VwYXJhdG9yKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm11bHRpbGluZUNhcmRTZXBhcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubXVsdGlsaW5lQ2FyZFNlcGFyYXRvciA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLm11bHRpbGluZUNhcmRTZXBhcmF0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJTZXBhcmF0b3IgZm9yIG11bHRpbGluZSByZXZlcnNlZCBmbGFzaGNhcmRzXCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcclxuICAgICAgICAgICAgICAgIHQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOb3RlIHRoYXQgYWZ0ZXIgY2hhbmdpbmcgdGhpcyB5b3UgaGF2ZSB0byBtYW51YWxseSBlZGl0IGFueSBmbGFzaGNhcmRzIHlvdSBhbHJlYWR5IGhhdmUuXCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3IpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubXVsdGlsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInJlc2V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodChcIlJlc2V0IHRvIGRlZmF1bHRcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvciA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLm11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoKS5pbm5lckhUTUwgPSBcIjxoMz5cIiArIHQoXCJOb3Rlc1wiKSArIFwiPC9oMz5cIjtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJUYWdzIHRvIHJldmlld1wiKSlcclxuICAgICAgICAgICAgLnNldERlc2ModChcIkVudGVyIHRhZ3Mgc2VwYXJhdGVkIGJ5IHNwYWNlcyBvciBuZXdsaW5lcyBpLmUuICNyZXZpZXcgI3RhZzIgI3RhZzMuXCIpKVxyXG4gICAgICAgICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+XHJcbiAgICAgICAgICAgICAgICB0ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MudGFnc1RvUmV2aWV3LmpvaW4oXCIgXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnRhZ3NUb1JldmlldyA9IHZhbHVlLnNwbGl0KC9cXHMrLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIk9wZW4gYSByYW5kb20gbm90ZSBmb3IgcmV2aWV3XCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiV2hlbiB5b3UgdHVybiB0aGlzIG9mZiwgbm90ZXMgYXJlIG9yZGVyZWQgYnkgaW1wb3J0YW5jZSAoUGFnZVJhbmspLlwiKSlcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Mub3BlblJhbmRvbU5vdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm9wZW5SYW5kb21Ob3RlID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJPcGVuIG5leHQgbm90ZSBhdXRvbWF0aWNhbGx5IGFmdGVyIGEgcmV2aWV3XCIpKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyh0KFwiRm9yIGZhc3RlciByZXZpZXdzLlwiKSlcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxyXG4gICAgICAgICAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYXV0b05leHROb3RlKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmF1dG9OZXh0Tm90ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIkRpc2FibGUgcmV2aWV3IG9wdGlvbnMgaW4gdGhlIGZpbGUgbWVudSBpLmUuIFJldmlldzogRWFzeSBHb29kIEhhcmRcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgdChcclxuICAgICAgICAgICAgICAgICAgICBcIkFmdGVyIGRpc2FibGluZywgeW91IGNhbiByZXZpZXcgdXNpbmcgdGhlIGNvbW1hbmQgaG90a2V5cy4gUmVsb2FkIE9ic2lkaWFuIGFmdGVyIGNoYW5naW5nIHRoaXMuXCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5kaXNhYmxlRmlsZU1lbnVSZXZpZXdPcHRpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5kaXNhYmxlRmlsZU1lbnVSZXZpZXdPcHRpb25zID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJNYXhpbXVtIG51bWJlciBvZiBkYXlzIHRvIGRpc3BsYXkgb24gcmlnaHQgcGFuZWxcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHQoXCJSZWR1Y2UgdGhpcyBmb3IgYSBjbGVhbmVyIGludGVyZmFjZS5cIikpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZS50b1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtVmFsdWU6IG51bWJlciA9IE51bWJlci5wYXJzZUludCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG51bVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1WYWx1ZSA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0KFwiVGhlIG51bWJlciBvZiBkYXlzIG11c3QgYmUgYXQgbGVhc3QgMS5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldFZhbHVlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tYXhORGF5c05vdGVzUmV2aWV3UXVldWUudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZSA9IG51bVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodChcIlBsZWFzZSBwcm92aWRlIGEgdmFsaWQgbnVtYmVyLlwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERFRkFVTFRfU0VUVElOR1MubWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZURpdigpLmlubmVySFRNTCA9IFwiPGgzPlwiICsgdChcIkFsZ29yaXRobVwiKSArIFwiPC9oMz5cIjtcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRGl2KCkuaW5uZXJIVE1MID1cclxuICAgICAgICAgICAgdChcIkZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVjayB0aGVcIikgK1xyXG4gICAgICAgICAgICAnIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vc3QzdjNubXcvb2JzaWRpYW4tc3BhY2VkLXJlcGV0aXRpb24vd2lraS9TcGFjZWQtUmVwZXRpdGlvbi1BbGdvcml0aG1cIj4nICtcclxuICAgICAgICAgICAgdChcImFsZ29yaXRobSBpbXBsZW1lbnRhdGlvblwiKSArXHJcbiAgICAgICAgICAgIFwiPC9hPi5cIjtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJCYXNlIGVhc2VcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHQoXCJtaW5pbXVtID0gMTMwLCBwcmVmZXJyYWJseSBhcHByb3hpbWF0ZWx5IDI1MC5cIikpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhc2VFYXNlLnRvU3RyaW5nKCkpLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGx5U2V0dGluZ3NVcGRhdGUoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtVmFsdWU6IG51bWJlciA9IE51bWJlci5wYXJzZUludCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4obnVtVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtVmFsdWUgPCAxMzApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHQoXCJUaGUgYmFzZSBlYXNlIG11c3QgYmUgYXQgbGVhc3QgMTMwLlwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhc2VFYXNlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhc2VFYXNlID0gbnVtVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0KFwiUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBudW1iZXIuXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGJ1dHRvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJyZXNldFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHQoXCJSZXNldCB0byBkZWZhdWx0XCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSA9IERFRkFVTFRfU0VUVElOR1MuYmFzZUVhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKHQoXCJJbnRlcnZhbCBjaGFuZ2Ugd2hlbiB5b3UgcmV2aWV3IGEgZmxhc2hjYXJkL25vdGUgYXMgaGFyZFwiKSlcclxuICAgICAgICAgICAgLnNldERlc2ModChcIm5ld0ludGVydmFsID0gb2xkSW50ZXJ2YWwgKiBpbnRlcnZhbENoYW5nZSAvIDEwMC5cIikpXHJcbiAgICAgICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT5cclxuICAgICAgICAgICAgICAgIHNsaWRlclxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRMaW1pdHMoMSwgOTksIDEpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubGFwc2VzSW50ZXJ2YWxDaGFuZ2UgKiAxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5sYXBzZXNJbnRlcnZhbENoYW5nZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubGFwc2VzSW50ZXJ2YWxDaGFuZ2UgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5sYXBzZXNJbnRlcnZhbENoYW5nZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUodChcIkVhc3kgYm9udXNcIikpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgdChcclxuICAgICAgICAgICAgICAgICAgICBcIlRoZSBlYXN5IGJvbnVzIGFsbG93cyB5b3UgdG8gc2V0IHRoZSBkaWZmZXJlbmNlIGluIGludGVydmFscyBiZXR3ZWVuIGFuc3dlcmluZyBHb29kIGFuZCBFYXN5IG9uIGEgZmxhc2hjYXJkL25vdGUgKG1pbmltdW0gPSAxMDAlKS5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSgodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5lYXN5Qm9udXMgKiAxMDApLnRvU3RyaW5nKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1WYWx1ZTogbnVtYmVyID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlKSAvIDEwMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4obnVtVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG51bVZhbHVlIDwgMS4wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodChcIlRoZSBlYXN5IGJvbnVzIG11c3QgYmUgYXQgbGVhc3QgMTAwLlwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5lYXN5Qm9udXMgKiAxMDApLnRvU3RyaW5nKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5lYXN5Qm9udXMgPSBudW1WYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKHQoXCJQbGVhc2UgcHJvdmlkZSBhIHZhbGlkIG51bWJlci5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInJlc2V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodChcIlJlc2V0IHRvIGRlZmF1bHRcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmVhc3lCb251cyA9IERFRkFVTFRfU0VUVElOR1MuZWFzeUJvbnVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0KFwiTWF4aW11bSBJbnRlcnZhbFwiKSlcclxuICAgICAgICAgICAgLnNldERlc2ModChcIkFsbG93cyB5b3UgdG8gcGxhY2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGludGVydmFsIChkZWZhdWx0ID0gMTAwIHllYXJzKS5cIikpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heGltdW1JbnRlcnZhbC50b1N0cmluZygpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtVmFsdWU6IG51bWJlciA9IE51bWJlci5wYXJzZUludCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG51bVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1WYWx1ZSA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSh0KFwiVGhlIG1heGltdW0gaW50ZXJ2YWwgbXVzdCBiZSBhdCBsZWFzdCAxIGRheS5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldFZhbHVlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tYXhpbXVtSW50ZXJ2YWwudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heGltdW1JbnRlcnZhbCA9IG51bVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UodChcIlBsZWFzZSBwcm92aWRlIGEgdmFsaWQgbnVtYmVyLlwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcCh0KFwiUmVzZXQgdG8gZGVmYXVsdFwiKSlcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4aW11bUludGVydmFsID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERFRkFVTFRfU0VUVElOR1MubWF4aW11bUludGVydmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSh0KFwiTWF4aW11bSBsaW5rIGNvbnRyaWJ1dGlvblwiKSlcclxuICAgICAgICAgICAgLnNldERlc2MoXHJcbiAgICAgICAgICAgICAgICB0KFwiTWF4aW11bSBjb250cmlidXRpb24gb2YgdGhlIHdlaWdodGVkIGVhc2Ugb2YgbGlua2VkIG5vdGVzIHRvIHRoZSBpbml0aWFsIGVhc2UuXCIpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PlxyXG4gICAgICAgICAgICAgICAgc2xpZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldExpbWl0cygwLCAxMDAsIDEpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TGlua0ZhY3RvciAqIDEwMClcclxuICAgICAgICAgICAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heExpbmtGYWN0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInJlc2V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAodChcIlJlc2V0IHRvIGRlZmF1bHRcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heExpbmtGYWN0b3IgPSBERUZBVUxUX1NFVFRJTkdTLm1heExpbmtGYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuaW1wb3J0IHsgU1JTZXR0aW5ncyB9IGZyb20gXCJzcmMvc2V0dGluZ3NcIjtcclxuaW1wb3J0IHsgQ2FyZFR5cGUgfSBmcm9tIFwic3JjL3R5cGVzXCI7XHJcbmltcG9ydCB7IHQgfSBmcm9tIFwic3JjL2xhbmcvaGVscGVyc1wiO1xyXG5cclxuZXhwb3J0IGVudW0gUmV2aWV3UmVzcG9uc2Uge1xyXG4gICAgRWFzeSxcclxuICAgIEdvb2QsXHJcbiAgICBIYXJkLFxyXG4gICAgUmVzZXQsXHJcbn1cclxuXHJcbi8vIEZsYXNoY2FyZHNcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2FyZCB7XHJcbiAgICAvLyBzY2hlZHVsaW5nXHJcbiAgICBpc0R1ZTogYm9vbGVhbjtcclxuICAgIGludGVydmFsPzogbnVtYmVyO1xyXG4gICAgZWFzZT86IG51bWJlcjtcclxuICAgIGRlbGF5QmVmb3JlUmV2aWV3PzogbnVtYmVyO1xyXG4gICAgLy8gbm90ZVxyXG4gICAgbm90ZTogVEZpbGU7XHJcbiAgICBsaW5lTm86IG51bWJlcjtcclxuICAgIC8vIHZpc3VhbHNcclxuICAgIGZyb250OiBzdHJpbmc7XHJcbiAgICBiYWNrOiBzdHJpbmc7XHJcbiAgICBjYXJkVGV4dDogc3RyaW5nO1xyXG4gICAgY29udGV4dDogc3RyaW5nO1xyXG4gICAgLy8gdHlwZXNcclxuICAgIGNhcmRUeXBlOiBDYXJkVHlwZTtcclxuICAgIC8vIGluZm9ybWF0aW9uIGZvciBzaWJsaW5nIGNhcmRzXHJcbiAgICBzaWJsaW5nSWR4OiBudW1iZXI7XHJcbiAgICBzaWJsaW5nczogQ2FyZFtdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGUoXHJcbiAgICByZXNwb25zZTogUmV2aWV3UmVzcG9uc2UsXHJcbiAgICBpbnRlcnZhbDogbnVtYmVyLFxyXG4gICAgZWFzZTogbnVtYmVyLFxyXG4gICAgZGVsYXlCZWZvcmVSZXZpZXc6IG51bWJlcixcclxuICAgIHNldHRpbmdzT2JqOiBTUlNldHRpbmdzLFxyXG4gICAgZHVlRGF0ZXM/OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XHJcbik6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4ge1xyXG4gICAgZGVsYXlCZWZvcmVSZXZpZXcgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKGRlbGF5QmVmb3JlUmV2aWV3IC8gKDI0ICogMzYwMCAqIDEwMDApKSk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlID09PSBSZXZpZXdSZXNwb25zZS5FYXN5KSB7XHJcbiAgICAgICAgZWFzZSArPSAyMDtcclxuICAgICAgICBpbnRlcnZhbCA9ICgoaW50ZXJ2YWwgKyBkZWxheUJlZm9yZVJldmlldykgKiBlYXNlKSAvIDEwMDtcclxuICAgICAgICBpbnRlcnZhbCAqPSBzZXR0aW5nc09iai5lYXN5Qm9udXM7XHJcbiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlID09PSBSZXZpZXdSZXNwb25zZS5Hb29kKSB7XHJcbiAgICAgICAgaW50ZXJ2YWwgPSAoKGludGVydmFsICsgZGVsYXlCZWZvcmVSZXZpZXcgLyAyKSAqIGVhc2UpIC8gMTAwO1xyXG4gICAgfSBlbHNlIGlmIChyZXNwb25zZSA9PT0gUmV2aWV3UmVzcG9uc2UuSGFyZCkge1xyXG4gICAgICAgIGVhc2UgPSBNYXRoLm1heCgxMzAsIGVhc2UgLSAyMCk7XHJcbiAgICAgICAgaW50ZXJ2YWwgPSBNYXRoLm1heChcclxuICAgICAgICAgICAgMSxcclxuICAgICAgICAgICAgKGludGVydmFsICsgZGVsYXlCZWZvcmVSZXZpZXcgLyA0KSAqIHNldHRpbmdzT2JqLmxhcHNlc0ludGVydmFsQ2hhbmdlXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXBsYWNlcyByYW5kb20gZnV6eiB3aXRoIGxvYWQgYmFsYW5jaW5nIG92ZXIgdGhlIGZ1enogaW50ZXJ2YWxcclxuICAgIGlmIChkdWVEYXRlcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaW50ZXJ2YWwgPSBNYXRoLnJvdW5kKGludGVydmFsKTtcclxuICAgICAgICBpZiAoIWR1ZURhdGVzLmhhc093blByb3BlcnR5KGludGVydmFsKSkge1xyXG4gICAgICAgICAgICBkdWVEYXRlc1tpbnRlcnZhbF0gPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZ1enpSYW5nZTogW251bWJlciwgbnVtYmVyXTtcclxuICAgICAgICAvLyBkaXNhYmxlIGZ1enppbmcgZm9yIHNtYWxsIGludGVydmFsc1xyXG4gICAgICAgIGlmIChpbnRlcnZhbCA8PSA0KSB7XHJcbiAgICAgICAgICAgIGZ1enpSYW5nZSA9IFtpbnRlcnZhbCwgaW50ZXJ2YWxdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBmdXp6OiBudW1iZXI7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnZhbCA8IDcpIGZ1enogPSAxO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpbnRlcnZhbCA8IDMwKSBmdXp6ID0gTWF0aC5tYXgoMiwgTWF0aC5mbG9vcihpbnRlcnZhbCAqIDAuMTUpKTtcclxuICAgICAgICAgICAgZWxzZSBmdXp6ID0gTWF0aC5tYXgoNCwgTWF0aC5mbG9vcihpbnRlcnZhbCAqIDAuMDUpKTtcclxuICAgICAgICAgICAgZnV6elJhbmdlID0gW2ludGVydmFsIC0gZnV6eiwgaW50ZXJ2YWwgKyBmdXp6XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGl2bCA9IGZ1enpSYW5nZVswXTsgaXZsIDw9IGZ1enpSYW5nZVsxXTsgaXZsKyspIHtcclxuICAgICAgICAgICAgaWYgKCFkdWVEYXRlcy5oYXNPd25Qcm9wZXJ0eShpdmwpKSB7XHJcbiAgICAgICAgICAgICAgICBkdWVEYXRlc1tpdmxdID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZHVlRGF0ZXNbaXZsXSA8IGR1ZURhdGVzW2ludGVydmFsXSkge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWwgPSBpdmw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR1ZURhdGVzW2ludGVydmFsXSsrO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVydmFsID0gTWF0aC5taW4oaW50ZXJ2YWwsIHNldHRpbmdzT2JqLm1heGltdW1JbnRlcnZhbCk7XHJcblxyXG4gICAgcmV0dXJuIHsgaW50ZXJ2YWw6IE1hdGgucm91bmQoaW50ZXJ2YWwgKiAxMCkgLyAxMCwgZWFzZSB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGV4dEludGVydmFsKGludGVydmFsOiBudW1iZXIsIGlzTW9iaWxlOiBib29sZWFuKTogc3RyaW5nIHtcclxuICAgIGxldCBtOiBudW1iZXIgPSBNYXRoLnJvdW5kKGludGVydmFsIC8gMykgLyAxMCxcclxuICAgICAgICB5OiBudW1iZXIgPSBNYXRoLnJvdW5kKGludGVydmFsIC8gMzYuNSkgLyAxMDtcclxuXHJcbiAgICBpZiAoaXNNb2JpbGUpIHtcclxuICAgICAgICBpZiAoaW50ZXJ2YWwgPCAzMCkgcmV0dXJuIGAke2ludGVydmFsfWRgO1xyXG4gICAgICAgIGVsc2UgaWYgKGludGVydmFsIDwgMzY1KSByZXR1cm4gYCR7bX1tYDtcclxuICAgICAgICBlbHNlIHJldHVybiBgJHt5fXlgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoaW50ZXJ2YWwgPCAzMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJ2YWwgPT09IDEuMCA/IFwiMS4wIFwiICsgdChcImRheVwiKSA6IGludGVydmFsLnRvU3RyaW5nKCkgKyBcIiBcIiArIHQoXCJkYXlzXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaW50ZXJ2YWwgPCAzNjUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG0gPT09IDEuMCA/IFwiMS4wIFwiICsgdChcIm1vbnRoXCIpIDogbS50b1N0cmluZygpICsgXCIgXCIgKyB0KFwibW9udGhzXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB5ID09PSAxLjAgPyBcIjEuMCBcIiArIHQoXCJ5ZWFyXCIpIDogeS50b1N0cmluZygpICsgXCIgXCIgKyB0KFwieWVhcnNcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9vYnNpZGlhbm1kL29ic2lkaWFuLWFwaS9pc3N1ZXMvMTNcclxuXHJcbi8vIGZsYXNoY2FyZHNcclxuXHJcbmV4cG9ydCBlbnVtIENhcmRUeXBlIHtcclxuICAgIFNpbmdsZUxpbmVCYXNpYyxcclxuICAgIFNpbmdsZUxpbmVSZXZlcnNlZCxcclxuICAgIE11bHRpTGluZUJhc2ljLFxyXG4gICAgTXVsdGlMaW5lUmV2ZXJzZWQsXHJcbiAgICBDbG96ZSxcclxufVxyXG4iLCJleHBvcnQgY29uc3QgU0NIRURVTElOR19JTkZPX1JFR0VYOiBSZWdFeHAgPVxyXG4gICAgL14tLS1cXG4oKD86LipcXG4pKilzci1kdWU6ICguKylcXG5zci1pbnRlcnZhbDogKFxcZCspXFxuc3ItZWFzZTogKFxcZCspXFxuKCg/Oi4qXFxuKSopLS0tLztcclxuZXhwb3J0IGNvbnN0IFlBTUxfRlJPTlRfTUFUVEVSX1JFR0VYOiBSZWdFeHAgPSAvXi0tLVxcbigoPzouKlxcbikqPyktLS0vO1xyXG5cclxuZXhwb3J0IGNvbnN0IE1VTFRJX1NDSEVEVUxJTkdfRVhUUkFDVE9SOiBSZWdFeHAgPSAvIShbXFxkLV0rKSwoXFxkKyksKFxcZCspL2dtO1xyXG5leHBvcnQgY29uc3QgTEVHQUNZX1NDSEVEVUxJTkdfRVhUUkFDVE9SOiBSZWdFeHAgPSAvPCEtLVNSOihbXFxkLV0rKSwoXFxkKyksKFxcZCspLS0+L2dtO1xyXG5cclxuZXhwb3J0IGNvbnN0IE9CU0lESUFOX0NIQVJUU19JRDogc3RyaW5nID0gXCJvYnNpZGlhbi1jaGFydHNcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBDUk9TU19IQUlSU19JQ09OOiBzdHJpbmcgPSBgPHBhdGggc3R5bGU9XCIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOm5vbnplcm87ZmlsbDpjdXJyZW50Q29sb3I7ZmlsbC1vcGFjaXR5OjE7XCIgZD1cIk0gOTkuOTIxODc1IDQ3Ljk0MTQwNiBMIDkzLjA3NDIxOSA0Ny45NDE0MDYgQyA5Mi44NDM3NSA0Mi4wMzEyNSA5MS4zOTA2MjUgMzYuMjM4MjgxIDg4LjgwMDc4MSAzMC45MjE4NzUgTCA4NS4zNjcxODggMzIuNTgyMDMxIEMgODcuNjY3OTY5IDM3LjM1NTQ2OSA4OC45NjQ4NDQgNDIuNTUwNzgxIDg5LjE4MzU5NCA0Ny44NDM3NSBMIDgyLjIzODI4MSA0Ny44NDM3NSBDIDgyLjA5NzY1NiA0NC42MTcxODggODEuNTg5ODQ0IDQxLjQxNzk2OSA4MC43MzQzNzUgMzguMzA0Njg4IEwgNzcuMDUwNzgxIDM5LjMzNTkzOCBDIDc3LjgwODU5NCA0Mi4wODk4NDQgNzguMjYxNzE5IDQ0LjkxNzk2OSA3OC40MDYyNSA0Ny43Njk1MzEgTCA2NS44NzEwOTQgNDcuNzY5NTMxIEMgNjQuOTE0MDYyIDQwLjUwNzgxMiA1OS4xNDQ1MzEgMzQuODMyMDMxIDUxLjg3MTA5NCAzMy45OTYwOTQgTCA1MS44NzEwOTQgMjEuMzg2NzE5IEMgNTQuODE2NDA2IDIxLjUwNzgxMiA1Ny43NDIxODggMjEuOTYwOTM4IDYwLjU4NTkzOCAyMi43MzgyODEgTCA2MS42MTcxODggMTkuMDU4NTk0IEMgNTguNDM3NSAxOC4xOTE0MDYgNTUuMTY0MDYyIDE3LjY5MTQwNiA1MS44NzEwOTQgMTcuNTcwMzEyIEwgNTEuODcxMDk0IDEwLjU1MDc4MSBDIDU3LjE2NDA2MiAxMC43Njk1MzEgNjIuMzU1NDY5IDEyLjA2NjQwNiA2Ny4xMzI4MTIgMTQuMzYzMjgxIEwgNjguNzg5MDYyIDEwLjkyOTY4OCBDIDYzLjUgOC4zODI4MTIgNTcuNzM4MjgxIDYuOTUzMTI1IDUxLjg3MTA5NCA2LjczNDM3NSBMIDUxLjg3MTA5NCAwLjAzOTA2MjUgTCA0OC4wNTQ2ODggMC4wMzkwNjI1IEwgNDguMDU0Njg4IDYuNzM0Mzc1IEMgNDIuMTc5Njg4IDYuOTc2NTYyIDM2LjQxNzk2OSA4LjQzMzU5NCAzMS4xMzI4MTIgMTEuMDA3ODEyIEwgMzIuNzkyOTY5IDE0LjQ0MTQwNiBDIDM3LjU2NjQwNiAxMi4xNDA2MjUgNDIuNzYxNzE5IDEwLjg0Mzc1IDQ4LjA1NDY4OCAxMC42MjUgTCA0OC4wNTQ2ODggMTcuNTcwMzEyIEMgNDQuODI4MTI1IDE3LjcxNDg0NCA0MS42Mjg5MDYgMTguMjE4NzUgMzguNTE1NjI1IDE5LjA3ODEyNSBMIDM5LjU0Njg3NSAyMi43NTc4MTIgQyA0Mi4zMjQyMTkgMjEuOTg4MjgxIDQ1LjE3NTc4MSAyMS41MzEyNSA0OC4wNTQ2ODggMjEuMzg2NzE5IEwgNDguMDU0Njg4IDM0LjAzMTI1IEMgNDAuNzk2ODc1IDM0Ljk0OTIxOSAzNS4wODk4NDQgNDAuNjc5Njg4IDM0LjIwMzEyNSA0Ny45NDE0MDYgTCAyMS41IDQ3Ljk0MTQwNiBDIDIxLjYzMjgxMiA0NS4wNDI5NjkgMjIuMDg5ODQ0IDQyLjE3MTg3NSAyMi44NTU0NjkgMzkuMzc1IEwgMTkuMTcxODc1IDM4LjM0Mzc1IEMgMTguMzEyNSA0MS40NTcwMzEgMTcuODA4NTk0IDQ0LjY1NjI1IDE3LjY2NDA2MiA0Ny44ODI4MTIgTCAxMC42NjQwNjIgNDcuODgyODEyIEMgMTAuODgyODEyIDQyLjU4OTg0NCAxMi4xNzk2ODggMzcuMzk0NTMxIDE0LjQ4MDQ2OSAzMi42MjEwOTQgTCAxMS4xMjEwOTQgMzAuOTIxODc1IEMgOC41MzUxNTYgMzYuMjM4MjgxIDcuMDc4MTI1IDQyLjAzMTI1IDYuODQ3NjU2IDQ3Ljk0MTQwNiBMIDAgNDcuOTQxNDA2IEwgMCA1MS43NTM5MDYgTCA2Ljg0NzY1NiA1MS43NTM5MDYgQyA3LjA4OTg0NCA1Ny42MzY3MTkgOC41NDI5NjkgNjMuNDAyMzQ0IDExLjEyMTA5NCA2OC42OTUzMTIgTCAxNC41NTQ2ODggNjcuMDM1MTU2IEMgMTIuMjU3ODEyIDYyLjI2MTcxOSAxMC45NTcwMzEgNTcuMDY2NDA2IDEwLjczODI4MSA1MS43NzM0MzggTCAxNy43NDIxODggNTEuNzczNDM4IEMgMTcuODU1NDY5IDU1LjA0Mjk2OSAxOC4zNDM3NSA1OC4yODkwNjIgMTkuMTkxNDA2IDYxLjQ0NTMxMiBMIDIyLjg3MTA5NCA2MC40MTQwNjIgQyAyMi4wODk4NDQgNTcuNTYyNSAyMS42Mjg5MDYgNTQuNjMyODEyIDIxLjUgNTEuNjc5Njg4IEwgMzQuMjAzMTI1IDUxLjY3OTY4OCBDIDM1LjA1ODU5NCA1OC45Njg3NSA0MC43NzM0MzggNjQuNzM4MjgxIDQ4LjA1NDY4OCA2NS42NjAxNTYgTCA0OC4wNTQ2ODggNzguMzA4NTk0IEMgNDUuMTA1NDY5IDc4LjE4NzUgNDIuMTgzNTk0IDc3LjczMDQ2OSAzOS4zMzU5MzggNzYuOTU3MDMxIEwgMzguMzA0Njg4IDgwLjYzNjcxOSBDIDQxLjQ4ODI4MSA4MS41MTE3MTkgNDQuNzU3ODEyIDgyLjAxNTYyNSA0OC4wNTQ2ODggODIuMTQ0NTMxIEwgNDguMDU0Njg4IDg5LjE0NDUzMSBDIDQyLjc2MTcxOSA4OC45MjU3ODEgMzcuNTY2NDA2IDg3LjYyODkwNiAzMi43OTI5NjkgODUuMzI4MTI1IEwgMzEuMTMyODEyIDg4Ljc2NTYyNSBDIDM2LjQyNTc4MSA5MS4zMTI1IDQyLjE4MzU5NCA5Mi43NDIxODggNDguMDU0Njg4IDkyLjk2MDkzOCBMIDQ4LjA1NDY4OCA5OS45NjA5MzggTCA1MS44NzEwOTQgOTkuOTYwOTM4IEwgNTEuODcxMDk0IDkyLjk2MDkzOCBDIDU3Ljc1IDkyLjcxODc1IDYzLjUxOTUzMSA5MS4yNjU2MjUgNjguODA4NTk0IDg4LjY4NzUgTCA2Ny4xMzI4MTIgODUuMjUzOTA2IEMgNjIuMzU1NDY5IDg3LjU1MDc4MSA1Ny4xNjQwNjIgODguODUxNTYyIDUxLjg3MTA5NCA4OS4wNzAzMTIgTCA1MS44NzEwOTQgODIuMTI1IEMgNTUuMDkzNzUgODEuOTgwNDY5IDU4LjI5Mjk2OSA4MS40NzY1NjIgNjEuNDA2MjUgODAuNjE3MTg4IEwgNjAuMzc4OTA2IDc2LjkzNzUgQyA1Ny41NzQyMTkgNzcuNzAzMTI1IDU0LjY5NTMxMiA3OC4xNTYyNSA1MS43OTI5NjkgNzguMjg5MDYyIEwgNTEuNzkyOTY5IDY1LjY3OTY4OCBDIDU5LjEyMTA5NCA2NC44MjgxMjUgNjQuOTEwMTU2IDU5LjA2MjUgNjUuNzk2ODc1IDUxLjczNDM3NSBMIDc4LjM2NzE4OCA1MS43MzQzNzUgQyA3OC4yNSA1NC43MzQzNzUgNzcuNzg5MDYyIDU3LjcxMDkzOCA3Ni45OTIxODggNjAuNjA1NDY5IEwgODAuNjc1NzgxIDYxLjYzNjcxOSBDIDgxLjU1ODU5NCA1OC40MDYyNSA4Mi4wNjY0MDYgNTUuMDgyMDMxIDgyLjE4MzU5NCA1MS43MzQzNzUgTCA4OS4yNjE3MTkgNTEuNzM0Mzc1IEMgODkuMDQyOTY5IDU3LjAzMTI1IDg3Ljc0MjE4OCA2Mi4yMjI2NTYgODUuNDQ1MzEyIDY2Ljk5NjA5NCBMIDg4Ljg3ODkwNiA2OC42NTYyNSBDIDkxLjQ1NzAzMSA2My4zNjcxODggOTIuOTEwMTU2IDU3LjU5NzY1NiA5My4xNTIzNDQgNTEuNzE4NzUgTCAxMDAgNTEuNzE4NzUgWiBNIDYyLjAxOTUzMSA1MS43MzQzNzUgQyA2MS4xODM1OTQgNTYuOTQ1MzEyIDU3LjA4NTkzOCA2MS4wMjM0MzggNTEuODcxMDk0IDYxLjgyODEyNSBMIDUxLjg3MTA5NCA1Ny41MTU2MjUgTCA0OC4wNTQ2ODggNTcuNTE1NjI1IEwgNDguMDU0Njg4IDYxLjgwODU5NCBDIDQyLjkxMDE1NiA2MC45NDkyMTkgMzguODg2NzE5IDU2LjkwMjM0NCAzOC4wNTg1OTQgNTEuNzUzOTA2IEwgNDIuMzMyMDMxIDUxLjc1MzkwNiBMIDQyLjMzMjAzMSA0Ny45NDE0MDYgTCAzOC4wNTg1OTQgNDcuOTQxNDA2IEMgMzguODg2NzE5IDQyLjc4OTA2MiA0Mi45MTAxNTYgMzguNzQ2MDk0IDQ4LjA1NDY4OCAzNy44ODY3MTkgTCA0OC4wNTQ2ODggNDIuMTc5Njg4IEwgNTEuODcxMDk0IDQyLjE3OTY4OCBMIDUxLjg3MTA5NCAzNy44NDc2NTYgQyA1Ny4wNzgxMjUgMzguNjQ4NDM4IDYxLjE3OTY4OCA0Mi43MTg3NSA2Mi4wMTk1MzEgNDcuOTIxODc1IEwgNTcuNzA3MDMxIDQ3LjkyMTg3NSBMIDU3LjcwNzAzMSA1MS43MzQzNzUgWiBNIDYyLjAxOTUzMSA1MS43MzQzNzUgXCIvPmA7XHJcbmV4cG9ydCBjb25zdCBDT0xMQVBTRV9JQ09OOiBzdHJpbmcgPSBgPHN2ZyB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiB3aWR0aD1cIjhcIiBoZWlnaHQ9XCI4XCIgY2xhc3M9XCJyaWdodC10cmlhbmdsZVwiPjxwYXRoIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBkPVwiTTk0LjksMjAuOGMtMS40LTIuNS00LjEtNC4xLTcuMS00LjFIMTIuMmMtMywwLTUuNywxLjYtNy4xLDQuMWMtMS4zLDIuNC0xLjIsNS4yLDAuMiw3LjZMNDMuMSw4OGMxLjUsMi4zLDQsMy43LDYuOSwzLjcgczUuNC0xLjQsNi45LTMuN2wzNy44LTU5LjZDOTYuMSwyNiw5Ni4yLDIzLjIsOTQuOSwyMC44TDk0LjksMjAuOHpcIj48L3BhdGg+PC9zdmc+YDtcclxuIiwidHlwZSBIZXggPSBudW1iZXI7XHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUga2V5cyBvZiBhbiBvYmplY3Qgd2l0aCB0eXBlIGAoa2V5b2YgVClbXWBcclxuICogaW5zdGVhZCBvZiBgc3RyaW5nW11gXHJcbiAqIFBsZWFzZSBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU5NDU5MDAwIGZvciBtb3JlIGRldGFpbHNcclxuICpcclxuICogQHBhcmFtIG9iaiAtIEFuIG9iamVjdFxyXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiB0aGUga2V5cyBvZiBgb2JqYCB3aXRoIHR5cGUgYChrZXlvZiBUKVtdYFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGdldEtleXNQcmVzZXJ2ZVR5cGUgPSBPYmplY3Qua2V5cyBhcyA8VCBleHRlbmRzIG9iamVjdD4ob2JqOiBUKSA9PiBBcnJheTxrZXlvZiBUPjtcclxuXHJcbi8qKlxyXG4gKiBFc2NhcGVzIHRoZSBpbnB1dCBzdHJpbmcgc28gdGhhdCBpdCBjYW4gYmUgY29udmVydGVkIHRvIGEgcmVnZXhcclxuICogd2hpbGUgbWFraW5nIHN1cmUgdGhhdCBzeW1ib2xzIGxpa2UgYD9gIGFuZCBgKmAgYXJlbid0IGludGVycHJldGVkXHJcbiAqIGFzIHJlZ2V4IHNwZWNpYWxzLlxyXG4gKiBQbGVhc2Ugc2VlIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2IGZvciBtb3JlIGRldGFpbHNcclxuICpcclxuICogQHBhcmFtIHN0ciAtIFRoZSBzdHJpbmcgdG8gYmUgZXNjYXBlZFxyXG4gKiBAcmV0dXJucyBUaGUgZXNjYXBlZCBzdHJpbmdcclxuICovXHJcbmV4cG9ydCBjb25zdCBlc2NhcGVSZWdleFN0cmluZyA9ICh0ZXh0OiBzdHJpbmcpID0+IHRleHQucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGN5cmI1MyBoYXNoIChoZXggc3RyaW5nKSBvZiB0aGUgaW5wdXQgc3RyaW5nXHJcbiAqIFBsZWFzZSBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzUyMTcxNDgwIGZvciBtb3JlIGRldGFpbHNcclxuICpcclxuICogQHBhcmFtIHN0ciAtIFRoZSBzdHJpbmcgdG8gYmUgaGFzaGVkXHJcbiAqIEBwYXJhbSBzZWVkIC0gVGhlIHNlZWQgZm9yIHRoZSBjeXJiNTMgZnVuY3Rpb25cclxuICogQHJldHVybnMgVGhlIGN5cmI1MyBoYXNoIChoZXggc3RyaW5nKSBvZiBgc3RyYCBzZWVkZWQgdXNpbmcgYHNlZWRgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3lyYjUzKHN0cjogc3RyaW5nLCBzZWVkOiBudW1iZXIgPSAwKTogc3RyaW5nIHtcclxuICAgIGxldCBoMTogSGV4ID0gMHhkZWFkYmVlZiBeIHNlZWQsXHJcbiAgICAgICAgaDI6IEhleCA9IDB4NDFjNmNlNTcgXiBzZWVkO1xyXG4gICAgZm9yIChsZXQgaSA9IDAsIGNoOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY2ggPSBzdHIuY2hhckNvZGVBdChpKTtcclxuICAgICAgICBoMSA9IE1hdGguaW11bChoMSBeIGNoLCAyNjU0NDM1NzYxKTtcclxuICAgICAgICBoMiA9IE1hdGguaW11bChoMiBeIGNoLCAxNTk3MzM0Njc3KTtcclxuICAgIH1cclxuICAgIGgxID0gTWF0aC5pbXVsKGgxIF4gKGgxID4+PiAxNiksIDIyNDY4MjI1MDcpIF4gTWF0aC5pbXVsKGgyIF4gKGgyID4+PiAxMyksIDMyNjY0ODk5MDkpO1xyXG4gICAgaDIgPSBNYXRoLmltdWwoaDIgXiAoaDIgPj4+IDE2KSwgMjI0NjgyMjUwNykgXiBNYXRoLmltdWwoaDEgXiAoaDEgPj4+IDEzKSwgMzI2NjQ4OTkwOSk7XHJcbiAgICByZXR1cm4gKDQyOTQ5NjcyOTYgKiAoMjA5NzE1MSAmIGgyKSArIChoMSA+Pj4gMCkpLnRvU3RyaW5nKDE2KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgbGVnYWN5IDxrZXksIHZhbHVlPiBwYWlycyB0aGF0IG5vIGxvbmdlciBuZWVkIHRvIGJlIHNhdmVkXHJcbiAqXHJcbiAqIEBwYXJhbSBjdXJyZW50RGF0YSAtIERhdGEgdG8gY2xlYW4gdXBcclxuICogQHBhcmFtIGRlZmF1bHREYXRhIC0gVGVtcGxhdGUgdG8gbG9va3VwIGN1cnJlbnRseSB1c2VkIGtleXMgZnJvbVxyXG4gKiBAcmV0dXJucyB0aGUgY2xlYW5lZCB1cCByZWNvcmRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVMZWdhY3lLZXlzKFxyXG4gICAgY3VycmVudERhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4sXHJcbiAgICBkZWZhdWx0RGF0YTogUmVjb3JkPHN0cmluZywgYW55PlxyXG4pOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhjdXJyZW50RGF0YSkpIHtcclxuICAgICAgICBpZiAoIWRlZmF1bHREYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGN1cnJlbnREYXRhW2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGN1cnJlbnREYXRhO1xyXG59XHJcbiIsImltcG9ydCB7IE1vZGFsLCBBcHAsIE1hcmtkb3duUmVuZGVyZXIsIE5vdGljZSwgUGxhdGZvcm0sIFRGaWxlLCBNYXJrZG93blZpZXcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB0eXBlIFNSUGx1Z2luIGZyb20gXCJzcmMvbWFpblwiO1xyXG5pbXBvcnQgeyBDYXJkLCBzY2hlZHVsZSwgdGV4dEludGVydmFsLCBSZXZpZXdSZXNwb25zZSB9IGZyb20gXCJzcmMvc2NoZWR1bGluZ1wiO1xyXG5pbXBvcnQgeyBDYXJkVHlwZSB9IGZyb20gXCJzcmMvdHlwZXNcIjtcclxuaW1wb3J0IHtcclxuICAgIENPTExBUFNFX0lDT04sXHJcbiAgICBNVUxUSV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUixcclxuICAgIExFR0FDWV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUixcclxufSBmcm9tIFwic3JjL2NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVSZWdleFN0cmluZywgY3lyYjUzIH0gZnJvbSBcInNyYy91dGlsc1wiO1xyXG5pbXBvcnQgeyB0IH0gZnJvbSBcInNyYy9sYW5nL2hlbHBlcnNcIjtcclxuXHJcbmV4cG9ydCBlbnVtIEZsYXNoY2FyZE1vZGFsTW9kZSB7XHJcbiAgICBEZWNrc0xpc3QsXHJcbiAgICBGcm9udCxcclxuICAgIEJhY2ssXHJcbiAgICBDbG9zZWQsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGbGFzaGNhcmRNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICAgIHB1YmxpYyBwbHVnaW46IFNSUGx1Z2luO1xyXG4gICAgcHVibGljIGFuc3dlckJ0bjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZmxhc2hjYXJkVmlldzogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgaGFyZEJ0bjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZ29vZEJ0bjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgZWFzeUJ0bjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVzcG9uc2VEaXY6IEhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIGZpbGVMaW5rVmlldzogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgcmVzZXRMaW5rVmlldzogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgY29udGV4dFZpZXc6IEhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIGN1cnJlbnRDYXJkOiBDYXJkO1xyXG4gICAgcHVibGljIGN1cnJlbnRDYXJkSWR4OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgY3VycmVudERlY2s6IERlY2s7XHJcbiAgICBwdWJsaWMgY2hlY2tEZWNrOiBEZWNrO1xyXG4gICAgcHVibGljIG1vZGU6IEZsYXNoY2FyZE1vZGFsTW9kZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTUlBsdWdpbikge1xyXG4gICAgICAgIHN1cGVyKGFwcCk7XHJcblxyXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG5cclxuICAgICAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0KFwiRGVja3NcIikpO1xyXG5cclxuICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWwuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkSGVpZ2h0UGVyY2VudGFnZSArIFwiJVwiO1xyXG4gICAgICAgIHRoaXMubW9kYWxFbC5zdHlsZS53aWR0aCA9IHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZmxhc2hjYXJkV2lkdGhQZXJjZW50YWdlICsgXCIlXCI7XHJcblxyXG4gICAgICAgIHRoaXMuY29udGVudEVsLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xyXG4gICAgICAgIHRoaXMuY29udGVudEVsLnN0eWxlLmhlaWdodCA9IFwiOTIlXCI7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJzci1tb2RhbC1jb250ZW50XCIpO1xyXG5cclxuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5cHJlc3MgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlICE9PSBGbGFzaGNhcmRNb2RhbE1vZGUuRGVja3NMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb2RlICE9PSBGbGFzaGNhcmRNb2RhbE1vZGUuQ2xvc2VkICYmIGUuY29kZSA9PT0gXCJLZXlTXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREZWNrLmRlbGV0ZUZsYXNoY2FyZEF0SW5kZXgoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmRJZHgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuaXNEdWVcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnVyeVNpYmxpbmdDYXJkcyhmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50RGVjay5uZXh0Q2FyZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RlID09PSBGbGFzaGNhcmRNb2RhbE1vZGUuRnJvbnQgJiZcclxuICAgICAgICAgICAgICAgICAgICAoZS5jb2RlID09PSBcIlNwYWNlXCIgfHwgZS5jb2RlID09PSBcIkVudGVyXCIpXHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dBbnN3ZXIoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5tb2RlID09PSBGbGFzaGNhcmRNb2RhbE1vZGUuQmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmNvZGUgPT09IFwiTnVtcGFkMVwiIHx8IGUuY29kZSA9PT0gXCJEaWdpdDFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuSGFyZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLmNvZGUgPT09IFwiTnVtcGFkMlwiIHx8IGUuY29kZSA9PT0gXCJEaWdpdDJcIiB8fCBlLmNvZGUgPT09IFwiU3BhY2VcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuR29vZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLmNvZGUgPT09IFwiTnVtcGFkM1wiIHx8IGUuY29kZSA9PT0gXCJEaWdpdDNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuRWFzeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLmNvZGUgPT09IFwiTnVtcGFkMFwiIHx8IGUuY29kZSA9PT0gXCJEaWdpdDBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuUmVzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZGVja3NMaXN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25DbG9zZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLm1vZGUgPSBGbGFzaGNhcmRNb2RhbE1vZGUuQ2xvc2VkO1xyXG4gICAgfVxyXG5cclxuICAgIGRlY2tzTGlzdCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLm1vZGUgPSBGbGFzaGNhcmRNb2RhbE1vZGUuRGVja3NMaXN0O1xyXG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHQoXCJEZWNrc1wiKSk7XHJcbiAgICAgICAgdGhpcy50aXRsZUVsLmlubmVySFRNTCArPVxyXG4gICAgICAgICAgICAnPHAgc3R5bGU9XCJtYXJnaW46MHB4O2xpbmUtaGVpZ2h0OjEycHg7XCI+JyArXHJcbiAgICAgICAgICAgICc8c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IzRjYWY1MDtjb2xvcjojZmZmZmZmO1wiIGFyaWEtbGFiZWw9XCInICtcclxuICAgICAgICAgICAgdChcIkR1ZSBjYXJkc1wiKSArXHJcbiAgICAgICAgICAgICdcIiBjbGFzcz1cInRhZy1wYW5lLXRhZy1jb3VudCB0cmVlLWl0ZW0tZmxhaXJcIj4nICtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGVja1RyZWUuZHVlRmxhc2hjYXJkc0NvdW50ICtcclxuICAgICAgICAgICAgXCI8L3NwYW4+XCIgK1xyXG4gICAgICAgICAgICAnPHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiMyMTk2ZjM7XCIgYXJpYS1sYWJlbD1cIicgK1xyXG4gICAgICAgICAgICB0KFwiTmV3IGNhcmRzXCIpICtcclxuICAgICAgICAgICAgJ1wiIGNsYXNzPVwidGFnLXBhbmUtdGFnLWNvdW50IHRyZWUtaXRlbS1mbGFpciBzci1kZWNrLWNvdW50c1wiPicgK1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5kZWNrVHJlZS5uZXdGbGFzaGNhcmRzQ291bnQgK1xyXG4gICAgICAgICAgICBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICc8c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I2ZmNzA0MztcIiBhcmlhLWxhYmVsPVwiJyArXHJcbiAgICAgICAgICAgIHQoXCJUb3RhbCBjYXJkc1wiKSArXHJcbiAgICAgICAgICAgICdcIiBjbGFzcz1cInRhZy1wYW5lLXRhZy1jb3VudCB0cmVlLWl0ZW0tZmxhaXIgc3ItZGVjay1jb3VudHNcIj4nICtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGVja1RyZWUudG90YWxGbGFzaGNhcmRzICtcclxuICAgICAgICAgICAgXCI8L3NwYW4+XCIgK1xyXG4gICAgICAgICAgICBcIjwvcD5cIjtcclxuICAgICAgICB0aGlzLmNvbnRlbnRFbC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY29udGVudEVsLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3ItZmxhc2hjYXJkLXZpZXdcIik7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRlY2sgb2YgdGhpcy5wbHVnaW4uZGVja1RyZWUuc3ViZGVja3MpIHtcclxuICAgICAgICAgICAgZGVjay5yZW5kZXIodGhpcy5jb250ZW50RWwsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXR1cENhcmRzVmlldygpIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnRFbC5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgICAgICB0aGlzLmZpbGVMaW5rVmlldyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdihcInNyLWxpbmtcIik7XHJcbiAgICAgICAgdGhpcy5maWxlTGlua1ZpZXcuc2V0VGV4dCh0KFwiT3BlbiBmaWxlXCIpKTtcclxuICAgICAgICBpZiAodGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5zaG93RmlsZU5hbWVJbkZpbGVMaW5rKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsZUxpbmtWaWV3LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdChcIk9wZW4gZmlsZVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZmlsZUxpbmtWaWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoXykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiEub3BlbkZpbGUodGhpcy5jdXJyZW50Q2FyZC5ub3RlKTtcclxuICAgICAgICAgICAgbGV0IGFjdGl2ZVZpZXc6IE1hcmtkb3duVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldykhO1xyXG4gICAgICAgICAgICBhY3RpdmVWaWV3LmVkaXRvci5zZXRDdXJzb3Ioe1xyXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy5jdXJyZW50Q2FyZC5saW5lTm8sXHJcbiAgICAgICAgICAgICAgICBjaDogMCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVzZXRMaW5rVmlldyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdihcInNyLWxpbmtcIik7XHJcbiAgICAgICAgdGhpcy5yZXNldExpbmtWaWV3LnNldFRleHQodChcIlJlc2V0IGNhcmQncyBwcm9ncmVzc1wiKSk7XHJcbiAgICAgICAgdGhpcy5yZXNldExpbmtWaWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoXykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuUmVzZXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMucmVzZXRMaW5rVmlldy5zdHlsZS5mbG9hdCA9IFwicmlnaHRcIjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Muc2hvd0NvbnRleHRJbkNhcmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dFZpZXcgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0Vmlldy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLWNvbnRleHRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZsYXNoY2FyZFZpZXcgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5mbGFzaGNhcmRWaWV3LnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3ItZmxhc2hjYXJkLXZpZXdcIik7XHJcblxyXG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoXCJzci1yZXNwb25zZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5oYXJkQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLmhhcmRCdG4uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzci1oYXJkLWJ0blwiKTtcclxuICAgICAgICB0aGlzLmhhcmRCdG4uc2V0VGV4dCh0KFwiSGFyZFwiKSk7XHJcbiAgICAgICAgdGhpcy5oYXJkQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoXykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuSGFyZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZURpdi5hcHBlbmRDaGlsZCh0aGlzLmhhcmRCdG4pO1xyXG5cclxuICAgICAgICB0aGlzLmdvb2RCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHRoaXMuZ29vZEJ0bi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLWdvb2QtYnRuXCIpO1xyXG4gICAgICAgIHRoaXMuZ29vZEJ0bi5zZXRUZXh0KHQoXCJHb29kXCIpKTtcclxuICAgICAgICB0aGlzLmdvb2RCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChfKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JldmlldyhSZXZpZXdSZXNwb25zZS5Hb29kKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnJlc3BvbnNlRGl2LmFwcGVuZENoaWxkKHRoaXMuZ29vZEJ0bik7XHJcblxyXG4gICAgICAgIHRoaXMuZWFzeUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgdGhpcy5lYXN5QnRuLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3ItZWFzeS1idG5cIik7XHJcbiAgICAgICAgdGhpcy5lYXN5QnRuLnNldFRleHQodChcIkVhc3lcIikpO1xyXG4gICAgICAgIHRoaXMuZWFzeUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmV2aWV3KFJldmlld1Jlc3BvbnNlLkVhc3kpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYuYXBwZW5kQ2hpbGQodGhpcy5lYXN5QnRuKTtcclxuICAgICAgICB0aGlzLnJlc3BvbnNlRGl2LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgdGhpcy5hbnN3ZXJCdG4gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcclxuICAgICAgICB0aGlzLmFuc3dlckJ0bi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLXNob3ctYW5zd2VyXCIpO1xyXG4gICAgICAgIHRoaXMuYW5zd2VyQnRuLnNldFRleHQodChcIlNob3cgQW5zd2VyXCIpKTtcclxuICAgICAgICB0aGlzLmFuc3dlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zaG93QW5zd2VyKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0Fuc3dlcigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLm1vZGUgPSBGbGFzaGNhcmRNb2RhbE1vZGUuQmFjaztcclxuXHJcbiAgICAgICAgdGhpcy5hbnN3ZXJCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYuc3R5bGUuZGlzcGxheSA9IFwiZ3JpZFwiO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2FyZC5pc0R1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0TGlua1ZpZXcuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2FyZC5jYXJkVHlwZSAhPT0gQ2FyZFR5cGUuQ2xvemUpIHtcclxuICAgICAgICAgICAgbGV0IGhyOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoclwiKTtcclxuICAgICAgICAgICAgaHIuc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzci1oci1jYXJkLWRpdmlkZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5mbGFzaGNhcmRWaWV3LmFwcGVuZENoaWxkKGhyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmZsYXNoY2FyZFZpZXcuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVuZGVyTWFya2Rvd25XcmFwcGVyKHRoaXMuY3VycmVudENhcmQuYmFjaywgdGhpcy5mbGFzaGNhcmRWaWV3KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBwcm9jZXNzUmV2aWV3KHJlc3BvbnNlOiBSZXZpZXdSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGxldCBpbnRlcnZhbDogbnVtYmVyLCBlYXNlOiBudW1iZXIsIGR1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50RGVjay5kZWxldGVGbGFzaGNhcmRBdEluZGV4KHRoaXMuY3VycmVudENhcmRJZHgsIHRoaXMuY3VycmVudENhcmQuaXNEdWUpO1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPT0gUmV2aWV3UmVzcG9uc2UuUmVzZXQpIHtcclxuICAgICAgICAgICAgLy8gc2NoZWR1bGVkIGNhcmRcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuaXNEdWUpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzY2hlZE9iajogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHNjaGVkdWxlKFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuaW50ZXJ2YWwhLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuZWFzZSEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5kZWxheUJlZm9yZVJldmlldyEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kdWVEYXRlc0ZsYXNoY2FyZHNcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnZhbCA9IHNjaGVkT2JqLmludGVydmFsO1xyXG4gICAgICAgICAgICAgICAgZWFzZSA9IHNjaGVkT2JqLmVhc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2NoZWRPYmo6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSBzY2hlZHVsZShcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgICAgICAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFzZUVhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgMCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmR1ZURhdGVzRmxhc2hjYXJkc1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGludGVydmFsID0gc2NoZWRPYmouaW50ZXJ2YWw7XHJcbiAgICAgICAgICAgICAgICBlYXNlID0gc2NoZWRPYmouZWFzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZHVlID0gd2luZG93Lm1vbWVudChEYXRlLm5vdygpICsgaW50ZXJ2YWwgKiAyNCAqIDM2MDAgKiAxMDAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmludGVydmFsID0gMS4wO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmVhc2UgPSB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJhc2VFYXNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2FyZC5pc0R1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50RGVjay5kdWVGbGFzaGNhcmRzLnB1c2godGhpcy5jdXJyZW50Q2FyZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREZWNrLm5ld0ZsYXNoY2FyZHMucHVzaCh0aGlzLmN1cnJlbnRDYXJkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkdWUgPSB3aW5kb3cubW9tZW50KERhdGUubm93KCkpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHQoXCJDYXJkJ3MgcHJvZ3Jlc3MgaGFzIGJlZW4gcmVzZXQuXCIpKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGVjay5uZXh0Q2FyZCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGR1ZVN0cmluZzogc3RyaW5nID0gZHVlLmZvcm1hdChcIllZWVktTU0tRERcIik7XHJcblxyXG4gICAgICAgIGxldCBmaWxlVGV4dDogc3RyaW5nID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZCh0aGlzLmN1cnJlbnRDYXJkLm5vdGUpO1xyXG4gICAgICAgIGxldCByZXBsYWNlbWVudFJlZ2V4ID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdleFN0cmluZyh0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0KSwgXCJnbVwiKTtcclxuXHJcbiAgICAgICAgbGV0IHNlcDogc3RyaW5nID0gdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5jYXJkQ29tbWVudE9uU2FtZUxpbmUgPyBcIiBcIiA6IFwiXFxuXCI7XHJcbiAgICAgICAgLy8gT3ZlcnJpZGUgc2VwYXJhdG9yIGlmIGxhc3QgYmxvY2sgaXMgYSBjb2RlYmxvY2tcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dC5lbmRzV2l0aChcImBgYFwiKSAmJiBzZXAgIT09IFwiXFxuXCIpIHtcclxuICAgICAgICAgICAgc2VwID0gXCJcXG5cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGlmIHdlJ3JlIGFkZGluZyBzY2hlZHVsaW5nIGluZm9ybWF0aW9uIHRvIHRoZSBmbGFzaGNhcmRcclxuICAgICAgICAvLyBmb3IgdGhlIGZpcnN0IHRpbWVcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dC5sYXN0SW5kZXhPZihcIjwhLS1TUjpcIikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQgPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCArIHNlcCArIGA8IS0tU1I6ISR7ZHVlU3RyaW5nfSwke2ludGVydmFsfSwke2Vhc2V9LS0+YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgc2NoZWR1bGluZzogUmVnRXhwTWF0Y2hBcnJheVtdID0gW1xyXG4gICAgICAgICAgICAgICAgLi4udGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dC5tYXRjaEFsbChNVUxUSV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUiksXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIGlmIChzY2hlZHVsaW5nLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgc2NoZWR1bGluZyA9IFsuLi50aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0Lm1hdGNoQWxsKExFR0FDWV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUildO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgY3VyckNhcmRTY2hlZDogc3RyaW5nW10gPSBbXCIwXCIsIGR1ZVN0cmluZywgaW50ZXJ2YWwudG9TdHJpbmcoKSwgZWFzZS50b1N0cmluZygpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuaXNEdWUpIHtcclxuICAgICAgICAgICAgICAgIHNjaGVkdWxpbmdbdGhpcy5jdXJyZW50Q2FyZC5zaWJsaW5nSWR4XSA9IGN1cnJDYXJkU2NoZWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzY2hlZHVsaW5nLnB1c2goY3VyckNhcmRTY2hlZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQgPSB0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0LnJlcGxhY2UoLzwhLS1TUjouKy0tPi9nbSwgXCJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQgKz0gXCI8IS0tU1I6XCI7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWR1bGluZy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCArPSBgISR7c2NoZWR1bGluZ1tpXVsxXX0sJHtzY2hlZHVsaW5nW2ldWzJdfSwke3NjaGVkdWxpbmdbaV1bM119YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0ICs9IFwiLS0+XCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaWxlVGV4dCA9IGZpbGVUZXh0LnJlcGxhY2UocmVwbGFjZW1lbnRSZWdleCwgKF8pID0+IHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQpO1xyXG4gICAgICAgIGZvciAobGV0IHNpYmxpbmcgb2YgdGhpcy5jdXJyZW50Q2FyZC5zaWJsaW5ncykge1xyXG4gICAgICAgICAgICBzaWJsaW5nLmNhcmRUZXh0ID0gdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYnVyeVNpYmxpbmdDYXJkcykge1xyXG4gICAgICAgICAgICB0aGlzLmJ1cnlTaWJsaW5nQ2FyZHModHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodGhpcy5jdXJyZW50Q2FyZC5ub3RlLCBmaWxlVGV4dCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50RGVjay5uZXh0Q2FyZCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBidXJ5U2libGluZ0NhcmRzKHRpbGxOZXh0RGF5OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgaWYgKHRpbGxOZXh0RGF5KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuYnVyeUxpc3QucHVzaChjeXJiNTModGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCkpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgc2libGluZyBvZiB0aGlzLmN1cnJlbnRDYXJkLnNpYmxpbmdzKSB7XHJcbiAgICAgICAgICAgIGxldCBkdWVJZHggPSB0aGlzLmN1cnJlbnREZWNrLmR1ZUZsYXNoY2FyZHMuaW5kZXhPZihzaWJsaW5nKTtcclxuICAgICAgICAgICAgbGV0IG5ld0lkeCA9IHRoaXMuY3VycmVudERlY2submV3Rmxhc2hjYXJkcy5pbmRleE9mKHNpYmxpbmcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGR1ZUlkeCAhPT0gLTEpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREZWNrLmRlbGV0ZUZsYXNoY2FyZEF0SW5kZXgoXHJcbiAgICAgICAgICAgICAgICAgICAgZHVlSWR4LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudERlY2suZHVlRmxhc2hjYXJkc1tkdWVJZHhdLmlzRHVlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChuZXdJZHggIT09IC0xKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50RGVjay5kZWxldGVGbGFzaGNhcmRBdEluZGV4KFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld0lkeCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREZWNrLm5ld0ZsYXNoY2FyZHNbbmV3SWR4XS5pc0R1ZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2xpZ2h0bHkgbW9kaWZpZWQgdmVyc2lvbiBvZiB0aGUgcmVuZGVyTWFya2Rvd24gZnVuY3Rpb24gaW5cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZ21leWVycy9vYnNpZGlhbi1rYW5iYW4vYmxvYi9tYWluL3NyYy9LYW5iYW5WaWV3LnRzeFxyXG4gICAgYXN5bmMgcmVuZGVyTWFya2Rvd25XcmFwcGVyKG1hcmtkb3duU3RyaW5nOiBzdHJpbmcsIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIE1hcmtkb3duUmVuZGVyZXIucmVuZGVyTWFya2Rvd24oXHJcbiAgICAgICAgICAgIG1hcmtkb3duU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250YWluZXJFbCxcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5ub3RlLnBhdGgsXHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb250YWluZXJFbC5maW5kQWxsKFwiLmludGVybmFsLWVtYmVkXCIpLmZvckVhY2goKGVsKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBzcmM6IHN0cmluZyA9IGVsLmdldEF0dHJpYnV0ZShcInNyY1wiKSE7XHJcbiAgICAgICAgICAgIGxldCB0YXJnZXQ6IFRGaWxlIHwgbnVsbCB8IGZhbHNlID1cclxuICAgICAgICAgICAgICAgIHR5cGVvZiBzcmMgPT09IFwic3RyaW5nXCIgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHNyYywgdGhpcy5jdXJyZW50Q2FyZC5ub3RlLnBhdGgpO1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVEZpbGUgJiYgdGFyZ2V0LmV4dGVuc2lvbiAhPT0gXCJtZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgZWwuY3JlYXRlRWwoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpbWdcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aCh0YXJnZXQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgKGltZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuaGFzQXR0cmlidXRlKFwid2lkdGhcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgZWwuZ2V0QXR0cmlidXRlKFwid2lkdGhcIikhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpbWcuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxMDAlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuaGFzQXR0cmlidXRlKFwiYWx0XCIpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLnNldEF0dHJpYnV0ZShcImFsdFwiLCBlbC5nZXRBdHRyaWJ1dGUoXCJhbHRcIikhKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgZWwuYWRkQ2xhc3NlcyhbXCJpbWFnZS1lbWJlZFwiLCBcImlzLWxvYWRlZFwiXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZpbGUgZG9lcyBub3QgZXhpc3RcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBkZWFkIGxpbmtcclxuICAgICAgICAgICAgaWYgKHRhcmdldCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZWwuaW5uZXJUZXh0ID0gc3JjO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEZWNrIHtcclxuICAgIHB1YmxpYyBkZWNrTmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIG5ld0ZsYXNoY2FyZHM6IENhcmRbXTtcclxuICAgIHB1YmxpYyBuZXdGbGFzaGNhcmRzQ291bnQ6IG51bWJlciA9IDA7IC8vIGNvdW50cyB0aG9zZSBpbiBzdWJkZWNrcyB0b29cclxuICAgIHB1YmxpYyBkdWVGbGFzaGNhcmRzOiBDYXJkW107XHJcbiAgICBwdWJsaWMgZHVlRmxhc2hjYXJkc0NvdW50OiBudW1iZXIgPSAwOyAvLyBjb3VudHMgdGhvc2UgaW4gc3ViZGVja3MgdG9vXHJcbiAgICBwdWJsaWMgdG90YWxGbGFzaGNhcmRzOiBudW1iZXIgPSAwOyAvLyBjb3VudHMgdGhvc2UgaW4gc3ViZGVja3MgdG9vXHJcbiAgICBwdWJsaWMgc3ViZGVja3M6IERlY2tbXTtcclxuICAgIHB1YmxpYyBwYXJlbnQ6IERlY2sgfCBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGRlY2tOYW1lOiBzdHJpbmcsIHBhcmVudDogRGVjayB8IG51bGwpIHtcclxuICAgICAgICB0aGlzLmRlY2tOYW1lID0gZGVja05hbWU7XHJcbiAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzID0gW107XHJcbiAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkc0NvdW50ID0gMDtcclxuICAgICAgICB0aGlzLnRvdGFsRmxhc2hjYXJkcyA9IDA7XHJcbiAgICAgICAgdGhpcy5zdWJkZWNrcyA9IFtdO1xyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZURlY2soZGVja1BhdGg6IHN0cmluZ1tdKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGRlY2tQYXRoLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVja05hbWU6IHN0cmluZyA9IGRlY2tQYXRoLnNoaWZ0KCkhO1xyXG4gICAgICAgIGZvciAobGV0IGRlY2sgb2YgdGhpcy5zdWJkZWNrcykge1xyXG4gICAgICAgICAgICBpZiAoZGVja05hbWUgPT09IGRlY2suZGVja05hbWUpIHtcclxuICAgICAgICAgICAgICAgIGRlY2suY3JlYXRlRGVjayhkZWNrUGF0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkZWNrOiBEZWNrID0gbmV3IERlY2soZGVja05hbWUsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMuc3ViZGVja3MucHVzaChkZWNrKTtcclxuICAgICAgICBkZWNrLmNyZWF0ZURlY2soZGVja1BhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydEZsYXNoY2FyZChkZWNrUGF0aDogc3RyaW5nW10sIGNhcmRPYmo6IENhcmQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoY2FyZE9iai5pc0R1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmR1ZUZsYXNoY2FyZHNDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV3Rmxhc2hjYXJkc0NvdW50Kys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudG90YWxGbGFzaGNhcmRzKys7XHJcblxyXG4gICAgICAgIGlmIChkZWNrUGF0aC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKGNhcmRPYmouaXNEdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkcy5wdXNoKGNhcmRPYmopO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzLnB1c2goY2FyZE9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRlY2tOYW1lOiBzdHJpbmcgPSBkZWNrUGF0aC5zaGlmdCgpITtcclxuICAgICAgICBmb3IgKGxldCBkZWNrIG9mIHRoaXMuc3ViZGVja3MpIHtcclxuICAgICAgICAgICAgaWYgKGRlY2tOYW1lID09PSBkZWNrLmRlY2tOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNrLmluc2VydEZsYXNoY2FyZChkZWNrUGF0aCwgY2FyZE9iaik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY291bnQgZmxhc2hjYXJkcyB0aGF0IGhhdmUgZWl0aGVyIGJlZW4gYnVyaWVkXHJcbiAgICAvLyBvciBhcmVuJ3QgZHVlIHlldFxyXG4gICAgY291bnRGbGFzaGNhcmQoZGVja1BhdGg6IHN0cmluZ1tdLCBuOiBudW1iZXIgPSAxKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy50b3RhbEZsYXNoY2FyZHMgKz0gbjtcclxuXHJcbiAgICAgICAgbGV0IGRlY2tOYW1lOiBzdHJpbmcgPSBkZWNrUGF0aC5zaGlmdCgpITtcclxuICAgICAgICBmb3IgKGxldCBkZWNrIG9mIHRoaXMuc3ViZGVja3MpIHtcclxuICAgICAgICAgICAgaWYgKGRlY2tOYW1lID09PSBkZWNrLmRlY2tOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNrLmNvdW50Rmxhc2hjYXJkKGRlY2tQYXRoLCBuKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkZWxldGVGbGFzaGNhcmRBdEluZGV4KGluZGV4OiBudW1iZXIsIGNhcmRJc0R1ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmIChjYXJkSXNEdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kdWVGbGFzaGNhcmRzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVjazogRGVjayB8IG51bGwgPSB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChkZWNrICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChjYXJkSXNEdWUpIHtcclxuICAgICAgICAgICAgICAgIGRlY2suZHVlRmxhc2hjYXJkc0NvdW50LS07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZWNrLm5ld0ZsYXNoY2FyZHNDb3VudC0tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlY2sgPSBkZWNrLnBhcmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc29ydFN1YmRlY2tzTGlzdCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnN1YmRlY2tzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgaWYgKGEuZGVja05hbWUgPCBiLmRlY2tOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYS5kZWNrTmFtZSA+IGIuZGVja05hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBkZWNrIG9mIHRoaXMuc3ViZGVja3MpIHtcclxuICAgICAgICAgICAgZGVjay5zb3J0U3ViZGVja3NMaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250YWluZXJFbDogSFRNTEVsZW1lbnQsIG1vZGFsOiBGbGFzaGNhcmRNb2RhbCk6IHZvaWQge1xyXG4gICAgICAgIGxldCBkZWNrVmlldzogSFRNTEVsZW1lbnQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoXCJ0cmVlLWl0ZW1cIik7XHJcblxyXG4gICAgICAgIGxldCBkZWNrVmlld1NlbGY6IEhUTUxFbGVtZW50ID0gZGVja1ZpZXcuY3JlYXRlRGl2KFxyXG4gICAgICAgICAgICBcInRyZWUtaXRlbS1zZWxmIHRhZy1wYW5lLXRhZyBpcy1jbGlja2FibGVcIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgbGV0IGNvbGxhcHNlZDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICAgICAgbGV0IGNvbGxhcHNlSWNvbkVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGlmICh0aGlzLnN1YmRlY2tzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29sbGFwc2VJY29uRWwgPSBkZWNrVmlld1NlbGYuY3JlYXRlRGl2KFwidHJlZS1pdGVtLWljb24gY29sbGFwc2UtaWNvblwiKTtcclxuICAgICAgICAgICAgY29sbGFwc2VJY29uRWwuaW5uZXJIVE1MID0gQ09MTEFQU0VfSUNPTjtcclxuICAgICAgICAgICAgKGNvbGxhcHNlSWNvbkVsLmNoaWxkTm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnRyYW5zZm9ybSA9IFwicm90YXRlKC05MGRlZylcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkZWNrVmlld0lubmVyOiBIVE1MRWxlbWVudCA9IGRlY2tWaWV3U2VsZi5jcmVhdGVEaXYoXCJ0cmVlLWl0ZW0taW5uZXJcIik7XHJcbiAgICAgICAgZGVja1ZpZXdJbm5lci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcclxuICAgICAgICAgICAgbW9kYWwuY3VycmVudERlY2sgPSB0aGlzO1xyXG4gICAgICAgICAgICBtb2RhbC5jaGVja0RlY2sgPSB0aGlzLnBhcmVudCE7XHJcbiAgICAgICAgICAgIG1vZGFsLnNldHVwQ2FyZHNWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dENhcmQobW9kYWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxldCBkZWNrVmlld0lubmVyVGV4dDogSFRNTEVsZW1lbnQgPSBkZWNrVmlld0lubmVyLmNyZWF0ZURpdihcInRhZy1wYW5lLXRhZy10ZXh0XCIpO1xyXG4gICAgICAgIGRlY2tWaWV3SW5uZXJUZXh0LmlubmVySFRNTCArPSBgPHNwYW4gY2xhc3M9XCJ0YWctcGFuZS10YWctc2VsZlwiPiR7dGhpcy5kZWNrTmFtZX08L3NwYW4+YDtcclxuICAgICAgICBsZXQgZGVja1ZpZXdPdXRlcjogSFRNTEVsZW1lbnQgPSBkZWNrVmlld1NlbGYuY3JlYXRlRGl2KFwidHJlZS1pdGVtLWZsYWlyLW91dGVyXCIpO1xyXG4gICAgICAgIGRlY2tWaWV3T3V0ZXIuaW5uZXJIVE1MICs9XHJcbiAgICAgICAgICAgICc8c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IzRjYWY1MDtcIiBjbGFzcz1cInRhZy1wYW5lLXRhZy1jb3VudCB0cmVlLWl0ZW0tZmxhaXIgc3ItZGVjay1jb3VudHNcIj4nICtcclxuICAgICAgICAgICAgdGhpcy5kdWVGbGFzaGNhcmRzQ291bnQgK1xyXG4gICAgICAgICAgICBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICc8c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IzIxOTZmMztcIiBjbGFzcz1cInRhZy1wYW5lLXRhZy1jb3VudCB0cmVlLWl0ZW0tZmxhaXIgc3ItZGVjay1jb3VudHNcIj4nICtcclxuICAgICAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzQ291bnQgK1xyXG4gICAgICAgICAgICBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICc8c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I2ZmNzA0MztcIiBjbGFzcz1cInRhZy1wYW5lLXRhZy1jb3VudCB0cmVlLWl0ZW0tZmxhaXIgc3ItZGVjay1jb3VudHNcIj4nICtcclxuICAgICAgICAgICAgdGhpcy50b3RhbEZsYXNoY2FyZHMgK1xyXG4gICAgICAgICAgICBcIjwvc3Bhbj5cIjtcclxuXHJcbiAgICAgICAgbGV0IGRlY2tWaWV3Q2hpbGRyZW46IEhUTUxFbGVtZW50ID0gZGVja1ZpZXcuY3JlYXRlRGl2KFwidHJlZS1pdGVtLWNoaWxkcmVuXCIpO1xyXG4gICAgICAgIGRlY2tWaWV3Q2hpbGRyZW4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIGlmICh0aGlzLnN1YmRlY2tzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29sbGFwc2VJY29uRWwhLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoXykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbGxhcHNlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIChjb2xsYXBzZUljb25FbCEuY2hpbGROb2Rlc1swXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUudHJhbnNmb3JtID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICBkZWNrVmlld0NoaWxkcmVuLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIChjb2xsYXBzZUljb25FbCEuY2hpbGROb2Rlc1swXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUudHJhbnNmb3JtID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3RhdGUoLTkwZGVnKVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlY2tWaWV3Q2hpbGRyZW4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29sbGFwc2VkID0gIWNvbGxhcHNlZDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGRlY2sgb2YgdGhpcy5zdWJkZWNrcykge1xyXG4gICAgICAgICAgICBkZWNrLnJlbmRlcihkZWNrVmlld0NoaWxkcmVuLCBtb2RhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5leHRDYXJkKG1vZGFsOiBGbGFzaGNhcmRNb2RhbCk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLm5ld0ZsYXNoY2FyZHMubGVuZ3RoICsgdGhpcy5kdWVGbGFzaGNhcmRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kdWVGbGFzaGNhcmRzQ291bnQgKyB0aGlzLm5ld0ZsYXNoY2FyZHNDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlY2sgb2YgdGhpcy5zdWJkZWNrcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWNrLmR1ZUZsYXNoY2FyZHNDb3VudCArIGRlY2submV3Rmxhc2hjYXJkc0NvdW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50RGVjayA9IGRlY2s7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY2submV4dENhcmQobW9kYWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQgPT0gbW9kYWwuY2hlY2tEZWNrKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5kZWNrc0xpc3QoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50IS5uZXh0Q2FyZChtb2RhbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbW9kYWwucmVzcG9uc2VEaXYuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIG1vZGFsLnJlc2V0TGlua1ZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIG1vZGFsLnRpdGxlRWwuc2V0VGV4dChcclxuICAgICAgICAgICAgYCR7dGhpcy5kZWNrTmFtZX0gLSAke3RoaXMuZHVlRmxhc2hjYXJkc0NvdW50ICsgdGhpcy5uZXdGbGFzaGNhcmRzQ291bnR9YFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG1vZGFsLmFuc3dlckJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJpbml0aWFsXCI7XHJcbiAgICAgICAgbW9kYWwuZmxhc2hjYXJkVmlldy5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgIG1vZGFsLm1vZGUgPSBGbGFzaGNhcmRNb2RhbE1vZGUuRnJvbnQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmR1ZUZsYXNoY2FyZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBpZiAobW9kYWwucGx1Z2luLmRhdGEuc2V0dGluZ3MucmFuZG9taXplQ2FyZE9yZGVyKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZElkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuZHVlRmxhc2hjYXJkcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmRJZHggPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1vZGFsLmN1cnJlbnRDYXJkID0gdGhpcy5kdWVGbGFzaGNhcmRzW21vZGFsLmN1cnJlbnRDYXJkSWR4XTtcclxuICAgICAgICAgICAgbW9kYWwucmVuZGVyTWFya2Rvd25XcmFwcGVyKG1vZGFsLmN1cnJlbnRDYXJkLmZyb250LCBtb2RhbC5mbGFzaGNhcmRWaWV3KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBoYXJkSW50ZXJ2YWw6IG51bWJlciA9IHNjaGVkdWxlKFxyXG4gICAgICAgICAgICAgICAgUmV2aWV3UmVzcG9uc2UuSGFyZCxcclxuICAgICAgICAgICAgICAgIG1vZGFsLmN1cnJlbnRDYXJkLmludGVydmFsISxcclxuICAgICAgICAgICAgICAgIG1vZGFsLmN1cnJlbnRDYXJkLmVhc2UhLFxyXG4gICAgICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmQuZGVsYXlCZWZvcmVSZXZpZXchLFxyXG4gICAgICAgICAgICAgICAgbW9kYWwucGx1Z2luLmRhdGEuc2V0dGluZ3NcclxuICAgICAgICAgICAgKS5pbnRlcnZhbDtcclxuICAgICAgICAgICAgbGV0IGdvb2RJbnRlcnZhbDogbnVtYmVyID0gc2NoZWR1bGUoXHJcbiAgICAgICAgICAgICAgICBSZXZpZXdSZXNwb25zZS5Hb29kLFxyXG4gICAgICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmQuaW50ZXJ2YWwhLFxyXG4gICAgICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmQuZWFzZSEsXHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZC5kZWxheUJlZm9yZVJldmlldyEsXHJcbiAgICAgICAgICAgICAgICBtb2RhbC5wbHVnaW4uZGF0YS5zZXR0aW5nc1xyXG4gICAgICAgICAgICApLmludGVydmFsO1xyXG4gICAgICAgICAgICBsZXQgZWFzeUludGVydmFsOiBudW1iZXIgPSBzY2hlZHVsZShcclxuICAgICAgICAgICAgICAgIFJldmlld1Jlc3BvbnNlLkVhc3ksXHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZC5pbnRlcnZhbCEsXHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZC5lYXNlISxcclxuICAgICAgICAgICAgICAgIG1vZGFsLmN1cnJlbnRDYXJkLmRlbGF5QmVmb3JlUmV2aWV3ISxcclxuICAgICAgICAgICAgICAgIG1vZGFsLnBsdWdpbi5kYXRhLnNldHRpbmdzXHJcbiAgICAgICAgICAgICkuaW50ZXJ2YWw7XHJcblxyXG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsLmhhcmRCdG4uc2V0VGV4dCh0ZXh0SW50ZXJ2YWwoaGFyZEludGVydmFsLCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5nb29kQnRuLnNldFRleHQodGV4dEludGVydmFsKGdvb2RJbnRlcnZhbCwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuZWFzeUJ0bi5zZXRUZXh0KHRleHRJbnRlcnZhbChlYXN5SW50ZXJ2YWwsIHRydWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1vZGFsLmhhcmRCdG4uc2V0VGV4dCh0KFwiSGFyZFwiKSArIFwiIC0gXCIgKyB0ZXh0SW50ZXJ2YWwoaGFyZEludGVydmFsLCBmYWxzZSkpO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuZ29vZEJ0bi5zZXRUZXh0KHQoXCJHb29kXCIpICsgXCIgLSBcIiArIHRleHRJbnRlcnZhbChnb29kSW50ZXJ2YWwsIGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5lYXN5QnRuLnNldFRleHQodChcIkVhc3lcIikgKyBcIiAtIFwiICsgdGV4dEludGVydmFsKGVhc3lJbnRlcnZhbCwgZmFsc2UpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5uZXdGbGFzaGNhcmRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgaWYgKG1vZGFsLnBsdWdpbi5kYXRhLnNldHRpbmdzLnJhbmRvbWl6ZUNhcmRPcmRlcikge1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmRJZHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLm5ld0ZsYXNoY2FyZHMubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBmaXJzdCB1bnNjaGVkdWxlZCBzaWJsaW5nXHJcbiAgICAgICAgICAgICAgICBsZXQgY2FyZDogQ2FyZCA9IHRoaXMubmV3Rmxhc2hjYXJkc1ttb2RhbC5jdXJyZW50Q2FyZElkeF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzaWJsaW5nQ2FyZCBvZiBjYXJkLnNpYmxpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaWJsaW5nQ2FyZC5pc0R1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZElkeCArPSBzaWJsaW5nQ2FyZC5zaWJsaW5nSWR4IC0gY2FyZC5zaWJsaW5nSWR4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5jdXJyZW50Q2FyZElkeCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbW9kYWwuY3VycmVudENhcmQgPSB0aGlzLm5ld0ZsYXNoY2FyZHNbbW9kYWwuY3VycmVudENhcmRJZHhdO1xyXG4gICAgICAgICAgICBtb2RhbC5yZW5kZXJNYXJrZG93bldyYXBwZXIobW9kYWwuY3VycmVudENhcmQuZnJvbnQsIG1vZGFsLmZsYXNoY2FyZFZpZXcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzTW9iaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5oYXJkQnRuLnNldFRleHQoXCIxLjBkXCIpO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuZ29vZEJ0bi5zZXRUZXh0KFwiMi41ZFwiKTtcclxuICAgICAgICAgICAgICAgIG1vZGFsLmVhc3lCdG4uc2V0VGV4dChcIjMuNWRcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5oYXJkQnRuLnNldFRleHQodChcIkhhcmRcIikgKyBcIiAtIDEuMCBcIiArIHQoXCJkYXlcIikpO1xyXG4gICAgICAgICAgICAgICAgbW9kYWwuZ29vZEJ0bi5zZXRUZXh0KHQoXCJHb29kXCIpICsgXCIgLSAyLjUgXCIgKyB0KFwiZGF5c1wiKSk7XHJcbiAgICAgICAgICAgICAgICBtb2RhbC5lYXN5QnRuLnNldFRleHQodChcIkVhc3lcIikgKyBcIiAtIDMuNSBcIiArIHQoXCJkYXlzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1vZGFsLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNob3dDb250ZXh0SW5DYXJkcylcclxuICAgICAgICAgICAgbW9kYWwuY29udGV4dFZpZXcuc2V0VGV4dChtb2RhbC5jdXJyZW50Q2FyZC5jb250ZXh0KTtcclxuICAgICAgICBpZiAobW9kYWwucGx1Z2luLmRhdGEuc2V0dGluZ3Muc2hvd0ZpbGVOYW1lSW5GaWxlTGluaylcclxuICAgICAgICAgICAgbW9kYWwuZmlsZUxpbmtWaWV3LnNldFRleHQobW9kYWwuY3VycmVudENhcmQubm90ZS5iYXNlbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgTW9kYWwsIEFwcCwgTWFya2Rvd25SZW5kZXJlciwgUGxhdGZvcm0gfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB0eXBlIFNSUGx1Z2luIGZyb20gXCJzcmMvbWFpblwiO1xyXG5pbXBvcnQgeyBnZXRLZXlzUHJlc2VydmVUeXBlIH0gZnJvbSBcInNyYy91dGlsc1wiO1xyXG5pbXBvcnQgeyB0ZXh0SW50ZXJ2YWwgfSBmcm9tIFwic3JjL3NjaGVkdWxpbmdcIjtcclxuaW1wb3J0IHsgT0JTSURJQU5fQ0hBUlRTX0lEIH0gZnJvbSBcInNyYy9jb25zdGFudHNcIjtcclxuaW1wb3J0IHsgdCB9IGZyb20gXCJzcmMvbGFuZy9oZWxwZXJzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRzIHtcclxuICAgIGVhc2VzOiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+O1xyXG4gICAgaW50ZXJ2YWxzOiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+O1xyXG4gICAgbmV3Q291bnQ6IG51bWJlcjtcclxuICAgIHlvdW5nQ291bnQ6IG51bWJlcjtcclxuICAgIG1hdHVyZUNvdW50OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdGF0c01vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gICAgcHJpdmF0ZSBwbHVnaW46IFNSUGx1Z2luO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFNSUGx1Z2luKSB7XHJcbiAgICAgICAgc3VwZXIoYXBwKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcblxyXG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHQoXCJTdGF0aXN0aWNzXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xyXG4gICAgICAgIHRoaXMubW9kYWxFbC5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xyXG5cclxuICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWwuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgICAgIGxldCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZTogUHJvcGVydHkgJ3BsdWdpbnMnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0FwcCdcclxuICAgICAgICBpZiAoIXRoaXMuYXBwLnBsdWdpbnMuZW5hYmxlZFBsdWdpbnMuaGFzKE9CU0lESUFOX0NIQVJUU19JRCkpIHtcclxuICAgICAgICAgICAgY29udGVudEVsLmlubmVySFRNTCArPVxyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcic+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8c3Bhbj5cIiArXHJcbiAgICAgICAgICAgICAgICB0KFwiTm90ZSB0aGF0IHRoaXMgcmVxdWlyZXMgdGhlIE9ic2lkaWFuIENoYXJ0cyBwbHVnaW4gdG8gd29ya1wiKSArXHJcbiAgICAgICAgICAgICAgICBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjwvZGl2PlwiO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGV4dDogc3RyaW5nID0gXCJcIjtcclxuXHJcbiAgICAgICAgLy8gQWRkIGZvcmVjYXN0XHJcbiAgICAgICAgbGV0IG1heE46IG51bWJlciA9IE1hdGgubWF4KC4uLmdldEtleXNQcmVzZXJ2ZVR5cGUodGhpcy5wbHVnaW4uZHVlRGF0ZXNGbGFzaGNhcmRzKSk7XHJcbiAgICAgICAgZm9yIChsZXQgZHVlT2Zmc2V0ID0gMDsgZHVlT2Zmc2V0IDw9IG1heE47IGR1ZU9mZnNldCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5wbHVnaW4uZHVlRGF0ZXNGbGFzaGNhcmRzLmhhc093blByb3BlcnR5KGR1ZU9mZnNldCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmR1ZURhdGVzRmxhc2hjYXJkc1tkdWVPZmZzZXRdID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGR1ZURhdGVzRmxhc2hjYXJkc0NvcHk6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7IDA6IDAgfTtcclxuICAgICAgICBmb3IgKGxldCBbZHVlT2Zmc2V0LCBkdWVDb3VudF0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5wbHVnaW4uZHVlRGF0ZXNGbGFzaGNhcmRzKSkge1xyXG4gICAgICAgICAgICBpZiAoZHVlT2Zmc2V0IDw9IDApIHtcclxuICAgICAgICAgICAgICAgIGR1ZURhdGVzRmxhc2hjYXJkc0NvcHlbMF0gKz0gZHVlQ291bnQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkdWVEYXRlc0ZsYXNoY2FyZHNDb3B5W2R1ZU9mZnNldF0gPSBkdWVDb3VudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNhcmRTdGF0czogU3RhdHMgPSB0aGlzLnBsdWdpbi5jYXJkU3RhdHM7XHJcbiAgICAgICAgbGV0IHNjaGVkdWxlZENvdW50OiBudW1iZXIgPSBjYXJkU3RhdHMueW91bmdDb3VudCArIGNhcmRTdGF0cy5tYXR1cmVDb3VudDtcclxuICAgICAgICBtYXhOID0gTWF0aC5tYXgobWF4TiwgMSk7XHJcblxyXG4gICAgICAgIC8vIGxldCB0aGUgaG9ycm9ycyBiZWdpbiBMT0xcclxuICAgICAgICB0ZXh0ICs9XHJcbiAgICAgICAgICAgIFwiXFxuPGRpdiBzdHlsZT0ndGV4dC1hbGlnbjpjZW50ZXInPlwiICtcclxuICAgICAgICAgICAgXCI8aDIgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIHQoXCJGb3JlY2FzdFwiKSArXHJcbiAgICAgICAgICAgIFwiPC9oMj5cIiArXHJcbiAgICAgICAgICAgIFwiPGg0IHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcic+XCIgK1xyXG4gICAgICAgICAgICB0KFwiVGhlIG51bWJlciBvZiBjYXJkcyBkdWUgaW4gdGhlIGZ1dHVyZVwiKSArXHJcbiAgICAgICAgICAgIFwiPC9oND5cIiArXHJcbiAgICAgICAgICAgIFwiPC9kaXY+XFxuXFxuXCIgK1xyXG4gICAgICAgICAgICBcImBgYGNoYXJ0XFxuXCIgK1xyXG4gICAgICAgICAgICBcIlxcdHR5cGU6IGJhclxcblwiICtcclxuICAgICAgICAgICAgYFxcdGxhYmVsczogWyR7T2JqZWN0LmtleXMoZHVlRGF0ZXNGbGFzaGNhcmRzQ29weSl9XVxcbmAgK1xyXG4gICAgICAgICAgICBcIlxcdHNlcmllczpcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFx0XFx0LSB0aXRsZTogXCIgK1xyXG4gICAgICAgICAgICB0KFwiU2NoZWR1bGVkXCIpICtcclxuICAgICAgICAgICAgYFxcblxcdFxcdCAgZGF0YTogWyR7T2JqZWN0LnZhbHVlcyhkdWVEYXRlc0ZsYXNoY2FyZHNDb3B5KX1dXFxuYCArXHJcbiAgICAgICAgICAgIFwiXFx0eFRpdGxlOiBcIiArXHJcbiAgICAgICAgICAgIHQoXCJEYXlzXCIpICtcclxuICAgICAgICAgICAgXCJcXG5cXHR5VGl0bGU6IFwiICtcclxuICAgICAgICAgICAgdChcIk51bWJlciBvZiBjYXJkc1wiKSArXHJcbiAgICAgICAgICAgIFwiXFxuXFx0bGVnZW5kOiBmYWxzZVxcblwiICtcclxuICAgICAgICAgICAgXCJcXHRzdGFja2VkOiB0cnVlXFxuXCIgK1xyXG4gICAgICAgICAgICBcImBgYGBcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFxuPGRpdiBzdHlsZT0ndGV4dC1hbGlnbjpjZW50ZXInPlwiICtcclxuICAgICAgICAgICAgYEF2ZXJhZ2U6ICR7KHNjaGVkdWxlZENvdW50IC8gbWF4TikudG9GaXhlZCgxKX0gcmV2aWV3cy9kYXlgICtcclxuICAgICAgICAgICAgXCI8L2Rpdj5cIjtcclxuXHJcbiAgICAgICAgbWF4TiA9IE1hdGgubWF4KC4uLmdldEtleXNQcmVzZXJ2ZVR5cGUoY2FyZFN0YXRzLmludGVydmFscykpO1xyXG4gICAgICAgIGZvciAobGV0IGludGVydmFsID0gMDsgaW50ZXJ2YWwgPD0gbWF4TjsgaW50ZXJ2YWwrKykge1xyXG4gICAgICAgICAgICBpZiAoIWNhcmRTdGF0cy5pbnRlcnZhbHMuaGFzT3duUHJvcGVydHkoaW50ZXJ2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXJkU3RhdHMuaW50ZXJ2YWxzW2ludGVydmFsXSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFkZCBpbnRlcnZhbHNcclxuICAgICAgICBsZXQgYXZlcmFnZV9pbnRlcnZhbDogc3RyaW5nID0gdGV4dEludGVydmFsKFxyXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChcclxuICAgICAgICAgICAgICAgICAgICAoT2JqZWN0LmVudHJpZXMoY2FyZFN0YXRzLmludGVydmFscylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoW2ludGVydmFsLCBjb3VudF0pID0+IGludGVydmFsICogY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiKSAvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlZENvdW50KSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDEwXHJcbiAgICAgICAgICAgICAgICApIC8gMTAsXHJcbiAgICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBsb25nZXN0X2ludGVydmFsOiBzdHJpbmcgPSB0ZXh0SW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1heCguLi5nZXRLZXlzUHJlc2VydmVUeXBlKGNhcmRTdGF0cy5pbnRlcnZhbHMpKSxcclxuICAgICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgdGV4dCArPVxyXG4gICAgICAgICAgICBcIlxcbjxkaXYgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIFwiPGgyIHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcic+XCIgK1xyXG4gICAgICAgICAgICB0KFwiSW50ZXJ2YWxzXCIpICtcclxuICAgICAgICAgICAgXCI8L2gyPlwiICtcclxuICAgICAgICAgICAgXCI8aDQgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIHQoXCJEZWxheXMgdW50aWwgcmV2aWV3cyBhcmUgc2hvd24gYWdhaW5cIikgK1xyXG4gICAgICAgICAgICBcIjwvaDQ+XCIgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlxcblxcblwiICtcclxuICAgICAgICAgICAgXCJgYGBjaGFydFxcblwiICtcclxuICAgICAgICAgICAgXCJcXHR0eXBlOiBiYXJcXG5cIiArXHJcbiAgICAgICAgICAgIGBcXHRsYWJlbHM6IFske09iamVjdC5rZXlzKGNhcmRTdGF0cy5pbnRlcnZhbHMpfV1cXG5gICtcclxuICAgICAgICAgICAgXCJcXHRzZXJpZXM6XFxuXCIgK1xyXG4gICAgICAgICAgICBcIlxcdFxcdC0gdGl0bGU6IFwiICtcclxuICAgICAgICAgICAgdChcIkNvdW50XCIpICtcclxuICAgICAgICAgICAgYFxcblxcdFxcdCAgZGF0YTogWyR7T2JqZWN0LnZhbHVlcyhjYXJkU3RhdHMuaW50ZXJ2YWxzKX1dXFxuYCArXHJcbiAgICAgICAgICAgIFwiXFx0eFRpdGxlOiBcIiArXHJcbiAgICAgICAgICAgIHQoXCJEYXlzXCIpICtcclxuICAgICAgICAgICAgXCJcXG5cXHR5VGl0bGU6IFwiICtcclxuICAgICAgICAgICAgdChcIk51bWJlciBvZiBjYXJkc1wiKSArXHJcbiAgICAgICAgICAgIFwiXFxuXFx0bGVnZW5kOiBmYWxzZVxcblwiICtcclxuICAgICAgICAgICAgXCJcXHRzdGFja2VkOiB0cnVlXFxuXCIgK1xyXG4gICAgICAgICAgICBcImBgYGBcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFxuPGRpdiBzdHlsZT0ndGV4dC1hbGlnbjpjZW50ZXInPlwiICtcclxuICAgICAgICAgICAgYEF2ZXJhZ2UgaW50ZXJ2YWw6ICR7YXZlcmFnZV9pbnRlcnZhbH0sIGAgK1xyXG4gICAgICAgICAgICBgTG9uZ2VzdCBpbnRlcnZhbDogJHtsb25nZXN0X2ludGVydmFsfWAgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlwiO1xyXG5cclxuICAgICAgICAvLyBBZGQgZWFzZXNcclxuICAgICAgICBsZXQgYXZlcmFnZV9lYXNlOiBudW1iZXIgPSBNYXRoLnJvdW5kKFxyXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyhjYXJkU3RhdHMuZWFzZXMpXHJcbiAgICAgICAgICAgICAgICAubWFwKChbZWFzZSwgY291bnRdKSA9PiBlYXNlICogY291bnQpXHJcbiAgICAgICAgICAgICAgICAucmVkdWNlKChhLCBiKSA9PiBhICsgYikgLyBzY2hlZHVsZWRDb3VudFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGV4dCArPVxyXG4gICAgICAgICAgICBcIlxcbjxkaXYgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIFwiPGgyIHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcic+XCIgK1xyXG4gICAgICAgICAgICB0KFwiRWFzZXNcIikgK1xyXG4gICAgICAgICAgICBcIjwvaDI+XCIgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlxcblxcblwiICtcclxuICAgICAgICAgICAgXCJgYGBjaGFydFxcblwiICtcclxuICAgICAgICAgICAgXCJcXHR0eXBlOiBiYXJcXG5cIiArXHJcbiAgICAgICAgICAgIGBcXHRsYWJlbHM6IFske09iamVjdC5rZXlzKGNhcmRTdGF0cy5lYXNlcyl9XVxcbmAgK1xyXG4gICAgICAgICAgICBcIlxcdHNlcmllczpcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFx0XFx0LSB0aXRsZTogXCIgK1xyXG4gICAgICAgICAgICB0KFwiQ291bnRcIikgK1xyXG4gICAgICAgICAgICBgXFxuXFx0XFx0ICBkYXRhOiBbJHtPYmplY3QudmFsdWVzKGNhcmRTdGF0cy5lYXNlcyl9XVxcbmAgK1xyXG4gICAgICAgICAgICBcIlxcdHhUaXRsZTogXCIgK1xyXG4gICAgICAgICAgICB0KFwiRGF5c1wiKSArXHJcbiAgICAgICAgICAgIFwiXFxuXFx0eVRpdGxlOiBcIiArXHJcbiAgICAgICAgICAgIHQoXCJOdW1iZXIgb2YgY2FyZHNcIikgK1xyXG4gICAgICAgICAgICBcIlxcblxcdGxlZ2VuZDogZmFsc2VcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFx0c3RhY2tlZDogdHJ1ZVxcblwiICtcclxuICAgICAgICAgICAgXCJgYGBgXFxuXCIgK1xyXG4gICAgICAgICAgICBcIlxcbjxkaXYgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIGBBdmVyYWdlIGVhc2U6ICR7YXZlcmFnZV9lYXNlfWAgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlwiO1xyXG5cclxuICAgICAgICAvLyBBZGQgY2FyZCB0eXBlc1xyXG4gICAgICAgIGxldCB0b3RhbENhcmRzOiBudW1iZXIgPSB0aGlzLnBsdWdpbi5kZWNrVHJlZS50b3RhbEZsYXNoY2FyZHM7XHJcbiAgICAgICAgdGV4dCArPVxyXG4gICAgICAgICAgICBcIlxcbjxkaXYgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIFwiPGgyIHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcic+XCIgK1xyXG4gICAgICAgICAgICB0KFwiQ2FyZCBUeXBlc1wiKSArXHJcbiAgICAgICAgICAgIFwiPC9oMj5cIiArXHJcbiAgICAgICAgICAgIFwiPC9kaXY+XFxuXFxuXCIgK1xyXG4gICAgICAgICAgICBcImBgYGNoYXJ0XFxuXCIgK1xyXG4gICAgICAgICAgICBcIlxcdHR5cGU6IHBpZVxcblwiICtcclxuICAgICAgICAgICAgYFxcdGxhYmVsczogWydOZXcgLSAke01hdGgucm91bmQoXHJcbiAgICAgICAgICAgICAgICAoY2FyZFN0YXRzLm5ld0NvdW50IC8gdG90YWxDYXJkcykgKiAxMDBcclxuICAgICAgICAgICAgKX0lJywgJ1lvdW5nIC0gJHtNYXRoLnJvdW5kKFxyXG4gICAgICAgICAgICAgICAgKGNhcmRTdGF0cy55b3VuZ0NvdW50IC8gdG90YWxDYXJkcykgKiAxMDBcclxuICAgICAgICAgICAgKX0lJywgJ01hdHVyZSAtICR7TWF0aC5yb3VuZCgoY2FyZFN0YXRzLm1hdHVyZUNvdW50IC8gdG90YWxDYXJkcykgKiAxMDApfSUnXVxcbmAgK1xyXG4gICAgICAgICAgICBgXFx0c2VyaWVzOlxcbmAgK1xyXG4gICAgICAgICAgICBgXFx0XFx0LSBkYXRhOiBbJHtjYXJkU3RhdHMubmV3Q291bnR9LCAke2NhcmRTdGF0cy55b3VuZ0NvdW50fSwgJHtjYXJkU3RhdHMubWF0dXJlQ291bnR9XVxcbmAgK1xyXG4gICAgICAgICAgICBcIlxcdHdpZHRoOiA0MCVcXG5cIiArXHJcbiAgICAgICAgICAgIFwiXFx0bGFiZWxDb2xvcnM6IHRydWVcXG5cIiArXHJcbiAgICAgICAgICAgIFwiYGBgXFxuXCIgK1xyXG4gICAgICAgICAgICBcIlxcbjxkaXYgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyJz5cIiArXHJcbiAgICAgICAgICAgIGBUb3RhbCBjYXJkczogJHt0b3RhbENhcmRzfWAgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlwiO1xyXG5cclxuICAgICAgICBNYXJrZG93blJlbmRlcmVyLnJlbmRlck1hcmtkb3duKHRleHQsIGNvbnRlbnRFbCwgXCJcIiwgdGhpcy5wbHVnaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ2xvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBNZW51LCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuaW1wb3J0IHR5cGUgU1JQbHVnaW4gZnJvbSBcInNyYy9tYWluXCI7XHJcbmltcG9ydCB7IENPTExBUFNFX0lDT04gfSBmcm9tIFwic3JjL2NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBSZXZpZXdEZWNrIH0gZnJvbSBcInNyYy9yZXZpZXctZGVja1wiO1xyXG5pbXBvcnQgeyB0IH0gZnJvbSBcInNyYy9sYW5nL2hlbHBlcnNcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBSRVZJRVdfUVVFVUVfVklFV19UWVBFOiBzdHJpbmcgPSBcInJldmlldy1xdWV1ZS1saXN0LXZpZXdcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXZpZXdRdWV1ZUxpc3RWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xyXG4gICAgcHJpdmF0ZSBwbHVnaW46IFNSUGx1Z2luO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogU1JQbHVnaW4pIHtcclxuICAgICAgICBzdXBlcihsZWFmKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoXzogYW55KSA9PiB0aGlzLnJlZHJhdygpKSk7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwicmVuYW1lXCIsIChfOiBhbnkpID0+IHRoaXMucmVkcmF3KCkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gUkVWSUVXX1FVRVVFX1ZJRVdfVFlQRTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdChcIk5vdGVzIFJldmlldyBRdWV1ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0SWNvbigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcImNyb3NzaGFpcnNcIjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25IZWFkZXJNZW51KG1lbnU6IE1lbnUpOiB2b2lkIHtcclxuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgaXRlbS5zZXRUaXRsZSh0KFwiQ2xvc2VcIikpXHJcbiAgICAgICAgICAgICAgICAuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShSRVZJRVdfUVVFVUVfVklFV19UWVBFKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWRyYXcoKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IG9wZW5GaWxlOiBURmlsZSB8IG51bGwgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xyXG5cclxuICAgICAgICBsZXQgcm9vdEVsOiBIVE1MRWxlbWVudCA9IGNyZWF0ZURpdihcIm5hdi1mb2xkZXIgbW9kLXJvb3RcIiksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuRWw6IEhUTUxFbGVtZW50ID0gcm9vdEVsLmNyZWF0ZURpdihcIm5hdi1mb2xkZXItY2hpbGRyZW5cIik7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRlY2tLZXkgaW4gdGhpcy5wbHVnaW4ucmV2aWV3RGVja3MpIHtcclxuICAgICAgICAgICAgbGV0IGRlY2s6IFJldmlld0RlY2sgPSB0aGlzLnBsdWdpbi5yZXZpZXdEZWNrc1tkZWNrS2V5XTtcclxuXHJcbiAgICAgICAgICAgIGxldCBkZWNrRm9sZGVyRWw6IEhUTUxFbGVtZW50ID0gdGhpcy5jcmVhdGVSaWdodFBhbmVGb2xkZXIoXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkVsLFxyXG4gICAgICAgICAgICAgICAgZGVja0tleSxcclxuICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGVja1xyXG4gICAgICAgICAgICApLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJuYXYtZm9sZGVyLWNoaWxkcmVuXCIpWzBdIGFzIEhUTUxFbGVtZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKGRlY2submV3Tm90ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5ld05vdGVzRm9sZGVyRWw6IEhUTUxFbGVtZW50ID0gdGhpcy5jcmVhdGVSaWdodFBhbmVGb2xkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZGVja0ZvbGRlckVsLFxyXG4gICAgICAgICAgICAgICAgICAgIHQoXCJOZXdcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgIWRlY2suYWN0aXZlRm9sZGVycy5oYXModChcIk5ld1wiKSksXHJcbiAgICAgICAgICAgICAgICAgICAgZGVja1xyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBuZXdGaWxlIG9mIGRlY2submV3Tm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJpZ2h0UGFuZUZpbGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld05vdGVzRm9sZGVyRWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5GaWxlISAmJiBuZXdGaWxlLnBhdGggPT09IG9wZW5GaWxlLnBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICFkZWNrLmFjdGl2ZUZvbGRlcnMuaGFzKHQoXCJOZXdcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRlY2suc2NoZWR1bGVkTm90ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5vdzogbnVtYmVyID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyVW5peDogbnVtYmVyID0gLTE7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2NoZWRGb2xkZXJFbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBmb2xkZXJUaXRsZTogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGxldCBtYXhEYXlzVG9SZW5kZXI6IG51bWJlciA9IHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHNOb3RlIG9mIGRlY2suc2NoZWR1bGVkTm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc05vdGUuZHVlVW5peCAhPSBjdXJyVW5peCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbkRheXM6IG51bWJlciA9IE1hdGguY2VpbCgoc05vdGUuZHVlVW5peCAtIG5vdykgLyAoMjQgKiAzNjAwICogMTAwMCkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5EYXlzID4gbWF4RGF5c1RvUmVuZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyVGl0bGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbkRheXMgPT0gLTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHQoXCJZZXN0ZXJkYXlcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG5EYXlzID09IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHQoXCJUb2RheVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbkRheXMgPT0gMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdChcIlRvbW9ycm93XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgRGF0ZShzTm90ZS5kdWVVbml4KS50b0RhdGVTdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkRm9sZGVyRWwgPSB0aGlzLmNyZWF0ZVJpZ2h0UGFuZUZvbGRlcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY2tGb2xkZXJFbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlclRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIWRlY2suYWN0aXZlRm9sZGVycy5oYXMoZm9sZGVyVGl0bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyVW5peCA9IHNOb3RlLmR1ZVVuaXg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJpZ2h0UGFuZUZpbGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkRm9sZGVyRWwhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzTm90ZS5ub3RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuRmlsZSEgJiYgc05vdGUubm90ZS5wYXRoID09PSBvcGVuRmlsZS5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAhZGVjay5hY3RpdmVGb2xkZXJzLmhhcyhmb2xkZXJUaXRsZSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29udGVudEVsOiBFbGVtZW50ID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXTtcclxuICAgICAgICBjb250ZW50RWwuZW1wdHkoKTtcclxuICAgICAgICBjb250ZW50RWwuYXBwZW5kQ2hpbGQocm9vdEVsKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVJpZ2h0UGFuZUZvbGRlcihcclxuICAgICAgICBwYXJlbnRFbDogSFRNTEVsZW1lbnQsXHJcbiAgICAgICAgZm9sZGVyVGl0bGU6IHN0cmluZyxcclxuICAgICAgICBjb2xsYXBzZWQ6IGJvb2xlYW4sXHJcbiAgICAgICAgZGVjazogUmV2aWV3RGVja1xyXG4gICAgKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIGxldCBmb2xkZXJFbDogSFRNTERpdkVsZW1lbnQgPSBwYXJlbnRFbC5jcmVhdGVEaXYoXCJuYXYtZm9sZGVyXCIpLFxyXG4gICAgICAgICAgICBmb2xkZXJUaXRsZUVsOiBIVE1MRGl2RWxlbWVudCA9IGZvbGRlckVsLmNyZWF0ZURpdihcIm5hdi1mb2xkZXItdGl0bGVcIiksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuRWw6IEhUTUxEaXZFbGVtZW50ID0gZm9sZGVyRWwuY3JlYXRlRGl2KFwibmF2LWZvbGRlci1jaGlsZHJlblwiKSxcclxuICAgICAgICAgICAgY29sbGFwc2VJY29uRWw6IEhUTUxEaXZFbGVtZW50ID0gZm9sZGVyVGl0bGVFbC5jcmVhdGVEaXYoXHJcbiAgICAgICAgICAgICAgICBcIm5hdi1mb2xkZXItY29sbGFwc2UtaW5kaWNhdG9yIGNvbGxhcHNlLWljb25cIlxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBjb2xsYXBzZUljb25FbC5pbm5lckhUTUwgPSBDT0xMQVBTRV9JQ09OO1xyXG4gICAgICAgIGlmIChjb2xsYXBzZWQpIHtcclxuICAgICAgICAgICAgKGNvbGxhcHNlSWNvbkVsLmNoaWxkTm9kZXNbMF0gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnRyYW5zZm9ybSA9IFwicm90YXRlKC05MGRlZylcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvbGRlclRpdGxlRWwuY3JlYXRlRGl2KFwibmF2LWZvbGRlci10aXRsZS1jb250ZW50XCIpLnNldFRleHQoZm9sZGVyVGl0bGUpO1xyXG5cclxuICAgICAgICBmb2xkZXJUaXRsZUVsLm9uQ2xpY2tFdmVudCgoXykgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHJlbkVsLmNoaWxkTm9kZXMgYXMgTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4pIHtcclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5zdHlsZS5kaXNwbGF5ID09PSBcImJsb2NrXCIgfHwgY2hpbGQuc3R5bGUuZGlzcGxheSA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgICAgICAoY29sbGFwc2VJY29uRWwuY2hpbGROb2Rlc1swXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUudHJhbnNmb3JtID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyb3RhdGUoLTkwZGVnKVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlY2suYWN0aXZlRm9sZGVycy5kZWxldGUoZm9sZGVyVGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gICAgICAgICAgICAgICAgICAgIChjb2xsYXBzZUljb25FbC5jaGlsZE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50KS5zdHlsZS50cmFuc2Zvcm0gPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlY2suYWN0aXZlRm9sZGVycy5hZGQoZm9sZGVyVGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmb2xkZXJFbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVJpZ2h0UGFuZUZpbGUoXHJcbiAgICAgICAgZm9sZGVyRWw6IEhUTUxFbGVtZW50LFxyXG4gICAgICAgIGZpbGU6IFRGaWxlLFxyXG4gICAgICAgIGZpbGVFbEFjdGl2ZTogYm9vbGVhbixcclxuICAgICAgICBoaWRkZW46IGJvb2xlYW5cclxuICAgICk6IHZvaWQge1xyXG4gICAgICAgIGxldCBuYXZGaWxlRWw6IEhUTUxFbGVtZW50ID0gZm9sZGVyRWxcclxuICAgICAgICAgICAgLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJuYXYtZm9sZGVyLWNoaWxkcmVuXCIpWzBdXHJcbiAgICAgICAgICAgIC5jcmVhdGVEaXYoXCJuYXYtZmlsZVwiKTtcclxuICAgICAgICBpZiAoaGlkZGVuKSB7XHJcbiAgICAgICAgICAgIG5hdkZpbGVFbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbmF2RmlsZVRpdGxlOiBIVE1MRWxlbWVudCA9IG5hdkZpbGVFbC5jcmVhdGVEaXYoXCJuYXYtZmlsZS10aXRsZVwiKTtcclxuICAgICAgICBpZiAoZmlsZUVsQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIG5hdkZpbGVUaXRsZS5hZGRDbGFzcyhcImlzLWFjdGl2ZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5hdkZpbGVUaXRsZS5jcmVhdGVEaXYoXCJuYXYtZmlsZS10aXRsZS1jb250ZW50XCIpLnNldFRleHQoZmlsZS5iYXNlbmFtZSk7XHJcbiAgICAgICAgbmF2RmlsZVRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXHJcbiAgICAgICAgICAgIFwiY2xpY2tcIixcclxuICAgICAgICAgICAgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYhLm9wZW5GaWxlKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5hdkZpbGVUaXRsZS5hZGRFdmVudExpc3RlbmVyKFxyXG4gICAgICAgICAgICBcImNvbnRleHRtZW51XCIsXHJcbiAgICAgICAgICAgIChldmVudDogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIGxldCBmaWxlTWVudTogTWVudSA9IG5ldyBNZW51KHRoaXMuYXBwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiZmlsZS1tZW51XCIsIGZpbGVNZW51LCBmaWxlLCBcIm15LWNvbnRleHQtbWVudVwiLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIGZpbGVNZW51LnNob3dBdFBvc2l0aW9uKHtcclxuICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQXBwLCBGdXp6eVN1Z2dlc3RNb2RhbCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB7IFNjaGVkTm90ZSB9IGZyb20gXCJzcmMvbWFpblwiO1xyXG5pbXBvcnQgeyB0IH0gZnJvbSBcInNyYy9sYW5nL2hlbHBlcnNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXZpZXdEZWNrIHtcclxuICAgIHB1YmxpYyBkZWNrTmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIG5ld05vdGVzOiBURmlsZVtdID0gW107XHJcbiAgICBwdWJsaWMgc2NoZWR1bGVkTm90ZXM6IFNjaGVkTm90ZVtdID0gW107XHJcbiAgICBwdWJsaWMgYWN0aXZlRm9sZGVyczogU2V0PHN0cmluZz47XHJcbiAgICBwdWJsaWMgZHVlTm90ZXNDb3VudDogbnVtYmVyID0gMDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmRlY2tOYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLmFjdGl2ZUZvbGRlcnMgPSBuZXcgU2V0KFt0KFwiVG9kYXlcIildKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc29ydE5vdGVzKHBhZ2VyYW5rczogUmVjb3JkPHN0cmluZywgbnVtYmVyPikge1xyXG4gICAgICAgIC8vIHNvcnQgbmV3IG5vdGVzIGJ5IGltcG9ydGFuY2VcclxuICAgICAgICB0aGlzLm5ld05vdGVzID0gdGhpcy5uZXdOb3Rlcy5zb3J0KFxyXG4gICAgICAgICAgICAoYTogVEZpbGUsIGI6IFRGaWxlKSA9PiAocGFnZXJhbmtzW2IucGF0aF0gfHwgMCkgLSAocGFnZXJhbmtzW2EucGF0aF0gfHwgMClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBzb3J0IHNjaGVkdWxlZCBub3RlcyBieSBkYXRlICYgd2l0aGluIHRob3NlIGRheXMsIHNvcnQgdGhlbSBieSBpbXBvcnRhbmNlXHJcbiAgICAgICAgdGhpcy5zY2hlZHVsZWROb3RlcyA9IHRoaXMuc2NoZWR1bGVkTm90ZXMuc29ydCgoYTogU2NoZWROb3RlLCBiOiBTY2hlZE5vdGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGEuZHVlVW5peCAtIGIuZHVlVW5peDtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAocGFnZXJhbmtzW2Iubm90ZS5wYXRoXSB8fCAwKSAtIChwYWdlcmFua3NbYS5ub3RlLnBhdGhdIHx8IDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmV2aWV3RGVja1NlbGVjdGlvbk1vZGFsIGV4dGVuZHMgRnV6enlTdWdnZXN0TW9kYWw8c3RyaW5nPiB7XHJcbiAgICBwdWJsaWMgZGVja0tleXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBwdWJsaWMgc3VibWl0Q2FsbGJhY2s6IChkZWNrS2V5OiBzdHJpbmcpID0+IHZvaWQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGRlY2tLZXlzOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHN1cGVyKGFwcCk7XHJcbiAgICAgICAgdGhpcy5kZWNrS2V5cyA9IGRlY2tLZXlzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEl0ZW1zKCk6IHN0cmluZ1tdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWNrS2V5cztcclxuICAgIH1cclxuXHJcbiAgICBnZXRJdGVtVGV4dChpdGVtOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ2hvb3NlSXRlbShkZWNrS2V5OiBzdHJpbmcsIF86IE1vdXNlRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgIHRoaXMuc3VibWl0Q2FsbGJhY2soZGVja0tleSk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQ2FyZFR5cGUgfSBmcm9tIFwic3JjL3R5cGVzXCI7XHJcblxyXG4vKipcclxuICogUmV0dXJucyBmbGFzaGNhcmRzIGZvdW5kIGluIGB0ZXh0YFxyXG4gKlxyXG4gKiBAcGFyYW0gdGV4dCAtIFRoZSB0ZXh0IHRvIGV4dHJhY3QgZmxhc2hjYXJkcyBmcm9tXHJcbiAqIEBwYXJhbSBzaW5nbGVsaW5lQ2FyZFNlcGFyYXRvciAtIFNlcGFyYXRvciBmb3IgaW5saW5lIGJhc2ljIGNhcmRzXHJcbiAqIEBwYXJhbSBzaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yIC0gU2VwYXJhdG9yIGZvciBpbmxpbmUgcmV2ZXJzZWQgY2FyZHNcclxuICogQHBhcmFtIG11bHRpbGluZUNhcmRTZXBhcmF0b3IgLSBTZXBhcmF0b3IgZm9yIG11bHRpbGluZSBiYXNpYyBjYXJkc1xyXG4gKiBAcGFyYW0gbXVsdGlsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yIC0gU2VwYXJhdG9yIGZvciBtdWx0aWxpbmUgYmFzaWMgY2FyZFxyXG4gKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbQ2FyZFR5cGUsIGNhcmQgdGV4dCwgbGluZSBudW1iZXJdIHR1cGxlc1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKFxyXG4gICAgdGV4dDogc3RyaW5nLFxyXG4gICAgc2luZ2xlbGluZUNhcmRTZXBhcmF0b3I6IHN0cmluZyxcclxuICAgIHNpbmdsZWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3I6IHN0cmluZyxcclxuICAgIG11bHRpbGluZUNhcmRTZXBhcmF0b3I6IHN0cmluZyxcclxuICAgIG11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjogc3RyaW5nXHJcbik6IFtDYXJkVHlwZSwgc3RyaW5nLCBudW1iZXJdW10ge1xyXG4gICAgbGV0IGNhcmRUZXh0OiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgbGV0IGNhcmRzOiBbQ2FyZFR5cGUsIHN0cmluZywgbnVtYmVyXVtdID0gW107XHJcbiAgICBsZXQgY2FyZFR5cGU6IENhcmRUeXBlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBsZXQgbGluZU5vOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIGxldCBsaW5lczogc3RyaW5nW10gPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChsaW5lc1tpXS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKGNhcmRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXJkcy5wdXNoKFtjYXJkVHlwZSwgY2FyZFRleHQsIGxpbmVOb10pO1xyXG4gICAgICAgICAgICAgICAgY2FyZFR5cGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXJkVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGluZXNbaV0uc3RhcnRzV2l0aChcIjwhLS1cIikgJiYgIWxpbmVzW2ldLnN0YXJ0c1dpdGgoXCI8IS0tU1I6XCIpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpICsgMSA8IGxpbmVzLmxlbmd0aCAmJiAhbGluZXNbaSArIDFdLmluY2x1ZGVzKFwiLS0+XCIpKSBpKys7XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2FyZFRleHQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjYXJkVGV4dCArPSBcIlxcblwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXJkVGV4dCArPSBsaW5lc1tpXTtcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBsaW5lc1tpXS5pbmNsdWRlcyhzaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yKSB8fFxyXG4gICAgICAgICAgICBsaW5lc1tpXS5pbmNsdWRlcyhzaW5nbGVsaW5lQ2FyZFNlcGFyYXRvcilcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgY2FyZFR5cGUgPSBsaW5lc1tpXS5pbmNsdWRlcyhzaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yKVxyXG4gICAgICAgICAgICAgICAgPyBDYXJkVHlwZS5TaW5nbGVMaW5lUmV2ZXJzZWRcclxuICAgICAgICAgICAgICAgIDogQ2FyZFR5cGUuU2luZ2xlTGluZUJhc2ljO1xyXG4gICAgICAgICAgICBjYXJkVGV4dCA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBsaW5lTm8gPSBpO1xyXG4gICAgICAgICAgICBpZiAoaSArIDEgPCBsaW5lcy5sZW5ndGggJiYgbGluZXNbaSArIDFdLnN0YXJ0c1dpdGgoXCI8IS0tU1I6XCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXJkVGV4dCArPSBcIlxcblwiICsgbGluZXNbaSArIDFdO1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhcmRzLnB1c2goW2NhcmRUeXBlLCBjYXJkVGV4dCwgbGluZU5vXSk7XHJcbiAgICAgICAgICAgIGNhcmRUeXBlID0gbnVsbDtcclxuICAgICAgICAgICAgY2FyZFRleHQgPSBcIlwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY2FyZFR5cGUgPT09IG51bGwgJiYgLz09Lio/PT0vZ20udGVzdChsaW5lc1tpXSkpIHtcclxuICAgICAgICAgICAgY2FyZFR5cGUgPSBDYXJkVHlwZS5DbG96ZTtcclxuICAgICAgICAgICAgbGluZU5vID0gaTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxpbmVzW2ldID09PSBtdWx0aWxpbmVDYXJkU2VwYXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGNhcmRUeXBlID0gQ2FyZFR5cGUuTXVsdGlMaW5lQmFzaWM7XHJcbiAgICAgICAgICAgIGxpbmVObyA9IGk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsaW5lc1tpXSA9PT0gbXVsdGlsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGNhcmRUeXBlID0gQ2FyZFR5cGUuTXVsdGlMaW5lUmV2ZXJzZWQ7XHJcbiAgICAgICAgICAgIGxpbmVObyA9IGk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsaW5lc1tpXS5zdGFydHNXaXRoKFwiYGBgXCIpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpICsgMSA8IGxpbmVzLmxlbmd0aCAmJiAhbGluZXNbaSArIDFdLnN0YXJ0c1dpdGgoXCJgYGBcIikpIHtcclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgICAgIGNhcmRUZXh0ICs9IFwiXFxuXCIgKyBsaW5lc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXJkVGV4dCArPSBcIlxcblwiICsgXCJgYGBcIjtcclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2FyZFR5cGUgJiYgY2FyZFRleHQpIHtcclxuICAgICAgICBjYXJkcy5wdXNoKFtjYXJkVHlwZSwgY2FyZFRleHQsIGxpbmVOb10pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYXJkcztcclxufVxyXG4iLCJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiwgVEFic3RyYWN0RmlsZSwgVEZpbGUsIEhlYWRpbmdDYWNoZSwgZ2V0QWxsVGFncyB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgKiBhcyBncmFwaCBmcm9tIFwicGFnZXJhbmsuanNcIjtcclxuXHJcbmltcG9ydCB7IFNSU2V0dGluZ1RhYiwgU1JTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUyB9IGZyb20gXCJzcmMvc2V0dGluZ3NcIjtcclxuaW1wb3J0IHsgRmxhc2hjYXJkTW9kYWwsIERlY2sgfSBmcm9tIFwic3JjL2ZsYXNoY2FyZC1tb2RhbFwiO1xyXG5pbXBvcnQgeyBTdGF0c01vZGFsLCBTdGF0cyB9IGZyb20gXCJzcmMvc3RhdHMtbW9kYWxcIjtcclxuaW1wb3J0IHsgUmV2aWV3UXVldWVMaXN0VmlldywgUkVWSUVXX1FVRVVFX1ZJRVdfVFlQRSB9IGZyb20gXCJzcmMvc2lkZWJhclwiO1xyXG5pbXBvcnQgeyBDYXJkLCBSZXZpZXdSZXNwb25zZSwgc2NoZWR1bGUgfSBmcm9tIFwic3JjL3NjaGVkdWxpbmdcIjtcclxuaW1wb3J0IHsgQ2FyZFR5cGUgfSBmcm9tIFwic3JjL3R5cGVzXCI7XHJcbmltcG9ydCB7XHJcbiAgICBDUk9TU19IQUlSU19JQ09OLFxyXG4gICAgWUFNTF9GUk9OVF9NQVRURVJfUkVHRVgsXHJcbiAgICBTQ0hFRFVMSU5HX0lORk9fUkVHRVgsXHJcbiAgICBMRUdBQ1lfU0NIRURVTElOR19FWFRSQUNUT1IsXHJcbiAgICBNVUxUSV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUixcclxufSBmcm9tIFwic3JjL2NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVSZWdleFN0cmluZywgY3lyYjUzLCByZW1vdmVMZWdhY3lLZXlzIH0gZnJvbSBcInNyYy91dGlsc1wiO1xyXG5pbXBvcnQgeyBSZXZpZXdEZWNrLCBSZXZpZXdEZWNrU2VsZWN0aW9uTW9kYWwgfSBmcm9tIFwic3JjL3Jldmlldy1kZWNrXCI7XHJcbmltcG9ydCB7IHQgfSBmcm9tIFwic3JjL2xhbmcvaGVscGVyc1wiO1xyXG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJzcmMvcGFyc2VyXCI7XHJcbmltcG9ydCB7IExvZ2dlciwgY3JlYXRlTG9nZ2VyIH0gZnJvbSBcInNyYy9sb2dnZXJcIjtcclxuXHJcbmludGVyZmFjZSBQbHVnaW5EYXRhIHtcclxuICAgIHNldHRpbmdzOiBTUlNldHRpbmdzO1xyXG4gICAgYnVyeURhdGU6IHN0cmluZztcclxuICAgIC8vIGhhc2hlcyBvZiBjYXJkIHRleHRzXHJcbiAgICAvLyBzaG91bGQgd29yayBhcyBsb25nIGFzIHVzZXIgZG9lc24ndCBtb2RpZnkgY2FyZCdzIHRleHRcclxuICAgIC8vIHdoaWNoIGNvdmVycyBtb3N0IG9mIHRoZSBjYXNlc1xyXG4gICAgYnVyeUxpc3Q6IHN0cmluZ1tdO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX0RBVEE6IFBsdWdpbkRhdGEgPSB7XHJcbiAgICBzZXR0aW5nczogREVGQVVMVF9TRVRUSU5HUyxcclxuICAgIGJ1cnlEYXRlOiBcIlwiLFxyXG4gICAgYnVyeUxpc3Q6IFtdLFxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTY2hlZE5vdGUge1xyXG4gICAgbm90ZTogVEZpbGU7XHJcbiAgICBkdWVVbml4OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTGlua1N0YXQge1xyXG4gICAgc291cmNlUGF0aDogc3RyaW5nO1xyXG4gICAgbGlua0NvdW50OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNSUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBIVE1MRWxlbWVudDtcclxuICAgIHByaXZhdGUgcmV2aWV3UXVldWVWaWV3OiBSZXZpZXdRdWV1ZUxpc3RWaWV3O1xyXG4gICAgcHVibGljIGRhdGE6IFBsdWdpbkRhdGE7XHJcbiAgICBwdWJsaWMgbG9nZ2VyOiBMb2dnZXI7XHJcblxyXG4gICAgcHVibGljIHJldmlld0RlY2tzOiB7IFtkZWNrS2V5OiBzdHJpbmddOiBSZXZpZXdEZWNrIH0gPSB7fTtcclxuICAgIHB1YmxpYyBsYXN0U2VsZWN0ZWRSZXZpZXdEZWNrOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIG5ld05vdGVzOiBURmlsZVtdID0gW107XHJcbiAgICBwdWJsaWMgc2NoZWR1bGVkTm90ZXM6IFNjaGVkTm90ZVtdID0gW107XHJcbiAgICBwcml2YXRlIGVhc2VCeVBhdGg6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcclxuICAgIHByaXZhdGUgaW5jb21pbmdMaW5rczogUmVjb3JkPHN0cmluZywgTGlua1N0YXRbXT4gPSB7fTtcclxuICAgIHByaXZhdGUgcGFnZXJhbmtzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XHJcbiAgICBwcml2YXRlIGR1ZU5vdGVzQ291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgZHVlRGF0ZXNOb3RlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPiA9IHt9OyAvLyBSZWNvcmQ8IyBvZiBkYXlzIGluIGZ1dHVyZSwgZHVlIGNvdW50PlxyXG5cclxuICAgIHB1YmxpYyBkZWNrVHJlZTogRGVjayA9IG5ldyBEZWNrKFwicm9vdFwiLCBudWxsKTtcclxuICAgIHB1YmxpYyBkdWVEYXRlc0ZsYXNoY2FyZHM6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7fTsgLy8gUmVjb3JkPCMgb2YgZGF5cyBpbiBmdXR1cmUsIGR1ZSBjb3VudD5cclxuICAgIHB1YmxpYyBjYXJkU3RhdHM6IFN0YXRzO1xyXG5cclxuICAgIC8vIHByZXZlbnQgY2FsbGluZyB0aGVzZSBmdW5jdGlvbnMgaWYgYW5vdGhlciBpbnN0YW5jZSBpcyBhbHJlYWR5IHJ1bm5pbmdcclxuICAgIHByaXZhdGUgbm90ZXNTeW5jTG9jazogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBmbGFzaGNhcmRzU3luY0xvY2s6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgIHRoaXMubG9nZ2VyID0gY3JlYXRlTG9nZ2VyKGNvbnNvbGUsIHRoaXMuZGF0YS5zZXR0aW5ncy5sb2dMZXZlbCk7XHJcblxyXG4gICAgICAgIGFkZEljb24oXCJjcm9zc2hhaXJzXCIsIENST1NTX0hBSVJTX0lDT04pO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHRoaXMuYWRkU3RhdHVzQmFySXRlbSgpO1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyLmNsYXNzTGlzdC5hZGQoXCJtb2QtY2xpY2thYmxlXCIpO1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdChcIk9wZW4gYSBub3RlIGZvciByZXZpZXdcIikpO1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWwtcG9zaXRpb25cIiwgXCJ0b3BcIik7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChfOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm5vdGVzU3luY0xvY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3luYygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXZpZXdOZXh0Tm90ZU1vZGFsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRSaWJib25JY29uKFwiY3Jvc3NoYWlyc1wiLCB0KFwiUmV2aWV3IGZsYXNoY2FyZHNcIiksIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmZsYXNoY2FyZHNTeW5jTG9jaykge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mbGFzaGNhcmRzX3N5bmMoKTtcclxuICAgICAgICAgICAgICAgIG5ldyBGbGFzaGNhcmRNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxyXG4gICAgICAgICAgICBSRVZJRVdfUVVFVUVfVklFV19UWVBFLFxyXG4gICAgICAgICAgICAobGVhZikgPT4gKHRoaXMucmV2aWV3UXVldWVWaWV3ID0gbmV3IFJldmlld1F1ZXVlTGlzdFZpZXcobGVhZiwgdGhpcykpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmRhdGEuc2V0dGluZ3MuZGlzYWJsZUZpbGVNZW51UmV2aWV3T3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW1lbnVcIiwgKG1lbnUsIGZpbGVpc2g6IFRBYnN0cmFjdEZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZWlzaCBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGVpc2guZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHQoXCJSZXZpZXc6IEVhc3lcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJjcm9zc2hhaXJzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKF8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2UoZmlsZWlzaCwgUmV2aWV3UmVzcG9uc2UuRWFzeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHQoXCJSZXZpZXc6IEdvb2RcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJjcm9zc2hhaXJzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKF8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2UoZmlsZWlzaCwgUmV2aWV3UmVzcG9uc2UuR29vZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKHQoXCJSZXZpZXc6IEhhcmRcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJjcm9zc2hhaXJzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKF8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2UoZmlsZWlzaCwgUmV2aWV3UmVzcG9uc2UuSGFyZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJzcnMtbm90ZS1yZXZpZXctb3Blbi1ub3RlXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IHQoXCJPcGVuIGEgbm90ZSBmb3IgcmV2aWV3XCIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5vdGVzU3luY0xvY2spIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN5bmMoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJldmlld05leHROb3RlTW9kYWwoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwic3JzLW5vdGUtcmV2aWV3LWVhc3lcIixcclxuICAgICAgICAgICAgbmFtZTogdChcIlJldmlldyBub3RlIGFzIGVhc3lcIiksXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcGVuRmlsZTogVEZpbGUgfCBudWxsID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcGVuRmlsZSAmJiBvcGVuRmlsZS5leHRlbnNpb24gPT09IFwibWRcIilcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVSZXZpZXdSZXNwb25zZShvcGVuRmlsZSwgUmV2aWV3UmVzcG9uc2UuRWFzeSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcInNycy1ub3RlLXJldmlldy1nb29kXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IHQoXCJSZXZpZXcgbm90ZSBhcyBnb29kXCIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BlbkZpbGU6IFRGaWxlIHwgbnVsbCA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAob3BlbkZpbGUgJiYgb3BlbkZpbGUuZXh0ZW5zaW9uID09PSBcIm1kXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2Uob3BlbkZpbGUsIFJldmlld1Jlc3BvbnNlLkdvb2QpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJzcnMtbm90ZS1yZXZpZXctaGFyZFwiLFxyXG4gICAgICAgICAgICBuYW1lOiB0KFwiUmV2aWV3IG5vdGUgYXMgaGFyZFwiKSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9wZW5GaWxlOiBURmlsZSB8IG51bGwgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wZW5GaWxlICYmIG9wZW5GaWxlLmV4dGVuc2lvbiA9PT0gXCJtZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVJldmlld1Jlc3BvbnNlKG9wZW5GaWxlLCBSZXZpZXdSZXNwb25zZS5IYXJkKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwic3JzLXJldmlldy1mbGFzaGNhcmRzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IHQoXCJSZXZpZXcgZmxhc2hjYXJkc1wiKSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5mbGFzaGNhcmRzU3luY0xvY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZsYXNoY2FyZHNfc3luYygpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbGFzaGNhcmRNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJzcnMtdmlldy1zdGF0c1wiLFxyXG4gICAgICAgICAgICBuYW1lOiB0KFwiVmlldyBzdGF0aXN0aWNzXCIpLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZsYXNoY2FyZHNTeW5jTG9jaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZmxhc2hjYXJkc19zeW5jKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFN0YXRzTW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTUlNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRWaWV3KCk7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zeW5jKCksIDIwMDApO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZmxhc2hjYXJkc19zeW5jKCksIDIwMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9udW5sb2FkKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoUkVWSUVXX1FVRVVFX1ZJRVdfVFlQRSkuZm9yRWFjaCgobGVhZikgPT4gbGVhZi5kZXRhY2goKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc3luYygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5ub3Rlc1N5bmNMb2NrKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5ub3Rlc1N5bmNMb2NrID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbGV0IG5vdGVzOiBURmlsZVtdID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuICAgICAgICBncmFwaC5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuZWFzZUJ5UGF0aCA9IHt9O1xyXG4gICAgICAgIHRoaXMuaW5jb21pbmdMaW5rcyA9IHt9O1xyXG4gICAgICAgIHRoaXMucGFnZXJhbmtzID0ge307XHJcbiAgICAgICAgdGhpcy5kdWVOb3Rlc0NvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmR1ZURhdGVzTm90ZXMgPSB7fTtcclxuICAgICAgICB0aGlzLnJldmlld0RlY2tzID0ge307XHJcblxyXG4gICAgICAgIGxldCBub3c6IG51bWJlciA9IERhdGUubm93KCk7XHJcbiAgICAgICAgZm9yIChsZXQgbm90ZSBvZiBub3Rlcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pbmNvbWluZ0xpbmtzW25vdGUucGF0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmNvbWluZ0xpbmtzW25vdGUucGF0aF0gPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGxpbmtzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5yZXNvbHZlZExpbmtzW25vdGUucGF0aF0gfHwge307XHJcbiAgICAgICAgICAgIGZvciAobGV0IHRhcmdldFBhdGggaW4gbGlua3MpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmluY29taW5nTGlua3NbdGFyZ2V0UGF0aF0gPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluY29taW5nTGlua3NbdGFyZ2V0UGF0aF0gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBtYXJrZG93biBmaWxlcyBvbmx5XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0UGF0aC5zcGxpdChcIi5cIikucG9wKCkhLnRvTG93ZXJDYXNlKCkgPT09IFwibWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5jb21pbmdMaW5rc1t0YXJnZXRQYXRoXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlUGF0aDogbm90ZS5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rQ291bnQ6IGxpbmtzW3RhcmdldFBhdGhdLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rKG5vdGUucGF0aCwgdGFyZ2V0UGF0aCwgbGlua3NbdGFyZ2V0UGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5zZXR0aW5ncy5ub3RlRm9sZGVyc1RvSWdub3JlLnNvbWUoKGZvbGRlcikgPT5cclxuICAgICAgICAgICAgICAgICAgICBub3RlLnBhdGguc3RhcnRzV2l0aChmb2xkZXIpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmaWxlQ2FjaGVkRGF0YSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG5vdGUpIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgbGV0IGZyb250bWF0dGVyID0gZmlsZUNhY2hlZERhdGEuZnJvbnRtYXR0ZXIgfHwgPFJlY29yZDxzdHJpbmcsIGFueT4+e307XHJcbiAgICAgICAgICAgIGxldCB0YWdzID0gZ2V0QWxsVGFncyhmaWxlQ2FjaGVkRGF0YSkgfHwgW107XHJcblxyXG4gICAgICAgICAgICBsZXQgc2hvdWxkSWdub3JlOiBib29sZWFuID0gdHJ1ZTtcclxuICAgICAgICAgICAgZm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuc2V0dGluZ3MudGFnc1RvUmV2aWV3LnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh0YWdUb1JldmlldykgPT4gdGFnID09PSB0YWdUb1JldmlldyB8fCB0YWcuc3RhcnRzV2l0aCh0YWdUb1JldmlldyArIFwiL1wiKVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXZpZXdEZWNrcy5oYXNPd25Qcm9wZXJ0eSh0YWcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV2aWV3RGVja3NbdGFnXSA9IG5ldyBSZXZpZXdEZWNrKHRhZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZElnbm9yZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzaG91bGRJZ25vcmUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmaWxlIGhhcyBubyBzY2hlZHVsaW5nIGluZm9ybWF0aW9uXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICEoXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbnRtYXR0ZXIuaGFzT3duUHJvcGVydHkoXCJzci1kdWVcIikgJiZcclxuICAgICAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWludGVydmFsXCIpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbnRtYXR0ZXIuaGFzT3duUHJvcGVydHkoXCJzci1lYXNlXCIpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXZpZXdEZWNrcy5oYXNPd25Qcm9wZXJ0eSh0YWcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV2aWV3RGVja3NbdGFnXS5uZXdOb3Rlcy5wdXNoKG5vdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgZHVlVW5peDogbnVtYmVyID0gd2luZG93XHJcbiAgICAgICAgICAgICAgICAubW9tZW50KGZyb250bWF0dGVyW1wic3ItZHVlXCJdLCBbXCJZWVlZLU1NLUREXCIsIFwiREQtTU0tWVlZWVwiLCBcImRkZCBNTU0gREQgWVlZWVwiXSlcclxuICAgICAgICAgICAgICAgIC52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXZpZXdEZWNrcy5oYXNPd25Qcm9wZXJ0eSh0YWcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXZpZXdEZWNrc1t0YWddLnNjaGVkdWxlZE5vdGVzLnB1c2goeyBub3RlLCBkdWVVbml4IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZHVlVW5peCA8PSBub3cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXZpZXdEZWNrc1t0YWddLmR1ZU5vdGVzQ291bnQrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFzZUJ5UGF0aFtub3RlLnBhdGhdID0gZnJvbnRtYXR0ZXJbXCJzci1lYXNlXCJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGR1ZVVuaXggPD0gbm93KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmR1ZU5vdGVzQ291bnQrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG5EYXlzOiBudW1iZXIgPSBNYXRoLmNlaWwoKGR1ZVVuaXggLSBub3cpIC8gKDI0ICogMzYwMCAqIDEwMDApKTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmR1ZURhdGVzTm90ZXMuaGFzT3duUHJvcGVydHkobkRheXMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmR1ZURhdGVzTm90ZXNbbkRheXNdID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmR1ZURhdGVzTm90ZXNbbkRheXNdKys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBncmFwaC5yYW5rKDAuODUsIDAuMDAwMDAxLCAobm9kZTogc3RyaW5nLCByYW5rOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wYWdlcmFua3Nbbm9kZV0gPSByYW5rICogMTAwMDA7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGRlY2tLZXkgaW4gdGhpcy5yZXZpZXdEZWNrcykge1xyXG4gICAgICAgICAgICB0aGlzLnJldmlld0RlY2tzW2RlY2tLZXldLnNvcnROb3Rlcyh0aGlzLnBhZ2VyYW5rcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbm90ZUNvdW50VGV4dDogc3RyaW5nID0gdGhpcy5kdWVOb3Rlc0NvdW50ID09PSAxID8gdChcIm5vdGVcIikgOiB0KFwibm90ZXNcIik7XHJcbiAgICAgICAgbGV0IGNhcmRDb3VudFRleHQ6IHN0cmluZyA9IHRoaXMuZGVja1RyZWUuZHVlRmxhc2hjYXJkc0NvdW50ID09PSAxID8gdChcImNhcmRcIikgOiB0KFwiY2FyZHNcIik7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0VGV4dChcclxuICAgICAgICAgICAgdChcIlJldmlld1wiKSArXHJcbiAgICAgICAgICAgICAgICBgOiAke3RoaXMuZHVlTm90ZXNDb3VudH0gJHtub3RlQ291bnRUZXh0fSwgYCArXHJcbiAgICAgICAgICAgICAgICBgJHt0aGlzLmRlY2tUcmVlLmR1ZUZsYXNoY2FyZHNDb3VudH0gJHtjYXJkQ291bnRUZXh0fSBgICtcclxuICAgICAgICAgICAgICAgIHQoXCJkdWVcIilcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMucmV2aWV3UXVldWVWaWV3LnJlZHJhdygpO1xyXG5cclxuICAgICAgICB0aGlzLm5vdGVzU3luY0xvY2sgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlUmV2aWV3UmVzcG9uc2Uobm90ZTogVEZpbGUsIHJlc3BvbnNlOiBSZXZpZXdSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGxldCBmaWxlQ2FjaGVkRGF0YSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG5vdGUpIHx8IHt9O1xyXG4gICAgICAgIGxldCBmcm9udG1hdHRlciA9IGZpbGVDYWNoZWREYXRhLmZyb250bWF0dGVyIHx8IDxSZWNvcmQ8c3RyaW5nLCBhbnk+Pnt9O1xyXG5cclxuICAgICAgICBsZXQgdGFncyA9IGdldEFsbFRhZ3MoZmlsZUNhY2hlZERhdGEpIHx8IFtdO1xyXG4gICAgICAgIGlmICh0aGlzLmRhdGEuc2V0dGluZ3Mubm90ZUZvbGRlcnNUb0lnbm9yZS5zb21lKChmb2xkZXIpID0+IG5vdGUucGF0aC5zdGFydHNXaXRoKGZvbGRlcikpKSB7XHJcbiAgICAgICAgICAgIG5ldyBOb3RpY2UodChcIk5vdGUgaXMgc2F2ZWQgdW5kZXIgaWdub3JlZCBmb2xkZXIgKGNoZWNrIHNldHRpbmdzKS5cIikpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc2hvdWxkSWdub3JlOiBib29sZWFuID0gdHJ1ZTtcclxuICAgICAgICBmb3IgKGxldCB0YWcgb2YgdGFncykge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuc2V0dGluZ3MudGFnc1RvUmV2aWV3LnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgKHRhZ1RvUmV2aWV3KSA9PiB0YWcgPT09IHRhZ1RvUmV2aWV3IHx8IHRhZy5zdGFydHNXaXRoKHRhZ1RvUmV2aWV3ICsgXCIvXCIpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgc2hvdWxkSWdub3JlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNob3VsZElnbm9yZSkge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKHQoXCJQbGVhc2UgdGFnIHRoZSBub3RlIGFwcHJvcHJpYXRlbHkgZm9yIHJldmlld2luZyAoaW4gc2V0dGluZ3MpLlwiKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmaWxlVGV4dDogc3RyaW5nID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChub3RlKTtcclxuICAgICAgICBsZXQgZWFzZTogbnVtYmVyLFxyXG4gICAgICAgICAgICBpbnRlcnZhbDogbnVtYmVyLFxyXG4gICAgICAgICAgICBkZWxheUJlZm9yZVJldmlldzogbnVtYmVyLFxyXG4gICAgICAgICAgICBub3c6IG51bWJlciA9IERhdGUubm93KCk7XHJcbiAgICAgICAgLy8gbmV3IG5vdGVcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICEoXHJcbiAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWR1ZVwiKSAmJlxyXG4gICAgICAgICAgICAgICAgZnJvbnRtYXR0ZXIuaGFzT3duUHJvcGVydHkoXCJzci1pbnRlcnZhbFwiKSAmJlxyXG4gICAgICAgICAgICAgICAgZnJvbnRtYXR0ZXIuaGFzT3duUHJvcGVydHkoXCJzci1lYXNlXCIpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgbGV0IGxpbmtUb3RhbDogbnVtYmVyID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbmtQR1RvdGFsOiBudW1iZXIgPSAwLFxyXG4gICAgICAgICAgICAgICAgdG90YWxMaW5rQ291bnQ6IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0T2JqIG9mIHRoaXMuaW5jb21pbmdMaW5rc1tub3RlLnBhdGhdIHx8IFtdKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZWFzZTogbnVtYmVyID0gdGhpcy5lYXNlQnlQYXRoW3N0YXRPYmouc291cmNlUGF0aF07XHJcbiAgICAgICAgICAgICAgICBpZiAoZWFzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtUb3RhbCArPSBzdGF0T2JqLmxpbmtDb3VudCAqIHRoaXMucGFnZXJhbmtzW3N0YXRPYmouc291cmNlUGF0aF0gKiBlYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtQR1RvdGFsICs9IHRoaXMucGFnZXJhbmtzW3N0YXRPYmouc291cmNlUGF0aF0gKiBzdGF0T2JqLmxpbmtDb3VudDtcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbExpbmtDb3VudCArPSBzdGF0T2JqLmxpbmtDb3VudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG91dGdvaW5nTGlua3MgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLnJlc29sdmVkTGlua3Nbbm90ZS5wYXRoXSB8fCB7fTtcclxuICAgICAgICAgICAgZm9yIChsZXQgbGlua2VkRmlsZVBhdGggaW4gb3V0Z29pbmdMaW5rcykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVhc2U6IG51bWJlciA9IHRoaXMuZWFzZUJ5UGF0aFtsaW5rZWRGaWxlUGF0aF07XHJcbiAgICAgICAgICAgICAgICBpZiAoZWFzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtUb3RhbCArPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRnb2luZ0xpbmtzW2xpbmtlZEZpbGVQYXRoXSAqIHRoaXMucGFnZXJhbmtzW2xpbmtlZEZpbGVQYXRoXSAqIGVhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlua1BHVG90YWwgKz0gdGhpcy5wYWdlcmFua3NbbGlua2VkRmlsZVBhdGhdICogb3V0Z29pbmdMaW5rc1tsaW5rZWRGaWxlUGF0aF07XHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxMaW5rQ291bnQgKz0gb3V0Z29pbmdMaW5rc1tsaW5rZWRGaWxlUGF0aF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBsaW5rQ29udHJpYnV0aW9uOiBudW1iZXIgPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnNldHRpbmdzLm1heExpbmtGYWN0b3IgKlxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4oMS4wLCBNYXRoLmxvZyh0b3RhbExpbmtDb3VudCArIDAuNSkgLyBNYXRoLmxvZyg2NCkpO1xyXG4gICAgICAgICAgICBlYXNlID0gTWF0aC5yb3VuZChcclxuICAgICAgICAgICAgICAgICgxLjAgLSBsaW5rQ29udHJpYnV0aW9uKSAqIHRoaXMuZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSArXHJcbiAgICAgICAgICAgICAgICAgICAgKHRvdGFsTGlua0NvdW50ID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IChsaW5rQ29udHJpYnV0aW9uICogbGlua1RvdGFsKSAvIGxpbmtQR1RvdGFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbGlua0NvbnRyaWJ1dGlvbiAqIHRoaXMuZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaW50ZXJ2YWwgPSAxO1xyXG4gICAgICAgICAgICBkZWxheUJlZm9yZVJldmlldyA9IDA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaW50ZXJ2YWwgPSBmcm9udG1hdHRlcltcInNyLWludGVydmFsXCJdO1xyXG4gICAgICAgICAgICBlYXNlID0gZnJvbnRtYXR0ZXJbXCJzci1lYXNlXCJdO1xyXG4gICAgICAgICAgICBkZWxheUJlZm9yZVJldmlldyA9XHJcbiAgICAgICAgICAgICAgICBub3cgLVxyXG4gICAgICAgICAgICAgICAgd2luZG93XHJcbiAgICAgICAgICAgICAgICAgICAgLm1vbWVudChmcm9udG1hdHRlcltcInNyLWR1ZVwiXSwgW1wiWVlZWS1NTS1ERFwiLCBcIkRELU1NLVlZWVlcIiwgXCJkZGQgTU1NIEREIFlZWVlcIl0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzY2hlZE9iajogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHNjaGVkdWxlKFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgaW50ZXJ2YWwsXHJcbiAgICAgICAgICAgIGVhc2UsXHJcbiAgICAgICAgICAgIGRlbGF5QmVmb3JlUmV2aWV3LFxyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2V0dGluZ3MsXHJcbiAgICAgICAgICAgIHRoaXMuZHVlRGF0ZXNOb3Rlc1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgaW50ZXJ2YWwgPSBzY2hlZE9iai5pbnRlcnZhbDtcclxuICAgICAgICBlYXNlID0gc2NoZWRPYmouZWFzZTtcclxuXHJcbiAgICAgICAgbGV0IGR1ZSA9IHdpbmRvdy5tb21lbnQobm93ICsgaW50ZXJ2YWwgKiAyNCAqIDM2MDAgKiAxMDAwKTtcclxuICAgICAgICBsZXQgZHVlU3RyaW5nOiBzdHJpbmcgPSBkdWUuZm9ybWF0KFwiWVlZWS1NTS1ERFwiKTtcclxuXHJcbiAgICAgICAgLy8gY2hlY2sgaWYgc2NoZWR1bGluZyBpbmZvIGV4aXN0c1xyXG4gICAgICAgIGlmIChTQ0hFRFVMSU5HX0lORk9fUkVHRVgudGVzdChmaWxlVGV4dCkpIHtcclxuICAgICAgICAgICAgbGV0IHNjaGVkdWxpbmdJbmZvID0gU0NIRURVTElOR19JTkZPX1JFR0VYLmV4ZWMoZmlsZVRleHQpITtcclxuICAgICAgICAgICAgZmlsZVRleHQgPSBmaWxlVGV4dC5yZXBsYWNlKFxyXG4gICAgICAgICAgICAgICAgU0NIRURVTElOR19JTkZPX1JFR0VYLFxyXG4gICAgICAgICAgICAgICAgYC0tLVxcbiR7c2NoZWR1bGluZ0luZm9bMV19c3ItZHVlOiAke2R1ZVN0cmluZ31cXG5gICtcclxuICAgICAgICAgICAgICAgICAgICBgc3ItaW50ZXJ2YWw6ICR7aW50ZXJ2YWx9XFxuc3ItZWFzZTogJHtlYXNlfVxcbmAgK1xyXG4gICAgICAgICAgICAgICAgICAgIGAke3NjaGVkdWxpbmdJbmZvWzVdfS0tLWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFlBTUxfRlJPTlRfTUFUVEVSX1JFR0VYLnRlc3QoZmlsZVRleHQpKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyBub3RlIHdpdGggZXhpc3RpbmcgWUFNTCBmcm9udCBtYXR0ZXJcclxuICAgICAgICAgICAgbGV0IGV4aXN0aW5nWWFtbCA9IFlBTUxfRlJPTlRfTUFUVEVSX1JFR0VYLmV4ZWMoZmlsZVRleHQpITtcclxuICAgICAgICAgICAgZmlsZVRleHQgPSBmaWxlVGV4dC5yZXBsYWNlKFxyXG4gICAgICAgICAgICAgICAgWUFNTF9GUk9OVF9NQVRURVJfUkVHRVgsXHJcbiAgICAgICAgICAgICAgICBgLS0tXFxuJHtleGlzdGluZ1lhbWxbMV19c3ItZHVlOiAke2R1ZVN0cmluZ31cXG5gICtcclxuICAgICAgICAgICAgICAgICAgICBgc3ItaW50ZXJ2YWw6ICR7aW50ZXJ2YWx9XFxuc3ItZWFzZTogJHtlYXNlfVxcbi0tLWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmaWxlVGV4dCA9XHJcbiAgICAgICAgICAgICAgICBgLS0tXFxuc3ItZHVlOiAke2R1ZVN0cmluZ31cXG5zci1pbnRlcnZhbDogJHtpbnRlcnZhbH1cXG5gICtcclxuICAgICAgICAgICAgICAgIGBzci1lYXNlOiAke2Vhc2V9XFxuLS0tXFxuXFxuJHtmaWxlVGV4dH1gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5zZXR0aW5ncy5idXJ5U2libGluZ0NhcmRzKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZmluZEZsYXNoY2FyZHMobm90ZSwgW10sIHRydWUpOyAvLyBidXJ5IGFsbCBjYXJkcyBpbiBjdXJyZW50IG5vdGVcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlUGx1Z2luRGF0YSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobm90ZSwgZmlsZVRleHQpO1xyXG5cclxuICAgICAgICBuZXcgTm90aWNlKHQoXCJSZXNwb25zZSByZWNlaXZlZC5cIikpO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm5vdGVzU3luY0xvY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3luYygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5zZXR0aW5ncy5hdXRvTmV4dE5vdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJldmlld05leHROb3RlKHRoaXMubGFzdFNlbGVjdGVkUmV2aWV3RGVjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJldmlld05leHROb3RlTW9kYWwoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgbGV0IHJldmlld0RlY2tOYW1lczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyh0aGlzLnJldmlld0RlY2tzKTtcclxuICAgICAgICBpZiAocmV2aWV3RGVja05hbWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLnJldmlld05leHROb3RlKHJldmlld0RlY2tOYW1lc1swXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRlY2tTZWxlY3Rpb25Nb2RhbCA9IG5ldyBSZXZpZXdEZWNrU2VsZWN0aW9uTW9kYWwodGhpcy5hcHAsIHJldmlld0RlY2tOYW1lcyk7XHJcbiAgICAgICAgICAgIGRlY2tTZWxlY3Rpb25Nb2RhbC5zdWJtaXRDYWxsYmFjayA9IChkZWNrS2V5OiBzdHJpbmcpID0+IHRoaXMucmV2aWV3TmV4dE5vdGUoZGVja0tleSk7XHJcbiAgICAgICAgICAgIGRlY2tTZWxlY3Rpb25Nb2RhbC5vcGVuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJldmlld05leHROb3RlKGRlY2tLZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGlmICghdGhpcy5yZXZpZXdEZWNrcy5oYXNPd25Qcm9wZXJ0eShkZWNrS2V5KSkge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKFwiTm8gZGVjayBleGlzdHMgZm9yIFwiICsgZGVja0tleSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFNlbGVjdGVkUmV2aWV3RGVjayA9IGRlY2tLZXk7XHJcbiAgICAgICAgbGV0IGRlY2sgPSB0aGlzLnJldmlld0RlY2tzW2RlY2tLZXldO1xyXG5cclxuICAgICAgICBpZiAoZGVjay5kdWVOb3Rlc0NvdW50ID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmRhdGEuc2V0dGluZ3Mub3BlblJhbmRvbU5vdGVcclxuICAgICAgICAgICAgICAgID8gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZGVjay5kdWVOb3Rlc0NvdW50KVxyXG4gICAgICAgICAgICAgICAgOiAwO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiEub3BlbkZpbGUoZGVjay5zY2hlZHVsZWROb3Rlc1tpbmRleF0ubm90ZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkZWNrLm5ld05vdGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5kYXRhLnNldHRpbmdzLm9wZW5SYW5kb21Ob3RlXHJcbiAgICAgICAgICAgICAgICA/IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGRlY2submV3Tm90ZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgOiAwO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiEub3BlbkZpbGUoZGVjay5uZXdOb3Rlc1tpbmRleF0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBuZXcgTm90aWNlKHQoXCJZb3UncmUgYWxsIGNhdWdodCB1cCBub3cgOkQuXCIpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmbGFzaGNhcmRzX3N5bmMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgaWYgKHRoaXMuZmxhc2hjYXJkc1N5bmNMb2NrKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mbGFzaGNhcmRzU3luY0xvY2sgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgbm90ZXM6IFRGaWxlW10gPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGVja1RyZWUgPSBuZXcgRGVjayhcInJvb3RcIiwgbnVsbCk7XHJcbiAgICAgICAgdGhpcy5kdWVEYXRlc0ZsYXNoY2FyZHMgPSB7fTtcclxuICAgICAgICB0aGlzLmNhcmRTdGF0cyA9IHtcclxuICAgICAgICAgICAgZWFzZXM6IHt9LFxyXG4gICAgICAgICAgICBpbnRlcnZhbHM6IHt9LFxyXG4gICAgICAgICAgICBuZXdDb3VudDogMCxcclxuICAgICAgICAgICAgeW91bmdDb3VudDogMCxcclxuICAgICAgICAgICAgbWF0dXJlQ291bnQ6IDAsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IG5vdyA9IHdpbmRvdy5tb21lbnQoRGF0ZS5ub3coKSk7XHJcbiAgICAgICAgbGV0IHRvZGF5RGF0ZTogc3RyaW5nID0gbm93LmZvcm1hdChcIllZWVktTU0tRERcIik7XHJcbiAgICAgICAgLy8gY2xlYXIgbGlzdCBpZiB3ZSd2ZSBjaGFuZ2VkIGRhdGVzXHJcbiAgICAgICAgaWYgKHRvZGF5RGF0ZSAhPT0gdGhpcy5kYXRhLmJ1cnlEYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5idXJ5RGF0ZSA9IHRvZGF5RGF0ZTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmJ1cnlMaXN0ID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbm90ZVBhdGhzU2V0OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcclxuICAgICAgICBmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5zZXR0aW5ncy5ub3RlRm9sZGVyc1RvSWdub3JlLnNvbWUoKGZvbGRlcikgPT5cclxuICAgICAgICAgICAgICAgICAgICBub3RlLnBhdGguc3RhcnRzV2l0aChmb2xkZXIpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG5vdGVQYXRoc1NldC5hZGQobm90ZS5wYXRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGZpbmQgZGVjayBwYXRoXHJcbiAgICAgICAgICAgIGxldCBkZWNrUGF0aDogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5zZXR0aW5ncy5jb252ZXJ0Rm9sZGVyc1RvRGVja3MpIHtcclxuICAgICAgICAgICAgICAgIGRlY2tQYXRoID0gbm90ZS5wYXRoLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgICAgIGRlY2tQYXRoLnBvcCgpOyAvLyByZW1vdmUgZmlsZW5hbWVcclxuICAgICAgICAgICAgICAgIGlmIChkZWNrUGF0aC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWNrUGF0aCA9IFtcIi9cIl07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmlsZUNhY2hlZERhdGEgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShub3RlKSB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGxldCB0YWdzID0gZ2V0QWxsVGFncyhmaWxlQ2FjaGVkRGF0YSkgfHwgW107XHJcblxyXG4gICAgICAgICAgICAgICAgb3V0ZXI6IGZvciAobGV0IHRhZ1RvUmV2aWV3IG9mIHRoaXMuZGF0YS5zZXR0aW5ncy5mbGFzaGNhcmRUYWdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgdGFnIG9mIHRhZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZyA9PT0gdGFnVG9SZXZpZXcgfHwgdGFnLnN0YXJ0c1dpdGgodGFnVG9SZXZpZXcgKyBcIi9cIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY2tQYXRoID0gdGFnLnN1YnN0cmluZygxKS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhayBvdXRlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRlY2tQYXRoLmxlbmd0aCA9PT0gMCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmZpbmRGbGFzaGNhcmRzKG5vdGUsIGRlY2tQYXRoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oYEZsYXNoY2FyZCBzeW5jIHRvb2sgJHtEYXRlLm5vdygpIC0gbm93LnZhbHVlT2YoKX1tc2ApO1xyXG5cclxuICAgICAgICAvLyBzb3J0IHRoZSBkZWNrIG5hbWVzXHJcbiAgICAgICAgdGhpcy5kZWNrVHJlZS5zb3J0U3ViZGVja3NMaXN0KCk7XHJcblxyXG4gICAgICAgIGxldCBub3RlQ291bnRUZXh0OiBzdHJpbmcgPSB0aGlzLmR1ZU5vdGVzQ291bnQgPT09IDEgPyB0KFwibm90ZVwiKSA6IHQoXCJub3Rlc1wiKTtcclxuICAgICAgICBsZXQgY2FyZENvdW50VGV4dDogc3RyaW5nID0gdGhpcy5kZWNrVHJlZS5kdWVGbGFzaGNhcmRzQ291bnQgPT09IDEgPyB0KFwiY2FyZFwiKSA6IHQoXCJjYXJkc1wiKTtcclxuICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXRUZXh0KFxyXG4gICAgICAgICAgICB0KFwiUmV2aWV3XCIpICtcclxuICAgICAgICAgICAgICAgIGA6ICR7dGhpcy5kdWVOb3Rlc0NvdW50fSAke25vdGVDb3VudFRleHR9LCBgICtcclxuICAgICAgICAgICAgICAgIGAke3RoaXMuZGVja1RyZWUuZHVlRmxhc2hjYXJkc0NvdW50fSAke2NhcmRDb3VudFRleHR9IGAgK1xyXG4gICAgICAgICAgICAgICAgdChcImR1ZVwiKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHRoaXMuZmxhc2hjYXJkc1N5bmNMb2NrID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZmluZEZsYXNoY2FyZHMoXHJcbiAgICAgICAgbm90ZTogVEZpbGUsXHJcbiAgICAgICAgZGVja1BhdGg6IHN0cmluZ1tdLFxyXG4gICAgICAgIGJ1cnlPbmx5OiBib29sZWFuID0gZmFsc2VcclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGxldCBmaWxlVGV4dDogc3RyaW5nID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChub3RlKTtcclxuICAgICAgICBsZXQgZmlsZUNhY2hlZERhdGEgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShub3RlKSB8fCB7fTtcclxuICAgICAgICBsZXQgaGVhZGluZ3M6IEhlYWRpbmdDYWNoZVtdID0gZmlsZUNhY2hlZERhdGEuaGVhZGluZ3MgfHwgW107XHJcbiAgICAgICAgbGV0IGZpbGVDaGFuZ2VkOiBib29sZWFuID0gZmFsc2UsXHJcbiAgICAgICAgICAgIGRlY2tBZGRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgbm93OiBudW1iZXIgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGxldCBwYXJzZWRDYXJkczogW0NhcmRUeXBlLCBzdHJpbmcsIG51bWJlcl1bXSA9IHBhcnNlKFxyXG4gICAgICAgICAgICBmaWxlVGV4dCxcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yLFxyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2V0dGluZ3Muc2luZ2xlbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcixcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNldHRpbmdzLm11bHRpbGluZUNhcmRTZXBhcmF0b3IsXHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3JcclxuICAgICAgICApO1xyXG4gICAgICAgIGZvciAobGV0IHBhcnNlZENhcmQgb2YgcGFyc2VkQ2FyZHMpIHtcclxuICAgICAgICAgICAgbGV0IGNhcmRUeXBlOiBDYXJkVHlwZSA9IHBhcnNlZENhcmRbMF0sXHJcbiAgICAgICAgICAgICAgICBjYXJkVGV4dDogc3RyaW5nID0gcGFyc2VkQ2FyZFsxXSxcclxuICAgICAgICAgICAgICAgIGxpbmVObzogbnVtYmVyID0gcGFyc2VkQ2FyZFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjYXJkVHlwZSA9PT0gQ2FyZFR5cGUuQ2xvemUgJiYgdGhpcy5kYXRhLnNldHRpbmdzLmRpc2FibGVDbG96ZUNhcmRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGNhcmRUZXh0SGFzaDogc3RyaW5nID0gY3lyYjUzKGNhcmRUZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidXJ5T25seSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmJ1cnlMaXN0LnB1c2goY2FyZFRleHRIYXNoKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWRlY2tBZGRlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWNrVHJlZS5jcmVhdGVEZWNrKFsuLi5kZWNrUGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgZGVja0FkZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHNpYmxpbmdNYXRjaGVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcclxuICAgICAgICAgICAgaWYgKGNhcmRUeXBlID09PSBDYXJkVHlwZS5DbG96ZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb250OiBzdHJpbmcsIGJhY2s6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG0gb2YgY2FyZFRleHQubWF0Y2hBbGwoLz09KC4qPyk9PS9nbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsZXRpb25TdGFydDogbnVtYmVyID0gbS5pbmRleCEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0aW9uRW5kOiBudW1iZXIgPSBkZWxldGlvblN0YXJ0ICsgbVswXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbnQgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgZGVsZXRpb25TdGFydCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIHN0eWxlPSdjb2xvcjojMjE5NmYzJz5bLi4uXTwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LnN1YnN0cmluZyhkZWxldGlvbkVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbnQgPSBmcm9udC5yZXBsYWNlKC89PS9nbSwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFjayA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LnN1YnN0cmluZygwLCBkZWxldGlvblN0YXJ0KSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gc3R5bGU9J2NvbG9yOiMyMTk2ZjMnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKGRlbGV0aW9uU3RhcnQsIGRlbGV0aW9uRW5kKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9zcGFuPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKGRlbGV0aW9uRW5kKTtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrID0gYmFjay5yZXBsYWNlKC89PS9nbSwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgc2libGluZ01hdGNoZXMucHVzaChbZnJvbnQsIGJhY2tdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZHg6IG51bWJlcjtcclxuICAgICAgICAgICAgICAgIGlmIChjYXJkVHlwZSA9PT0gQ2FyZFR5cGUuU2luZ2xlTGluZUJhc2ljKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gY2FyZFRleHQuaW5kZXhPZih0aGlzLmRhdGEuc2V0dGluZ3Muc2luZ2xlbGluZUNhcmRTZXBhcmF0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdNYXRjaGVzLnB1c2goW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgaWR4KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKGlkeCArIHRoaXMuZGF0YS5zZXR0aW5ncy5zaW5nbGVsaW5lQ2FyZFNlcGFyYXRvci5sZW5ndGgpLFxyXG4gICAgICAgICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYXJkVHlwZSA9PT0gQ2FyZFR5cGUuU2luZ2xlTGluZVJldmVyc2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gY2FyZFRleHQuaW5kZXhPZih0aGlzLmRhdGEuc2V0dGluZ3Muc2luZ2xlbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNpZGUxOiBzdHJpbmcgPSBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgaWR4KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkZTI6IHN0cmluZyA9IGNhcmRUZXh0LnN1YnN0cmluZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkeCArIHRoaXMuZGF0YS5zZXR0aW5ncy5zaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdNYXRjaGVzLnB1c2goW3NpZGUxLCBzaWRlMl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdNYXRjaGVzLnB1c2goW3NpZGUyLCBzaWRlMV0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYXJkVHlwZSA9PT0gQ2FyZFR5cGUuTXVsdGlMaW5lQmFzaWMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBjYXJkVGV4dC5pbmRleE9mKFwiXFxuXCIgKyB0aGlzLmRhdGEuc2V0dGluZ3MubXVsdGlsaW5lQ2FyZFNlcGFyYXRvciArIFwiXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdNYXRjaGVzLnB1c2goW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgaWR4KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWR4ICsgMiArIHRoaXMuZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVDYXJkU2VwYXJhdG9yLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYXJkVHlwZSA9PT0gQ2FyZFR5cGUuTXVsdGlMaW5lUmV2ZXJzZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBjYXJkVGV4dC5pbmRleE9mKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlxcblwiICsgdGhpcy5kYXRhLnNldHRpbmdzLm11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvciArIFwiXFxuXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaWRlMTogc3RyaW5nID0gY2FyZFRleHQuc3Vic3RyaW5nKDAsIGlkeCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGUyOiBzdHJpbmcgPSBjYXJkVGV4dC5zdWJzdHJpbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZHggKyAyICsgdGhpcy5kYXRhLnNldHRpbmdzLm11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvci5sZW5ndGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nTWF0Y2hlcy5wdXNoKFtzaWRlMSwgc2lkZTJdKTtcclxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nTWF0Y2hlcy5wdXNoKFtzaWRlMiwgc2lkZTFdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHNjaGVkdWxpbmc6IFJlZ0V4cE1hdGNoQXJyYXlbXSA9IFsuLi5jYXJkVGV4dC5tYXRjaEFsbChNVUxUSV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUildO1xyXG4gICAgICAgICAgICBpZiAoc2NoZWR1bGluZy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICBzY2hlZHVsaW5nID0gWy4uLmNhcmRUZXh0Lm1hdGNoQWxsKExFR0FDWV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUildO1xyXG5cclxuICAgICAgICAgICAgLy8gd2UgaGF2ZSBzb21lIGV4dHJhIHNjaGVkdWxpbmcgZGF0ZXMgdG8gZGVsZXRlXHJcbiAgICAgICAgICAgIGlmIChzY2hlZHVsaW5nLmxlbmd0aCA+IHNpYmxpbmdNYXRjaGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkeFNjaGVkOiBudW1iZXIgPSBjYXJkVGV4dC5sYXN0SW5kZXhPZihcIjwhLS1TUjpcIikgKyA3O1xyXG4gICAgICAgICAgICAgICAgbGV0IG5ld0NhcmRUZXh0OiBzdHJpbmcgPSBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgaWR4U2NoZWQpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaWJsaW5nTWF0Y2hlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkVGV4dCArPSBgISR7c2NoZWR1bGluZ1tpXVsxXX0sJHtzY2hlZHVsaW5nW2ldWzJdfSwke3NjaGVkdWxpbmdbaV1bM119YDtcclxuICAgICAgICAgICAgICAgIG5ld0NhcmRUZXh0ICs9IFwiLS0+XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJlcGxhY2VtZW50UmVnZXggPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ2V4U3RyaW5nKGNhcmRUZXh0KSwgXCJnbVwiKTtcclxuICAgICAgICAgICAgICAgIGZpbGVUZXh0ID0gZmlsZVRleHQucmVwbGFjZShyZXBsYWNlbWVudFJlZ2V4LCAoXykgPT4gbmV3Q2FyZFRleHQpO1xyXG4gICAgICAgICAgICAgICAgZmlsZUNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgY29udGV4dDogc3RyaW5nID0gdGhpcy5kYXRhLnNldHRpbmdzLnNob3dDb250ZXh0SW5DYXJkc1xyXG4gICAgICAgICAgICAgICAgPyBnZXRDYXJkQ29udGV4dChsaW5lTm8sIGhlYWRpbmdzKVxyXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xyXG4gICAgICAgICAgICBsZXQgc2libGluZ3M6IENhcmRbXSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpYmxpbmdNYXRjaGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZnJvbnQ6IHN0cmluZyA9IHNpYmxpbmdNYXRjaGVzW2ldWzBdLnRyaW0oKSxcclxuICAgICAgICAgICAgICAgICAgICBiYWNrOiBzdHJpbmcgPSBzaWJsaW5nTWF0Y2hlc1tpXVsxXS50cmltKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNhcmRPYmo6IENhcmQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNEdWU6IGkgPCBzY2hlZHVsaW5nLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBub3RlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVObyxcclxuICAgICAgICAgICAgICAgICAgICBmcm9udCxcclxuICAgICAgICAgICAgICAgICAgICBiYWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FyZFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2libGluZ0lkeDogaSxcclxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY2FyZCBzY2hlZHVsZWRcclxuICAgICAgICAgICAgICAgIGlmIChpIDwgc2NoZWR1bGluZy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZHVlVW5peDogbnVtYmVyID0gd2luZG93XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tb21lbnQoc2NoZWR1bGluZ1tpXVsxXSwgW1wiWVlZWS1NTS1ERFwiLCBcIkRELU1NLVlZWVlcIl0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5EYXlzOiBudW1iZXIgPSBNYXRoLmNlaWwoKGR1ZVVuaXggLSBub3cpIC8gKDI0ICogMzYwMCAqIDEwMDApKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZHVlRGF0ZXNGbGFzaGNhcmRzLmhhc093blByb3BlcnR5KG5EYXlzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmR1ZURhdGVzRmxhc2hjYXJkc1tuRGF5c10gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmR1ZURhdGVzRmxhc2hjYXJkc1tuRGF5c10rKztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGludGVydmFsOiBudW1iZXIgPSBwYXJzZUludChzY2hlZHVsaW5nW2ldWzJdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFzZTogbnVtYmVyID0gcGFyc2VJbnQoc2NoZWR1bGluZ1tpXVszXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhcmRTdGF0cy5pbnRlcnZhbHMuaGFzT3duUHJvcGVydHkoaW50ZXJ2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZFN0YXRzLmludGVydmFsc1tpbnRlcnZhbF0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRTdGF0cy5pbnRlcnZhbHNbaW50ZXJ2YWxdKys7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhcmRTdGF0cy5lYXNlcy5oYXNPd25Qcm9wZXJ0eShlYXNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRTdGF0cy5lYXNlc1tlYXNlXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZFN0YXRzLmVhc2VzW2Vhc2VdKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnZhbCA+PSAyMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRTdGF0cy5tYXR1cmVDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZFN0YXRzLnlvdW5nQ291bnQrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuYnVyeUxpc3QuaW5jbHVkZXMoY2FyZFRleHRIYXNoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2tUcmVlLmNvdW50Rmxhc2hjYXJkKFsuLi5kZWNrUGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkdWVVbml4IDw9IG5vdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkT2JqLmludGVydmFsID0gaW50ZXJ2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRPYmouZWFzZSA9IGVhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRPYmouZGVsYXlCZWZvcmVSZXZpZXcgPSBub3cgLSBkdWVVbml4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2tUcmVlLmluc2VydEZsYXNoY2FyZChbLi4uZGVja1BhdGhdLCBjYXJkT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2tUcmVlLmNvdW50Rmxhc2hjYXJkKFsuLi5kZWNrUGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZFN0YXRzLm5ld0NvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5idXJ5TGlzdC5pbmNsdWRlcyhjeXJiNTMoY2FyZFRleHQpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlY2tUcmVlLmNvdW50Rmxhc2hjYXJkKFsuLi5kZWNrUGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWNrVHJlZS5pbnNlcnRGbGFzaGNhcmQoWy4uLmRlY2tQYXRoXSwgY2FyZE9iaik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2libGluZ3MucHVzaChjYXJkT2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZpbGVDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShub3RlLCBmaWxlVGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRQbHVnaW5EYXRhKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfREFUQSwgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuICAgICAgICB0aGlzLmRhdGEgPSByZW1vdmVMZWdhY3lLZXlzKHRoaXMuZGF0YSwgREVGQVVMVF9EQVRBKSBhcyBQbHVnaW5EYXRhO1xyXG4gICAgICAgIHRoaXMuZGF0YS5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIHRoaXMuZGF0YS5zZXR0aW5ncyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLnNldHRpbmdzID0gcmVtb3ZlTGVnYWN5S2V5cyh0aGlzLmRhdGEuc2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MpIGFzIFNSU2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2F2ZVBsdWdpbkRhdGEoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLmRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRWaWV3KCk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFJFVklFV19RVUVVRV9WSUVXX1RZUEUpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKS5zZXRWaWV3U3RhdGUoe1xyXG4gICAgICAgICAgICB0eXBlOiBSRVZJRVdfUVVFVUVfVklFV19UWVBFLFxyXG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldENhcmRDb250ZXh0KGNhcmRMaW5lOiBudW1iZXIsIGhlYWRpbmdzOiBIZWFkaW5nQ2FjaGVbXSk6IHN0cmluZyB7XHJcbiAgICBsZXQgc3RhY2s6IEhlYWRpbmdDYWNoZVtdID0gW107XHJcbiAgICBmb3IgKGxldCBoZWFkaW5nIG9mIGhlYWRpbmdzKSB7XHJcbiAgICAgICAgaWYgKGhlYWRpbmcucG9zaXRpb24uc3RhcnQubGluZSA+IGNhcmRMaW5lKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDAgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ubGV2ZWwgPj0gaGVhZGluZy5sZXZlbCkge1xyXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YWNrLnB1c2goaGVhZGluZyk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvbnRleHQ6IHN0cmluZyA9IFwiXCI7XHJcbiAgICBmb3IgKGxldCBoZWFkaW5nT2JqIG9mIHN0YWNrKSB7XHJcbiAgICAgICAgaGVhZGluZ09iai5oZWFkaW5nID0gaGVhZGluZ09iai5oZWFkaW5nLnJlcGxhY2UoL1xcW1xcXlxcZCtcXF0vZ20sIFwiXCIpLnRyaW0oKTtcclxuICAgICAgICBjb250ZXh0ICs9IGhlYWRpbmdPYmouaGVhZGluZyArIFwiID4gXCI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY29udGV4dC5zbGljZSgwLCAtMyk7XHJcbn1cclxuIl0sIm5hbWVzIjpbIm1vbWVudCIsIlBsYXRmb3JtIiwiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciLCJOb3RpY2UiLCJNb2RhbCIsIk1hcmtkb3duVmlldyIsIk1hcmtkb3duUmVuZGVyZXIiLCJURmlsZSIsIkl0ZW1WaWV3IiwiTWVudSIsIkZ1enp5U3VnZ2VzdE1vZGFsIiwiUGx1Z2luIiwiYWRkSWNvbiIsImdyYXBoLnJlc2V0IiwiZ3JhcGgubGluayIsImdldEFsbFRhZ3MiLCJncmFwaC5yYW5rIl0sIm1hcHBpbmdzIjoiOzs7O0FBRUEsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTtBQUNsQyxJQUFJLElBQUksQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLE1BQU0sT0FBTyxRQUFRLEtBQUssVUFBVSxDQUFDLEVBQUU7QUFDMUUsUUFBUSxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtBQUNoQyxZQUFZLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDckQsZ0JBQWdCLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDMUQsb0JBQW9CLE1BQU07QUFDMUIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYixTQUFTO0FBQ1QsS0FBSztBQUNMLENBQUM7QUFDRDtJQUNBLEdBQWMsR0FBRyxDQUFDLFlBQVk7QUFDOUIsSUFBSSxJQUFJLElBQUksR0FBRztBQUNmLFFBQVEsS0FBSyxFQUFFLENBQUM7QUFDaEIsUUFBUSxLQUFLLEVBQUUsRUFBRTtBQUNqQixRQUFRLEtBQUssRUFBRSxFQUFFO0FBQ2pCLEtBQUssQ0FBQztBQUNOO0FBQ0EsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDbEQsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksTUFBTSxNQUFNLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDOUQsWUFBWSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFNBQVM7QUFDVDtBQUNBLFFBQVEsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFN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
