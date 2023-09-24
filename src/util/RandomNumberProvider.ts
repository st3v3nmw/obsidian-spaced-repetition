export interface IRandomNumberProvider {
    getInteger(lowerBound: number, upperBound: number): number;
}

export class RandomNumberProvider implements IRandomNumberProvider {
    getInteger(lowerBound: number, upperBound: number): number {
        let range = upperBound - lowerBound + 1;
        return Math.floor(Math.random() * range) + lowerBound;

    }
}

export class WeightedRandomNumber {
    private provider: IRandomNumberProvider;

    constructor(provider: IRandomNumberProvider) {
        this.provider = provider;
    }

    // 
    // weights is a dictionary:
    //      first number - a value that can be returned
    //      second number - the weight that influences the probability of the
    //          first number being returned
    // 
    getRandomValues(weights: Record<number, number>): number {
        throw "";
    }
}

export class StaticRandomNumberProvider implements IRandomNumberProvider {
    expectedLowerBound: number;
    expectedUpperBound: number;
    next: number;

    getInteger(lowerBound: number, upperBound: number): number {
        if ((lowerBound != this.expectedLowerBound) || (upperBound != this.expectedUpperBound))
            throw `lowerBound: ${lowerBound}/${this.expectedLowerBound}, upperBound: ${upperBound}/${this.expectedUpperBound}`;
        return this.next;
    }
}

export var globalRandomNumberProvider: IRandomNumberProvider = new RandomNumberProvider();
export var staticRandomNumberProvider: StaticRandomNumberProvider = new StaticRandomNumberProvider();

export interface IStaticRandom {
    lower: number;
    upper: number;
    next: number
}

export function setupNextRandomNumber(info: IStaticRandom) {
    staticRandomNumberProvider.expectedLowerBound = info.lower;
    staticRandomNumberProvider.expectedUpperBound = info.upper;
    staticRandomNumberProvider.next = info.next;

    globalRandomNumberProvider = staticRandomNumberProvider;
    
}