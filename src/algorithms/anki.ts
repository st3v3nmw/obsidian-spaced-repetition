import { Setting, Notice } from "obsidian";
import { DateUtils } from "src/utils_recall";
import SrsAlgorithm from "./../algorithms";
import { RepetitionItem, ReviewResult } from "./../data";

interface AnkiData {
    ease: number;
    lastInterval: number;
    iteration: number;
}

interface AnkiSettings {
    easyBonus: number;
    startingEase: number;
    lapseInterval: number;
    graduatingInterval: number;
    easyInterval: number;
}

const AnkiOptions: string[] = ["Again", "Hard", "Good", "Easy"];

/**
 * This is an implementation of the Anki algorithm as described in
 * https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html
 */
export class AnkiAlgorithm extends SrsAlgorithm {
    defaultSettings(): AnkiSettings {
        return {
            easyBonus: 1.3,
            startingEase: 2.5,
            lapseInterval: 0.5,
            graduatingInterval: 1,
            easyInterval: 4,
        };
    }

    defaultData(): AnkiData {
        return {
            ease: this.settings.startingEase,
            lastInterval: 1,
            iteration: 1,
        };
    }

    srsOptions(): string[] {
        return AnkiOptions;
    }

    onSelection(item: RepetitionItem, optionStr: string, repeat: boolean): ReviewResult {
        const data = item.data as AnkiData;
        const response = AnkiOptions.indexOf(optionStr);

        let correct = true;
        let nextInterval = 0;
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
            data.ease = Math.max(1.3, data.ease - 0.2);
            nextInterval = data.lastInterval * this.settings.lapseInterval;
            correct = false;
        } else if (response == 1) {
            // Hard
            data.ease = Math.max(1.3, data.ease - 0.15);
            nextInterval = data.lastInterval * 1.2;
            if (nextInterval - data.lastInterval < 1) nextInterval = data.lastInterval + 1;
        } else if (response == 2) {
            // Good
            if (data.iteration == 1) {
                // Graduation!
                nextInterval = this.settings.graduatingInterval;
            } else {
                nextInterval = data.lastInterval * data.ease;
                if (nextInterval - data.lastInterval < 1) nextInterval = data.lastInterval + 1;
            }
        } else if (response == 3) {
            data.ease += 0.15;
            if (data.iteration == 1) {
                // Graduation!
                nextInterval = this.settings.easyInterval;
            } else {
                nextInterval = data.lastInterval * data.ease * this.settings.easyBonus;
            }
        }

        data.iteration += 1;
        data.lastInterval = nextInterval;

        return {
            correct,
            nextReview: nextInterval * DateUtils.DAYS_TO_MILLIS,
        };
    }

    displaySettings(containerEl: HTMLElement, update: (settings: any) => void) {
        new Setting(containerEl)
            .setName("Starting Ease")
            .setDesc("The initial ease given to an item.")
            .addText((text) =>
                text
                    .setPlaceholder("Starting Ease")
                    .setValue(this.settings.startingEase.toString())
                    .onChange((newValue) => {
                        const ease = Number(newValue);

                        if (isNaN(ease) || ease < 0) {
                            new Notice("Starting ease must be a positive number.");
                            return;
                        }

                        if (ease < 1.3) {
                            new Notice("Starting ease lower than 1.3 is not recommended.");
                        }

                        this.settings.startingEase = ease;
                        update(this.settings);
                    })
            );

        new Setting(containerEl)
            .setName("Easy Bonus")
            .setDesc("A bonus multiplier for items reviewed as easy.")
            .addText((text) =>
                text
                    .setPlaceholder("Easy Bonus")
                    .setValue(this.settings.easyBonus.toString())
                    .onChange((newValue) => {
                        const bonus = Number(newValue);

                        if (isNaN(bonus) || bonus < 1) {
                            new Notice("Easy bonus must be a number greater than or equal to 1.");
                            return;
                        }

                        this.settings.easyBonus = bonus;
                        update(this.settings);
                    })
            );

        new Setting(containerEl)
            .setName("Lapse Interval Modifier")
            .setDesc(
                "A factor to modify the review interval with when an item is reviewed as wrong."
            )
            .addText((text) =>
                text
                    .setPlaceholder("Lapse Interval")
                    .setValue(this.settings.lapseInterval.toString())
                    .onChange((newValue) => {
                        const lapse = Number(newValue);

                        if (isNaN(lapse) || lapse <= 0) {
                            new Notice("Lapse interval must be a positive number.");
                            return;
                        }

                        this.settings.lapseInterval = lapse;
                        update(this.settings);
                    })
            );

        new Setting(containerEl)
            .setName("Graduating Interval")
            .setDesc(
                "The interval (in days) to the next review after reviewing a new item as 'Good'."
            )
            .addText((text) =>
                text
                    .setPlaceholder("Graduating Interval")
                    .setValue(this.settings.graduatingInterval.toString())
                    .onChange((newValue) => {
                        const interval = Number(newValue);

                        if (isNaN(interval) || interval <= 0) {
                            new Notice("Interval must be a positive number.");
                            return;
                        }

                        this.settings.graduatingInterval = interval;
                        update(this.settings);
                    })
            );

        new Setting(containerEl)
            .setName("Easy Interval")
            .setDesc(
                "The interval (in days) to the next review after reviewing a new item as 'Easy'."
            )
            .addText((text) =>
                text
                    .setPlaceholder("Easy Interval")
                    .setValue(this.settings.easyInterval.toString())
                    .onChange((newValue) => {
                        const interval = Number(newValue);

                        if (isNaN(interval) || interval <= 0) {
                            new Notice("Interval must be a positive number.");
                            return;
                        }

                        this.settings.easyInterval = interval;
                        update(this.settings);
                    })
            );
    }
}
