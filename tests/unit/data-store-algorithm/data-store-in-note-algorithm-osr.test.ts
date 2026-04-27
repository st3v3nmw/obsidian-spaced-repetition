import moment from "moment";
import { State } from "ts-fsrs";

import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card/card";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
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

    test("Formats FSRS schedules", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: DataStoreInNoteAlgorithmOsr = new DataStoreInNoteAlgorithmOsr(settings);

        const scheduleInfo = new RepItemScheduleInfoFsrs(
            moment("2023-09-06T00:10:00.000Z"),
            0,
            5.5,
            0.4,
            State.Learning,
            1,
            0,
            1,
            moment("2023-09-06T00:00:00.000Z"),
        );
        const card: Card = new Card({
            scheduleInfo,
        });

        expect(instance.formatCardSchedule(card)).toEqual(
            "!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z",
        );
    });
});
