import moment from "moment";
import { State } from "ts-fsrs";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleFactory } from "src/scheduling/algorithms/base/rep-item-info-factory";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { CommentParser } from "src/utils/comment-parser";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

test("formats FSRS card schedule for markdown comments", () => {
    const schedule = new RepItemScheduleInfoFsrs(
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

    expect(schedule.formatScheduleAsSRHtmlComment()).toEqual(
        "!fsrs,2023-09-06T00:10:00.000Z,0,0.4,5.5,1,1,0,1,2023-09-06T00:00:00.000Z",
    );
    expect(schedule.isShortTerm()).toEqual(true);
    expect(schedule.isDue()).toEqual(false);
});

test("Serializes FSRS card schedule for JSON", () => {
    const schedule = new RepItemScheduleInfoFsrs(
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

    const serialized = schedule.serializeSchedule();

    expect(serialized).toMatchObject({
        algorithm: SRAlgorithmType.FSRS,
        scheduleData: {
            dueDate: "2023-09-06T00:10:00.000Z",
            interval: 0,
            stability: 0.4,
            difficulty: 5.5,
            state: State.Learning,
            reps: 1,
            lapses: 0,
            learningSteps: 1,
            lastReview: "2023-09-06T00:00:00.000Z",
        },
    });
});

test("converts to and from ts-fsrs card structures", () => {
    const schedule = RepItemScheduleInfoFsrs.fromFsrsCard({
        dueAt: new Date("2023-09-06T00:00:00.000Z"),
        scheduleStatus: "review",
        stability: 2.5,
        difficulty: 4.5,
        scheduledDays: 3,
        learningStep: 0,
        reps: 5,
        lapses: 1,
        state: State.Review,
        lastReviewAt: new Date("2023-09-03T00:00:00.000Z"),
    });

    expect(schedule).toMatchObject({
        interval: 3,
        stability: 2.5,
        difficulty: 4.5,
        reps: 5,
        lapses: 1,
        state: State.Review,
    });

    const roundTrip = schedule.toFsrsCard();
    expect(roundTrip.dueAt.toISOString()).toEqual("2023-09-06T00:00:00.000Z");
    expect(roundTrip.lastReviewAt?.toISOString()).toEqual("2023-09-03T00:00:00.000Z");
    expect(roundTrip.scheduledDays).toEqual(3);
});

test("handles missing due dates and review timestamps", () => {
    const noDueSchedule = new RepItemScheduleInfoFsrs(
        null,
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        null,
    );
    expect(noDueSchedule.delayedBeforeReviewTicks).toEqual(0);

    const roundTrip = new RepItemScheduleInfoFsrs(
        moment("2023-09-06T00:10:00.000Z"),
        0,
        5.5,
        0.4,
        State.Learning,
        1,
        0,
        1,
        null,
    ).toFsrsCard();
    expect(roundTrip.lastReviewAt).toBeNull();

    const parsed = RepItemScheduleInfoFsrs.fromFsrsCard({
        dueAt: new Date("2023-09-06T00:10:00.000Z"),
        scheduleStatus: "learning",
        stability: 0.4,
        difficulty: 5.5,
        scheduledDays: 0,
        learningStep: 1,
        reps: 1,
        lapses: 0,
        state: State.Learning,
        lastReviewAt: null,
    });
    expect(parsed.lastReview).toBeNull();
});

test.each([State.New, State.Learning, State.Review, State.Relearning])(
    "loads v5-era JSON and Markdown for state %s without a storage migration",
    (state) => {
        // Use the stored v5-era format directly, independently of the current serializer.
        const serialized: ISerializedScheduleEntry = {
            algorithm: SRAlgorithmType.FSRS,
            scheduleData: {
                dueDate: "2023-09-08T00:10:00.000Z",
                interval: 2,
                difficulty: state === State.New ? 0 : 5.5,
                stability: state === State.New ? 0 : 2.5,
                state,
                reps: 5,
                lapses: 1,
                learningSteps: state === State.Learning ? 1 : 0,
                lastReview: state === State.New ? "-" : "2023-09-06T00:00:00.000Z",
            },
        };
        const comment = `!fsrs,2023-09-08T00:10:00.000Z,2,${state === State.New ? 0 : 2.5},${state === State.New ? 0 : 5.5},${state},5,1,${state === State.Learning ? 1 : 0},${state === State.New ? "-" : "2023-09-06T00:00:00.000Z"}`;
        const fromJson = RepItemScheduleFactory.createFSRSRepItemSchedule(serialized);
        const fromComment = CommentParser.parseScheduleSegment(
            comment.slice(1),
        ) as RepItemScheduleInfoFsrs;
        for (const restored of [fromJson, fromComment]) {
            const roundTrip = RepItemScheduleInfoFsrs.fromFsrsCard(restored.toFsrsCard());
            expect(roundTrip.serializeSchedule()).toEqual(serialized);
            expect(roundTrip.formatScheduleAsSRHtmlComment()).toBe(comment);
        }
    },
);

test("normalizes a reset New card's stale last review without mutating its stored schedule", () => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-08"),
        0,
        0,
        0,
        State.New,
        5,
        1,
        0,
        moment("2023-09-06"),
    );
    const serialized = schedule.serializeSchedule();
    expect(schedule.toFsrsCard().lastReviewAt).toBeNull();
    expect(schedule.serializeSchedule()).toEqual(serialized);
});

test.each(["dueDate", "lastReview"])("rejects an invalid stored %s before scheduling", (field) => {
    const schedule = new RepItemScheduleInfoFsrs(
        moment("2023-09-08"),
        2,
        5,
        2,
        State.Review,
        3,
        0,
        0,
        moment("2023-09-06"),
    );
    Object.assign(schedule, { [field]: moment.invalid() });
    expect(() => schedule.toFsrsCard()).toThrow();
});

test("rejects an unknown FSRS state in a stored Markdown schedule", () => {
    expect(() =>
        CommentParser.parseScheduleSegment(
            "fsrs,2023-09-08T00:00:00.000Z,2,2.5,5.5,99,5,1,0,2023-09-06T00:00:00.000Z",
        ),
    ).toThrow();
});
