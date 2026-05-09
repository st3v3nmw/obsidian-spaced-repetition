import {
    RepetitionItem,
    RepetitionItemType,
    RepetitionPhase,
} from "src/algorithms/base/repetition-item";
import { Question } from "src/data/data-structures/card/questions/question";
import { CardListType } from "src/data/data-structures/deck/deck";

export class Card extends RepetitionItem {
    question: Question;
    cardIdx: number;

    // visuals
    front: string;
    back: string;

    constructor(init?: Partial<Card>) {
        super(RepetitionItemType.Card, RepetitionPhase.New, null, null);
        Object.assign(this, init);
    }

    get cardListType(): CardListType {
        return this.isNew ? CardListType.NewCard : CardListType.DueCard;
    }

    formatSchedule(): string {
        return this.scheduleInfo !== null
            ? this.scheduleInfo.formatScheduleAsSRHtmlComment()
            : "New";
    }
}
