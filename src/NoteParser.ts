import { IQuestionContextFinder, NoteQuestionParser } from "./NoteQuestionParser";
import { ISRFile } from "./SRFile";
import { Note } from "./note";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";

export class NoteParser {
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;
    noteText: string;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
    }

    async parse(noteFile: ISRFile, noteTopicPath: TopicPath, refDate: Date) {
        let questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings, this.questionContextFinder);
        let noteText: string = await noteFile.read();
        let questions = questionParser.createQuestionList(noteText, noteTopicPath, refDate);
        let totalCards: number = questions.reduce((accumulator, q) => accumulator + q.cards.length, 0);

        // throw `${noteText}, ${questions.length}, ${totalCards}`;
        
        let result: Note = new Note(noteFile, questions);
        return result;
    }

}