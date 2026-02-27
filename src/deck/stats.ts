import { ValueCountDict } from "src/utils/numbers";

export class Stats {
    eases: ValueCountDict = new ValueCountDict();
    intervals: ValueCountDict = new ValueCountDict();
    delayedDays: ValueCountDict = new ValueCountDict();
    newCount: number = 0;
    youngCount: number = 0;
    matureCount: number = 0;

    get totalCount(): number {
        return this.youngCount + this.matureCount;
    }

    incrementNew() {
        this.newCount++;
    }

    update(delayedDays: number, interval: number, ease: number) {
        this.intervals.incrementCount(interval);
        this.eases.incrementCount(ease);
        this.delayedDays.incrementCount(delayedDays);

        if (interval >= 32) {
            this.matureCount++;
        } else {
            this.youngCount++;
        }
    }

    getMaxInterval(): number {
        return this.intervals.getMaxValue();
    }

    getAverageInterval(): number {
        return this.intervals.getTotalOfValueMultiplyCount() / this.totalCount;
    }

    getAverageEases(): number {
        return this.eases.getTotalOfValueMultiplyCount() / this.totalCount;
    }
}
