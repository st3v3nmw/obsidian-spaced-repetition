import { getKeysPreserveType, getTypedObjectEntries } from "./util/utils";

export class IntervalCountDict {
    dict: Record<number, number> = {}; // Record<# of days in future, due count>

    constructor(dict: Record<number, number>) {
        this.dict = dict;
    }

    hasInterval(interval: number): boolean {
        return Object.prototype.hasOwnProperty.call(this.dict, interval);
    }

    incrementIntervalCount(interval: number): void {
        if (!this.hasInterval(interval)) {
            this.dict[interval] = 0;
        }
        this.dict[interval]++;       
    }

    clearIntervalCount(interval: number): void {
        this.dict[interval] = 0;       
    }

    getIntervalCount(interval: number): number {
        let result: number = 0;
        if (this.hasInterval(interval)) {
            result = this.dict[interval];
        }
        return result;         
    }

    getMaxInterval(): number {
        return Math.max(...getKeysPreserveType(this.dict));
    }

    getNormalisedCopy(): IntervalCountDict {
        const copy: Record<number, number> = { 0: 0 };
        for (const [dueOffset, dueCount] of getTypedObjectEntries(this.dict)) {
            if (dueOffset <= 0) {
                copy[0] += dueCount;
            } else {
                copy[dueOffset] = dueCount;
            }
        }
        return new IntervalCountDict(copy);
    }
}