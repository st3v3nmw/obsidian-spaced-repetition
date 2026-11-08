import { State } from "ts-fsrs";

import { MULTI_SCHEDULING_EXTRACTOR } from "src/data/constants";
import { TICKS_PER_DAY } from "src/data/constants";
import { DataStore } from "src/data/data-store/base/data-store";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("No schedule info for question", () => {
    expect(DataStore.getInstance().createSchedule("A::B", null)).toEqual([]);
});

test("Single schedule info for question (on separate line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        `What symbol represents an electric field:: $\\large \\vec E$
<!--SR:!2023-09-02,4,270-->`,
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Single schedule info for question (on same line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2023-09-02,4,270-->",
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Legacy schedule comments without the bang prefix are still parsed", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:2023-09-02,4,270-->",
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Legacy fallback extractor loop still parses schedules", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        {
            match(): RegExpMatchArray | null {
                return null;
            },
            matchAll(regex: RegExp): IterableIterator<RegExpMatchArray> {
                const matches =
                    regex === MULTI_SCHEDULING_EXTRACTOR
                        ? []
                        : [
                              [
                                  "<!--SR:2023-09-02,4,270-->",
                                  "2023-09-02",
                                  "4",
                                  "270",
                              ] as RegExpMatchArray,
                          ];
                return matches[Symbol.iterator]() as IterableIterator<RegExpMatchArray>;
            },
        } as never,
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Multiple schedule info for question (on separate line)", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        `This is a really very ==interesting== and ==fascinating== and ==great== test
    <!--SR:!2023-09-03,1,230!2023-09-05,3,250!2023-09-06,4,270-->`,
        null,
    );

    expect(actual).toEqual([
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230, -3 * TICKS_PER_DAY),
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-05", 3, 250, -1 * TICKS_PER_DAY),
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 4, 270, 0),
    ]);
});

test("Single FSRS schedule info for question", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z-->",
        null,
    );

    expect(actual).toHaveLength(1);
    expect(actual[0]).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(actual[0]).toMatchObject({
        interval: 0,
        stability: 0.4,
        difficulty: 5.5,
        state: State.Learning,
        reps: 1,
        lapses: 0,
        learningSteps: 1,
    });
    expect(actual[0].dueDate.toDate().toISOString()).toEqual("2023-09-06T00:10:00.000Z");
});

test("Mixed OSR and FSRS schedule info for question", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2023-09-02,4,270!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z-->",
        null,
    );

    expect(actual).toHaveLength(2);
    expect(actual[0]).toEqual(
        RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    );
    expect(actual[1]).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(actual[1]).toMatchObject({
        interval: 0,
        stability: 0.4,
        difficulty: 5.5,
        state: State.Learning,
        reps: 1,
        lapses: 0,
        learningSteps: 1,
    });
});

test("Placeholder schedules parse as empty card slots", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2000-01-01,1,250-->",
        null,
    );

    expect(actual).toEqual([null]);
});

test("Placeholder schedules preserve sibling indexes before FSRS schedules", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2000-01-01,1,250!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z-->",
        null,
    );

    expect(actual).toHaveLength(2);
    expect(actual[0]).toBeNull();
    expect(actual[1]).toBeInstanceOf(RepItemScheduleInfoFsrs);
});

test("Placeholder schedules preserve sibling indexes after FSRS schedules", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z!2000-01-01,1,250-->",
        null,
    );

    expect(actual).toHaveLength(2);
    expect(actual[0]).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(actual[1]).toBeNull();
});

test("Placeholder schedules preserve middle FSRS sibling indexes", () => {
    const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
        "What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2000-01-01,1,250!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z!2000-01-01,1,250-->",
        null,
    );

    expect(actual).toHaveLength(3);
    expect(actual[0]).toBeNull();
    expect(actual[1]).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(actual[2]).toBeNull();
});

describe("Suspended cards", () => {
    test("No schedule info means no suspended cards", () => {
        expect(DataStore.getInstance().createCardMetadataList("A::B")).toEqual([]);
    });

    test("Schedule without suspended flag", () => {
        expect(
            DataStore.getInstance().createCardMetadataList("A::B <!--SR:!2023-09-02,4,270-->"),
        ).toEqual([{ isSuspended: false, id: null }]);
    });

    test("Suspended flag does not change the parsed schedule", () => {
        const text: string = "A::B <!--SR:!2023-09-02,4,270,suspended-->";

        expect(DataStore.getInstance().createSchedule(text, null)).toEqual([
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
        ]);
        expect(DataStore.getInstance().createCardMetadataList(text)).toEqual([
            { isSuspended: true, id: null },
        ]);
    });

    test("Suspended flag on new, SM-2 and FSRS sibling cards", () => {
        const text: string =
            "A::B <!--SR:!2000-01-01,1,250,suspended!2023-09-02,4,270!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z,suspended-->";

        const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(text, null);
        expect(actual).toHaveLength(3);
        expect(actual[0]).toBeNull();
        expect(actual[1]).toEqual(
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
        );
        expect(actual[2]).toBeInstanceOf(RepItemScheduleInfoFsrs);
        expect(actual[2]).toMatchObject({
            interval: 0,
            stability: 0.4,
            difficulty: 5.5,
            state: State.Learning,
            reps: 1,
            lapses: 0,
            learningSteps: 1,
        });
        expect(actual[2].dueDate.toDate().toISOString()).toEqual("2023-09-06T00:10:00.000Z");
        expect((actual[2] as RepItemScheduleInfoFsrs).lastReview.toDate().toISOString()).toEqual(
            "2023-09-06T00:00:00.000Z",
        );

        expect(
            DataStore.getInstance()
                .createCardMetadataList(text)
                .map((metadata) => metadata.isSuspended),
        ).toEqual([true, false, true]);
    });
});

describe("Card ids", () => {
    test("Card id does not change the parsed schedule", () => {
        const text: string = "A::B <!--SR:!2023-09-02,4,270,id=k2n8x0c4qz7m-->";

        expect(DataStore.getInstance().createSchedule(text, null)).toEqual([
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
        ]);
        expect(DataStore.getInstance().createCardMetadataList(text)).toEqual([
            { isSuspended: false, id: "k2n8x0c4qz7m" },
        ]);
    });

    test("Card ids and suspended flags in any order, on new, SM-2 and FSRS sibling cards", () => {
        const text: string =
            "A::B <!--SR:!2000-01-01,1,250,id=aaa111!2023-09-02,4,270,suspended,id=bbb222!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z,id=ccc333,suspended!2023-09-02,5,270-->";

        const schedules: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(text, null);
        expect(schedules).toHaveLength(4);
        expect(schedules[0]).toBeNull();
        expect(schedules[1]).toEqual(
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
        );
        expect(schedules[2]).toBeInstanceOf(RepItemScheduleInfoFsrs);
        expect((schedules[2] as RepItemScheduleInfoFsrs).lastReview.toDate().toISOString()).toEqual(
            "2023-09-06T00:00:00.000Z",
        );
        expect(schedules[3]).toEqual(
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-02", 5, 270, -4 * TICKS_PER_DAY),
        );

        expect(DataStore.getInstance().createCardMetadataList(text)).toEqual([
            { isSuspended: false, id: "aaa111" },
            { isSuspended: true, id: "bbb222" },
            { isSuspended: true, id: "ccc333" },
            { isSuspended: false, id: null },
        ]);
    });

    test("Invalid card id throws", () => {
        expect(() =>
            DataStore.getInstance().createCardMetadataList("A::B <!--SR:!2023-09-02,4,270,id=-->"),
        ).toThrow(/Invalid card id/);
        expect(() =>
            DataStore.getInstance().createCardMetadataList(
                "A::B <!--SR:!2023-09-02,4,270,id=a b-->",
            ),
        ).toThrow(/Invalid card id/);
    });

    test("Two card ids for one card throws", () => {
        expect(() =>
            DataStore.getInstance().createCardMetadataList(
                "A::B <!--SR:!2023-09-02,4,270,id=abc,id=def-->",
            ),
        ).toThrow(/More than one card id/);
    });
});

describe("FSRS-7 schedules", () => {
    const FSRS7_SCHEDULE =
        "fsrs7,2023-09-16T01:52:52.121Z,10.07143659,5.69148946,32.23815599,3.49771674,2,2,0,0,2023-09-06T00:10:00.000Z";

    test("Single FSRS-7 schedule info for question", () => {
        const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
            `A::B <!--SR:!${FSRS7_SCHEDULE}-->`,
            null,
        );

        expect(actual).toHaveLength(1);
        expect(actual[0]).toBeInstanceOf(RepItemScheduleInfoFsrs7);
        expect(actual[0]).toMatchObject({
            interval: 10.07143659,
            stability: 5.69148946,
            stabilityFast: 32.23815599,
            difficulty: 3.49771674,
            state: State.Review,
            reps: 2,
            lapses: 0,
            learningSteps: 0,
        });
        expect(actual[0].dueDate.toDate().toISOString()).toEqual("2023-09-16T01:52:52.121Z");
        expect(actual[0].formatScheduleAsSRHtmlComment()).toEqual(`!${FSRS7_SCHEDULE}`);
    });

    test("FSRS-7, FSRS-6 and SM-2 siblings with card ids and suspended flags", () => {
        const text: string = `A::B <!--SR:!${FSRS7_SCHEDULE},suspended,id=aaa111!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z,id=bbb222!2023-09-02,4,270-->`;

        const schedules: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(text, null);
        expect(schedules).toHaveLength(3);
        expect(schedules[0]).toBeInstanceOf(RepItemScheduleInfoFsrs7);
        expect(schedules[1]).toBeInstanceOf(RepItemScheduleInfoFsrs);
        expect(schedules[2]).toBeInstanceOf(RepItemScheduleInfoOsr);

        expect(DataStore.getInstance().createCardMetadataList(text)).toEqual([
            { isSuspended: true, id: "aaa111" },
            { isSuspended: false, id: "bbb222" },
            { isSuspended: false, id: null },
        ]);
    });

    test("New FSRS-7 schedule after a reset has no last review", () => {
        const actual: RepItemScheduleInfo[] = DataStore.getInstance().createSchedule(
            "A::B <!--SR:!fsrs7,2023-09-06T00:00:00.000Z,0,0,0,0,0,0,0,0,--->",
            null,
        );

        expect(actual[0]).toBeInstanceOf(RepItemScheduleInfoFsrs7);
        expect(actual[0]).toMatchObject({ state: State.New, lastReview: null });
    });

    test("Invalid FSRS-7 schedules throw", () => {
        const parse = (schedule: string) =>
            DataStore.getInstance().createSchedule(`A::B <!--SR:!${schedule}-->`, null);

        expect(() =>
            parse(
                "fsrs7,2023-09-16T01:52:52.121Z,10.07,5.69,3.49,2,2,0,0,2023-09-06T00:10:00.000Z",
            ),
        ).toThrow(/Expected 11 fields/);
        expect(() =>
            parse(
                "fsrs7,2023-09-16T01:52:52.121Z,10.07,5.69,32.2,3.49,5,2,0,0,2023-09-06T00:10:00.000Z",
            ),
        ).toThrow(/Invalid FSRS state "5"/);
        expect(() =>
            parse(
                "fsrs7,2023-09-16T01:52:52.121Z,10.07,abc,32.2,3.49,2,2,0,0,2023-09-06T00:10:00.000Z",
            ),
        ).toThrow(/Invalid number "abc"/);
        expect(() =>
            parse(
                "fsrs7,2023-09-16T01:52:52.121Z,10.07,5.69,32.2,3.49,2,2.5,0,0,2023-09-06T00:10:00.000Z",
            ),
        ).toThrow(/Invalid integer "2.5"/);
        expect(() =>
            parse("fsrs7,-,10.07,5.69,32.2,3.49,2,2,0,0,2023-09-06T00:10:00.000Z"),
        ).toThrow(/Invalid due date "-"/);
    });
});
