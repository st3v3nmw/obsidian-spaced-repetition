import { dateChrono, defineScheduler } from "ts-fsrs";
import {
    schedulerDesiredRetentionMiddleware,
    schedulerFuzzingMiddleware,
    schedulerLearningStepsMiddleware,
    schedulerMaximumIntervalMiddleware,
    schedulerMonotonicIntervalMiddleware,
    schedulerScheduledDaysMiddleware,
    schedulerStatsMiddleware,
} from "ts-fsrs/middlewares";
import { FSRS6Model, migrateFSRS6Parameters } from "ts-fsrs/models/fsrs-6";
import { FSRS7_DEFAULT_WEIGHTS, FSRS7Model } from "ts-fsrs/models/fsrs-7";

import { SRSettings } from "src/data/settings";

/*
 * Two FSRS models are in use side by side:
 *  - FSRS-7 for new cards, reset cards, and SM-2 cards that move to FSRS.
 *  - FSRS-6 for cards that were already scheduled with FSRS-6.
 *
 * A card doesn't move from FSRS-6 to FSRS-7: that would replace the FSRS memory state the card built up from its
 * reviews with a guess, because the second memory value of FSRS-7 (the fast stability) can only be rebuilt from the
 * card's complete review history, which the plugin doesn't have for older cards.
 * SM-2 cards have no FSRS memory state to lose, any FSRS state for them is a guess (see
 * RepItemScheduleInfoFsrs7.fromSm2Schedule()).
 *
 * Both schedulers use the same scheduling policies, in the order of the ts-fsrs standard preset.
 */
const fsrs6Definition = defineScheduler({ model: FSRS6Model, chrono: dateChrono }).use(
    schedulerDesiredRetentionMiddleware,
    schedulerFuzzingMiddleware,
    schedulerStatsMiddleware,
    schedulerScheduledDaysMiddleware,
    schedulerLearningStepsMiddleware,
    schedulerMaximumIntervalMiddleware,
    schedulerMonotonicIntervalMiddleware,
);

const fsrs7Definition = defineScheduler({ model: FSRS7Model, chrono: dateChrono }).use(
    schedulerDesiredRetentionMiddleware,
    schedulerFuzzingMiddleware,
    schedulerStatsMiddleware,
    schedulerScheduledDaysMiddleware,
    schedulerLearningStepsMiddleware,
    schedulerMaximumIntervalMiddleware,
    schedulerMonotonicIntervalMiddleware,
);

// The ts-fsrs defaults, which the plugin has always used
const LEARNING_STEPS = ["1m", "10m"] as const;
const RELEARNING_STEPS = ["10m"] as const;

// The 34 FSRS-7 weights, the same for all cards
export const FSRS7_WEIGHTS: readonly number[] = FSRS7_DEFAULT_WEIGHTS;

// ts-fsrs uses the card id only to seed the fuzzing of intervals, which is disabled.
// The schedule of a card doesn't know the card's id, so all cards share this one.
export const FSRS_SCHEDULER_CARD_ID = "osr-card";

export function createFsrs6Scheduler(settings: SRSettings) {
    return fsrs6Definition.create({
        config: {
            weights: migrateFSRS6Parameters(),
            fractionalDays: false,
            enableShortTerm: true,
            numRelearningSteps: RELEARNING_STEPS.length,
            desiredRetention: settings.fsrsDesiredRetention,
            learningSteps: [...LEARNING_STEPS],
            relearningSteps: [...RELEARNING_STEPS],
            enableFuzz: false,
            maximumInterval: settings.maximumInterval,
            clearStatsOnForget: false,
        },
    });
}

export function createFsrs7Scheduler(settings: SRSettings) {
    return fsrs7Definition.create({
        config: {
            weights: FSRS7_WEIGHTS,
            fractionalDays: true,
            enableShortTerm: true,
            desiredRetention: settings.fsrsDesiredRetention,
            learningSteps: [...LEARNING_STEPS],
            relearningSteps: [...RELEARNING_STEPS],
            enableFuzz: false,
            maximumInterval: settings.maximumInterval,
            clearStatsOnForget: false,
        },
    });
}

export type Fsrs6Scheduler = ReturnType<typeof createFsrs6Scheduler>;
export type Fsrs7Scheduler = ReturnType<typeof createFsrs7Scheduler>;
export type Fsrs6Card = ReturnType<Fsrs6Scheduler["newCard"]>;
export type Fsrs7Card = ReturnType<Fsrs7Scheduler["newCard"]>;

/**
 * Validates a card read from the plugin's storage, throwing if it isn't a valid FSRS-6 card.
 */
export function parseFsrs6Card(card: unknown): Fsrs6Card {
    return fsrs6Definition.schema.card.parse(card);
}

/**
 * Validates a card read from the plugin's storage, throwing if it isn't a valid FSRS-7 card.
 */
export function parseFsrs7Card(card: unknown): Fsrs7Card {
    return fsrs7Definition.schema.card.parse(card);
}
