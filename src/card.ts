import { TFile } from "obsidian";
import { Question } from "./question";
import { CardScheduleInfo } from "./card-schedule";

export interface Card {
    question: Question;
    cardIdx: number;

    // scheduling
    isDue: boolean;
    scheduleInfo?: CardScheduleInfo;
    
    // visuals
    front: string;
    back: string;
}
