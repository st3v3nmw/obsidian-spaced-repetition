import { RepetitionItem } from "src/algorithms/base/repetition-item";
import { CardListType } from "src/deck";
import { Question } from "src/question";

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
        let result: string = "";
        if (this.hasSchedule) result = this.scheduleInfo.formatCardScheduleForHtmlComment();
        else result = "New";
        return result;
    }
}
