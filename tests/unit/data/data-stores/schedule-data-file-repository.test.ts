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
