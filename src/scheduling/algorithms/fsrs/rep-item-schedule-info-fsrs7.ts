import moment, { Moment } from "moment";
import { State } from "ts-fsrs";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    difficultyToEase,
    formatFsrsTimestamp,
    FSRS7_COMMENT_PREFIX,
    fsrsScheduleStatus,
    roundFsrsNumber,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import {
    FSRS_SCHEDULER_CARD_ID,
    Fsrs7Card,
    parseFsrs7Card,
} from "src/scheduling/algorithms/fsrs/fsrs-schedulers";
import { ISerializedFSRS7ScheduleData } from "src/scheduling/algorithms/fsrs/serialized-schedule-data";
import { globalDateProvider } from "src/utils/dates";

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
