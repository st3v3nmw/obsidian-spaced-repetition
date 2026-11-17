export const NOTE_REVIEW_LIST_BATCH_SIZE = 100;

export interface ListWindow<T> {
    items: T[];
    prefixCount: number;
    remainingCount: number;
}

/**
 * Returns a bounded prefix of a list while keeping an active item reachable.
 * The active item is appended when it falls outside the prefix and is never duplicated.
 */
export function getListWindow<T>(
    items: readonly T[],
    requestedLimit: number,
    activeIndex = -1,
): ListWindow<T> {
    const normalizedLimit = Number.isFinite(requestedLimit)
        ? Math.max(0, Math.trunc(requestedLimit))
        : items.length;
    const prefixCount = Math.min(normalizedLimit, items.length);
    const windowItems = items.slice(0, prefixCount);

    if (activeIndex >= prefixCount && activeIndex < items.length) {
        windowItems.push(items[activeIndex]);
    }

    return {
        items: windowItems,
        prefixCount,
        remainingCount: items.length - windowItems.length,
    };
}
