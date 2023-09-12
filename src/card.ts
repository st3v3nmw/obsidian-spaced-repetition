import { Question } from "./Question";
import { CardScheduleInfo } from "./CardSchedule";
import { CardListType } from "./Deck";
import { SRSettings } from "./settings";

export class Card {
    question: Question;
    cardIdx: number;

    // scheduling
    get hasSchedule(): boolean {
        return (this.scheduleInfo != null);
    }
    scheduleInfo?: CardScheduleInfo;
    
    // visuals
    front: string;
    back: string;

    constructor(init?: Partial<Card>) {
        Object.assign(this, init);
    }

    get cardListType(): CardListType {
        return this.hasSchedule ? CardListType.DueCard : CardListType.NewCard;
    }

    get isNew(): boolean {
        return !this.hasSchedule;
    }

    get isDue(): boolean {
        return this.hasSchedule && this.scheduleInfo.isDue();
    }

    formatSchedule(settings: SRSettings): string {
        let temp: CardScheduleInfo = this.scheduleInfo;
        if (temp == null) {
            temp =  CardScheduleInfo.fromDueDateStr("2000-01-01", 
                CardScheduleInfo.initialInterval, 
                settings.baseEase, 0);
        }
        return temp.formatSchedule();
    }
}
