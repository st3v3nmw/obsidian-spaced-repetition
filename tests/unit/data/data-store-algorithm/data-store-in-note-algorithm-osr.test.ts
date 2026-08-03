import moment from "moment";
import { State } from "ts-fsrs";

import { NoteDataStoreAlgorithmOsr } from "src/data/data-store/notes-data-store/note-data-store-algorithm-osr";
import { Card } from "src/data/data-structures/card/card";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { FSRS_EMPTY_SCHEDULE_COMMENT } from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

describe("formatCardSchedule", () => {
    test("Has schedule, with due date", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: NoteDataStoreAlgorithmOsr = new NoteDataStoreAlgorithmOsr(settings);

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

    test("Has schedule, but no due date", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: NoteDataStoreAlgorithmOsr = new NoteDataStoreAlgorithmOsr(settings);

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

    test("Formats FSRS schedules", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const instance: NoteDataStoreAlgorithmOsr = new NoteDataStoreAlgorithmOsr(settings);

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

    test("Uses FSRS-native empty placeholder for unscheduled siblings when algorithm is FSRS", () => {
        const settings: SRSettings = {
            ...DEFAULT_SETTINGS,
            algorithm: SRAlgorithmType.FSRS,
        };
        const instance: NoteDataStoreAlgorithmOsr = new NoteDataStoreAlgorithmOsr(settings);
        const card: Card = new Card({});

        expect(instance.formatCardSchedule(card)).toEqual(FSRS_EMPTY_SCHEDULE_COMMENT);
    });

    test("Uses SM-2 dummy placeholder for unscheduled siblings when algorithm is SM-2-OSR", () => {
        const settings: SRSettings = {
            ...DEFAULT_SETTINGS,
            algorithm: SRAlgorithmType.SM_2_OSR,
        };
        const instance: NoteDataStoreAlgorithmOsr = new NoteDataStoreAlgorithmOsr(settings);
        const card: Card = new Card({});

        expect(instance.formatCardSchedule(card)).toEqual("!2000-01-01,1,250");
    });
});
