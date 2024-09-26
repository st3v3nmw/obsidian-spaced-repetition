import {
    IStaticRandom,
    setupNextRandomNumber,
    setupStaticRandomNumberProvider,
    ValueCountDict,
    WeightedRandomNumber,
} from "src/utils/numbers";

let provider: WeightedRandomNumber;

beforeAll(() => {
    setupStaticRandomNumberProvider();
    provider = WeightedRandomNumber.create();
});

describe("ValueCountDict", () => {
    let valueCountDict: ValueCountDict;

    beforeEach(() => {
        valueCountDict = new ValueCountDict();
    });

    test("incrementCount should increment count of a value", () => {
        valueCountDict.incrementCount(5);
        valueCountDict.incrementCount(5);
        valueCountDict.incrementCount(10);
        expect(valueCountDict.dict).toEqual({ 5: 2, 10: 1 });
    });

    test("getMaxValue should return the maximum value in the dictionary", () => {
        valueCountDict.dict = { 5: 2, 10: 1, 3: 5 };
        expect(valueCountDict.getMaxValue()).toBe(10);
    });

    test("getTotalOfValueMultiplyCount should return the sum of value * count", () => {
        valueCountDict.dict = { 5: 2, 10: 1, 3: 5 };
        expect(valueCountDict.getTotalOfValueMultiplyCount()).toBe(5 * 2 + 10 * 1 + 3 * 5);
    });

    test("clearCountIfMissing should set count to 0 if missing", () => {
        valueCountDict.clearCountIfMissing(5);
        expect(valueCountDict.dict[5]).toBe(0);
    });

    test("hasValue should return true if value exists", () => {
        valueCountDict.dict = { 5: 2, 10: 1, 3: 5 };
        expect(valueCountDict.hasValue(10)).toBe(true);
    });

    test("hasValue should return false if value does not exist", () => {
        valueCountDict.dict = { 5: 2, 10: 1, 3: 5 };
        expect(valueCountDict.hasValue(7)).toBe(false);
    });
});

describe("WeightedRandomNumber", () => {
    test("Single weight", () => {
        const weights: Record<number, number> = {
            10: 1,
        };
        checkGetRandomValues(weights, { lower: 0, upper: 0, next: 0 }, 10, 0);
    });

    test("Two weights", () => {
        // We want the value 10 to be returned 1% of the time and 20 the remaining 99%
        const weights: Record<number, number> = {
            10: 1,
            20: 99,
        };
        checkGetRandomValues(weights, { lower: 0, upper: 99, next: 0 }, 10, 0);

        checkGetRandomValues(weights, { lower: 0, upper: 99, next: 1 }, 20, 0);
        checkGetRandomValues(weights, { lower: 0, upper: 99, next: 99 }, 20, 98);
    });

    test("4 weights", () => {
        const weights: Record<number, number> = {
            10: 5,
            20: 33,
            30: 1,
            40: 11,
        };
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 0 }, 10, 0);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 4 }, 10, 4);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 5 }, 20, 0);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 37 }, 20, 32);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 38 }, 30, 0);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 39 }, 40, 0);
        checkGetRandomValues(weights, { lower: 0, upper: 49, next: 49 }, 40, 10);
    });

    test("Invalid weights parameter", () => {
        const weights: Record<number, number> = {
            10: 5,
            20: 33,
            30: 0,
            40: 11,
        };
        const t = () => {
            checkGetRandomValues(weights, { lower: 0, upper: 49, next: 0 }, 10, 10);
        };
        expect(t).toThrow();
    });
});

function checkGetRandomValues(
    weights: Record<number, number>,
    info: IStaticRandom,
    expectedValue: number,
    expectedIndex: number,
) {
    setupNextRandomNumber(info);
    const [value, index] = provider.getRandomValues(weights);
    expect(value).toEqual(expectedValue);
    expect(index).toEqual(expectedIndex);
}
