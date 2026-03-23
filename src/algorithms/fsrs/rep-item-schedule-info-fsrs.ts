import moment, { Moment } from "moment";
import { Card, CardInput, State } from "ts-fsrs";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import {
    difficultyToEase,
    formatFsrsTimestamp,
    FSRS_COMMENT_PREFIX,
} from "src/algorithms/fsrs/fsrs-helpers";
import { globalDateProvider } from "src/utils/dates";

export class RepItemScheduleInfoFsrs extends RepItemScheduleInfo {
    difficulty: number;
    stability: number;
    state: State;
    reps: number;
    lapses: number;
    learningSteps: number;
    lastReview: Moment | null;

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
        super();
        this.dueDate = dueDate;
        this.interval = interval;
        this.difficulty = difficulty;
        this.stability = stability;
        this.state = state;
        this.reps = reps;
        this.lapses = lapses;
        this.learningSteps = learningSteps;
        this.lastReview = lastReview;
        this.latestEase = difficultyToEase(difficulty);
        this.delayedBeforeReviewTicks =
            dueDate && globalDateProvider.now ? globalDateProvider.now.valueOf() - dueDate.valueOf() : 0;
    }

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

    isDue(): boolean {
        return this.dueDate && this.dueDate.isSameOrBefore(globalDateProvider.now);
    }

    isShortTerm(): boolean {
        return this.interval < 1;
    }

    formatCardScheduleForHtmlComment(): string {
        return `!${FSRS_COMMENT_PREFIX},${formatFsrsTimestamp(this.dueDate)},${this.interval},${this.stability},${this.difficulty},${this.state},${this.reps},${this.lapses},${this.learningSteps},${formatFsrsTimestamp(this.lastReview)}`;
    }
}
