import { getKeysPreserveType, getTypedObjectEntries } from "./util/utils";

export class Stats {
    eases: Record<number, number> = {};
    intervals: Record<number, number> = {};
    newCount: number;
    youngCount: number;
    matureCount: number;

    get totalCount(): number {
        return this.youngCount + this.matureCount;
    }

    update(interval: number, ease: number) {
        if (!Object.prototype.hasOwnProperty.call(this.intervals, interval)) {
            this.intervals[interval] = 0;
        }
        this.intervals[interval]++;
        if (!Object.prototype.hasOwnProperty.call(this.eases, ease)) {
            this.eases[ease] = 0;
        }
        this.eases[ease]++;

        if (interval >= 32) {
            this.matureCount++;
        } else {
            this.youngCount++;
        }
    }
    
    getMaxInterval(): number {
        return Math.max(...getKeysPreserveType(this.intervals)) || 0;
    }

    getAverageInterval(): number {
        let v: number = getTypedObjectEntries(this.intervals)
            .map(([interval, count]) => interval * count)
            .reduce((a, b) => a + b, 0) || 0;
        return v / this.totalCount;
    }

    getAverageEases(): number {
        let v: number = getTypedObjectEntries(this.eases)
            .map(([ease, count]) => ease * count)
            .reduce((a, b) => a + b, 0) || 0;
        return v / this.totalCount;
    }
}
