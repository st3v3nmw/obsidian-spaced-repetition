import moment from "moment";

import {
    HistoryEvent,
    REVIEW_RESPONSE_NAMES,
    ReviewResponseName,
} from "src/history/history-events";

// Time between two consecutive events of a review session counts as time spent, up to this limit. Longer gaps mean
// the user most likely left the review open and did something else.
export const IDLE_GAP_CAP_MS = 5 * 60 * 1000;

const DAY_KEY_FORMAT = "YYYY-MM-DD";

export interface DayUsage {
    // Local date, e.g. "2026-11-08" (respecting the "start of day" setting)
    day: string;
    // Active time spent in review sessions
    timeMs: number;
    // Flashcard reviews (including resets), excluding undone ones
    reviews: number;
    responses: Record<ReviewResponseName, number>;
    // Reviews of cards that had never been reviewed before
    newCardsReviewed: number;
    // Distinct cards shown
    cardsSeen: number;
    skipped: number;
    suspended: number;
    undone: number;
    notesReviewed: number;
    sessions: number;
}

export interface UsageStats {
    // Only days with any activity, sorted ascending
    days: DayUsage[];
    total: DayUsage;
    // Reviews per hour of the day (local time), index 0 = 00:00-00:59
    reviewsByHour: number[];
    daysStudied: number;
    currentStreak: number;
    longestStreak: number;
    eventCount: number;
    firstEventTs: number | null;
    lastEventTs: number | null;
}

/**
 * Creates the function that maps a timestamp to its local day, e.g. "2026-11-08". With a start of day of "04:00:00",
 * a review at 02:00 counts towards the previous day.
 *
 * @param {string} startOfDay - The "start of day" setting, "HH:mm:ss".
 */
export function createDayKeyFunction(startOfDay: string): (ts: number) => string {
    const parts: string[] = startOfDay.split(":");
    if (parts.length !== 3 || parts.some((part) => !/^\d{1,2}$/.test(part))) {
        throw new Error(`Invalid start of day "${startOfDay}", expected "HH:mm:ss"`);
    }
    const offsetMs: number =
        ((parseInt(parts[0]) * 60 + parseInt(parts[1])) * 60 + parseInt(parts[2])) * 1000;

    return (ts: number) => moment(ts - offsetMs).format(DAY_KEY_FORMAT);
}

export function addDaysToDayKey(day: string, days: number): string {
    return moment(day, DAY_KEY_FORMAT, true).add(days, "days").format(DAY_KEY_FORMAT);
}

function emptyResponses(): Record<ReviewResponseName, number> {
    const result = {} as Record<ReviewResponseName, number>;
    for (const name of REVIEW_RESPONSE_NAMES) result[name] = 0;
    return result;
}

export function emptyDayUsage(day: string): DayUsage {
    return {
        day,
        timeMs: 0,
        reviews: 0,
        responses: emptyResponses(),
        newCardsReviewed: 0,
        cardsSeen: 0,
        skipped: 0,
        suspended: 0,
        undone: 0,
        notesReviewed: 0,
        sessions: 0,
    };
}

/**
 * Computes the usage statistics from the history.
 *
 * Actions that were undone are not counted (but the time spent on them is).
 *
 * @param {HistoryEvent[]} events - All events, in any order.
 * @param {(ts: number) => string} dayKeyOf - Maps a timestamp to its day (see createDayKeyFunction()).
 * @param {string} today - Today's day key, for the current streak.
 */
export function computeUsageStats(
    events: HistoryEvent[],
    dayKeyOf: (ts: number) => string,
    today: string,
): UsageStats {
    const sorted: HistoryEvent[] = [...events].sort((a, b) => a.ts - b.ts);

    const undoneEventIds: Set<string> = new Set();
    for (const event of sorted) {
        if (event.type === "action_undone") undoneEventIds.add(event.undoneEventId);
    }

    const dayMap: Map<string, DayUsage> = new Map();
    const cardsSeenPerDay: Map<string, Set<string>> = new Map();
    const sessionsPerDay: Map<string, Set<string>> = new Map();
    const reviewsByHour: number[] = new Array<number>(24).fill(0);

    const getDay = (day: string): DayUsage => {
        let result: DayUsage | undefined = dayMap.get(day);
        if (result === undefined) {
            result = emptyDayUsage(day);
            dayMap.set(day, result);
            cardsSeenPerDay.set(day, new Set());
            sessionsPerDay.set(day, new Set());
        }
        return result;
    };

    // Time spent: the gaps between consecutive events of the same session, each capped at IDLE_GAP_CAP_MS,
    // attributed to the day of the later event
    const lastTsPerSession: Map<string, number> = new Map();

    for (const event of sorted) {
        const dayKey: string = dayKeyOf(event.ts);
        const day: DayUsage = getDay(dayKey);

        if (event.sessionId !== null) {
            sessionsPerDay.get(dayKey).add(event.sessionId);
            const lastTs: number | undefined = lastTsPerSession.get(event.sessionId);
            if (lastTs !== undefined) {
                day.timeMs += Math.min(event.ts - lastTs, IDLE_GAP_CAP_MS);
            }
            lastTsPerSession.set(event.sessionId, event.ts);
        }

        const isUndone: boolean = undoneEventIds.has(event.id);
        switch (event.type) {
            case "card_shown":
                cardsSeenPerDay.get(dayKey).add(event.cardId);
                break;
            case "card_reviewed":
                if (isUndone) break;
                day.reviews++;
                day.responses[event.response]++;
                if (event.isNew) day.newCardsReviewed++;
                reviewsByHour[new Date(event.ts).getHours()]++;
                break;
            case "card_skipped":
                if (!isUndone) day.skipped++;
                break;
            case "card_suspended":
                if (!isUndone) day.suspended++;
                break;
            case "action_undone":
                day.undone++;
                break;
            case "note_reviewed":
                day.notesReviewed++;
                break;
            default:
                break;
        }
    }

    const days: DayUsage[] = [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day));
    const total: DayUsage = emptyDayUsage("total");
    for (const day of days) {
        day.cardsSeen = cardsSeenPerDay.get(day.day).size;
        day.sessions = sessionsPerDay.get(day.day).size;

        total.timeMs += day.timeMs;
        total.reviews += day.reviews;
        for (const name of REVIEW_RESPONSE_NAMES) total.responses[name] += day.responses[name];
        total.newCardsReviewed += day.newCardsReviewed;
        total.skipped += day.skipped;
        total.suspended += day.suspended;
        total.undone += day.undone;
        total.notesReviewed += day.notesReviewed;
        total.sessions += day.sessions;
    }
    total.cardsSeen = new Set(
        sorted.flatMap((event) => (event.type === "card_shown" ? [event.cardId] : [])),
    ).size;

    // A day counts as studied if anything was reviewed
    const studiedDays: Set<string> = new Set(
        days.filter((day) => day.reviews + day.notesReviewed > 0).map((day) => day.day),
    );

    return {
        days,
        total,
        reviewsByHour,
        daysStudied: studiedDays.size,
        currentStreak: computeCurrentStreak(studiedDays, today),
        longestStreak: computeLongestStreak(studiedDays),
        eventCount: sorted.length,
        firstEventTs: sorted.length > 0 ? sorted[0].ts : null,
        lastEventTs: sorted.length > 0 ? sorted[sorted.length - 1].ts : null,
    };
}

/**
 * The number of consecutive studied days up to today. If nothing was studied today (yet), the streak up to
 * yesterday still counts.
 */
function computeCurrentStreak(studiedDays: Set<string>, today: string): number {
    let day: string = studiedDays.has(today) ? today : addDaysToDayKey(today, -1);
    let result: number = 0;
    while (studiedDays.has(day)) {
        result++;
        day = addDaysToDayKey(day, -1);
    }
    return result;
}

function computeLongestStreak(studiedDays: Set<string>): number {
    let result: number = 0;
    for (const day of studiedDays) {
        // Only count from the first day of each streak
        if (studiedDays.has(addDaysToDayKey(day, -1))) continue;
        let length: number = 1;
        let next: string = addDaysToDayKey(day, 1);
        while (studiedDays.has(next)) {
            length++;
            next = addDaysToDayKey(next, 1);
        }
        result = Math.max(result, length);
    }
    return result;
}

/**
 * Returns one entry per day of the given range (including days without activity), oldest first.
 *
 * @param {UsageStats} stats - The statistics.
 * @param {string} lastDay - The last day of the range (usually today).
 * @param {number} dayCount - The number of days in the range.
 */
export function getDayRange(stats: UsageStats, lastDay: string, dayCount: number): DayUsage[] {
    const byDay: Map<string, DayUsage> = new Map(stats.days.map((day) => [day.day, day]));
    const result: DayUsage[] = [];
    for (let i = dayCount - 1; i >= 0; i--) {
        const day: string = addDaysToDayKey(lastDay, -i);
        result.push(byDay.get(day) ?? emptyDayUsage(day));
    }
    return result;
}

/**
 * Sums up a list of days.
 */
export function sumDays(days: DayUsage[]): DayUsage {
    const result: DayUsage = emptyDayUsage("sum");
    for (const day of days) {
        result.timeMs += day.timeMs;
        result.reviews += day.reviews;
        for (const name of REVIEW_RESPONSE_NAMES) result.responses[name] += day.responses[name];
        result.newCardsReviewed += day.newCardsReviewed;
        result.cardsSeen += day.cardsSeen;
        result.skipped += day.skipped;
        result.suspended += day.suspended;
        result.undone += day.undone;
        result.notesReviewed += day.notesReviewed;
        result.sessions += day.sessions;
    }
    return result;
}

/**
 * Formats a duration, e.g. "1h 05m", "12m 30s", "45s".
 */
export function formatDuration(ms: number): string {
    const totalSeconds: number = Math.round(ms / 1000);
    const hours: number = Math.floor(totalSeconds / 3600);
    const minutes: number = Math.floor((totalSeconds % 3600) / 60);
    const seconds: number = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    return `${seconds}s`;
}
