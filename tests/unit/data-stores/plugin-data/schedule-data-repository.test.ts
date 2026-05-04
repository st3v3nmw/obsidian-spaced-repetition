import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { ScheduleDataMarkdownStorage } from "src/data-stores/plugin-data/schedule-data-markdown-storage";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

function makePluginData(): PluginData {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function makeRepo(data: PluginData): { repo: ScheduleDataRepository } {
    const repo = new ScheduleDataRepository(data, async () => {});
    return { repo };
}

describe("ScheduleDataRepository - note schedules", () => {
    test("hasNoteSchedule returns false when no entry exists", () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        expect(repo.hasNoteSchedule("notes/foo.md")).toBe(false);
    });

    test("setNoteSchedule then hasNoteSchedule returns true", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/foo.md", schedule);
        expect(repo.hasNoteSchedule("notes/foo.md")).toBe(true);
    });

    test("getNoteSchedule returns stored schedule", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/foo.md", schedule);

        const retrieved = repo.getNoteSchedule("notes/foo.md") as RepItemScheduleInfoOsr;
        expect(retrieved).not.toBeNull();
        expect(retrieved.interval).toBe(10);
        expect(retrieved.latestEase).toBe(250);
    });

    test("getNoteSchedule returns null for missing entry", () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        expect(repo.getNoteSchedule("notes/missing.md")).toBeNull();
    });

    test("deleteNoteSchedule removes entry", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/foo.md", schedule);
        await repo.deleteNoteSchedule("notes/foo.md");
        expect(repo.hasNoteSchedule("notes/foo.md")).toBe(false);
    });

    test("setNoteSchedule with null info stores null", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        await repo.setNoteSchedule("notes/foo.md", null);
        expect(data.scheduleState.noteSchedules["notes/foo.md"]).toBeNull();
        expect(repo.getNoteSchedule("notes/foo.md")).toBeNull();
    });

    test("persist is called on set", async () => {
        const data = makePluginData();
        let callCount = 0;
        const repo = new ScheduleDataRepository(data, async () => {
            callCount++;
        });
        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/foo.md", schedule);
        expect(callCount).toBe(1);
    });

    test("persist is called on delete", async () => {
        const data = makePluginData();
        let callCount = 0;
        const repo = new ScheduleDataRepository(data, async () => {
            callCount++;
        });
        await repo.deleteNoteSchedule("notes/foo.md");
        expect(callCount).toBe(1);
    });
});

describe("ScheduleDataRepository - card schedules", () => {
    test("hasCardSchedules returns false when no entry exists", () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        expect(repo.hasCardSchedules("abc123")).toBe(false);
    });

    test("setCardSchedules then hasCardSchedules returns true", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setCardSchedules("abc123", [s]);
        expect(repo.hasCardSchedules("abc123")).toBe(true);
    });

    test("getCardSchedules returns stored schedules", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s1 = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        const s2 = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-07", 3, 210);
        await repo.setCardSchedules("abc123", [s1, s2]);

        const result = repo.getCardSchedules("abc123");
        expect(result.length).toBe(2);
        expect((result[0] as RepItemScheduleInfoOsr).interval).toBe(5);
        expect((result[1] as RepItemScheduleInfoOsr).interval).toBe(3);
    });

    test("getCardSchedules returns empty array for missing key", () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        expect(repo.getCardSchedules("nope")).toEqual([]);
    });

    test("getCardSchedules handles null entries in array", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setCardSchedules("abc123", [s, null]);

        const result = repo.getCardSchedules("abc123");
        expect(result.length).toBe(2);
        expect(result[0]).not.toBeNull();
        expect(result[1]).toBeNull();
    });

    test("deleteCardSchedules removes entry", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setCardSchedules("abc123", [s]);
        await repo.deleteCardSchedules("abc123");
        expect(repo.hasCardSchedules("abc123")).toBe(false);
    });
});

describe("ScheduleDataRepository - state initialisation", () => {
    test("initialises scheduleState when it is missing", () => {
        const data = makePluginData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any).scheduleState = undefined;
        const { repo } = makeRepo(data);
        expect(repo.hasNoteSchedule("x")).toBe(false);
        expect(data.scheduleState).toBeDefined();
        expect(data.scheduleState.noteSchedules).toBeDefined();
        expect(data.scheduleState.cardSchedules).toBeDefined();
    });

    test("initialises noteSchedules when it is missing", () => {
        const data = makePluginData();
        data.scheduleState = { version: 1, noteSchedules: undefined, cardSchedules: {} };
        const { repo } = makeRepo(data);
        expect(repo.hasNoteSchedule("x")).toBe(false);
        expect(data.scheduleState.noteSchedules).toBeDefined();
    });

    test("initialises cardSchedules when it is missing", () => {
        const data = makePluginData();
        data.scheduleState = { version: 1, noteSchedules: {}, cardSchedules: undefined };
        const { repo } = makeRepo(data);
        expect(repo.hasCardSchedules("y")).toBe(false);
        expect(data.scheduleState.cardSchedules).toBeDefined();
    });

    test("migrates legacy notePath::hash keys to hash-only keys", () => {
        const data = makePluginData();
        data.scheduleState = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {
                "notes/foo.md::abc123": [{ dueDate: "2023-09-06", interval: 5, ease: 230 }],
                "notes/bar.md::def456": [{ dueDate: "2023-09-07", interval: 3, ease: 210 }],
            },
        };
        makeRepo(data); // constructor triggers migration
        expect(data.scheduleState.cardSchedules["notes/foo.md::abc123"]).toBeUndefined();
        expect(data.scheduleState.cardSchedules["notes/bar.md::def456"]).toBeUndefined();
        expect(data.scheduleState.cardSchedules["abc123"]).toBeDefined();
        expect(data.scheduleState.cardSchedules["def456"]).toBeDefined();
    });

    test("clearState resets all schedules", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setNoteSchedule("notes/foo.md", s);
        await repo.setCardSchedules("abc123", [s]);

        repo.clearState();

        expect(repo.hasNoteSchedule("notes/foo.md")).toBe(false);
        expect(repo.hasCardSchedules("abc123")).toBe(false);
    });

    test("migration does not overwrite an existing hash-only key", () => {
        const data = makePluginData();
        const existing = [{ dueDate: "2023-09-10", interval: 9, ease: 270 }];
        data.scheduleState = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {
                "notes/foo.md::abc123": [{ dueDate: "2023-09-06", interval: 5, ease: 230 }],
                abc123: existing,
            },
        };
        makeRepo(data);
        expect(data.scheduleState.cardSchedules["abc123"]).toBe(existing);
        expect(data.scheduleState.cardSchedules["notes/foo.md::abc123"]).toBeUndefined();
    });
});

describe("ScheduleDataRepository - UUID-keyed note schedules", () => {
    test("stores and retrieves schedule by UUID", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("uuid-abc-123", s);
        expect(repo.hasNoteSchedule("uuid-abc-123")).toBe(true);
        expect((repo.getNoteSchedule("uuid-abc-123") as RepItemScheduleInfoOsr).interval).toBe(10);
    });

    test("UUID-keyed entry is unaffected by renameFile with a different path", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("uuid-abc-123", s);

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(repo.hasNoteSchedule("uuid-abc-123")).toBe(true);
    });

    test("path-keyed entry is migrated by renameFile", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/old.md", s);

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(repo.hasNoteSchedule("notes/old.md")).toBe(false);
        expect(repo.hasNoteSchedule("notes/new.md")).toBe(true);
    });
});

describe("ScheduleDataRepository.renameFile", () => {
    test("moves note schedule to new path", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("notes/old.md", s);

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(repo.hasNoteSchedule("notes/old.md")).toBe(false);
        expect(repo.hasNoteSchedule("notes/new.md")).toBe(true);
        expect((repo.getNoteSchedule("notes/new.md") as RepItemScheduleInfoOsr).interval).toBe(10);
    });

    test("does not affect card schedules (keyed by hash only)", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setCardSchedules("hash1", [s]);

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(repo.hasCardSchedules("hash1")).toBe(true);
    });

    test("does not affect note schedules for other files", async () => {
        const data = makePluginData();
        const { repo } = makeRepo(data);
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setNoteSchedule("notes/other.md", s);

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(repo.hasNoteSchedule("notes/other.md")).toBe(true);
    });

    test("does not persist when there is nothing to rename", async () => {
        const data = makePluginData();
        let persistCount = 0;
        const repo = new ScheduleDataRepository(data, async () => {
            persistCount++;
        });

        await repo.renameFile("notes/nonexistent.md", "notes/new.md");

        expect(persistCount).toBe(0);
    });

    test("persists when a note schedule was renamed", async () => {
        const data = makePluginData();
        let persistCount = 0;
        const repo = new ScheduleDataRepository(data, async () => {
            persistCount++;
        });
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        await repo.setNoteSchedule("notes/old.md", s);
        persistCount = 0;

        await repo.renameFile("notes/old.md", "notes/new.md");

        expect(persistCount).toBe(1);
    });
});

describe("ScheduleDataRepository.initialize with markdown storage", () => {
    function makeStorage(loadedState: PluginData["scheduleState"]): {
        storage: ScheduleDataMarkdownStorage;
        save: jest.Mock;
    } {
        const save = jest.fn(async () => {});
        const storage = {
            load: jest.fn(async () => loadedState),
            save,
        } as unknown as ScheduleDataMarkdownStorage;
        return { storage, save };
    }

    test("initialize with no storage keeps plugin data state", async () => {
        const data = makePluginData();
        const repo = new ScheduleDataRepository(data, async () => {});

        await repo.initialize();

        expect(repo.hasNoteSchedule("missing")).toBe(false);
        expect(data.scheduleState).toBeDefined();
    });

    test("initialize prefers loaded file state when file has data", async () => {
        const data = makePluginData();
        data.scheduleState.noteSchedules.legacy = {
            dueDate: "2023-09-06",
            interval: 1,
            ease: 100,
        };

        const fileState: PluginData["scheduleState"] = {
            version: 1,
            noteSchedules: {
                fromFile: { dueDate: "2023-09-07", interval: 5, ease: 250 },
            },
            cardSchedules: {},
        };
        const { storage, save } = makeStorage(fileState);

        let persistCount = 0;
        const repo = new ScheduleDataRepository(
            data,
            async () => {
                persistCount++;
            },
            storage,
        );

        await repo.initialize();

        expect(repo.hasNoteSchedule("fromFile")).toBe(true);
        expect(repo.hasNoteSchedule("legacy")).toBe(false);
        expect(save).toHaveBeenCalledTimes(1);
        expect(persistCount).toBe(1);
        expect(Object.keys(data.scheduleState.noteSchedules)).toHaveLength(0);
    });

    test("initialize migrates legacy plugin state when loaded file is empty", async () => {
        const data = makePluginData();
        data.scheduleState.noteSchedules.legacy = {
            dueDate: "2023-09-06",
            interval: 1,
            ease: 100,
        };

        const emptyState: PluginData["scheduleState"] = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {},
        };
        const { storage, save } = makeStorage(emptyState);
        const repo = new ScheduleDataRepository(data, async () => {}, storage);

        await repo.initialize();

        expect(repo.hasNoteSchedule("legacy")).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
        const savedState = save.mock.calls[0][0] as PluginData["scheduleState"];
        expect(savedState.noteSchedules.legacy?.dueDate).toBe("2023-09-06");
    });

    test("initialize treats card-only loaded file as existing data", async () => {
        const data = makePluginData();
        data.scheduleState.noteSchedules.legacy = {
            dueDate: "2023-09-06",
            interval: 1,
            ease: 100,
        };

        const fileState: PluginData["scheduleState"] = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {
                c1: [{ dueDate: "2023-09-08", interval: 2, ease: 220 }],
            },
        };
        const { storage } = makeStorage(fileState);
        const repo = new ScheduleDataRepository(data, async () => {}, storage);

        await repo.initialize();

        expect(repo.hasCardSchedules("c1")).toBe(true);
        expect(repo.hasNoteSchedule("legacy")).toBe(false);
    });

    test("persistCurrentState writes through storage when storage is configured", async () => {
        const data = makePluginData();
        const { storage, save } = makeStorage({ version: 1, noteSchedules: {}, cardSchedules: {} });
        const repo = new ScheduleDataRepository(data, async () => {}, storage);
        await repo.initialize();

        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("note1", schedule);

        expect(save).toHaveBeenCalled();
    });

    test("clearStateAndPersist resets and writes empty state", async () => {
        const data = makePluginData();
        const { storage, save } = makeStorage({ version: 1, noteSchedules: {}, cardSchedules: {} });
        const repo = new ScheduleDataRepository(data, async () => {}, storage);
        await repo.initialize();

        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 10, 250);
        await repo.setNoteSchedule("note1", schedule);
        await repo.clearStateAndPersist();

        expect(repo.hasNoteSchedule("note1")).toBe(false);
        const lastSaved = save.mock.calls[
            save.mock.calls.length - 1
        ][0] as PluginData["scheduleState"];
        expect(lastSaved.noteSchedules).toEqual({});
        expect(lastSaved.cardSchedules).toEqual({});
    });

    test("initialize handles undefined legacy plugin state", async () => {
        const data = makePluginData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any).scheduleState = undefined;
        const { storage } = makeStorage({ version: 1, noteSchedules: {}, cardSchedules: {} });
        const repo = new ScheduleDataRepository(data, async () => {}, storage);

        await repo.initialize();

        expect(repo.hasNoteSchedule("none")).toBe(false);
    });
});
