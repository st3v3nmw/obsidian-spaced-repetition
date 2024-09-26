import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestSRFile } from "../helpers/unit-test-file";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

describe("noteSetSchedule", () => {
    test("File originally has frontmatter (but not OSR note scheduling frontmatter)", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: DataStoreInNoteAlgorithmOsr = new DataStoreInNoteAlgorithmOsr(settings);

        const noteText: string = `---
created: 2024-01-17
---
A very interesting note
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const scheduleInfo: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-10-06",
            25,
            263,
        );
        await instance.noteSetSchedule(file, scheduleInfo);

        const expectedText: string = `---
created: 2024-01-17
sr-due: 2023-10-06
sr-interval: 25
sr-ease: 263
---
A very interesting note
`;
        expect(file.content).toEqual(expectedText);
    });
});

describe("formatCardSchedule", () => {
    test("Has schedule, with due date", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: DataStoreInNoteAlgorithmOsr = new DataStoreInNoteAlgorithmOsr(settings);

        const scheduleInfo: RepItemScheduleInfoOsr = RepItemScheduleInfoOsr.fromDueDateStr(
            "2023-10-06",
            25,
            263,
        );
        const card: Card = new Card({
            scheduleInfo,
        });
        expect(instance.formatCardSchedule(card)).toEqual("!2023-10-06,25,263");
    });

    test("Has schedule, but no due date", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: DataStoreInNoteAlgorithmOsr = new DataStoreInNoteAlgorithmOsr(settings);

        const scheduleInfo: RepItemScheduleInfoOsr = new RepItemScheduleInfoOsr(
            null,
            25,
            303,
            null,
        );
        const card: Card = new Card({
            scheduleInfo,
        });
        expect(instance.formatCardSchedule(card)).toEqual("!2000-01-01,25,303");
    });
});
