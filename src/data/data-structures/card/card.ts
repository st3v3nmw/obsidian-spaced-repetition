import { Question } from "src/data/data-structures/card/questions/question";
import {
    RepetitionItem,
    RepetitionItemType,
    RepetitionPhase,
} from "src/scheduling/algorithms/base/repetition-item";

export class Card extends RepetitionItem {
    question: Question;
    cardIdx: number;

    // visuals
    front: string = "";
    back: string = "";

    constructor(init?: Partial<Card>) {
        super(RepetitionItemType.Card, RepetitionPhase.New, null, null);
        Object.assign(this, init);
    }

    formatSchedule(): string {
        return this.scheduleInfo !== null
            ? this.scheduleInfo.formatScheduleAsSRHtmlComment()
            : "New";
    }

    toString(): string {
        return `${this.front}::${this.back}`;
    }
}
