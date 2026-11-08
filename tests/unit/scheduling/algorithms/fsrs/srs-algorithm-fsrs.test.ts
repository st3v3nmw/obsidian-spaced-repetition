import moment from "moment";
import { State } from "ts-fsrs";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { SrsAlgorithmFsrs } from "src/scheduling/algorithms/fsrs/sr-algorithm-fsrs";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
import { CommentParser } from "src/utils/comment-parser";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("creates short-term FSRS-7 schedules for new cards", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const result = algorithm.cardGetNewSchedule(
        ReviewResponse.Again,
        "note.md",
        new CardDueDateHistogram(),
    );

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs7);
    expect(result.interval).toBeLessThan(1);
    expect(result.dueDateAsUnix).toBeGreaterThan(Date.parse("2023-09-06T00:00:00.000Z"));
});

// FSRS-7 results of ts-fsrs 6.0.0 with the default settings, "now" is 2023-09-06T00:00:00Z
test.each([
    [
        ReviewResponse.Again,
        "!fsrs7,2023-09-06T00:01:00.000Z,0.00069444,0.1104,0.08832,6.1686,1,1,0,0,2023-09-06T00:00:00.000Z",
    ],
    [
        ReviewResponse.Hard,
        "!fsrs7,2023-09-06T00:05:30.000Z,0.00381944,2.2395,1.7916,5.26127831,1,1,0,0,2023-09-06T00:00:00.000Z",
    ],
    [
        ReviewResponse.Good,
        "!fsrs7,2023-09-06T00:10:00.000Z,0.00694444,3.9221,3.13768,3.53072398,1,1,0,1,2023-09-06T00:00:00.000Z",
    ],
    [
        ReviewResponse.Easy,
        "!fsrs7,2023-10-29T20:52:05.937Z,53.86951316,11.7841,9.42728,1,2,1,0,0,2023-09-06T00:00:00.000Z",
    ],
])("new cards are scheduled with FSRS-7 (response %s)", (response, expected) => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const result = algorithm.cardGetNewSchedule(response, "note.md", new CardDueDateHistogram());

    expect(result.formatScheduleAsSRHtmlComment()).toEqual(expected);
});

test("FSRS-7 cards stay on FSRS-7, also after being written to and read from the note", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const learning = algorithm.cardGetNewSchedule(
        ReviewResponse.Good,
        "note.md",
        new CardDueDateHistogram(),
    );
    const parsed = CommentParser.parseScheduleSegment(
        learning.formatScheduleAsSRHtmlComment().slice(1),
    );
    expect(parsed).toBeInstanceOf(RepItemScheduleInfoFsrs7);

    const result = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        parsed,
        new CardDueDateHistogram(),
    ) as RepItemScheduleInfoFsrs7;

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs7);
    expect(result.state).toEqual(State.Review);
    expect(result.reps).toEqual(2);
    expect(result.interval).toBeGreaterThanOrEqual(1);
    expect(result.stabilityFast).toBeGreaterThan(0);
});

test("FSRS-6 cards that were reset before (state new) start over on FSRS-7", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const oldResetSchedule = CommentParser.parseScheduleSegment(
        "fsrs,2023-09-01T00:00:00.000Z,0,0,0,0,0,0,0,-",
    );
    expect(oldResetSchedule).toBeInstanceOf(RepItemScheduleInfoFsrs);

    const result = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        oldResetSchedule,
        new CardDueDateHistogram(),
    );

    expect(result.formatScheduleAsSRHtmlComment()).toEqual(
        algorithm
            .cardGetNewSchedule(ReviewResponse.Good, "note.md", new CardDueDateHistogram())
            .formatScheduleAsSRHtmlComment(),
    );
});

test("FSRS-6 review cards stay on FSRS-6", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const fsrs6Schedule = CommentParser.parseScheduleSegment(
        "fsrs,2023-09-06T00:00:00.000Z,3,3.1,5,2,3,0,0,2023-09-03T00:00:00.000Z",
    );

    for (const response of [
        ReviewResponse.Again,
        ReviewResponse.Hard,
        ReviewResponse.Good,
        ReviewResponse.Easy,
    ]) {
        const result = algorithm.cardCalcUpdatedSchedule(
            response,
            fsrs6Schedule,
            new CardDueDateHistogram(),
        );
        expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs);
        expect(result.formatScheduleAsSRHtmlComment()).toMatch(/^!fsrs,/);
    }
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

test("reset schedule returns an immediate FSRS-7 reset state", () => {
    const algorithm = new SrsAlgorithmFsrs(DEFAULT_SETTINGS);
    const result = algorithm.cardGetResetSchedule() as RepItemScheduleInfoFsrs7;

    expect(result).toBeInstanceOf(RepItemScheduleInfoFsrs7);
    expect(result.interval).toEqual(0);
    expect(result.state).toEqual(State.New);
    expect(result.isDue()).toEqual(true);
    expect(result.formatScheduleAsSRHtmlComment()).toEqual(
        "!fsrs7,2023-09-06T00:00:00.000Z,0,0,0,0,0,0,0,0,-",
    );

    // The next review of a reset card is the first review of a new FSRS-7 card
    const reviewed = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        result,
        new CardDueDateHistogram(),
    );
    expect(reviewed.formatScheduleAsSRHtmlComment()).toEqual(
        "!fsrs7,2023-09-06T00:10:00.000Z,0.00694444,3.9221,3.13768,3.53072398,1,1,0,1,2023-09-06T00:00:00.000Z",
    );
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
