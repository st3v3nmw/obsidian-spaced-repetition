import { getKeysPreserveType, getTypedObjectEntries } from "./utils";

export class ValueCountDict {
    dict: Record<number, number> = {}; // Record<value, count>

    clearCountIfMissing(value: number): void {
        if (!this.hasValue(value)) this.dict[value] = 0;
    }

    hasValue(value: number): boolean {
        return Object.prototype.hasOwnProperty.call(this.dict, value);
    }

    incrementCount(value: number): void {
        this.clearCountIfMissing(value);
        this.dict[value]++;
    }

    getMaxValue(): number {
        return Math.max(...getKeysPreserveType(this.dict)) || 0;
    }

    getTotalOfValueMultiplyCount(): number {
        const v: number =
            getTypedObjectEntries(this.dict)
                .map(([value, count]) => value * count)
                .reduce((a, b) => a + b, 0) || 0;
        return v;
    }
}
