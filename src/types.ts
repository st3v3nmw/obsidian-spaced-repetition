import { TFile } from "obsidian";

export interface SRSettings {
    // flashcards
    flashcardTags: string[];
    cardCommentOnSameLine: boolean;
    buryRelatedCards: boolean;
    showContextInCards: boolean;
    singlelineCardSeparator: string;
    singlelineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    // notes
    tagsToReview: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    disableFileMenuReviewOptions: boolean;
    maxNDaysNotesReviewQueue: number;
    // algorithm
    baseEase: number;
    lapsesIntervalChange: number;
    easyBonus: number;
    maximumInterval: number;
    maxLinkFactor: number;
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
    originalFrontText: string;
    originalBackText: string;
    // types
    cardType: CardType;
    // stuff for cards with sub-cards
    subCardIdx?: number;
    relatedCards?: Card[];
}

export enum CardType {
    SingleLineBasic,
    MultiLineBasic,
    Cloze,
}

export enum FlashcardModalMode {
    DecksList,
    Front,
    Back,
    Closed,
}
