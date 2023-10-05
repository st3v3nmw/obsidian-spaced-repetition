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
            throw `lowerBound: ${lowerBound}/${this.expectedLowerBound}, upperBound: ${upperBound}/${this.expectedUpperBound}`;
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
    //      first number - a value that can be returned
    //      second number - the weight that influences the probability of the
    //          first number being returned
    //
    getRandomValues(weights: Record<number, number>): number {
        const total: number = WeightedRandomNumber.calcTotalOfCount(weights);
        if (Object.values(weights).some((i) => !Number.isInteger(i) || i < 0)) throw "All weights must be positive integers";
        
        const v: number = this.provider.getInteger(0, total - 1);
        let x: number = 0;
        let result: number;
        for (const kvp in weights) {
            let [value, count] = [Number(kvp), weights[kvp] as number];
            if (v < x + count) {
                return value;
            }
            x += count;
        }
        throw "";
    }

    private static calcTotalOfCount(weights: Record<number, number>): number {
        const total: number = getTypedObjectEntries(weights)
            .map(([value, count]) => count)
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
