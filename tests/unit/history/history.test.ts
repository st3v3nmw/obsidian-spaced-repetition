import { Card } from "src/data/data-structures/card/card";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { CardReviewedPayload, HistoryEvent, HistoryEventPayload } from "src/history/history-events";
import { normalizeVaultFolderPath, resolveHistoryFolder } from "src/history/history-folder";
import { HistoryRecorder } from "src/history/history-recorder";
import {
    AdapterHistoryStore,
    HistoryFileAdapter,
    InMemoryHistoryStore,
    parseHistoryFile,
} from "src/history/history-store";
import {
    computeUsageStats,
    createDayKeyFunction,
    formatDuration,
    getDayRange,
    IDLE_GAP_CAP_MS,
    sumDays,
} from "src/history/usage-stats";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../helpers/unit-test-setup";

class FakeAdapter implements HistoryFileAdapter {
    files: Map<string, string> = new Map();
    folders: Set<string> = new Set();
    failNextAppend: boolean = false;
    failRenameOf: string | null = null;

    exists(path: string): Promise<boolean> {
        return Promise.resolve(this.files.has(path) || this.folders.has(path));
    }
    mkdir(path: string): Promise<void> {
        this.folders.add(path);
        return Promise.resolve();
    }
    write(path: string, data: string): Promise<void> {
        this.files.set(path, data);
        return Promise.resolve();
    }
    append(path: string, data: string): Promise<void> {
        if (this.failNextAppend) {
            this.failNextAppend = false;
            return Promise.reject(new Error("disk full"));
        }
        if (!this.files.has(path)) throw new Error(`append to missing file ${path}`);
        this.files.set(path, this.files.get(path) + data);
        return Promise.resolve();
    }
    read(path: string): Promise<string> {
        if (!this.files.has(path)) throw new Error(`missing file ${path}`);
        return Promise.resolve(this.files.get(path));
    }
    list(path: string): Promise<{ files: string[]; folders: string[] }> {
        const isDirectChild = (child: string) =>
            child.startsWith(path + "/") && !child.slice(path.length + 1).includes("/");
        return Promise.resolve({
            files: [...this.files.keys()].filter(isDirectChild),
            folders: [...this.folders].filter(isDirectChild),
        });
    }
    rename(path: string, newPath: string): Promise<void> {
        if (path === this.failRenameOf) return Promise.reject(new Error("permission denied"));
        if (!this.files.has(path)) throw new Error(`rename of missing file ${path}`);
        if (this.files.has(newPath)) throw new Error(`rename onto existing file ${newPath}`);
        this.files.set(newPath, this.files.get(path));
        this.files.delete(path);
        return Promise.resolve();
    }
    remove(path: string): Promise<void> {
        if (!this.files.delete(path)) throw new Error(`remove of missing file ${path}`);
        return Promise.resolve();
    }
}

function localTs(year: number, month: number, day: number, hour: number, minute = 0, second = 0) {
    return new Date(year, month - 1, day, hour, minute, second).getTime();
}

let eventCounter = 0;
function makeEvent(
    payload: HistoryEventPayload,
    ts: number,
    sessionId: string | null = "s1",
): HistoryEvent {
    eventCounter++;
    return {
        v: 1,
        id: `e${eventCounter}`,
        ts,
        at: new Date(ts).toISOString(),
        device: "dev1",
        sessionId,
        ...payload,
    };
}

const cardRef = { cardId: "c1", notePath: "a.md", cardIdx: 0, deck: "flashcards" };

function reviewed(
    response: CardReviewedPayload["response"],
    isNew: boolean = false,
    cardId: string = "c1",
): CardReviewedPayload {
    return {
        type: "card_reviewed",
        ...cardRef,
        cardId,
        mode: "review",
        response,
        isNew,
        scheduleBefore: null,
        scheduleAfter: null,
        msSinceCardShown: 1000,
        msSinceAnswerShown: 500,
    };
}

describe("AdapterHistoryStore", () => {
    test("Appends events as JSON lines to one file per month and device", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, ".obsidian/plugins/sr/history", "dev1");

        const e1 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 10, 31, 23));
        const e2 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 1, 8));
        const e3 = makeEvent({ type: "session_ended" }, localTs(2026, 11, 2, 8));
        await store.append(e1);
        await Promise.all([store.append(e2), store.append(e3)]);

        expect([...adapter.files.keys()].sort()).toEqual([
            ".obsidian/plugins/sr/history/events-2026-10-dev1.jsonl",
            ".obsidian/plugins/sr/history/events-2026-11-dev1.jsonl",
        ]);
        expect(adapter.files.get(".obsidian/plugins/sr/history/events-2026-11-dev1.jsonl")).toEqual(
            JSON.stringify(e2) + "\n" + JSON.stringify(e3) + "\n",
        );

        const result = await store.readAll();
        expect(result.events).toEqual([e1, e2, e3]);
        expect(result.corruptLines).toEqual([]);
    });

    test("Reads the files of all devices, sorted by time, and reports damaged lines", async () => {
        const adapter = new FakeAdapter();
        adapter.folders.add("h");
        const e1 = makeEvent({ type: "deck_list_shown" }, 1000);
        const e2 = { ...makeEvent({ type: "deck_list_shown" }, 2000), device: "dev2" };
        const e3 = makeEvent({ type: "deck_list_shown" }, 3000);
        adapter.files.set(
            "h/events-2026-11-dev1.jsonl",
            `${JSON.stringify(e1)}\n${JSON.stringify(e3)}\n{"v":1,"id`,
        );
        adapter.files.set("h/events-2026-11-dev2.jsonl", `${JSON.stringify(e2)}\n\n{"foo":1}\n`);
        adapter.files.set("h/notes.txt", "not history");

        const store = new AdapterHistoryStore(adapter, "h", "dev1");
        const result = await store.readAll();
        expect(result.events.map((event) => event.id)).toEqual([e1.id, e2.id, e3.id]);
        expect(result.corruptLines).toEqual([
            { file: "h/events-2026-11-dev1.jsonl", lineNo: 3 },
            { file: "h/events-2026-11-dev2.jsonl", lineNo: 3 },
        ]);
    });

    test("A missing history folder means no events", async () => {
        const store = new AdapterHistoryStore(new FakeAdapter(), "h", "dev1");
        expect(await store.readAll()).toEqual({ events: [], corruptLines: [] });
    });

    test("A failed append rejects, and later appends still work", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, "h", "dev1");
        const e1 = makeEvent({ type: "deck_list_shown" }, 1000);
        const e2 = makeEvent({ type: "deck_list_shown" }, 2000);
        const e3 = makeEvent({ type: "deck_list_shown" }, 3000);
        await store.append(e1);

        adapter.failNextAppend = true;
        await expect(store.append(e2)).rejects.toThrow("disk full");
        await store.append(e3);

        expect((await store.readAll()).events).toEqual([e1, e3]);
    });

    test("Appending to a file that was cut off doesn't damage the new line", async () => {
        const adapter = new FakeAdapter();
        adapter.folders.add("h");
        const e1 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 1, 12));
        adapter.files.set("h/events-2026-11-dev1.jsonl", `${JSON.stringify(e1)}\n{"v":1,"id`);

        const store = new AdapterHistoryStore(adapter, "h", "dev1");
        const e2 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 2, 12));
        const e3 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 3, 12));
        await store.append(e2);
        await store.append(e3);

        const result = await store.readAll();
        expect(result.events).toEqual([e1, e2, e3]);
        expect(result.corruptLines).toEqual([{ file: "h/events-2026-11-dev1.jsonl", lineNo: 2 }]);
    });

    test("Invalid device ids are rejected", () => {
        expect(() => new AdapterHistoryStore(new FakeAdapter(), "h", "../x")).toThrow(
            /invalid device id/,
        );
    });
});

describe("AdapterHistoryStore.moveTo", () => {
    test("Moves the history files and stores new events in the new folder", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, ".obsidian/plugins/sr/history", "dev1");
        const e1 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 10, 15, 12));
        const e2 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 1, 12));
        await store.append(e1);
        await store.append(e2);
        adapter.files.set(".obsidian/plugins/sr/history/unrelated.txt", "keep me");

        // An append requested right before the move goes to the old folder, one right after to the new folder
        const e3 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 2, 12));
        const e4 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 3, 12));
        const appendBefore = store.append(e3);
        const move = store.moveTo("SR/history");
        const appendAfter = store.append(e4);
        expect(store.location).toEqual(".obsidian/plugins/sr/history");
        expect(await move).toEqual(2);
        await Promise.all([appendBefore, appendAfter]);

        expect(store.location).toEqual("SR/history");
        expect([...adapter.files.keys()].sort()).toEqual([
            ".obsidian/plugins/sr/history/unrelated.txt",
            "SR/history/events-2026-10-dev1.jsonl",
            "SR/history/events-2026-11-dev1.jsonl",
        ]);
        expect((await store.readAll()).events).toEqual([e1, e2, e3, e4]);
        // Folders are never removed
        expect(adapter.folders.has(".obsidian/plugins/sr/history")).toEqual(true);
        expect(adapter.folders.has("SR")).toEqual(true);
    });

    test("Merges with files of the same month in the new folder, and keeps the empty old folder", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, "a", "dev1");
        const e1 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 1, 12));
        const e2 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 2, 12));
        await store.append(e2);
        adapter.folders.add("b");
        adapter.files.set("b/events-2026-11-dev1.jsonl", JSON.stringify(e1)); // no trailing newline

        expect(await store.moveTo("b")).toEqual(1);
        // Obsidian's desktop adapter can't remove a folder without removing its content (fs.rm without recursive
        // fails with "Path is a directory"), so the old folder stays
        expect(adapter.folders.has("a")).toEqual(true);
        expect(adapter.files.has("a/events-2026-11-dev1.jsonl")).toEqual(false);
        expect(adapter.files.get("b/events-2026-11-dev1.jsonl")).toEqual(
            JSON.stringify(e1) + "\n" + JSON.stringify(e2) + "\n",
        );
        expect((await store.readAll()).events).toEqual([e1, e2]);
    });

    test("A failed move keeps the old folder, and moving again moves the rest", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, "a", "dev1");
        const e1 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 10, 1, 12));
        const e2 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 1, 12));
        await store.append(e1);
        await store.append(e2);

        adapter.failRenameOf = "a/events-2026-11-dev1.jsonl";
        await expect(store.moveTo("b")).rejects.toThrow("permission denied");
        expect(store.location).toEqual("a");
        expect(adapter.files.has("b/events-2026-10-dev1.jsonl")).toEqual(true);

        // New events still go to the old folder
        const e3 = makeEvent({ type: "deck_list_shown" }, localTs(2026, 10, 2, 12));
        await store.append(e3);

        adapter.failRenameOf = null;
        expect(await store.moveTo("b")).toEqual(2);
        expect(store.location).toEqual("b");
        expect([...adapter.files.keys()].sort()).toEqual([
            "b/events-2026-10-dev1.jsonl",
            "b/events-2026-11-dev1.jsonl",
        ]);
        expect((await store.readAll()).events).toEqual([e1, e3, e2]);
    });

    test("Moving without any history, and moving to the same folder", async () => {
        const adapter = new FakeAdapter();
        const store = new AdapterHistoryStore(adapter, "a", "dev1");
        expect(await store.moveTo("a")).toEqual(0);
        expect(await store.moveTo("b/c")).toEqual(0);
        expect(store.location).toEqual("b/c");
        expect(adapter.folders.size).toEqual(0);
    });

    test("Invalid folders are rejected", () => {
        const store = new AdapterHistoryStore(new FakeAdapter(), "a", "dev1");
        expect(() => store.moveTo("")).toThrow(/invalid folder/);
        expect(() => store.moveTo("/abs")).toThrow(/invalid folder/);
    });
});

describe("resolveHistoryFolder", () => {
    test("Empty means the history folder within the plugin's folder", () => {
        expect(resolveHistoryFolder("", ".obsidian/plugins/sr")).toEqual(
            ".obsidian/plugins/sr/history",
        );
        expect(resolveHistoryFolder("  ", ".obsidian/plugins/sr")).toEqual(
            ".obsidian/plugins/sr/history",
        );
    });

    test("Custom folders are normalized", () => {
        expect(resolveHistoryFolder("/Spaced Repetition\\history/", "p")).toEqual(
            "Spaced Repetition/history",
        );
        expect(resolveHistoryFolder("a//b", "p")).toEqual("a/b");
    });

    test("Relative path segments are rejected", () => {
        expect(() => resolveHistoryFolder("../outside", "p")).toThrow(/must not contain/);
        expect(() => resolveHistoryFolder("a/./b", "p")).toThrow(/must not contain/);
        expect(() => normalizeVaultFolderPath("/")).toThrow(/not a folder path/);
    });
});

describe("parseHistoryFile", () => {
    test("Ignores empty lines and Windows line endings", () => {
        const e1 = makeEvent({ type: "deck_list_shown" }, 1000);
        expect(parseHistoryFile(`\r\n${JSON.stringify(e1)}\r\n\r\n`, "f")).toEqual({
            events: [e1],
            corruptLines: [],
        });
    });
});

describe("HistoryRecorder", () => {
    test("Fills in the common fields", async () => {
        const store = new InMemoryHistoryStore();
        const recorder = new HistoryRecorder(
            store,
            "dev1",
            () => true,
            () => 1_700_000_000_000,
        );

        const event = await recorder.record({ type: "deck_list_shown" }, "session1");

        expect(event).toMatchObject({
            v: 1,
            ts: 1_700_000_000_000,
            at: "2023-11-14T22:13:20.000Z",
            device: "dev1",
            sessionId: "session1",
            type: "deck_list_shown",
        });
        expect(event.id).toMatch(/^[0-9a-z]{12}$/);
        expect(store.events).toEqual([event]);
    });

    test("Records nothing when disabled", async () => {
        const store = new InMemoryHistoryStore();
        let enabled = false;
        const recorder = new HistoryRecorder(store, "dev1", () => enabled);

        expect(await recorder.record({ type: "deck_list_shown" }, null)).toBeNull();
        expect(store.events).toEqual([]);

        enabled = true;
        expect(await recorder.record({ type: "deck_list_shown" }, null)).not.toBeNull();
        expect(store.events).toHaveLength(1);
    });

    test("cardRef gives the card an id and stores it in the note", async () => {
        unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
        const file = new UnitTestSRFile("#flashcards Q1::A1\n", "notes/a.md");
        const note: Note = await new NoteFileLoader(DEFAULT_SETTINGS).load(
            file,
            TextDirection.Ltr,
            TopicPath.emptyPath,
        );
        const card: Card = note.questionList[0].cards[0];
        const recorder = new HistoryRecorder(new InMemoryHistoryStore(), "dev1", () => true);

        const ref = await recorder.cardRef(card, new TopicPath(["flashcards", "sub"]));

        expect(ref).toEqual({
            cardId: card.id,
            notePath: "notes/a.md",
            cardIdx: 0,
            deck: "flashcards/sub",
        });
        expect(file.content).toEqual(
            `#flashcards Q1::A1\n<!--SR:!2000-01-01,1,250,id=${card.id}-->\n`,
        );
        expect((await recorder.cardRef(card, TopicPath.emptyPath)).deck).toEqual("");
    });
});

describe("computeUsageStats", () => {
    const dayKeyOf = createDayKeyFunction("00:00:00");

    test("Time spent sums the gaps within a session, capped at the idle limit", () => {
        const start = localTs(2026, 11, 8, 10);
        const events: HistoryEvent[] = [
            makeEvent({ type: "session_started", mode: "review", singleNotePath: null }, start),
            makeEvent(
                { type: "card_shown", ...cardRef, mode: "review", isNew: false, schedule: null },
                start + 2_000,
            ),
            makeEvent(
                { type: "answer_shown", ...cardRef, msSinceCardShown: 8_000 },
                start + 10_000,
            ),
            makeEvent(reviewed("good"), start + 12_000),
            // Away for an hour
            makeEvent(
                {
                    type: "card_shown",
                    ...cardRef,
                    cardId: "c2",
                    mode: "review",
                    isNew: true,
                    schedule: null,
                },
                start + 12_000 + 3_600_000,
            ),
            makeEvent(reviewed("again", true, "c2"), start + 20_000 + 3_600_000),
            // Another session at the same time doesn't add up with this one
            makeEvent({ type: "deck_list_shown" }, start + 1_000, "s2"),
            makeEvent({ type: "deck_list_shown" }, start + 4_000, "s2"),
            // Events outside of sessions don't count as time
            makeEvent(
                { type: "note_reviewed", notePath: "n.md", response: "easy" },
                start + 5_000,
                null,
            ),
        ];

        const stats = computeUsageStats(events, dayKeyOf, "2026-11-08");

        expect(stats.days).toHaveLength(1);
        const day = stats.days[0];
        expect(day.day).toEqual("2026-11-08");
        expect(day.timeMs).toEqual(12_000 + IDLE_GAP_CAP_MS + 8_000 + 3_000);
        expect(day.reviews).toEqual(2);
        expect(day.responses).toEqual({ again: 1, hard: 0, good: 1, easy: 0, reset: 0 });
        expect(day.newCardsReviewed).toEqual(1);
        expect(day.cardsSeen).toEqual(2);
        expect(day.sessions).toEqual(2);
        expect(day.notesReviewed).toEqual(1);
        expect(stats.reviewsByHour[10]).toEqual(1);
        expect(stats.reviewsByHour[11]).toEqual(1);
        expect(stats.total.timeMs).toEqual(day.timeMs);
    });

    test("Undone actions are not counted", () => {
        const start = localTs(2026, 11, 8, 10);
        const review = makeEvent(reviewed("hard"), start + 1_000);
        const skip = makeEvent(
            { type: "card_skipped", ...cardRef, msSinceCardShown: 100 },
            start + 2_000,
        );
        const events: HistoryEvent[] = [
            makeEvent(
                { type: "card_shown", ...cardRef, mode: "review", isNew: false, schedule: null },
                start,
            ),
            review,
            makeEvent(
                {
                    type: "action_undone",
                    undoneEventId: review.id,
                    undoneEventType: "card_reviewed",
                    cardId: "c1",
                    notePath: "a.md",
                },
                start + 1_500,
            ),
            makeEvent(reviewed("good"), start + 1_800),
            skip,
            makeEvent(
                {
                    type: "action_undone",
                    undoneEventId: skip.id,
                    undoneEventType: "card_skipped",
                    cardId: "c1",
                    notePath: "a.md",
                },
                start + 2_500,
            ),
        ];

        const day = computeUsageStats(events, dayKeyOf, "2026-11-08").days[0];
        expect(day.reviews).toEqual(1);
        expect(day.responses.good).toEqual(1);
        expect(day.responses.hard).toEqual(0);
        expect(day.skipped).toEqual(0);
        expect(day.undone).toEqual(2);
        // The time spent on undone actions still counts
        expect(day.timeMs).toEqual(2_500);
    });

    test("A redone action counts once", () => {
        const start = localTs(2026, 11, 8, 10);
        const review = makeEvent(reviewed("hard"), start);
        const events: HistoryEvent[] = [
            review,
            makeEvent(
                {
                    type: "action_undone",
                    undoneEventId: review.id,
                    undoneEventType: "card_reviewed",
                    cardId: "c1",
                    notePath: "a.md",
                },
                start + 1_000,
            ),
            makeEvent({ ...reviewed("hard"), redoneEventId: review.id }, start + 2_000),
        ];

        const day = computeUsageStats(events, dayKeyOf, "2026-11-08").days[0];
        expect(day.reviews).toEqual(1);
        expect(day.responses.hard).toEqual(1);
        expect(day.undone).toEqual(1);
    });

    test("The start of day setting moves early reviews to the previous day", () => {
        const events = [makeEvent(reviewed("good"), localTs(2026, 11, 8, 3, 30))];
        expect(computeUsageStats(events, dayKeyOf, "2026-11-08").days[0].day).toEqual("2026-11-08");
        expect(
            computeUsageStats(events, createDayKeyFunction("04:00:00"), "2026-11-08").days[0].day,
        ).toEqual("2026-11-07");
    });

    test("Streaks", () => {
        const days = [1, 2, 3, 5, 6, 7, 8, 10, 11];
        const events = days.map((day) => makeEvent(reviewed("good"), localTs(2026, 11, day, 12)));
        // A day with only a shown card doesn't count as studied
        events.push(makeEvent({ type: "deck_list_shown" }, localTs(2026, 11, 12, 12)));

        expect(computeUsageStats(events, dayKeyOf, "2026-11-11").currentStreak).toEqual(2);
        // Nothing studied today yet: the streak up to yesterday still counts
        expect(computeUsageStats(events, dayKeyOf, "2026-11-12").currentStreak).toEqual(2);
        expect(computeUsageStats(events, dayKeyOf, "2026-11-13").currentStreak).toEqual(0);

        const stats = computeUsageStats(events, dayKeyOf, "2026-11-12");
        expect(stats.longestStreak).toEqual(4);
        expect(stats.daysStudied).toEqual(days.length);
        expect(stats.days).toHaveLength(days.length + 1);
    });

    test("No events", () => {
        const stats = computeUsageStats([], dayKeyOf, "2026-11-08");
        expect(stats.days).toEqual([]);
        expect(stats.eventCount).toEqual(0);
        expect(stats.firstEventTs).toBeNull();
        expect(stats.currentStreak).toEqual(0);
        expect(stats.longestStreak).toEqual(0);
    });

    test("getDayRange fills days without activity", () => {
        const events = [
            makeEvent(reviewed("good"), localTs(2026, 11, 6, 12)),
            makeEvent(reviewed("easy"), localTs(2026, 11, 8, 12)),
        ];
        const stats = computeUsageStats(events, dayKeyOf, "2026-11-08");
        const range = getDayRange(stats, "2026-11-08", 4);
        expect(range.map((day) => [day.day, day.reviews])).toEqual([
            ["2026-11-05", 0],
            ["2026-11-06", 1],
            ["2026-11-07", 0],
            ["2026-11-08", 1],
        ]);
        expect(sumDays(range).reviews).toEqual(2);
    });
});

describe("createDayKeyFunction", () => {
    test("Rejects an invalid start of day", () => {
        expect(() => createDayKeyFunction("4am")).toThrow(/Invalid start of day/);
    });
});

describe("formatDuration", () => {
    test.each([
        [0, "0s"],
        [45_000, "45s"],
        [12 * 60_000 + 30_000, "12m 30s"],
        [3_600_000 + 5 * 60_000, "1h 05m"],
    ])("%d ms -> %s", (ms, expected) => {
        expect(formatDuration(ms)).toEqual(expected);
    });
});
