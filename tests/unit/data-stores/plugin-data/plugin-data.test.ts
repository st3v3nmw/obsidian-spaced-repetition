import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card/card";
import { Question, QuestionText } from "src/card/questions/question";
import { RepItemStorageInfo } from "src/data-stores/base/rep-item-storage-info";
import { StoreInPluginData } from "src/data-stores/plugin-data/plugin-data";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { Note } from "src/note/note";
import { DEFAULT_DATA, PluginData } from "src/plugin-data";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
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

function makeRepo(data: PluginData): ScheduleDataRepository {
    return new ScheduleDataRepository(data, async () => {});
}

function makeStore(
    settings?: Partial<SRSettings>,
    data?: PluginData,
): { store: StoreInPluginData; repo: ScheduleDataRepository; data: PluginData } {
    const pluginData = data ?? JSON.parse(JSON.stringify(DEFAULT_DATA));
    const repo = makeRepo(pluginData);
    const store = new StoreInPluginData({ ...DEFAULT_SETTINGS, ...settings }, repo);
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
        expect(store.questionRemoveScheduleInfo(input)).toBe("Q::A ");
    });

    test("removes multiline SR comment", () => {
        const { store } = makeStore();
        const input = "Q\n?\nA\n<!--SR:!2023-09-06,5,230!2023-09-07,3,210-->";
        expect(store.questionRemoveScheduleInfo(input)).toBe("Q\n?\nA\n");
    });

    test("returns unchanged text when no comment present", () => {
        const { store } = makeStore();
        const input = "Q::A";
        expect(store.questionRemoveScheduleInfo(input)).toBe("Q::A");
    });
});

describe("StoreInPluginData.questionCreateSchedule", () => {
    test("falls back to parsing text when storageInfo is null", () => {
        const { store } = makeStore();
        const schedules = store.questionCreateSchedule("Q::A <!--SR:!2023-09-06,10,250-->", null);
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(10);
    });

    test("falls back to parsing text when storageInfo has no external data", () => {
        const { store } = makeStore();
        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.questionCreateSchedule(
            "Q::A <!--SR:!2023-09-06,4,270-->",
            storageInfo,
        );
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(4);
    });

    test("returns empty array when no inline schedule and no external data", () => {
        const { store } = makeStore();
        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.questionCreateSchedule("Q::A", storageInfo);
        expect(schedules).toEqual([]);
    });

    test("returns external data when it exists in repository", async () => {
        const { store, repo } = makeStore();
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 7, 240);
        await repo.setCardSchedules("abc123", [s]);

        const storageInfo = new RepItemStorageInfo("notes/foo.md", "abc123");
        const schedules = store.questionCreateSchedule("Q::A", storageInfo);
        expect(schedules.length).toBe(1);
        expect((schedules[0] as RepItemScheduleInfoOsr).interval).toBe(7);
    });

    test("external data takes precedence over inline comment", async () => {
        const { store, repo } = makeStore();
        const s = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 20, 300);
        await repo.setCardSchedules("hash1", [s]);

        const storageInfo = new RepItemStorageInfo("notes/foo.md", "hash1");
        // Inline comment says interval=4 but external data says interval=20
        const schedules = store.questionCreateSchedule(
            "Q::A <!--SR:!2023-09-06,4,270-->",
            storageInfo,
        );
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

        await store.questionWriteSchedule(question);

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

        await store.questionWrite(question);

        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(true);
        expect(question.hasChanged).toBe(false);
    });

    test("sets hasChanged to false after write", async () => {
        const { store } = makeStore();
        const { question } = makeQuestion("Q::A", "notes/test.md", "Q::A", [null]);

        question.hasChanged = true;
        await store.questionWrite(question);
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

        await store.questionDelete(question);

        expect(repo.hasCardSchedules(question.questionText.textHash)).toBe(false);
    });

    test("removes question text from file", async () => {
        const { store } = makeStore();
        const noteText = "Q::A\nOther content";
        const { question, file } = makeQuestion("Q::A", "notes/test.md", noteText, [null]);

        await store.questionDelete(question);

        expect(file.content).not.toContain("Q::A");
        expect(file.content).toContain("Other content");
    });
});
