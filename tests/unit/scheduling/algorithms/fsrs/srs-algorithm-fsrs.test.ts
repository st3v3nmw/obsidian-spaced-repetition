import moment from "moment";
import { State } from "ts-fsrs";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { SrsAlgorithmFsrs } from "src/scheduling/algorithms/fsrs/sr-algorithm-fsrs";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("uses changed retention and restored defaults in an existing algorithm instance", () => {
    const settings = { ...DEFAULT_SETTINGS };
    const algorithm = new SrsAlgorithmFsrs(settings);
    const histogram = new CardDueDateHistogram();
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:00:00Z"),
        3,
        5,
        3,
        State.Review,
        4,
        1,
        0,
        moment("2023-09-03T00:00:00Z"),
    );
    const storedSchedule = schedule.serializeSchedule();
    const beforeNew = algorithm.cardGetNewSchedule(ReviewResponse.Easy, "note.md", histogram);
    const beforeReview = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        schedule,
        histogram,
    );
    algorithm.noteOnLoadedNote("note.md", null, 260);

    settings.fsrsDesiredRetention = 0.97;

    expect(
        algorithm.cardGetNewSchedule(ReviewResponse.Easy, "note.md", histogram).interval,
    ).toBeLessThan(beforeNew.interval);
    expect(
        algorithm.cardCalcUpdatedSchedule(ReviewResponse.Good, schedule, histogram).interval,
    ).toBeLessThan(beforeReview.interval);
    expect(algorithm.noteStats().getEaseByPath("note.md")).toBe(260);
    expect(schedule.serializeSchedule()).toEqual(storedSchedule);

    settings.fsrsDesiredRetention = DEFAULT_SETTINGS.fsrsDesiredRetention;

    expect(algorithm.cardGetNewSchedule(ReviewResponse.Easy, "note.md", histogram).interval).toBe(
        beforeNew.interval,
    );
    expect(
        algorithm.cardCalcUpdatedSchedule(ReviewResponse.Good, schedule, histogram).interval,
    ).toBe(beforeReview.interval);
});

test("uses a changed maximum interval without restarting the algorithm", () => {
    const settings = { ...DEFAULT_SETTINGS };
    const algorithm = new SrsAlgorithmFsrs(settings);
    const histogram = new CardDueDateHistogram();
    const before = algorithm.cardGetNewSchedule(ReviewResponse.Easy, "note.md", histogram);

    settings.maximumInterval = 3;

    expect(before.interval).toBeGreaterThan(3);
    expect(algorithm.cardGetNewSchedule(ReviewResponse.Easy, "note.md", histogram).interval).toBe(
        3,
    );
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
    algorithm.noteOnLoadedNote("note.md", null, 260);
    expect(algorithm.noteStats().getEaseByPath("note.md")).toEqual(260);

    const noteGraph = new OsrNoteGraph({
        getResolvedTargetLinksForNotePath: () => ({}),
    });
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
