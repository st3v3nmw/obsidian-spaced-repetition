import { getKeysPreserveType, getTypedObjectEntries } from "./utils";

export class ValueCountDict {
    dict: Record<number, number> = {}; // Record<value, count>

    incrementCount(value: number): void {
        if (!Object.prototype.hasOwnProperty.call(this.dict, value)) {
            this.dict[value] = 0;
        }
        this.dict[value]++;
    }
        
    getMaxValue(): number {
        return Math.max(...getKeysPreserveType(this.dict)) || 0;
    }

    getTotalOfValueMultiplyCount(): number {
        let v: number = getTypedObjectEntries(this.dict)
            .map(([value, count]) => value * count)
            .reduce((a, b) => a + b, 0) || 0;
        return v;
    }
}