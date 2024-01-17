import { getTypedObjectEntries } from "./utils";

export interface IRandomNumberProvider {
    getInteger(lowerBound: number, upperBound: number): number;
}

export class RandomNumberProvider implements IRandomNumberProvider {
    getInteger(lowerBound: number, upperBound: number): number {
        const range = upperBound - lowerBound + 1;
        return Math.floor(Math.random() * range) + lowerBound;
    }
}

export class StaticRandomNumberProvider implements IRandomNumberProvider {
    expectedLowerBound: number;
    expectedUpperBound: number;
    next: number;

    getInteger(lowerBound: number, upperBound: number): number {
        if (lowerBound != this.expectedLowerBound || upperBound != this.expectedUpperBound)
            throw `lowerBound: A${lowerBound}/E${this.expectedLowerBound}, upperBound: A${upperBound}/E${this.expectedUpperBound}`;
        return this.next;
    }
}

export class WeightedRandomNumber {
    private provider: IRandomNumberProvider;

    constructor(provider: IRandomNumberProvider) {
        this.provider = provider;
    }

    static create(): WeightedRandomNumber {
        return new WeightedRandomNumber(globalRandomNumberProvider);
    }

    //
    // weights is a dictionary:
    //      first number - a key that can be returned
    //      second number - the "bucket size" - this is a weight that influences the probability of the
    //          first number being returned
    //
    // returns:
    //      first number - one of the keys from the weights parameter
    //      second number - an "index" value; 0 <= index < bucketSize
    getRandomValues(weights: Record<number, number>): [number, number] {
        const total: number = WeightedRandomNumber.calcTotalOfCount(weights);
        if (Object.values(weights).some((i) => !Number.isInteger(i) || i < 0))
            throw "All weights must be positive integers";

        const v: number = this.provider.getInteger(0, total - 1);
        let x: number = 0;
        for (const kvp in weights) {
            const [value, count] = [Number(kvp), weights[kvp] as number];
            if (v < x + count) {
                // x <= v < x + count
                const index: number = v - x;
                return [value, index];
            }
            x += count;
        }
        throw "";
    }

    private static calcTotalOfCount(weights: Record<number, number>): number {
        const total: number =
            getTypedObjectEntries(weights)
                .map(([_, count]) => count)
                .reduce((a, b) => a + b, 0) || 0;
        return total;
    }
}

export let globalRandomNumberProvider: IRandomNumberProvider = new RandomNumberProvider();
export const staticRandomNumberProvider: StaticRandomNumberProvider =
    new StaticRandomNumberProvider();

export interface IStaticRandom {
    lower: number;
    upper: number;
    next: number;
}

export function setupNextRandomNumber(info: IStaticRandom) {
    staticRandomNumberProvider.expectedLowerBound = info.lower;
    staticRandomNumberProvider.expectedUpperBound = info.upper;
    staticRandomNumberProvider.next = info.next;
}

export function setupStaticRandomNumberProvider() {
    globalRandomNumberProvider = staticRandomNumberProvider;
}
