import moment, { Moment } from "moment";
import { State } from "ts-fsrs";
import { curve, FSRS7_MODEL_BOUNDS } from "ts-fsrs/models/fsrs-7";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    clamp,
    difficultyToEase,
    easeToDifficulty,
    formatFsrsTimestamp,
    FSRS7_COMMENT_PREFIX,
    fsrsScheduleStatus,
    roundFsrsNumber,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import {
    FSRS_SCHEDULER_CARD_ID,
    FSRS7_WEIGHTS,
    Fsrs7Card,
    parseFsrs7Card,
} from "src/scheduling/algorithms/fsrs/fsrs-schedulers";
import { ISerializedFSRS7ScheduleData } from "src/scheduling/algorithms/fsrs/serialized-schedule-data";
import { globalDateProvider } from "src/utils/dates";

// The recall probability at the due date of an SM-2 card, see RepItemScheduleInfoFsrs7.fromSm2Schedule()
const SM2_RECALL_AT_DUE_DATE = 0.9;
// The ratio between the fast and the slow stability that FSRS-7 uses for new cards
const SM2_FAST_STABILITY_RATIO = 0.8;
const SM2_SOLVER_ITERATIONS = 100;
const SM2_SOLVER_TOLERANCE = 1e-6;

function sm2FastStability(stability: number): number {
    return roundFsrsNumber(
        clamp(
            SM2_FAST_STABILITY_RATIO * stability,
            FSRS7_MODEL_BOUNDS.stabilityFastMin,
            FSRS7_MODEL_BOUNDS.stabilityFastMax,
        ),
    );
}

function fsrs7Recall(elapsedDays: number, stability: number, difficulty: number): number {
    return curve(FSRS7_WEIGHTS, elapsedDays, {
        stability,
        stabilityFast: sm2FastStability(stability),
        difficulty,
    }).retrievability;
}

/**
 * Finds the slow stability for which FSRS-7 predicts 90% recall after the SM-2 interval, by bisection.
 * The recall at a given time increases with the stability.
 */
function solveSm2SlowStability(interval: number, difficulty: number): number {
    let low = Math.log(FSRS7_MODEL_BOUNDS.sMin);
    let high = Math.log(FSRS7_MODEL_BOUNDS.sMax);
    if (
        fsrs7Recall(interval, Math.exp(low), difficulty) > SM2_RECALL_AT_DUE_DATE ||
        fsrs7Recall(interval, Math.exp(high), difficulty) < SM2_RECALL_AT_DUE_DATE
    ) {
        throw new Error(`No FSRS-7 stability fits the SM-2 interval of ${interval} days`);
    }

    for (let i = 0; i < SM2_SOLVER_ITERATIONS; i++) {
        const middle = (low + high) / 2;
        if (fsrs7Recall(interval, Math.exp(middle), difficulty) < SM2_RECALL_AT_DUE_DATE) {
            low = middle;
        } else {
            high = middle;
        }
    }

    const stability = roundFsrsNumber(Math.exp((low + high) / 2));
    const recall = fsrs7Recall(interval, stability, difficulty);
    if (Math.abs(recall - SM2_RECALL_AT_DUE_DATE) > SM2_SOLVER_TOLERANCE) {
        throw new Error(
            `FSRS-7 stability ${stability} for the SM-2 interval of ${interval} days predicts a recall of ${recall}`,
        );
    }
    return stability;
}

/**
 * Represents scheduling information for a repetition item using the FSRS-7 algorithm.
 *
 * Compared to FSRS-6, FSRS-7 keeps two stabilities (a slow and a fast memory trace), and its intervals are fractional
 * days instead of whole days.
 *
 * @class RepItemScheduleInfoFsrs7
 * @extends {RepItemScheduleInfo}
 * @property {number} difficulty - The difficulty for the repetition item.
 * @property {number} stability - The stability of the slow memory trace.
 * @property {number} stabilityFast - The stability of the fast memory trace.
 * @property {State} state - The state for the repetition item.
 * @property {number} reps - The number of repetitions for the repetition item.
 * @property {number} lapses - The number of lapses for the repetition item.
 * @property {number} learningSteps - The number of learning steps for the repetition item.
 * @property {Moment | null} lastReview - The last review date for the repetition item.
 */
export class RepItemScheduleInfoFsrs7 extends RepItemScheduleInfo {
    public difficulty: number;
    public stability: number;
    public stabilityFast: number;
    public state: State;
    public reps: number;
    public lapses: number;
    public learningSteps: number;
    public lastReview: Moment | null;

    constructor(
        dueDate: Moment,
        interval: number,
        difficulty: number,
        stability: number,
        stabilityFast: number,
        state: State,
        reps: number,
        lapses: number,
        learningSteps: number,
        lastReview: Moment | null,
    ) {
        super(
            SRAlgorithmType.FSRS7,
            dueDate,
            interval,
            difficultyToEase(difficulty),
            globalDateProvider.now.valueOf() - dueDate.valueOf(),
        );
        this.difficulty = difficulty;
        this.stability = stability;
        this.stabilityFast = stabilityFast;
        this.state = state;
        this.reps = reps;
        this.lapses = lapses;
        this.learningSteps = learningSteps;
        this.lastReview = lastReview;
    }

    /**
     * Creates a RepItemScheduleInfoFsrs7 object from a ts-fsrs FSRS-7 card.
     *
     * @param {Fsrs7Card} card - The ts-fsrs card.
     * @returns {RepItemScheduleInfoFsrs7} - The RepItemScheduleInfoFsrs7 object.
     */
    static fromFsrs7Card(card: Fsrs7Card): RepItemScheduleInfoFsrs7 {
        return new RepItemScheduleInfoFsrs7(
            moment(card.dueAt),
            roundFsrsNumber(card.scheduledDays),
            card.difficulty,
            card.stability,
            card.stabilityFast,
            card.state,
            card.reps,
            card.lapses,
            card.learningStep,
            card.lastReviewAt === null ? null : moment(card.lastReviewAt),
        );
    }

    /**
     * Converts an SM-2 schedule into an FSRS-7 schedule in the review state, keeping its due date.
     *
     * An SM-2 card has no FSRS memory state, so it is estimated: the SM-2 due date is taken as the moment the
     * recall probability drops to 90%, the same assumption as for FSRS-6 (where the stability is the number of days
     * until recall drops to 90%, so it becomes the SM-2 interval). The fast stability can't be known, it is set to
     * 80% of the slow stability, the ratio FSRS-7 uses for new cards. The slow stability is then chosen so that the
     * FSRS-7 forgetting curve predicts 90% recall at the due date. The difficulty is derived from the SM-2 ease.
     *
     * @param {RepItemScheduleInfo} schedule - The SM-2 schedule.
     * @returns {RepItemScheduleInfoFsrs7} - The FSRS-7 schedule.
     */
    static fromSm2Schedule(schedule: RepItemScheduleInfo): RepItemScheduleInfoFsrs7 {
        const interval = Math.max(1, Math.round(schedule.interval));
        const dueDate = schedule.dueDate.clone();
        const lastReview = dueDate.clone().subtract(interval, "d");
        const difficulty = easeToDifficulty(schedule.latestEase);
        const stability = solveSm2SlowStability(interval, difficulty);

        return new RepItemScheduleInfoFsrs7(
            dueDate,
            interval,
            difficulty,
            stability,
            sm2FastStability(stability),
            State.Review,
            Math.max(1, Math.round(Math.log2(interval + 1))),
            0,
            0,
            lastReview,
        );
    }

    /**
     * Converts the schedule to a ts-fsrs FSRS-7 card, throwing if it isn't a valid FSRS-7 card.
     *
     * @returns {Fsrs7Card} - The ts-fsrs card.
     */
    toFsrs7Card(): Fsrs7Card {
        return parseFsrs7Card({
            cardId: FSRS_SCHEDULER_CARD_ID,
            dueAt: this.dueDate.toDate(),
            lastReviewAt: this.lastReview === null ? null : this.lastReview.toDate(),
            stability: this.stability,
            stabilityFast: this.stabilityFast,
            difficulty: this.difficulty,
            state: this.state,
            scheduleStatus: fsrsScheduleStatus(this.state),
            scheduledDays: this.interval,
            learningStep: this.learningSteps,
            reps: this.reps,
            lapses: this.lapses,
        });
    }

    /**
     * Formats the scheduling information for the repetition item as a string for HTML comments.
     *
     * @returns {string} - The formatted scheduling information.
     */
    formatScheduleAsSRHtmlComment(): string {
        return `!${FSRS7_COMMENT_PREFIX},${formatFsrsTimestamp(this.dueDate)},${this.interval},${this.stability},${this.stabilityFast},${this.difficulty},${this.state},${this.reps},${this.lapses},${this.learningSteps},${formatFsrsTimestamp(this.lastReview)}`;
    }

    /**
     * Formats the scheduling information for the repetition item as a JSON string.
     *
     * @returns {string} - The formatted scheduling information.
     */
    serializeSchedule(): ISerializedScheduleEntry {
        const serializedData: ISerializedFSRS7ScheduleData = {
            dueDate: formatFsrsTimestamp(this.dueDate),
            interval: this.interval,
            stability: this.stability,
            stabilityFast: this.stabilityFast,
            difficulty: this.difficulty,
            state: this.state,
            reps: this.reps,
            lapses: this.lapses,
            learningSteps: this.learningSteps,
            lastReview: formatFsrsTimestamp(this.lastReview),
        };

        return {
            algorithm: SRAlgorithmType.FSRS7,
            scheduleData: serializedData,
        };
    }
}
