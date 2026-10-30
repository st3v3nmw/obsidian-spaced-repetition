import { Rating, State } from "ts-fsrs";
import { FSRS6_DEFAULT_WEIGHTS } from "ts-fsrs/models/fsrs-6";

import { DEFAULT_SETTINGS } from "src/data/settings";
import { fsrs6SchedulerDefinition } from "src/scheduling/algorithms/fsrs/fsrs-scheduler";

const scheduler = fsrs6SchedulerDefinition.create({
    config: {
        desiredRetention: DEFAULT_SETTINGS.fsrsDesiredRetention,
        maximumInterval: DEFAULT_SETTINGS.maximumInterval,
        weights: FSRS6_DEFAULT_WEIGHTS,
        fractionalDays: false,
        enableShortTerm: true,
        learningSteps: ["1m", "10m"],
        relearningSteps: ["10m"],
        numRelearningSteps: 1,
        clearStatsOnForget: false,
    },
});

test("keeps the FSRS-6 policy and reviews a new card with Good", () => {
    expect(scheduler.definition.model.name).toBe("fsrs-6");
    expect(scheduler.config).toMatchObject({
        desiredRetention: {
            [Rating.Again]: DEFAULT_SETTINGS.fsrsDesiredRetention,
            [Rating.Hard]: DEFAULT_SETTINGS.fsrsDesiredRetention,
            [Rating.Good]: DEFAULT_SETTINGS.fsrsDesiredRetention,
            [Rating.Easy]: DEFAULT_SETTINGS.fsrsDesiredRetention,
        },
        maximumInterval: DEFAULT_SETTINGS.maximumInterval,
        fractionalDays: false,
        learningSteps: ["1m", "10m"],
        relearningSteps: ["10m"],
        numRelearningSteps: 1,
        clearStatsOnForget: false,
    });
    const now = new Date("2023-09-06T00:00:00.000Z");
    const card = scheduler.newCard({ now });
    const result = scheduler.review({ card, now, grade: Rating.Good });
    expect(result.card).toMatchObject({
        dueAt: new Date("2023-09-06T00:10:00.000Z"),
        lastReviewAt: now,
        state: State.Learning,
        learningStep: 1,
        reps: 1,
        lapses: 0,
    });
    expect(scheduler.rollback({ card: result.card, revlog: result.revlog })).toEqual(card);
});

test.each([State.New, State.Learning, State.Review, State.Relearning])(
    "preview matches review and rollback preserves state %s",
    (state) => {
        const card = scheduler.newCard({
            now: new Date("2023-09-08T00:00:00Z"),
        });
        Object.assign(card, {
            state,
            scheduleStatus:
                state === State.New ? "new" : state === State.Review ? "review" : "learning",
            lastReviewAt: state === State.New ? null : new Date("2023-09-06T00:00:00Z"),
            stability: state === State.New ? 0 : 2,
            difficulty: state === State.New ? 0 : 5,
            reps: 3,
            lapses: 1,
            scheduledDays: 2,
        });
        const snapshot = JSON.stringify(card);
        const now = new Date("2023-09-09T00:00:00Z");
        const previews = Array.from(scheduler.preview({ card, now }));
        expect(previews.map(({ grade }) => grade)).toEqual([
            Rating.Again,
            Rating.Hard,
            Rating.Good,
            Rating.Easy,
        ]);
        for (const preview of previews) {
            const result = scheduler.review({ card, now, grade: preview.grade });
            expect(result.card).toEqual(preview.card);
            expect(scheduler.rollback({ card: result.card, revlog: result.revlog })).toEqual(card);
        }
        expect(JSON.stringify(card)).toEqual(snapshot);
        expect(scheduler.forget({ card, now })).toMatchObject({
            state: State.New,
            reps: 3,
            lapses: 1,
        });
    },
);

test.each(["2023-09-07T00:00:00Z", "2023-09-09T00:00:00Z"])(
    "keeps previous review, due date and actual review distinct at %s",
    (reviewTime) => {
        const card = scheduler.newCard({ now: new Date("2023-09-08T00:00:00Z") });
        Object.assign(card, {
            state: State.Review,
            scheduleStatus: "review",
            lastReviewAt: new Date("2023-09-06T00:00:00Z"),
            stability: 2,
            difficulty: 5,
            scheduledDays: 2,
        });
        const now = new Date(reviewTime);
        const result = scheduler.review({ card, now, grade: Rating.Good });
        expect(result.revlog).toMatchObject({
            lastReviewAt: card.lastReviewAt,
            dueAt: card.dueAt,
            reviewTime: now,
        });
        expect(scheduler.rollback({ card: result.card, revlog: result.revlog })).toEqual(card);
    },
);

test("preserves UTC calendar-day differences and same-day learning steps", () => {
    expect(
        scheduler.chrono.difference(
            new Date("2023-09-06T23:00:00Z"),
            new Date("2023-09-07T01:00:00Z"),
        ),
    ).toBe(1);
    const now = new Date("2023-09-06T00:00:00Z");
    const first = scheduler.review({ card: scheduler.newCard({ now }), now, grade: Rating.Good });
    const next = scheduler.review({ card: first.card, now: first.card.dueAt, grade: Rating.Good });
    expect(next.card.state).toBe(State.Review);
    expect(next.card.scheduledDays).toBeGreaterThanOrEqual(1);
});
