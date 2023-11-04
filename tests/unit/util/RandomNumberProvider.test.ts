import {
    IStaticRandom,
    WeightedRandomNumber,
    setupNextRandomNumber,
    setupStaticRandomNumberProvider,
} from "src/util/RandomNumberProvider";

let provider: WeightedRandomNumber;

beforeAll(() => {
    setupStaticRandomNumberProvider();
    provider = WeightedRandomNumber.create();
});

describe("WeightedRandomNumber", () => {
    test("Single weight", () => {
        const weights: Record<number, number> = {
            10: 1,
        };
        check_getRandomValues(weights, { lower: 0, upper: 0, next: 0 }, 10, 0);
    });

    test("Two weights", () => {
        // We want the value 10 to be returned 1% of the time and 20 the remaining 99%
        const weights: Record<number, number> = {
            10: 1,
            20: 99,
        };
        check_getRandomValues(weights, { lower: 0, upper: 99, next: 0 }, 10, 0);

        check_getRandomValues(weights, { lower: 0, upper: 99, next: 1 }, 20, 0);
        check_getRandomValues(weights, { lower: 0, upper: 99, next: 99 }, 20, 98);
    });

    test("4 weights", () => {
        const weights: Record<number, number> = {
            10: 5,
            20: 33,
            30: 1,
            40: 11,
        };
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 0 }, 10, 0);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 4 }, 10, 4);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 5 }, 20, 0);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 37 }, 20, 32);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 38 }, 30, 0);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 39 }, 40, 0);
        check_getRandomValues(weights, { lower: 0, upper: 49, next: 49 }, 40, 10);
    });

    test("Invalid weights parameter", () => {
        const weights: Record<number, number> = {
            10: 5,
            20: 33,
            30: 0,
            40: 11,
        };
        const t = () => {
            check_getRandomValues(weights, { lower: 0, upper: 49, next: 0 }, 10, 10);
        };
        expect(t).toThrow();
    });
});

function check_getRandomValues(
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
