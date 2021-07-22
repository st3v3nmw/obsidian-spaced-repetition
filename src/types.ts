import { App, FuzzySuggestModal, TFile } from "obsidian";
import { FlashcardModal } from "./flashcard-modal";

export interface SRSettings {
    // flashcards
    flashcardTags: string[];
    convertFoldersToDecks: boolean;
    cardCommentOnSameLine: boolean;
    buryRelatedCards: boolean;
    showContextInCards: boolean;
    largeScreenMode: boolean;
    showFileNameInFileLink: boolean;
    randomizeCardOrder: boolean;
    disableClozeCards: boolean;
    disableSinglelineCards: boolean;
    singlelineCardSeparator: string;
    disableSinglelineReversedCards: boolean;
    singlelineReversedCardSeparator: string;
    disableMultilineCards: boolean;
    multilineCardSeparator: string;
    disableMultilineReversedCards: boolean;
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

export class ReviewDeck {
    public deckName: string;
    public newNotes: TFile[] = [];
    public scheduledNotes: SchedNote[] = [];
    public dueNotesCount: number;
    public dueDatesNotes: Record<number, number> = {}; // Record<# of days in future, due count>

    constructor(name: string) {
        this.deckName = name;
    }

    public sortNotes(pageranks: Record<string, number>) {
        this.newNotes = this.newNotes.sort(
            (a: TFile, b: TFile) =>
                (pageranks[b.path] || 0) - (pageranks[a.path] || 0)
        );

        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort(
            (a: SchedNote, b: SchedNote) => {
                let result = a.dueUnix - b.dueUnix;
                if (result != 0) return result;
                return (
                    (pageranks[b.note.path] || 0) -
                    (pageranks[a.note.path] || 0)
                );
            }
        );
    }
}

// Decks

export class Deck {
    public deckName: string;
    public newFlashcards: Card[];
    public newFlashcardsCount: number = 0; // counts those in subdecks too
    public dueFlashcards: Card[];
    public dueFlashcardsCount: number = 0; // counts those in subdecks too
    public totalFlashcards: number = 0; // counts those in subdecks too
    public subdecks: Deck[];
    public parent: Deck;

    constructor(deckName: string, parent: Deck) {
        this.deckName = deckName;
        this.newFlashcards = [];
        this.newFlashcardsCount = 0;
        this.dueFlashcards = [];
        this.dueFlashcardsCount = 0;
        this.totalFlashcards = 0;
        this.subdecks = [];
        this.parent = parent;
    }

    createDeck(deckPath: string[]) {
        if (deckPath.length == 0) return;

        let deckName: string = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName == deck.deckName) {
                deck.createDeck(deckPath);
                return;
            }
        }

        let deck: Deck = new Deck(deckName, this);
        this.subdecks.push(deck);
        deck.createDeck(deckPath);
    }

    insertFlashcard(deckPath: string[], cardObj: Card): void {
        if (cardObj.isDue) this.dueFlashcardsCount++;
        else this.newFlashcardsCount++;
        this.totalFlashcards++;

        if (deckPath.length == 0) {
            if (cardObj.isDue) this.dueFlashcards.push(cardObj);
            else this.newFlashcards.push(cardObj);
            return;
        }

        let deckName: string = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName == deck.deckName) {
                deck.insertFlashcard(deckPath, cardObj);
                return;
            }
        }
    }

    // count flashcards that have either been buried
    // or aren't due yet
    countFlashcard(deckPath: string[]): void {
        this.totalFlashcards++;

        let deckName: string = deckPath.shift();
        for (let deck of this.subdecks) {
            if (deckName == deck.deckName) {
                deck.countFlashcard(deckPath);
                return;
            }
        }
    }

    deleteFlashcardAtIndex(index: number, cardIsDue: boolean): void {
        if (cardIsDue) this.dueFlashcards.splice(index, 1);
        else this.newFlashcards.splice(index, 1);

        let deck: Deck = this;
        while (deck != null) {
            if (cardIsDue) deck.dueFlashcardsCount--;
            else deck.newFlashcardsCount--;
            deck = deck.parent;
        }
    }

    sortSubdecksList(): void {
        this.subdecks.sort((a, b) => {
            if (a.deckName < b.deckName) return -1;
            else if (a.deckName > b.deckName) return 1;
            return 0;
        });

        for (let deck of this.subdecks) deck.sortSubdecksList();
    }

    // implemented in flashcard-model.ts
    render(containerEl: HTMLElement, modal: FlashcardModal): void {}
    nextCard(modal: FlashcardModal): void {}
}

// Flashcards

export enum CardType {
    SingleLineBasic,
    MultiLineBasic,
    Cloze,
}

export interface Card {
    // scheduling
    isDue: boolean;
    interval?: number;
    ease?: number;
    delayBeforeReview?: number;
    // note
    note: TFile;
    // visuals
    front: string;
    back: string;
    cardText: string;
    context: string;
    // types
    cardType: CardType;
    // stuff for cards with sub-cards
    subCardIdx?: number;
    relatedCards?: Card[];
}

export enum FlashcardModalMode {
    DecksList,
    Front,
    Back,
    Closed,
}

export class ReviewDeckSelectionModal extends FuzzySuggestModal<string> {
    public deckKeys: string[] = [];
    public submitCallback: (deckKey: string) => void;

    constructor(app: App, deckKeys: string[]) {
        super(app);
        this.deckKeys = deckKeys;
    }

    getItems(): string[] {
        return this.deckKeys;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(deckKey: string, evt: MouseEvent | KeyboardEvent): void {
        this.close();
        this.submitCallback(deckKey);
    }
}