import { Note } from "src/note";
import { NoteQuestionParser } from "src/note-question-parser";
import { SRSettings } from "src/settings";
import { ISRFile } from "src/sr-file";
import { TopicPath } from "src/topic-path";
import { TextDirection } from "src/utils/text-direction";

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
