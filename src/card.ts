import { Question } from "./Question";
import { CardScheduleInfo } from "./CardSchedule";
import { CardListType } from "./Deck";
import { SRSettings } from "./settings";

export class Card {
    question: Question;
    cardIdx: number;

    // scheduling
    isDue: boolean;
    scheduleInfo?: CardScheduleInfo;
    
    // visuals
    front: string;
    back: string;

    constructor(init?: Partial<Card>) {
        Object.assign(this, init);
    }

    get cardListType(): CardListType {
        return this.isDue ? CardListType.DueCard : CardListType.NewCard;
    }

    get isNew(): boolean {
        return !this.isDue;
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
