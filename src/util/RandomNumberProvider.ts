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

    globalRandomNumberProvider = staticRandomNumberProvider;
}
