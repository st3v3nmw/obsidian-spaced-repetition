import { TopicPath } from "src/deck/topic-path";
import { ISRFile } from "src/file";
import { Note } from "src/note/note";
import { NoteQuestionParser } from "src/note/note-question-parser";
import { SRSettings } from "src/settings";
import { TextDirection } from "src/utils/strings";

export class NoteParser {
    settings: SRSettings;
    noteText: string;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async parse(
        noteFile: ISRFile,
        defaultTextDirection: TextDirection,
        folderTopicPath: TopicPath,
    ): Promise<Note> {
        const questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);
        const questions = await questionParser.createQuestionList(
            noteFile,
            defaultTextDirection,
            folderTopicPath,
            true,
        );

        const result: Note = new Note(noteFile, questions);
        return result;
    }
}
