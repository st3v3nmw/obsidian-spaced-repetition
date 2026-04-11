import {
    CardFragment,
    CardFragmentType,
} from "src/utils/parsers/data-structures/cards/card-fragments/card-fragment";

/**
 * A collection of notes with card fragments
 */
export class NotesWithCardFragments {
    notesWithCardFragments: Map<string, NoteWithCardFragments>;

    constructor() {
        this.notesWithCardFragments = new Map<string, NoteWithCardFragments>();
    }

    /**
     * Adds the rouge card fragment to the note rouge card fragments
     *
     * @param notePath
     * @param cardFragment
     */
    addCardFragment(notePath: string, noteText: string, cardFragment: CardFragment): void {
        let noteWithCardFragments: NoteWithCardFragments =
            this.notesWithCardFragments.get(notePath);

        if (!noteWithCardFragments) {
            noteWithCardFragments = new NoteWithCardFragments(notePath, noteText, []);
        }

        noteWithCardFragments.addFragment(cardFragment);

        this.notesWithCardFragments.set(notePath, noteWithCardFragments);
    }

    resetNote(notePath: string, noteText: string) {
        this.notesWithCardFragments.set(
            notePath,
            new NoteWithCardFragments(notePath, noteText, []),
        );
    }
}

/**
 * A note with card fragments
 */
export class NoteWithCardFragments {
    notePath: string;
    noteText: string;
    cardFragments: CardFragment[];

    constructor(notePath: string, noteText: string, cardFragments: CardFragment[]) {
        this.notePath = notePath;
        this.noteText = noteText;
        this.cardFragments = cardFragments;
    }

    /**
     * Returns the note text
     */
    getText(): string {
        return this.noteText;
    }

    /**
     * Returns the card fragments
     */
    getCardFragments(): CardFragment[] {
        return this.cardFragments;
    }

    /**
     * Returns the card fragments of a specific type
     */
    getCardFragmentsOfType(type: CardFragmentType): CardFragment[] {
        return this.cardFragments.filter((cardFragment) => cardFragment.type === type);
    }

    /**
     * Adds a card fragment
     */
    addFragment(cardFragment: CardFragment) {
        this.cardFragments.push(cardFragment);
    }
}
