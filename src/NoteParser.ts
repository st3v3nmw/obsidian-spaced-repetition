import { NoteQuestionParser } from "./NoteQuestionParser";
import { ISRFile } from "./SRFile";
import { Note } from "./Note";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";

export class NoteParser {
    settings: SRSettings;
    noteText: string;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async parse(noteFile: ISRFile, folderTopicPath: TopicPath): Promise<Note> {
        const questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);
        const questions = await questionParser.createQuestionList(noteFile, folderTopicPath, true);

        const result: Note = new Note(noteFile, questions);
        return result;
    }
}
