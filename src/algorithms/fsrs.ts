import { Setting, Notice } from "obsidian";
import { DateUtils } from "src/utils_recall";
import SrsAlgorithm from "../algorithms";
import { RepetitionItem, ReviewResult } from "../data";

import * as fsrsjs from "fsrs.js";
import { t } from "src/lang/helpers";
import deepcopy from "deepcopy";

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export type FsrsData = fsrsjs.Card;

interface FsrsSettings {
    request_retention: number;
    maximum_interval: number;
    easy_bonus: number;
    hard_factor: number;
    w: number[];
}

const FsrsOptions: string[] = ["Again", "Hard", "Good", "Easy"];

/**
 * This is an implementation of the Free Spaced Repetition Scheduling Algorithm as described in
 * https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
 * https://github.com/open-spaced-repetition/fsrs.js
 */
export class FsrsAlgorithm extends SrsAlgorithm {
    fsrs = new fsrsjs.FSRS();
    card = new fsrsjs.Card();

    constructor() {
        super();
        //Set algorithm parameters
        this.updateFsrsParams();
    }

    defaultSettings(): FsrsSettings {
        return {
            request_retention: 0.9,
            maximum_interval: 36500,
            easy_bonus: 1.3,
            hard_factor: 1.2,
            w: [1.0, 1.0, 5.0, -0.5, -0.5, 0.2, 1.4, -0.12, 0.8, 2.0, -0.2, 0.2, 1.0],
        };
    }

    updateFsrsParams() {
        if (this.settings != undefined) {
            this.fsrs.p = deepcopy(this.settings);
        }
    }

    defaultData(): FsrsData {
        return deepcopy(this.card);
    }

    srsOptions(): string[] {
        return FsrsOptions;
    }

    calcAllOptsIntervals(item: RepetitionItem) {
        const data = item.data as FsrsData;
        data.due = new Date(data.due);
        data.last_review = new Date(data.last_review);
        const card = deepcopy(data);
        const now = new Date();
        const scheduling_cards = this.fsrs.repeat(card, now);
        const intvls: number[] = [];
        this.srsOptions().forEach((opt, ind) => {
            const due = scheduling_cards[ind].card.due.valueOf();
            const lastrv = scheduling_cards[ind].card.last_review.valueOf();
            const nextInterval = due - lastrv;
            intvls.push(nextInterval / DateUtils.DAYS_TO_MILLIS);
            // console.debug("due:" + due + ", last: " + lastrv + ", intvl: " + nextInterval);
        });
        return intvls;
    }
    onSelection(item: RepetitionItem, optionStr: string, repeat: boolean): ReviewResult {
        const data = item.data as FsrsData;
        data.due = new Date(data.due);
        data.last_review = new Date(data.last_review);
        const response = FsrsOptions.indexOf(optionStr);

        const now = new Date();
        const scheduling_cards = this.fsrs.repeat(data, now);
        console.log(scheduling_cards);

        //Update the card after rating:
        item.data = deepcopy(scheduling_cards[response].card) as FsrsData;

        //Get the due date for card:
        // const due = card.due;

        //Get the state for card:
        // state = card.state;

        //Get the review log after rating `Good`:
        // review_log = scheduling_cards[2].review_log;

        let correct = true;
        const nextInterval = item.data.due.valueOf() - item.data.last_review.valueOf();
        if (repeat) {
            if (response == 0) {
                correct = false;
            }

            return {
                correct,
                nextReview: -1,
            };
        }

        if (response == 0) {
            // Again
            correct = false;
        }

        this.writeRevlog(now, item.ID, response);

        return {
            correct,
            nextReview: nextInterval,
        };
    }

    /**
     * 记录重复数据 日志，
     * @param now 
     * @param cid 对应数据项ID，如果运行了pruneData()，ID就会变化，数据可能对应不上了
     * @param rating 
     */
    async writeRevlog(now: Date, cid: number, rating: number) {
        const plugin = this.plugin;
        const adapter = plugin.app.vault.adapter;
        const id = now.getTime();

        const filename = "revlog.csv";
        let filepath = plugin.store.getStorePath();
        const fder_index = filepath.lastIndexOf("/");
        filepath = filepath.substring(0, fder_index + 1) + filename;
        let data = id + "\t" + cid + "\t" + rating + "\n";
        if (!(await adapter.exists(filepath))) {
            const title = "id\tcid\tr\n";
            data = title + data;
        }
        adapter.append(filepath, data);
    }

    displaySettings(containerEl: HTMLElement, update: (settings: any) => void) {
        containerEl.createDiv().innerHTML =
            '用于间隔重复的算法. 更多信息请查阅 <a href="https://github.com/open-spaced-repetition/fsrs.js">FSRS算法</a>.';
        new Setting(containerEl)
            .setName("request_retention")
            .setDesc("request_retention")
            .addText((text) =>
                text
                    .setPlaceholder("request_retention")
                    .setValue(this.settings.request_retention.toString())
                    .onChange((newValue) => {
                        applySettingsUpdate(async () => {
                            const numValue: number = Number.parseFloat(newValue);
                            if (!isNaN(numValue) && numValue > 0) {
                                if (numValue < 1.0) {
                                    new Notice(t("EASY_BONUS_MIN_WARNING"));
                                    text.setValue(this.settings.request_retention.toString());
                                    return;
                                }
                                this.settings.request_retention = this.fsrs.p.request_retention =
                                    numValue;
                                update(this.settings);
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
                        this.settings.request_retention = this.defaultSettings().request_retention;
                        this.fsrs.p.request_retention = this.settings.request_retention;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("EASY_BONUS"))
            .setDesc(t("EASY_BONUS_DESC"))
            .addText((text) =>
                text.setValue(this.settings.easy_bonus.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseFloat(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 1.0) {
                                new Notice(t("EASY_BONUS_MIN_WARNING"));
                                text.setValue(this.settings.easy_bonus.toString());
                                return;
                            }

                            this.settings.easy_bonus = this.fsrs.p.easy_bonus = numValue;
                            update(this.settings);
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
                        this.settings.easy_bonus = this.fsrs.p.easy_bonus =
                            this.defaultSettings().easy_bonus;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("MAX_INTERVAL"))
            .setDesc(t("MAX_INTERVAL_DESC"))
            .addText((text) =>
                text.setValue(this.settings.maximum_interval.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 1) {
                                new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                text.setValue(this.settings.maximum_interval.toString());
                                return;
                            }

                            this.settings.maximum_interval = this.fsrs.p.maximum_interval =
                                numValue;
                            update(this.settings);
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
                        this.settings.maximum_interval = this.fsrs.p.maximum_interval =
                            this.defaultSettings().maximum_interval;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName("hard_factor")
            .setDesc("hard_factor")
            .addSlider((slider) =>
                slider
                    .setLimits(0, 3, 0.01)
                    .setValue(this.settings.hard_factor)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.settings.hard_factor = this.fsrs.p.hard_factor = value;
                        update(this.settings);
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.settings.hard_factor = this.fsrs.p.hard_factor =
                            this.defaultSettings().hard_factor;
                        update(this.settings);
                    });
            });
        new Setting(containerEl)
            .setName("w")
            .setDesc("w")
            .addText((text) =>
                text.setValue(JSON.stringify(this.settings.w)).onChange((value) => {
                    applySettingsUpdate(async () => {
                        try {
                            const numValue: number[] = Object.assign({}, JSON.parse(value));
                            if (numValue.length === this.settings.w.length) {
                                this.settings.w = this.fsrs.p.w = numValue;
                                update(this.settings);
                                return;
                            }
                        } catch (error) {
                            console.log(error);
                        }
                        new Notice(t("VALID_NUMBER_WARNING"));
                        text.setValue(this.settings.w.toString());
                    });
                })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.settings.w = this.fsrs.p.w = this.defaultSettings().w;
                        update(this.settings);
                    });
            });
        return;
    }
}
