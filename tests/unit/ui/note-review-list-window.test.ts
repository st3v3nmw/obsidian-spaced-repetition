import { getListWindow, NOTE_REVIEW_LIST_BATCH_SIZE } from "src/ui/note-review-list-window";

describe("getListWindow", () => {
    const items = Array.from({ length: 10_000 }, (_, index) => index);

    test("keeps initial rendering bounded for a large review queue", () => {
        const result = getListWindow(items, NOTE_REVIEW_LIST_BATCH_SIZE);

        expect(result.items).toHaveLength(100);
        expect(result.items[0]).toBe(0);
        expect(result.items[result.items.length - 1]).toBe(99);
        expect(result.prefixCount).toBe(100);
        expect(result.remainingCount).toBe(9_900);
    });

    test("keeps the active note visible outside the prefix", () => {
        const result = getListWindow(items, NOTE_REVIEW_LIST_BATCH_SIZE, 8_765);

        expect(result.items).toHaveLength(101);
        expect(result.items[result.items.length - 1]).toBe(8_765);
        expect(result.remainingCount).toBe(9_899);
    });

    test("does not duplicate an active note already inside the prefix", () => {
        const result = getListWindow(items, NOTE_REVIEW_LIST_BATCH_SIZE, 42);

        expect(result.items).toHaveLength(100);
        expect(result.items.filter((item) => item === 42)).toHaveLength(1);
    });

    test("expands by another batch without exceeding the list", () => {
        const result = getListWindow(items.slice(0, 150), 200);

        expect(result.items).toHaveLength(150);
        expect(result.prefixCount).toBe(150);
        expect(result.remainingCount).toBe(0);
    });
});
