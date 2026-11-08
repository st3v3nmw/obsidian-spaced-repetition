import moment, { Moment } from "moment";
import { State } from "ts-fsrs";

import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { SrsAlgorithmFsrs } from "src/scheduling/algorithms/fsrs/sr-algorithm-fsrs";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

// FSRS-6 results recorded with ts-fsrs 5.4.1 (the version before the upgrade to ts-fsrs 6).
// Cards that are already on FSRS-6 (and SM-2 cards moving to FSRS-6) must keep this behaviour.
// "Now" is 2023-09-06T00:00:00Z for every case.
//
// Deliberate differences to ts-fsrs 5.4.1, which are bug fixes of ts-fsrs 6:
//  - "learning step 1, 10 min ago, hard" is due after 5.5 minutes instead of 6 (learning steps keep second precision)
//  - "retention 0.8 max 60, overdue review, good/easy" are capped at the maximum interval of 60 days, instead of 61/62
//
// New and reset cards are scheduled with FSRS-7, see srs-algorithm-fsrs.test.ts.

const NOW: Moment = moment("2023-09-06T00:00:00.000Z");
const RESPONSES: [string, ReviewResponse][] = [
    ["again", ReviewResponse.Again],
    ["hard", ReviewResponse.Hard],
    ["good", ReviewResponse.Good],
    ["easy", ReviewResponse.Easy],
];

// state: 0 New, 1 Learning, 2 Review, 3 Relearning
function fsrs6Card(
    lastReview: Moment,
    interval: number,
    stability: number,
    difficulty: number,
    state: State,
    reps: number,
    lapses: number,
    learningSteps: number,
): RepItemScheduleInfoFsrs {
    const due = lastReview.clone().add(interval < 1 ? 10 : interval * 24 * 60, "minutes");
    return new RepItemScheduleInfoFsrs(
        due,
        interval,
        difficulty,
        stability,
        state,
        reps,
        lapses,
        learningSteps,
        lastReview,
    );
}

const UPDATE_CASES: [string, () => RepItemScheduleInfo][] = [
    [
        "learning step 1, 10 min ago",
        () => fsrs6Card(NOW.clone().subtract(10, "minutes"), 0, 2.3065, 2.11810397, 1, 1, 0, 1),
    ],
    [
        "relearning, 10 min ago",
        () => fsrs6Card(NOW.clone().subtract(10, "minutes"), 0, 1.2, 7.1, 3, 6, 1, 0),
    ],
    [
        "review on time, 3 days",
        () => fsrs6Card(NOW.clone().subtract(3, "days"), 3, 3.1, 5.0, 2, 3, 0, 0),
    ],
    [
        "review overdue, 25 days for 20",
        () => fsrs6Card(NOW.clone().subtract(25, "days"), 20, 20.5, 4.2, 2, 6, 1, 0),
    ],
    [
        "review early, 10 days for 50",
        () => fsrs6Card(NOW.clone().subtract(10, "days"), 50, 48.3, 8.4, 2, 9, 2, 0),
    ],
    [
        "review reviewed at 18:30, 4 days",
        () => fsrs6Card(moment("2023-09-01T18:30:00.000Z"), 4, 4.4, 6.0, 2, 4, 0, 0),
    ],
    [
        "imported SM-2, 4 days, ease 270",
        () => RepItemScheduleInfoOsr.fromDueDateStr("2023-09-10", 4, 270),
    ],
    [
        "imported SM-2 overdue, 30 days, ease 130",
        () => RepItemScheduleInfoOsr.fromDueDateStr("2023-09-01", 30, 130),
    ],
];

function scheduleUpdate(
    settings: SRSettings,
    response: ReviewResponse,
    schedule: RepItemScheduleInfo,
): string {
    return new SrsAlgorithmFsrs(settings)
        .cardCalcUpdatedSchedule(response, schedule, new CardDueDateHistogram())
        .formatScheduleAsSRHtmlComment();
}

function collectResults(): Record<string, string> {
    const lowRetention: SRSettings = {
        ...DEFAULT_SETTINGS,
        fsrsDesiredRetention: 0.8,
        maximumInterval: 60,
    };
    const results: Record<string, string> = {};
    for (const [caseName, makeSchedule] of UPDATE_CASES) {
        for (const [name, response] of RESPONSES) {
            results[`${caseName}, ${name}`] = scheduleUpdate(
                DEFAULT_SETTINGS,
                response,
                makeSchedule(),
            );
        }
    }
    for (const [name, response] of RESPONSES) {
        results[`retention 0.8 max 60, overdue review, ${name}`] = scheduleUpdate(
            lowRetention,
            response,
            UPDATE_CASES[3][1](),
        );
    }
    return results;
}

const EXPECTED: Record<string, string> = {
    "learning step 1, 10 min ago, again":
        "!fsrs,2023-09-06T00:01:00.000Z,0,0.57129918,7.39450274,1,2,0,0,2023-09-06T00:00:00.000Z",
    "learning step 1, 10 min ago, hard":
        "!fsrs,2023-09-06T00:05:30.000Z,0,5.31879273,4.75285849,1,2,0,1,2023-09-06T00:00:00.000Z",
    "learning step 1, 10 min ago, good":
        "!fsrs,2023-09-13T00:00:00.000Z,7,7.31530068,2.11121424,2,2,0,0,2023-09-06T00:00:00.000Z",
    "learning step 1, 10 min ago, easy":
        "!fsrs,2023-09-18T00:00:00.000Z,12,11.6874828,1,2,2,0,0,2023-09-06T00:00:00.000Z",
    "relearning, 10 min ago, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.35022804,9.03201809,3,7,1,0,2023-09-06T00:00:00.000Z",
    "relearning, 10 min ago, hard":
        "!fsrs,2023-09-06T00:15:00.000Z,0,2.48779236,8.06007323,3,7,1,0,2023-09-06T00:00:00.000Z",
    "relearning, 10 min ago, good":
        "!fsrs,2023-09-09T00:00:00.000Z,3,3.34132417,7.08812837,2,7,1,0,2023-09-06T00:00:00.000Z",
    "relearning, 10 min ago, easy":
        "!fsrs,2023-09-11T00:00:00.000Z,5,5.21048604,6.11618351,2,7,1,0,2023-09-06T00:00:00.000Z",
    "review on time, 3 days, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.70909677,8.34176237,3,4,1,0,2023-09-06T00:00:00.000Z",
    "review on time, 3 days, hard":
        "!fsrs,2023-09-14T00:00:00.000Z,8,7.97526073,6.66599536,2,4,0,0,2023-09-06T00:00:00.000Z",
    "review on time, 3 days, good":
        "!fsrs,2023-09-17T00:00:00.000Z,11,11.20651934,4.99022837,2,4,0,0,2023-09-06T00:00:00.000Z",
    "review on time, 3 days, easy":
        "!fsrs,2023-09-24T00:00:00.000Z,18,18.28270008,3.31446137,2,4,0,0,2023-09-06T00:00:00.000Z",
    "review overdue, 25 days for 20, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,2.03368701,8.07880781,3,7,2,0,2023-09-06T00:00:00.000Z",
    "review overdue, 25 days for 20, hard":
        "!fsrs,2023-10-28T00:00:00.000Z,52,51.8656505,6.13491809,2,7,1,0,2023-09-06T00:00:00.000Z",
    "review overdue, 25 days for 20, good":
        "!fsrs,2023-11-18T00:00:00.000Z,73,72.65439059,4.19102837,2,7,1,0,2023-09-06T00:00:00.000Z",
    "review overdue, 25 days for 20, easy":
        "!fsrs,2024-01-02T00:00:00.000Z,118,118.17995814,2.24713864,2,7,1,0,2023-09-06T00:00:00.000Z",
    "review early, 10 days for 50, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,2.43576394,9.45931924,3,10,3,0,2023-09-06T00:00:00.000Z",
    "review early, 10 days for 50, hard":
        "!fsrs,2023-10-30T00:00:00.000Z,54,54.12104764,8.92307381,2,10,2,0,2023-09-06T00:00:00.000Z",
    "review early, 10 days for 50, good":
        "!fsrs,2023-11-03T00:00:00.000Z,58,57.97916135,8.38682837,2,10,2,0,2023-09-06T00:00:00.000Z",
    "review early, 10 days for 50, easy":
        "!fsrs,2023-11-11T00:00:00.000Z,66,66.42810129,7.85058293,2,10,2,0,2023-09-06T00:00:00.000Z",
    "review reviewed at 18:30, 4 days, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.88741364,8.67045557,3,5,1,0,2023-09-06T00:00:00.000Z",
    "review reviewed at 18:30, 4 days, hard":
        "!fsrs,2023-09-16T00:00:00.000Z,10,10.49359211,7.32984197,2,5,0,0,2023-09-06T00:00:00.000Z",
    "review reviewed at 18:30, 4 days, good":
        "!fsrs,2023-09-21T00:00:00.000Z,15,14.53234471,5.98922837,2,5,0,0,2023-09-06T00:00:00.000Z",
    "review reviewed at 18:30, 4 days, easy":
        "!fsrs,2023-09-29T00:00:00.000Z,23,23.37686841,4.64861476,2,5,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2, 4 days, ease 270, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,1.29634944,8.25958907,3,3,1,0,2023-09-06T00:00:00.000Z",
    "imported SM-2, 4 days, ease 270, hard":
        "!fsrs,2023-09-10T00:00:00.000Z,4,4,6.50003372,2,3,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2, 4 days, ease 270, good":
        "!fsrs,2023-09-11T00:00:00.000Z,5,4,4.74047837,2,3,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2, 4 days, ease 270, easy":
        "!fsrs,2023-09-13T00:00:00.000Z,7,6.59988479,2.98092302,2,3,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2 overdue, 30 days, ease 130, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,2.26766473,9.98522837,3,6,1,0,2023-09-06T00:00:00.000Z",
    "imported SM-2 overdue, 30 days, ease 130, hard":
        "!fsrs,2023-10-12T00:00:00.000Z,36,36.14584573,9.98522837,2,6,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2 overdue, 30 days, ease 130, good":
        "!fsrs,2023-10-16T00:00:00.000Z,40,40.21923135,9.98522837,2,6,0,0,2023-09-06T00:00:00.000Z",
    "imported SM-2 overdue, 30 days, ease 130, easy":
        "!fsrs,2023-10-25T00:00:00.000Z,49,49.13959839,9.98522837,2,6,0,0,2023-09-06T00:00:00.000Z",
    "retention 0.8 max 60, overdue review, again":
        "!fsrs,2023-09-06T00:10:00.000Z,0,2.03368701,8.07880781,3,7,2,0,2023-09-06T00:00:00.000Z",
    "retention 0.8 max 60, overdue review, hard":
        "!fsrs,2023-11-05T00:00:00.000Z,60,51.8656505,6.13491809,2,7,1,0,2023-09-06T00:00:00.000Z",
    "retention 0.8 max 60, overdue review, good":
        "!fsrs,2023-11-05T00:00:00.000Z,60,72.65439059,4.19102837,2,7,1,0,2023-09-06T00:00:00.000Z",
    "retention 0.8 max 60, overdue review, easy":
        "!fsrs,2023-11-05T00:00:00.000Z,60,118.17995814,2.24713864,2,7,1,0,2023-09-06T00:00:00.000Z",
};

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("FSRS-6 schedules match the results recorded with ts-fsrs 5.4.1", () => {
    const results = collectResults();
    if (process.env.PRINT_FSRS6_REFERENCE) {
        console.log(JSON.stringify(results, null, 4));
    }
    expect(results).toEqual(EXPECTED);
});
