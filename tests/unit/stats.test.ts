import { Stats } from "src/stats";

describe("Stats", () => {
    let stats: Stats;

    beforeEach(() => {
        stats = new Stats();
    });

    test("incrementNew should increment newCount", () => {
        stats.incrementNew();
        expect(stats.newCount).toBe(1);
    });

    test("update should update stats correctly", () => {
        stats.update(10, 20, 3); // DelayedDays: 10, Interval: 20, Ease: 3
        expect(stats.delayedDays.dict).toEqual({ 10: 1 });
        expect(stats.intervals.dict).toEqual({ 20: 1 });
        expect(stats.eases.dict).toEqual({ 3: 1 });
        expect(stats.youngCount).toBe(1);
        expect(stats.matureCount).toBe(0);
    });

    test("getMaxInterval should return the maximum interval", () => {
        stats.intervals.dict = { 10: 2, 20: 1, 30: 5 };
        expect(stats.getMaxInterval()).toBe(30);
    });

    test("getAverageInterval should return the average interval", () => {
        stats.intervals.dict = { 10: 2, 20: 1, 30: 5 };
        stats.youngCount = 3;
        stats.matureCount = 2;
        expect(stats.getAverageInterval()).toBe((10 * 2 + 20 * 1 + 30 * 5) / 5);
    });

    test("getAverageEases should return the average ease", () => {
        stats.eases.dict = { 1: 2, 2: 1, 3: 5 };
        stats.youngCount = 3;
        stats.matureCount = 2;
        expect(stats.getAverageEases()).toBe((1 * 2 + 2 * 1 + 3 * 5) / 5);
    });

    test("totalCount should return the sum of youngCount and matureCount", () => {
        stats.youngCount = 3;
        stats.matureCount = 2;
        expect(stats.totalCount).toBe(5);
    });
});
