import moment from "moment";
import { State } from "ts-fsrs";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { CardDueDateHistogram } from "src/due-date-histogram";
import { DEFAULT_SETTINGS } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { unitTestSetupStandardDataStoreAlgorithm } from "../../helpers/unit-test-setup";

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

test("SrsAlgorithmOsr should return note stats", () => {
    const noteStats = SrsAlgorithm.getInstance().noteStats();
    expect(noteStats.dict).toEqual({});
});

test("SrsAlgorithmOsr should update FSRS schedules after switching back", () => {
    const algorithm = new SrsAlgorithmOsr(DEFAULT_SETTINGS);
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
    expect(result.formatCardScheduleForHtmlComment()).not.toContain("fsrs");
});
