import moment, { Moment } from "moment";
import { State } from "ts-fsrs";

import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    difficultyToEase,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import {
    Fsrs6Card,
    fsrs6Schema,
    scheduleStatus,
} from "src/scheduling/algorithms/fsrs/fsrs-scheduler";
import { ISerializedFSRSScheduleData } from "src/scheduling/algorithms/fsrs/serialized-schedule-data";
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

    static fromFsrsCard(card: Fsrs6Card): RepItemScheduleInfoFsrs {
        return new RepItemScheduleInfoFsrs(
            moment(card.dueAt),
            card.scheduledDays,
            card.difficulty,
            card.stability,
            card.state,
            card.reps,
            card.lapses,
            card.learningStep,
            card.lastReviewAt ? moment(card.lastReviewAt) : null,
        );
    }

    toFsrsCard(): Fsrs6Card {
        return fsrs6Schema.card.parse({
            dueAt: this.dueDate.toDate(),
            stability: this.stability,
            difficulty: this.difficulty,
            scheduledDays: this.interval,
            learningStep: this.learningSteps,
            reps: this.reps,
            lapses: this.lapses,
            state: this.state,
            scheduleStatus: scheduleStatus[this.state],
            lastReviewAt: this.state === State.New ? null : (this.lastReview?.toDate() ?? null),
        });
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
    serializeSchedule(): ISerializedScheduleEntry {
        const serializedData: ISerializedFSRSScheduleData = {
            dueDate: formatFsrsTimestamp(this.dueDate),
            interval: this.interval,
            stability: this.stability,
            difficulty: this.difficulty,
            state: this.state,
            reps: this.reps,
            lapses: this.lapses,
            learningSteps: this.learningSteps,
            lastReview: formatFsrsTimestamp(this.lastReview),
        };

        return {
            algorithm: SRAlgorithmType.FSRS,
            scheduleData: serializedData,
        };
    }
}
