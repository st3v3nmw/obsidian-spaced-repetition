import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { RepItemStorageInfo } from "src/data/data-stores/base/rep-item-storage-info";
import { FolderDataStore } from "src/data/data-stores/folder-data-store/folder-data-store";
import { ScheduleDataFolderRepository } from "src/data/data-stores/folder-data-store/schedule-data-folder-repository";
import { Card } from "src/data/data-structures/card/card";
import { Question, QuestionText } from "src/data/data-structures/card/questions/question";
import { DEFAULT_DATA, PluginData } from "src/data/plugin-data";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "../../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../../helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    // StoreInPluginData.questionRemoveScheduleInfo is called from QuestionText.create via DataStore,
    // so we need a DataStore instance set up for any test that creates QuestionText.
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

function makeRepo(data: PluginData): ScheduleDataFolderRepository {
    return new ScheduleDataFolderRepository(data, async () => { });
}

function makeStore(
    settings?: Partial<SRSettings>,
    data?: PluginData,
): { store: FolderDataStore; repo: ScheduleDataFolderRepository; data: PluginData } {
    const pluginData = data ?? JSON.parse(JSON.stringify(DEFAULT_DATA));
    const repo = makeRepo(pluginData);
    const store = new FolderDataStore({ ...DEFAULT_SETTINGS, ...settings }, repo);
    return { store, repo, data: pluginData };
}

// Build a minimal Question suitable for write operations
function makeQuestion(
    questionText: string,
    filePath: string,
    fileContent: string,
    schedules: (RepItemScheduleInfoOsr | null)[],
): { question: Question; file: UnitTestSRFile } {
    const file = new UnitTestSRFile(fileContent, filePath);
    const qt = new QuestionText(
        questionText,
        null,
        questionText.replace(/<!--SR:.+-->/gm, "").trimEnd(),
        TextDirection.Ltr,
        null,
    );
    const cards: Card[] = schedules.map((s) => new Card({ scheduleInfo: s }));
    const question = new Question({
        questionText: qt,
        cards,
        hasChanged: true,
    });
    const note = new Note(file, [question]);
    // Note constructor assigns question.note
    void note;
    return { question, file };
}

describe("StoreInPluginData.questionRemoveScheduleInfo", () => {
    test("removes inline SR comment", () => {
        const { store } = makeStore();
        const input = "Q::A <!--SR:!2023-09-06,10,250-->";
        expect(store.removeScheduleInfo(input)).toBe("Q::A ");
    });

    test("removes multiline SR comment", () => {
        const { store } = makeStore();
        const input = "Q\n?\nA\n<!--SR:!2023-09-06,5,230!2023-09-07,3,210-->";
        expect(store.removeScheduleInfo(input)).toBe("Q\n?\nA\n");
    });

    test("returns unchanged text when no comment present", () => {
        const { store } = makeStore();
        const input = "Q::A";
        expect(store.removeScheduleInfo(input)).toBe("Q::A");
    });
});

describe("StoreInPluginData.questionCreateSchedule", () => {
    test("falls back to parsing text when storageInfo is null", () => {
        const { store } = makeStore();
        const schedules = store.createSchedule("Q::A <!--SR:!2023-09-06,10,250-->", null);
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(10);
    });

    test("falls back to parsing text when storageInfo has no external data", () => {
        const { store } = makeStore();
        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.createSchedule("Q::A <!--SR:!2023-09-06,4,270-->", storageInfo);
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(4);
    });

    test("returns null for dummy due date entries", () => {
        const { store } = makeStore();
        const schedules = store.createSchedule(
            `Q::A <!--SR:!${RepItemScheduleInfoOsr.dummyDueDateForNewCard},1,250-->`,
            null,
        );

        expect(schedules).toEqual([null]);
    });

    test("returns empty array when no inline schedule and no external data", () => {
        const { store } = makeStore();
        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.createSchedule("Q::A", storageInfo);
        expect(schedules).toEqual([]);
    });

    test("returns external data when it exists in repository", async () => {
        const { store, repo } = makeStore();
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 7, 240);
        await repo.setCardSchedules("abc123", [s]);

        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.createSchedule("Q::A", storageInfo);
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(7);
    });

    test("external data takes precedence over inline comment", async () => {
        const { store, repo } = makeStore();
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 20, 300);
        await repo.setCardSchedules("hash1", [s]);

        const storageInfo = new RepItemStorageInfo("notes/foo.md", "hash1");
        // Inline comment says interval=4 but external data says interval=20
        const schedules = store.createSchedule("Q::A <!--SR:!2023-09-06,4,270-->", storageInfo);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(20);
    });
});

describe("StoreInPluginData.questionWriteSchedule", () => {
    test("persists schedule to repository and updates file", async () => {
        const { store, repo } = makeStore();
        const noteText = "Q::A";
        const { question } = makeQuestion("Q::A", "notes/test.md", noteText, [
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230),
        ]);

        await store.writeSchedule(question);

        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(true);
        expect(question.hasChanged).toBe(false);
    });
});

describe("StoreInPluginData.questionWrite", () => {
    test("writes file content and persists schedule", async () => {
        const { store, repo } = makeStore();
        const noteText = "Q::A";
        const { question } = makeQuestion("Q::A", "notes/test.md", noteText, [
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230),
        ]);

        await store.write(question);

        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(true);
        expect(question.hasChanged).toBe(false);
    });

    test("sets hasChanged to false after write", async () => {
        const { store } = makeStore();
        const { question } = makeQuestion("Q::A", "notes/test.md", "Q::A", [null]);

        question.hasChanged = true;
        await store.write(question);
        expect(question.hasChanged).toBe(false);
    });
});

describe("StoreInPluginData.questionDelete", () => {
    test("removes card schedules from repository", async () => {
        const { store, repo } = makeStore();
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 5, 230);
        const { question } = makeQuestion("Q::A", "notes/test.md", "Q::A", [s]);

        // Pre-seed the repository so there's something to delete
        await repo.setCardSchedules(question.questionText.textHash, [s]);
        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(true);

        await store.delete(question);

        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(false);
    });

    test("removes question text from file", async () => {
        const { store } = makeStore();
        const noteText = "Q::A\nOther content";
        const { question, file } = makeQuestion("Q::A", "notes/test.md", noteText, [null]);

        await store.delete(question);

        expect(file.content).not.toContain("Q::A");
        expect(file.content).toContain("Other content");
    });
});
