import moment from "moment";
import { State } from "ts-fsrs";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { unitTestSetupStandardDataStoreAlgorithm } from "../../../helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("SrsAlgorithmOsr should return note stats", () => {
    const noteStats = SRAlgorithm.getInstance().noteStats();
    expect(noteStats.dict).toEqual({});
});

test("SrsAlgorithmOsr should update FSRS schedules after switching back", () => {
    const algorithm = new SRAlgorithmOsr(DEFAULT_SETTINGS);
    const fsrsSchedule = new RepItemScheduleInfoFsrs(
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

    const result = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        fsrsSchedule,
        new CardDueDateHistogram(),
    );

    expect(result).toBeInstanceOf(RepItemScheduleInfoOsr);
    expect(result.interval).toBeGreaterThanOrEqual(1);
    expect(result.latestEase).toBeGreaterThanOrEqual(130);
    expect(result.formatScheduleAsSRHtmlComment()).not.toContain("fsrs");
});

test("SrsAlgorithmOsr uses whole-day intervals for FSRS-7 schedules after switching back", () => {
    const algorithm = new SRAlgorithmOsr(DEFAULT_SETTINGS);
    const fsrs7Schedule = new RepItemScheduleInfoFsrs7(
        moment("2023-09-06T00:00:00.000Z"),
        10.4,
        3.5,
        5.7,
        32.2,
        State.Review,
        2,
        0,
        0,
        moment("2023-08-27T14:24:00.000Z"),
    );

    const result = algorithm.cardCalcUpdatedSchedule(
        ReviewResponse.Good,
        fsrs7Schedule,
        new CardDueDateHistogram(),
    );

    expect(result).toBeInstanceOf(RepItemScheduleInfoOsr);
    expect(Number.isInteger(result.interval)).toEqual(true);
    expect(result.formatScheduleAsSRHtmlComment()).toMatch(/^!\d{4}-\d{2}-\d{2},\d+,\d+$/);
});

test("SrsAlgorithmOsr doesn't predict recall probabilities", () => {
    const algorithm = new SRAlgorithmOsr(DEFAULT_SETTINGS);
    expect(
        algorithm.cardRecallProbability(
            RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270),
        ),
    ).toBeNull();
});
