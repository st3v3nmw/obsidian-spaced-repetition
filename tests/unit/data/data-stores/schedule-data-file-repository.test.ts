import { Vault } from "obsidian";

import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";

import { UnitTestVault } from "../../helpers/unit-test-vault";

function setup(location = "Spaced Repetition"): {
    vault: UnitTestVault;
    settings: SRSettings;
    repo: ScheduleDataFileRepository;
} {
    const vault = new UnitTestVault();
    const settings: SRSettings = { ...DEFAULT_SETTINGS, scheduleDataVaultLocation: location };
    const repo = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
    return { vault, settings, repo };
}

describe("paths", () => {
    test("derives folder and file path from the configured location", () => {
        const { repo } = setup("My Folder");
        expect(repo.folderPath).toEqual("My Folder");
        expect(repo.filePath).toEqual("My Folder/schedule-data.sr.md");
    });

    test("falls back to the default location when blank", () => {
        const { repo } = setup("   ");
        expect(repo.folderPath).toEqual("Spaced Repetition");
    });
});

describe("ensureStructure", () => {
    test("creates the folder and an empty data file", async () => {
        const { vault, repo } = setup();
        await repo.ensureStructure();

        const content = vault.rawContent("Spaced Repetition/schedule-data.sr.md");
        expect(content).toBeDefined();
        expect(content).toContain("```json");
        expect(content).toContain('"cards"');
    });
});

describe("read/write round-trip", () => {
    test("persists card and note schedules and reads them back via a fresh repository", async () => {
        const { vault, settings, repo } = setup();
        await repo.ensureStructure();
        await repo.setCardSchedule("^sr-id-abc", "!2023-10-06,25,263");
        await repo.setNoteSchedule("note-1", "!2023-10-06,4,270");

        // A fresh repository over the same vault should load the persisted data.
        const repo2 = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        await repo2.load();
        expect(repo2.getCardSchedule("^sr-id-abc")).toEqual("!2023-10-06,25,263");
        expect(repo2.getNoteSchedule("note-1")).toEqual("!2023-10-06,4,270");
    });

    test("delete and clear remove entries", async () => {
        const { repo } = setup();
        await repo.ensureStructure();
        await repo.setCardSchedule("^sr-id-a", "!2023-10-06,1,250");
        await repo.setCardSchedule("^sr-id-b", "!2023-10-06,2,250");
        await repo.setNoteSchedule("note-1", "!2023-10-06,3,250");

        await repo.deleteCardSchedule("^sr-id-a");
        expect(repo.getCardSchedule("^sr-id-a")).toBeUndefined();
        expect(repo.getCardSchedule("^sr-id-b")).toEqual("!2023-10-06,2,250");

        await repo.clearCards();
        expect(repo.getCardSchedule("^sr-id-b")).toBeUndefined();
        expect(repo.getNoteSchedule("note-1")).toEqual("!2023-10-06,3,250");

        await repo.clearNotes();
        expect(repo.getNoteSchedule("note-1")).toBeUndefined();

        await repo.setCardSchedule("^sr-id-c", "!2023-10-06,1,250");
        await repo.clear();
        expect(repo.getCardSchedule("^sr-id-c")).toBeUndefined();
    });
});

describe("load tolerance", () => {
    test("missing file yields empty data without throwing", async () => {
        const { repo } = setup();
        await repo.load();
        expect(repo.getCardSchedule("anything")).toBeUndefined();
    });

    test("corrupt file content yields empty data without throwing", async () => {
        const { vault, settings } = setup();
        await vault.createFolder("Spaced Repetition");
        await vault.create("Spaced Repetition/schedule-data.sr.md", "```json\nnot valid json\n```");

        const repo = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        await repo.load();
        expect(repo.getCardSchedule("^sr-id-abc")).toBeUndefined();
    });

    test("ignores non-string values defensively", async () => {
        const { vault, settings } = setup();
        await vault.createFolder("Spaced Repetition");
        await vault.create(
            "Spaced Repetition/schedule-data.sr.md",
            '```json\n{"version":1,"cards":{"^sr-id-x":123,"^sr-id-y":"!2023-10-06,1,250"},"notes":null}\n```',
        );

        const repo = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        await repo.load();
        expect(repo.getCardSchedule("^sr-id-x")).toBeUndefined();
        expect(repo.getCardSchedule("^sr-id-y")).toEqual("!2023-10-06,1,250");
    });
});

describe("deleteNoteSchedule", () => {
    test("removes a stored note schedule", async () => {
        const { repo } = setup();
        await repo.ensureStructure();
        await repo.setNoteSchedule("note-1", "!2023-10-06,4,270");
        await repo.setNoteSchedule("note-2", "!2023-10-07,5,270");

        await repo.deleteNoteSchedule("note-1");
        expect(repo.getNoteSchedule("note-1")).toBeUndefined();
        expect(repo.getNoteSchedule("note-2")).toEqual("!2023-10-07,5,270");
    });
});

describe("resilience", () => {
    test("ensureStructure continues when creating the folder throws", async () => {
        const { vault, settings } = setup();
        // A folder that already exists (or a case/race difference) makes createFolder throw.
        vault.createFolder = () => Promise.reject(new Error("Folder already exists"));

        const repo = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        await expect(repo.ensureStructure()).resolves.toBe(true);
        expect(vault.rawContent("Spaced Repetition/schedule-data.sr.md")).toBeDefined();
    });

    test("load yields empty data when reading the file throws", async () => {
        const { vault, settings, repo } = setup();
        await repo.ensureStructure();
        await repo.setCardSchedule("^sr-id-a", "!2023-10-06,1,250");

        const repo2 = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        vault.read = () => Promise.reject(new Error("I/O error"));
        await expect(repo2.load()).resolves.toBeUndefined();
        expect(repo2.getCardSchedule("^sr-id-a")).toBeUndefined();
    });

    test("valid JSON that is not an object yields empty data", async () => {
        const { vault, settings } = setup();
        await vault.createFolder("Spaced Repetition");
        // "null" and a bare number both parse successfully but are not a data object.
        await vault.create("Spaced Repetition/schedule-data.sr.md", "```json\nnull\n```");
        const repoNull = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
        await repoNull.load();
        expect(repoNull.getCardSchedule("^sr-id-a")).toBeUndefined();

        const vault2 = new UnitTestVault();
        await vault2.createFolder("Spaced Repetition");
        await vault2.create("Spaced Repetition/schedule-data.sr.md", "```json\n123\n```");
        const repoNumber = new ScheduleDataFileRepository(vault2 as unknown as Vault, settings);
        await repoNumber.load();
        expect(repoNumber.getCardSchedule("^sr-id-a")).toBeUndefined();
    });
});
