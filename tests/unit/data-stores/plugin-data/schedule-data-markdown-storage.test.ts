jest.mock("obsidian", () => {
    class MockTFile {}
    class MockTFolder {}
    return {
        TFile: MockTFile,
        TFolder: MockTFolder,
    };
});

import { TFile, TFolder } from "obsidian";

import { ScheduleDataMarkdownStorage } from "src/data-stores/plugin-data/schedule-data-markdown-storage";
import { PluginDataScheduleState } from "src/plugin-data";

function makeTFile(path: string): TFile {
    const file = new (TFile as unknown as { new (): TFile })();
    return Object.assign(file, { path });
}

function makeTFolder(path: string): TFolder {
    const folder = new (TFolder as unknown as { new (): TFolder })();
    return Object.assign(folder, { path });
}

function makeStorage(rootFolder = "/Spaced Repetition") {
    const files = new Map<string, TFile | TFolder>();
    const contents = new Map<string, string>();

    const vault = {
        getAbstractFileByPath: jest.fn((path: string) => files.get(path) ?? null),
        createFolder: jest.fn(async (path: string) => {
            files.set(path, makeTFolder(path));
        }),
        create: jest.fn(async (path: string, content: string) => {
            files.set(path, makeTFile(path));
            contents.set(path, content);
        }),
        modify: jest.fn(async (file: TFile, content: string) => {
            contents.set(file.path, content);
        }),
        read: jest.fn(async (file: TFile) => contents.get(file.path) ?? ""),
    };

    const app = { vault };
    const storage = new ScheduleDataMarkdownStorage(app as never, () => rootFolder);

    return { storage, vault, files, contents };
}

function makeStorageWithUndefinedRoot() {
    const files = new Map<string, TFile | TFolder>();
    const contents = new Map<string, string>();

    const vault = {
        getAbstractFileByPath: jest.fn((path: string) => files.get(path) ?? null),
        createFolder: jest.fn(async (path: string) => {
            files.set(path, makeTFolder(path));
        }),
        create: jest.fn(async (path: string, content: string) => {
            files.set(path, makeTFile(path));
            contents.set(path, content);
        }),
        modify: jest.fn(async (file: TFile, content: string) => {
            contents.set(file.path, content);
        }),
        read: jest.fn(async (file: TFile) => contents.get(file.path) ?? ""),
    };

    const app = { vault };
    const storage = new ScheduleDataMarkdownStorage(app as never, () => undefined as never);
    return { storage, files };
}

describe("ScheduleDataMarkdownStorage", () => {
    test("ensureFiles creates nested folders and both schedule files", async () => {
        const { storage, files } = makeStorage("/My Root/");

        await storage.ensureFiles();

        expect(files.has("My Root")).toBe(true);
        expect(files.has("My Root/Schedule Data")).toBe(true);
        expect(files.has("My Root/Schedule Data/card-schedule-data.sr.md")).toBe(true);
        expect(files.has("My Root/Schedule Data/note-schedule-data.sr.md")).toBe(true);
    });

    test("falls back to default folder when root is empty", async () => {
        const { storage, files } = makeStorage("   ");

        await storage.ensureFiles();

        expect(files.has("Spaced Repetition/Schedule Data/card-schedule-data.sr.md")).toBe(true);
        expect(files.has("Spaced Repetition/Schedule Data/note-schedule-data.sr.md")).toBe(true);
    });

    test("falls back to default folder when root getter returns undefined", async () => {
        const { storage, files } = makeStorageWithUndefinedRoot();

        await storage.ensureFiles();

        expect(files.has("Spaced Repetition/Schedule Data/card-schedule-data.sr.md")).toBe(true);
        expect(files.has("Spaced Repetition/Schedule Data/note-schedule-data.sr.md")).toBe(true);
    });

    test("load returns parsed data from json code blocks", async () => {
        const { storage, contents } = makeStorage();
        await storage.ensureFiles();

        contents.set(
            "Spaced Repetition/Schedule Data/note-schedule-data.sr.md",
            '# Header\n\n```json\n{"version":1,"noteSchedules":{"n1":{"dueDate":"2023-09-06","interval":4,"ease":250}}}\n```\n',
        );
        contents.set(
            "Spaced Repetition/Schedule Data/card-schedule-data.sr.md",
            '# Header\n\n```json\n{"version":1,"cardSchedules":{"h1":[{"dueDate":"2023-09-07","interval":2,"ease":220}]}}\n```\n',
        );

        const state = await storage.load();

        expect(state.noteSchedules.n1?.interval).toBe(4);
        expect(state.cardSchedules.h1[0]?.ease).toBe(220);
    });

    test("load falls back to empty objects when markdown has invalid or missing json block", async () => {
        const { storage, contents } = makeStorage();
        await storage.ensureFiles();

        contents.set("Spaced Repetition/Schedule Data/note-schedule-data.sr.md", "not json");
        contents.set(
            "Spaced Repetition/Schedule Data/card-schedule-data.sr.md",
            "```json\n{oops}\n```",
        );

        const state = await storage.load();

        expect(state.noteSchedules).toEqual({});
        expect(state.cardSchedules).toEqual({});
    });

    test("save writes note and card payloads to markdown files", async () => {
        const { storage, contents, vault } = makeStorage();
        await storage.ensureFiles();

        const state: PluginDataScheduleState = {
            version: 1,
            noteSchedules: {
                note: { dueDate: "2023-09-06", interval: 3, ease: 230 },
            },
            cardSchedules: {
                hash: [{ dueDate: "2023-09-07", interval: 7, ease: 240 }],
            },
        };

        await storage.save(state);

        const noteText = contents.get("Spaced Repetition/Schedule Data/note-schedule-data.sr.md");
        const cardText = contents.get("Spaced Repetition/Schedule Data/card-schedule-data.sr.md");
        expect(noteText).toContain("```json");
        expect(noteText).toContain('"noteSchedules"');
        expect(cardText).toContain('"cardSchedules"');
        expect(vault.modify).toHaveBeenCalled();
    });

    test("load handles non-file entries by returning empty objects", async () => {
        const { storage, files } = makeStorage();
        await storage.ensureFiles();
        files.set("Spaced Repetition/Schedule Data/card-schedule-data.sr.md", {} as never);

        const state = await storage.load();

        expect(state.cardSchedules).toEqual({});
    });

    test("save handles non-file non-folder entries without throwing", async () => {
        const { storage, files } = makeStorage();
        await storage.ensureFiles();
        files.set("Spaced Repetition/Schedule Data/note-schedule-data.sr.md", {} as never);

        const state: PluginDataScheduleState = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {},
        };

        await expect(storage.save(state)).resolves.toBeUndefined();
    });

    test("throws when a schedule file path already exists as a folder", async () => {
        const { storage, files } = makeStorage();
        files.set("Spaced Repetition", makeTFolder("Spaced Repetition"));
        files.set(
            "Spaced Repetition/Schedule Data",
            makeTFolder("Spaced Repetition/Schedule Data"),
        );
        files.set(
            "Spaced Repetition/Schedule Data/card-schedule-data.sr.md",
            makeTFolder("Spaced Repetition/Schedule Data/card-schedule-data.sr.md"),
        );

        await expect(storage.ensureFiles()).rejects.toThrow("expected file but found folder");
    });
});
