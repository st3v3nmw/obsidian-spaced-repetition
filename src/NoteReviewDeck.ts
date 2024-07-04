import { t } from "src/lang/helpers";
import { ISRFile } from "./SRFile";

export interface SchedNote {
    note: ISRFile;
    dueUnix: number;
}

export class NoteReviewDeck {
    public deckName: string;
    public newNotes: ISRFile[] = [];
    public scheduledNotes: SchedNote[] = [];
    public activeFolders: Set<string>;
    public dueNotesCount = 0;

    constructor(name: string) {
        this.deckName = name;
        this.activeFolders = new Set([this.deckName, t("TODAY")]);
    }

    public sortNotesByDateAndImportance(pageranks: Record<string, number>): void {
        // sort new notes by importance
        this.newNotes = this.newNotes.sort(
            (a: ISRFile, b: ISRFile) => (pageranks[b.path] || 0) - (pageranks[a.path] || 0),
        );

        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort((a: SchedNote, b: SchedNote) => {
            const result = a.dueUnix - b.dueUnix;
            if (result != 0) {
                return result;
            }
            return (pageranks[b.note.path] || 0) - (pageranks[a.note.path] || 0);
        });
    }
}
