import { TFile } from "obsidian";
import { Question } from "./question";
import { CardScheduleInfo } from "./card-schedule";
import { CardListType } from "./deck";

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
}
