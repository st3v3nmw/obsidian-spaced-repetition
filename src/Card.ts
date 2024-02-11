import { Question } from "./Question";
import { CardScheduleInfo } from "./CardSchedule";
import { CardListType } from "./Deck";

export class Card {
    question: Question;
    cardIdx: number;

    // scheduling
    get hasSchedule(): boolean {
        return this.scheduleInfo != null;
    }
    scheduleInfo?: CardScheduleInfo;

    // visuals
    front: string;
    back: string;

    constructor(init?: Partial<Card>) {
        Object.assign(this, init);
    }

    get cardListType(): CardListType {
        return this.isNew ? CardListType.NewCard : CardListType.DueCard;
    }

    get isNew(): boolean {
        return !this.hasSchedule || this.scheduleInfo.isDummyScheduleForNewCard();
    }

    get isDue(): boolean {
        return this.hasSchedule && this.scheduleInfo.isDue();
    }

    formatSchedule(): string {
        let result: string = "";
        if (this.hasSchedule) result = this.scheduleInfo.formatSchedule();
        else result = "New";
        return result;
    }
}
