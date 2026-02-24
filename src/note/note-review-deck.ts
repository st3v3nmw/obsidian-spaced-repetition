import { ISRFile } from "src/file";
import { t } from "src/lang/helpers";
import { globalDateProvider } from "src/utils/dates";
import { globalRandomNumberProvider } from "src/utils/numbers";

export class SchedNote {
    note: ISRFile;
    dueUnix: number;

    constructor(note: ISRFile, dueUnix: number) {
        this.note = note;
        this.dueUnix = dueUnix;
    }

    isDue(todayUnix: number): boolean {
        return this.dueUnix <= todayUnix;
    }
}

export class NoteReviewDeck {
    // Deck name such as the default "#review"
    private _deckName: string;

    private _newNotes: ISRFile[] = [];
    private _scheduledNotes: SchedNote[] = [];
    private _dueNotesCount = 0;

    // This stores the collapsed/expanded state of each folder (folder names being things like
    // "TODAY", "NEW" or formatted dates).
    private _activeFolders: Set<string>;

    get deckName(): string {
        return this._deckName;
    }

    get newNotes(): ISRFile[] {
        return this._newNotes;
    }

    get scheduledNotes(): SchedNote[] {
        return this._scheduledNotes;
    }

    get dueNotesCount(): number {
        return this._dueNotesCount;
    }

    get activeFolders(): Set<string> {
        return this._activeFolders;
    }

    constructor(name: string) {
        this._deckName = name;
        this._activeFolders = new Set([this._deckName, t("TODAY")]);
    }

    public calcDueNotesCount(todayUnix: number): void {
        this._dueNotesCount = 0;
        this.scheduledNotes.forEach((scheduledNote: SchedNote) => {
            if (scheduledNote.isDue(todayUnix)) {
                this._dueNotesCount++;
            }
        });
    }

    public sortNotesByDateAndImportance(pageranks: Record<string, number>): void {
        // sort new notes by importance
        this._newNotes = this.newNotes.sort(
            (a: ISRFile, b: ISRFile) => (pageranks[b.path] || 0) - (pageranks[a.path] || 0),
        );

        // sort scheduled notes by date & within those days, sort them by importance
        this._scheduledNotes = this.scheduledNotes.sort((a: SchedNote, b: SchedNote) => {
            const result = a.dueUnix - b.dueUnix;
            if (result != 0) {
                return result;
            }
            return (pageranks[b.note.path] || 0) - (pageranks[a.note.path] || 0);
        });
    }

    determineNextNote(openRandomNote: boolean): ISRFile {
        // Review due notes before new ones
        const todayUnix: number = globalDateProvider.today.valueOf();
        const dueNotes = this.scheduledNotes.filter((note) => note.isDue(todayUnix));
        if (dueNotes.length > 0) {
            const index = openRandomNote
                ? globalRandomNumberProvider.getInteger(0, dueNotes.length - 1)
                : 0;
            return dueNotes[index].note;
        }

        if (this.newNotes.length > 0) {
            const index = openRandomNote
                ? globalRandomNumberProvider.getInteger(0, this.newNotes.length - 1)
                : 0;
            return this.newNotes[index];
        }

        return null;
    }
}
