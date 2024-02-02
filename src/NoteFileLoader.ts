import { ISRFile } from "./SRFile";
import { Note } from "./Note";
import { Question } from "./Question";
import { TopicPath } from "./TopicPath";
import { NoteQuestionParser } from "./NoteQuestionParser";
import { SRSettings } from "./settings";
import { TextDirection } from "./util/TextDirection";

export class NoteFileLoader {
    fileText: string;
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: ISRFile;
    settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async load(noteFile: ISRFile, defaultTextDirection: TextDirection, noteTopicPath: TopicPath): Promise<Note> {
        this.noteFile = noteFile;

        const questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);

        const questionList: Question[] = await questionParser.createQuestionList(
            noteFile,
            defaultTextDirection, 
            noteTopicPath,
        );

        const result: Note = new Note(noteFile, questionList);
        return result;
    }
}
