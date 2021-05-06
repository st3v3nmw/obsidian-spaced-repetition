import { TFile } from "obsidian";

export interface SRSettings {
    // flashcards
    flashcardsTag: string;
    singleLineCommentOnSameLine: boolean;
    buryRelatedCards: boolean;
    // notes
    tagsToReview: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    disableFileMenuReviewOptions: boolean;
    // algorithm
    baseEase: number;
    maxLinkFactor: number;
    lapsesIntervalChange: number;
    easyBonus: number;
}

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Reset,
}

// Notes

export interface SchedNote {
    note: TFile;
    dueUnix: number;
}

export interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

// Flashcards

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

export enum FlashcardModalMode {
    Front,
    Back,
    Closed,
}
