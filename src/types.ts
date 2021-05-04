import { TFile } from "obsidian";

/*
    Card Object
    There's too much in here,
    but never tell the user about this abomination! xD
*/
export interface Card {
    // scheduling
    isDue: boolean;
    interval?: number;
    ease?: number;
    // note
    note: TFile;
    // visuals
    front: string;
    back: string;
    cardText: string;
    context: string;
    // deck
    deck: string;
    // types
    cardType: CardType;
    // cloze stuff
    clozeDeletionIdx?: number;
    relatedCards?: Card[];
}

export enum CardType {
    SingleLineBasic,
    MultiLineBasic,
    Cloze,
}
