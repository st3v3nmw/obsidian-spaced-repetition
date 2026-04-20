import moment from "moment";
import { State } from "ts-fsrs";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { SrsAlgorithmFsrs } from "src/algorithms/fsrs/srs-algorithm-fsrs";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { CardDueDateHistogram } from "src/due-date-histogram";
import { DEFAULT_SETTINGS } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("creates short-term FSRS schedules for new cards", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const result = algorithm.cardGetNewSchedule(
        ReviewResponse.Again,
        "note.md",
        new CardDueDateHistogram(),
    );

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(result.interval).toEqual(0);
    expect(result.dueDateAsUnix).toBeGreaterThan(Date.parse("2023-09-06T00:00:00.000Z"));
});

test("imports legacy schedules into FSRS state on update", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const legacySchedule = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270);
    const result = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        legacySchedule,
        new CardDueDateHistogram(),
    );

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(result.interval).toBeGreaterThanOrEqual(1);
    expect((result as RepItemScheduleInfoFsrs).state).toEqual(State.Review);
});

test("reset schedule returns an immediate FSRS reset state", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const result = algorithm.cardGetResetSchedule() as RepItemScheduleInfoFsrs;

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs);
    expect(result.interval).toEqual(0);
    expect(result.state).toEqual(State.New);
});

test("delegates note scheduling to OSR and keeps existing FSRS schedules in FSRS", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    algorithm.noteOnLoadedNote("note.md", null as never, 260);
    expect(algorithm.noteStats().getEaseByPath("note.md")).toEqual(260);

    const noteGraph = new OsrNoteGraph({
        getResolvedTargetLinksForNotePath: () => ({}),
    } as never);
    expect(
        algorithm.noteCalcNewSchedule(
            "note.md",
            noteGraph,
            ReviewResponse.Good,
            new CardDueDateHistogram(),
        ),
    ).toBeInstanceOf(RepItemScheduleInfoOsr);
    expect(
        algorithm.noteCalcUpdatedSchedule(
            "note.md",
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270),
            ReviewResponse.Good,
            new CardDueDateHistogram(),
        ),
    ).toBeInstanceOf(RepItemScheduleInfoOsr);

    const fsrsSchedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:10:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        null,
    );
    expect(
        algorithm.cardCalcUpdatedSchedule(
            ReviewResponse.Good,
            fsrsSchedule,
            new CardDueDateHistogram(),
        ),
    ).toBeInstanceOf(RepItemScheduleInfoFsrs);
});

test("CardDueDateHistogram setter updates the due-now count", () => {
    const histogram = new CardDueDateHistogram();
    histogram.set(CardDueDateHistogram.dueNowNDays, 2);
    expect(histogram.dueNotesCount).toEqual(2);
});
