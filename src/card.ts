import { TFile } from "obsidian";
import { Question } from "./question";

export interface Card {
    question: Question;
    cardIdx: number;

    // scheduling
    isDue: boolean;
    interval?: number;
    ease?: number;
    delayBeforeReview?: number;
    
    // visuals
    front: string;
    back: string;
}
