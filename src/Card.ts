import { Question } from "./Question";
import { CardListType } from "./Deck";
import { RepetitionItem } from "./algorithms/base/RepetitionItem";

export class Card extends RepetitionItem {
    question: Question;
    cardIdx: number;

    // scheduleInfo?: CardScheduleInfo;

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
