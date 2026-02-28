import { RepetitionItem } from "src/algorithms/base/repetition-item";
import { Question } from "src/card/questions/question";
import { CardListType } from "src/deck/deck";

export class Card extends RepetitionItem {
    question: Question;
    cardIdx: number;

    // visuals
    front: string;
    back: string;

    constructor(init?: Partial<Card>) {
        super();
        Object.assign(this, init);
    }

    get cardListType(): CardListType {
        return this.isNew ? CardListType.NewCard : CardListType.DueCard;
    }

    formatSchedule(): string {
        return this.hasSchedule ? this.scheduleInfo.formatCardScheduleForHtmlComment() : "New";
    }
}
