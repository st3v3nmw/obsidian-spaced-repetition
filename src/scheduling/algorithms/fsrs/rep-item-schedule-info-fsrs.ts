import moment, { Moment } from "moment";
import { Card, CardInput, State } from "ts-fsrs";

import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    difficultyToEase,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents scheduling information for a repetition item using the FSRS algorithm.
 *
 * @class RepItemScheduleInfoFsrs
 * @extends {RepItemScheduleInfo}
 * @property {number} difficulty - The difficulty for the repetition item.
 * @property {number} stability - The stability for the repetition item.
 * @property {State} state - The state for the repetition item.
 * @property {number} reps - The number of repetitions for the repetition item.
 * @property {number} lapses - The number of lapses for the repetition item.
 * @property {number} learningSteps - The number of learning steps for the repetition item.
 * @property {Moment | null} lastReview - The last review date for the repetition item.
 */
export class RepItemScheduleInfoFsrs extends RepItemScheduleInfo {
    public difficulty: number;
    public stability: number;
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
        state: State,
        reps: number,
        lapses: number,
        learningSteps: number,
        lastReview: Moment | null,
    ) {
        super(
            SRAlgorithmType.FSRS,
            dueDate,
            interval,
            difficultyToEase(difficulty),
            dueDate && globalDateProvider.now
                ? globalDateProvider.now.valueOf() - dueDate.valueOf()
                : 0,
        );
        this.difficulty = difficulty;
        this.stability = stability;
        this.state = state;
        this.reps = reps;
        this.lapses = lapses;
        this.learningSteps = learningSteps;
        this.lastReview = lastReview;
    }

    /**
     * Creates a RepItemScheduleInfoFsrs object from a Card or CardInput object.
     *
     *  NOTE: The fsrs library uses cards as the basic unit of scheduling, so we need to convert the Card or CardInput object to a RepItemScheduleInfoFsrs object.
     *
     * @param {Card | CardInput} card - The Card or CardInput object.
     * @returns {RepItemScheduleInfoFsrs} - The RepItemScheduleInfoFsrs object.
     */
    static fromFsrsCard(card: Card | CardInput): RepItemScheduleInfoFsrs {
        return new RepItemScheduleInfoFsrs(
            moment(card.due),
            card.scheduled_days,
            card.difficulty,
            card.stability,
            card.state as State,
            card.reps,
            card.lapses,
            card.learning_steps,
            card.last_review ? moment(card.last_review) : null,
        );
    }

    /**
     * Converts the RepItemScheduleInfoFsrs object to a CardInput object for use with the fsrs library.
     *
     * @param {Moment} [now] - The current date and time. Defaults to the current date and time.
     * @returns {CardInput} - The CardInput object.
     */
    toFsrsCardInput(now: Moment = globalDateProvider.now): CardInput {
        const lastReview = this.lastReview ? this.lastReview.clone() : now.clone();
        return {
            due: this.dueDate.toDate(),
            stability: this.stability,
            difficulty: this.difficulty,
            ["elapsed_days"]: Math.max(0, now.diff(lastReview, "days")),
            ["scheduled_days"]: this.interval,
            ["learning_steps"]: this.learningSteps,
            reps: this.reps,
            lapses: this.lapses,
            state: this.state,
            ["last_review"]: this.lastReview ? this.lastReview.toDate() : null,
        };
    }

    /**
     * Checks if the repetition item is short term.
     *
     * @returns {boolean} - True if the repetition item is short term, false otherwise.
     */
    isShortTerm(): boolean {
        return this.interval < 1;
    }

    /**
     * Formats the scheduling information for the repetition item as a string for HTML comments.
     *
     * @returns {string} - The formatted scheduling information.
     */
    formatScheduleAsSRHtmlComment(): string {
        return `!${FSRS_COMMENT_PREFIX},${formatFsrsTimestamp(this.dueDate)},${this.interval},${this.stability},${this.difficulty},${this.state},${this.reps},${this.lapses},${this.learningSteps},${formatFsrsTimestamp(this.lastReview)}`;
    }

    /**
     * Formats the scheduling information for the repetition item as a JSON string.
     *
     * @returns {string} - The formatted scheduling information.
     */
    formatScheduleAsJsonString(): string {
        return JSON.stringify({
            dueDate: formatFsrsTimestamp(this.dueDate),
            interval: this.interval,
            stability: this.stability,
            difficulty: this.difficulty,
            state: this.state,
            reps: this.reps,
            lapses: this.lapses,
            learningSteps: this.learningSteps,
            lastReview: formatFsrsTimestamp(this.lastReview),
        });
    }
}
