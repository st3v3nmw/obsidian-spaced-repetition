import { Notice, Setting } from "obsidian";

import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { t } from "src/lang/helpers";

import { DateUtils } from "src/utils_recall";
import SrsAlgorithm from "./../algorithms";
import { RPITEMTYPE, RepetitionItem, ReviewResult } from "./../data";
import deepcopy from "deepcopy";

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export enum ReviewResponse {
    Reset,
    Hard,
    Good,
    Easy,
}

interface Sm2Data {
    ease: number;
    lastInterval: number;
    iteration: number;
}

const Sm2Options: string[] = ["Reset", "Hard", "Good", "Easy"];

export function schedule(
    response: ReviewResponse,
    interval: number,
    ease: number,
    delayBeforeReview: number,
    settingsObj: SRSettings,
    dueDates?: Record<number, number>
): Record<string, number> {
    delayBeforeReview = Math.max(0, Math.floor(delayBeforeReview / (24 * 3600 * 1000)));

    if (response === ReviewResponse.Easy) {
        ease += 20;
        interval = ((interval + delayBeforeReview) * ease) / 100;
        interval *= settingsObj.easyBonus;
    } else if (response === ReviewResponse.Good) {
        interval = ((interval + delayBeforeReview / 2) * ease) / 100;
    } else if (response === ReviewResponse.Hard) {
        ease = Math.max(130, ease - 20);
        interval = Math.max(
            1,
            (interval + delayBeforeReview / 4) * settingsObj.lapsesIntervalChange
        );
    }

    // replaces random fuzz with load balancing over the fuzz interval
    if (dueDates !== undefined) {
        interval = Math.round(interval);
        if (!Object.prototype.hasOwnProperty.call(dueDates, interval)) {
            dueDates[interval] = 0;
        } else {
            // disable fuzzing for small intervals
            if (interval > 4) {
                let fuzz = 0;
                if (interval < 7) fuzz = 1;
                else if (interval < 30) fuzz = Math.max(2, Math.floor(interval * 0.15));
                else fuzz = Math.max(4, Math.floor(interval * 0.05));

                const originalInterval = interval;
                outer: for (let i = 1; i <= fuzz; i++) {
                    for (const ivl of [originalInterval - i, originalInterval + i]) {
                        if (!Object.prototype.hasOwnProperty.call(dueDates, ivl)) {
                            dueDates[ivl] = 0;
                            interval = ivl;
                            break outer;
                        }
                        if (dueDates[ivl] < dueDates[interval]) interval = ivl;
                    }
                }
            }
        }

        dueDates[interval]++;
    }

    interval = Math.min(interval, settingsObj.maximumInterval);

    return { interval: Math.round(interval * 10) / 10, ease };
}

export class DefaultAlgorithm extends SrsAlgorithm {
    defaultSettings(): any {
        return {
            // algorithm
            baseEase: 250,
            lapsesIntervalChange: 0.5,
            easyBonus: 1.3,
            maximumInterval: 36525,
            maxLinkFactor: 1.0,
        };
    }

    defaultData(): Sm2Data {
        return {
            ease: 2.5,
            lastInterval: 1, //todo: if should set it to 1, the anki is 0.
            iteration: 1,
        };
    }

    srsOptions(): string[] {
        return Sm2Options;
    }

    calcAllOptsIntervals(item: RepetitionItem): number[] {
        const data = item.data as Sm2Data;
        const due = item.nextReview;
        const now: number = Date.now();
        const delayBeforeReview = due === 0 ? 0 : now - due; //just in case.
        // console.log("item.data:", item.data);
        const dueDatesNotesorCards =
            item.itemType === RPITEMTYPE.NOTE
                ? this.plugin.dueDatesNotes
                : this.plugin.dueDatesFlashcards;

        const intvls: number[] = [];
        this.srsOptions().forEach((opt, ind) => {
            const dataCopy = deepcopy(data);
            const dueDates = deepcopy(dueDatesNotesorCards);

            const schedObj: Record<string, number> = schedule(
                ind,
                dataCopy.lastInterval,
                dataCopy.ease * 100,
                delayBeforeReview,
                this.settings,
                dueDates
            );
            const nextInterval = schedObj.interval;
            intvls.push(nextInterval);
        });
        return intvls;
    }

    onSelection(item: RepetitionItem, optionStr: string, repeat: boolean): ReviewResult {
        const data = item.data as Sm2Data;
        // console.log("item.data:", item.data);

        const response = Sm2Options.indexOf(optionStr) as ReviewResponse;

        if (repeat) {
            if (response < 1) {
                return { correct: false, nextReview: -1 };
            } else {
                return { correct: true, nextReview: -1 };
            }
        }

        const due = item.nextReview;
        const now: number = Date.now();
        const delayBeforeReview = due === 0 ? 0 : now - due; //just in case.
        const schedObj: Record<string, number> = schedule(
            response,
            data.lastInterval,
            data.ease * 100,
            delayBeforeReview,
            this.settings,
            this.plugin.dueDatesNotes
        );

        const nextReview = schedObj.interval;
        data.ease = schedObj.ease / 100;
        if (response < 1) {
            data.iteration = 1;
            data.lastInterval = nextReview;
            return {
                correct: false,
                nextReview: nextReview * DateUtils.DAYS_TO_MILLIS,
            };
        } else {
            data.iteration += 1;
            data.lastInterval = nextReview;
            console.log("item.data:", item.data);
            console.log("smdata:", data);
            return {
                correct: true,
                nextReview: nextReview * DateUtils.DAYS_TO_MILLIS,
            };
        }
    }

    displaySettings(containerEl: HTMLElement, update: (settings: any) => void): void {
        containerEl.createDiv().innerHTML = t("CHECK_ALGORITHM_WIKI", {
            algo_url: "https://www.stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
        });
        containerEl.createDiv().innerHTML =
            '用于间隔重复的算法. 更多信息请查阅 <a href="https://www.stephenmwangi.com/obsidian-spaced-repetition/algorithms/">anki修改算法</a>.';
        new Setting(containerEl)
            .setName(t("BASE_EASE"))
            .setDesc(t("BASE_EASE_DESC"))
            .addText((text) =>
                text.setValue(this.settings.baseEase.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 130) {
                                new Notice(t("BASE_EASE_MIN_WARNING"));
                                text.setValue(this.settings.baseEase.toString());
                                return;
                            }

                            this.settings.baseEase = numValue;
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
                        this.settings.baseEase = DEFAULT_SETTINGS.baseEase;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("LAPSE_INTERVAL_CHANGE"))
            .setDesc(t("LAPSE_INTERVAL_CHANGE_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(1, 99, 1)
                    .setValue(this.settings.lapsesIntervalChange * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.settings.lapsesIntervalChange = value / 100;
                        update(this.settings);
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.settings.lapsesIntervalChange = DEFAULT_SETTINGS.lapsesIntervalChange;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("EASY_BONUS"))
            .setDesc(t("EASY_BONUS_DESC"))
            .addText((text) =>
                text.setValue((this.settings.easyBonus * 100).toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 1.0) {
                                new Notice(t("EASY_BONUS_MIN_WARNING"));
                                text.setValue((this.settings.easyBonus * 100).toString());
                                return;
                            }

                            this.settings.easyBonus = numValue;
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
                        this.settings.easyBonus = DEFAULT_SETTINGS.easyBonus;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("MAX_INTERVAL"))
            .setDesc(t("MAX_INTERVAL_DESC"))
            .addText((text) =>
                text.setValue(this.settings.maximumInterval.toString()).onChange((value) => {
                    applySettingsUpdate(async () => {
                        const numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 1) {
                                new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                text.setValue(this.settings.maximumInterval.toString());
                                return;
                            }

                            this.settings.maximumInterval = numValue;
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
                        this.settings.maximumInterval = DEFAULT_SETTINGS.maximumInterval;
                        update(this.settings);
                    });
            });

        new Setting(containerEl)
            .setName(t("MAX_LINK_CONTRIB"))
            .setDesc(t("MAX_LINK_CONTRIB_DESC"))
            .addSlider((slider) =>
                slider
                    .setLimits(0, 100, 1)
                    .setValue(this.settings.maxLinkFactor * 100)
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.settings.maxLinkFactor = value / 100;
                        update(this.settings);
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip(t("RESET_DEFAULT"))
                    .onClick(async () => {
                        this.settings.maxLinkFactor = DEFAULT_SETTINGS.maxLinkFactor;
                        update(this.settings);
                    });
            });
        return;
    }
}
