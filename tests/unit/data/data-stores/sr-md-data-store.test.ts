import { Vault } from "obsidian";

import { DataStore, StorageType } from "src/data/data-store/base/data-store";
import { DataStoreAlgorithm } from "src/data/data-store/base/data-store-algorithm";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { SrMdDataStore } from "src/data/data-store/sr-md-data-store/sr-md-data-store";
import { SrMdDataStoreAlgorithmOsr } from "src/data/data-store/sr-md-data-store/sr-md-data-store-algorithm-osr";
import { Question } from "src/data/data-structures/card/questions/question";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { NoteFileLoader } from "src/note/note-file-loader";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "../../helpers/unit-test-file";
import { UnitTestVault } from "../../helpers/unit-test-vault";

function makeFileModifierStub(): IFileModifier {
    return {
        migrateDataStore: jest.fn().mockResolvedValue(undefined),
    } as unknown as IFileModifier;
}

function setupStore(settings: SRSettings): {
    vault: UnitTestVault;
    repo: ScheduleDataFileRepository;
    fileModifier: IFileModifier;
    store: SrMdDataStore;
} {
    const vault = new UnitTestVault();
    const repo = new ScheduleDataFileRepository(vault as unknown as Vault, settings);
    const fileModifier = makeFileModifierStub();
    const store = new SrMdDataStore(settings, fileModifier, repo);
    return { vault, repo, fileModifier, store };
}

describe("SrMdDataStoreAlgorithmOsr", () => {
    test("never writes an inline schedule comment", () => {
        const algorithm = new SrMdDataStoreAlgorithmOsr();
        expect(algorithm.questionFormatScheduleAsHtmlComment({} as Question)).toEqual("");
    });
});

describe("SrMdDataStore - pure read helpers", () => {
    const settings: SRSettings = { ...DEFAULT_SETTINGS, dataStore: StorageType.SR_MD };

    test("createSchedule returns [] when there is no block id", () => {
        const { store } = setupStore(settings);
        expect(store.createSchedule("Q::A", new RepItemStorageInfo())).toEqual([]);
    });

    test("createSchedule returns [] when the block id is unknown", () => {
        const { store } = setupStore(settings);
        expect(store.createSchedule("Q::A ^sr-id-missing", new RepItemStorageInfo())).toEqual([]);
    });

    test("removeScheduleInfo strips any stray inline comment", () => {
        const { store } = setupStore(settings);
        const cleaned = store.removeScheduleInfo("Q::A <!--SR:!2023-10-06,4,270-->");
        expect(cleaned).not.toContain("<!--SR");
    });

    test("migrateDataStore delegates to the file modifier", async () => {
        const { store, fileModifier } = setupStore(settings);
        await store.migrateDataStore(StorageType.NOTES);
        expect(fileModifier.migrateDataStore).toHaveBeenCalledWith(StorageType.NOTES);
    });
});

describe("SrMdDataStore - note schedules", () => {
    const settings: SRSettings = { ...DEFAULT_SETTINGS, dataStore: StorageType.SR_MD };

    beforeAll(() => {
        setupStaticDateProvider20230906();
    });

    test("writes and reads a note schedule via the external file", async () => {
        const { store } = setupStore(settings);
        const noteFile: ISRNoteTFile = new UnitTestSRFile("#flashcards/test\nA note\n");

        const schedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-10-06", 4, 270);
        await store.writeNoteSchedule(noteFile, schedule);

        // The note now has an sr-id, and no schedule was written into its body.
        expect(await noteFile.getNoteId()).not.toBeNull();
        expect(await noteFile.read()).not.toContain("<!--SR");

        const read = await store.readNoteSchedule(noteFile);
        expect(read).not.toBeNull();
        expect(read?.interval).toEqual(4);
        expect(read?.latestEase).toEqual(270);
    });

    test("readNoteSchedule returns null for a note with no id", async () => {
        const { store } = setupStore(settings);
        const noteFile: ISRNoteTFile = new UnitTestSRFile("No frontmatter here\n");
        expect(await store.readNoteSchedule(noteFile)).toBeNull();
    });
});

describe("SrMdDataStore - card schedules (integration via parser)", () => {
    const settings: SRSettings = { ...DEFAULT_SETTINGS, dataStore: StorageType.SR_MD };

    beforeAll(() => {
        setupStaticDateProvider20230906();
    });

    async function loadFirstQuestion(
        store: SrMdDataStore,
        noteFile: ISRNoteTFile,
    ): Promise<Question> {
        DataStore.instance = store;
        DataStoreAlgorithm.instance = new SrMdDataStoreAlgorithmOsr();
        SRAlgorithm.instance = new SRAlgorithmOsr(settings);

        const loader = new NoteFileLoader(settings);
        const note = await loader.load(noteFile, TextDirection.Ltr, TopicPath.emptyPath);
        expect(note).not.toBeNull();
        return note.questionList[0];
    }

    test("writeSchedule assigns a block id, stores externally, writes no comment; round-trips and deletes", async () => {
        const { vault, repo, store } = setupStore(settings);
        await store.isStructureInitialized;

        const noteFile = new UnitTestSRFile("#flashcards/test\nQ1::A1\n");
        const question = await loadFirstQuestion(store, noteFile);
        expect(question.questionText.obsidianBlockId).toBeFalsy();

        // Simulate a review having set a schedule on the card.
        question.cards[0].scheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-10-06",
            25,
            263,
        );
        await store.writeSchedule(question);

        const blockId = question.questionText.obsidianBlockId;
        expect(blockId).toMatch(/^\^sr-id-/);

        const noteContent = await noteFile.read();
        expect(noteContent).toContain(blockId);
        expect(noteContent).not.toContain("<!--SR");

        // The schedule lives in the external file, keyed by the block id.
        expect(repo.getCardSchedule(blockId)).toEqual("!2023-10-06,25,263");
        expect(vault.rawContent(repo.filePath)).toContain(blockId);

        // Read path: createSchedule resolves the schedule from the (in-memory) external store.
        const schedules = store.createSchedule(
            question.questionText.original,
            new RepItemStorageInfo(),
        );
        expect(schedules).toHaveLength(1);
        expect(schedules[0]?.interval).toEqual(25);
        expect(schedules[0]?.latestEase).toEqual(263);

        // Delete removes both the note text and the external entry.
        await store.delete(question);
        expect(repo.getCardSchedule(blockId)).toBeUndefined();
        expect(await noteFile.read()).not.toContain("Q1::A1");
    });
});
