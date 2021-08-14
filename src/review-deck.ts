import { App, FuzzySuggestModal, TFile } from "obsidian";
import { SchedNote } from "./main";

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
            (a: TFile, b: TFile) => (pageranks[b.path] || 0) - (pageranks[a.path] || 0)
        );

        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort((a: SchedNote, b: SchedNote) => {
            let result = a.dueUnix - b.dueUnix;
            if (result != 0) return result;
            return (pageranks[b.note.path] || 0) - (pageranks[a.note.path] || 0);
        });
    }
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

    onChooseItem(deckKey: string, _: MouseEvent | KeyboardEvent): void {
        this.close();
        this.submitCallback(deckKey);
    }
}
