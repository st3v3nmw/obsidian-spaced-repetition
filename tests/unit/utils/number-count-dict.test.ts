import { ValueCountDict } from "src/utils/number-count-dict";

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
