import { IQuestionContextFinder, NoteQuestionParser } from "./NoteQuestionParser";
import { ISRFile } from "./SRFile";
import { Note } from "./note";
import { SRSettings } from "./settings";
import { TopicPath } from "./topic-path";

export class NoteParser {
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;
    noteTopicPath: TopicPath;
    noteText: string;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder, noteTopicPath: TopicPath) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
        this.noteTopicPath = noteTopicPath;
    }

    async parse(noteFile: ISRFile, noteTopicPath: TopicPath, refDate: Date) {
        let questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings, this.questionContextFinder);
        let noteText: string = await noteFile.read();
        let questions = questionParser.createQuestionList(noteText, noteTopicPath, refDate);
        
        let result: Note = new Note {

        };
    }

}