import { DateUtils } from "src/utils_recall";
import SrsAlgorithm from "./../algorithms";
import { RepetitionItem, ReviewResult } from "./../data";
import deepcopy from "deepcopy";

interface Sm2Data {
    ease: number;
    lastInterval: number;
    iteration: number;
}

const Sm2Options: string[] = ["Blackout", "Incorrect", "Incorrect (Easy)", "Hard", "Good", "Easy"];

/**
 * Implementation of the SM2 algorithm as described at
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */
export class Sm2Algorithm extends SrsAlgorithm {
    defaultSettings(): any {
        return {};
    }

    defaultData(): Sm2Data {
        return {
            ease: 2.5,
            lastInterval: 0,
            iteration: 1,
        };
    }

    srsOptions(): string[] {
        return Sm2Options;
    }

    calcAllOptsIntervals(item: RepetitionItem): number[] {
        const intvls: number[] = [];
        this.srsOptions().forEach((opt, _ind) => {
            const itemCopy = deepcopy(item);
            const result = this.onSelection(itemCopy, opt, false);
            const intvl = Math.round((result.nextReview / DateUtils.DAYS_TO_MILLIS) * 100) / 100;
            intvls.push(intvl);
        });
        return intvls;
    }

    onSelection(item: RepetitionItem, optionStr: string, repeat: boolean): ReviewResult {
        const data = item.data as Sm2Data;
        console.log("item.data:", item.data);
        const interval = function (n: number): number {
            if (n === 1) {
                return 1;
            } else if (n === 2) {
                return 6;
            } else {
                return Math.round(data.lastInterval * data.ease);
            }
        };

        const q = Sm2Options.indexOf(optionStr);

        if (repeat) {
            if (q < 3) {
                return { correct: false, nextReview: -1 };
            } else {
                return { correct: true, nextReview: -1 };
            }
        }

        if (q < 3) {
            data.iteration = 1;
            const nextReview = interval(data.iteration);
            data.lastInterval = nextReview;
            return {
                correct: false,
                nextReview: nextReview * DateUtils.DAYS_TO_MILLIS,
            };
        } else {
            const nextReview = interval(data.iteration);
            data.iteration += 1;
            data.ease = data.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
            if (data.ease < 1.3) {
                data.ease = 1.3;
            }

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
        containerEl.createDiv().innerHTML =
            '用于间隔重复的算法. 目前与Anki算法共用参数（仅算法处理方式不同），更多信息请查阅 <a href="https://www.supermemo.com/en/archives1990-2015/english/ol/sm2">sm2算法</a>.';
        return;
    }
}
