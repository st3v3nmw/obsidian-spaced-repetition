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
        let questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);
        let questions = await questionParser.createQuestionList(noteFile, folderTopicPath);
        let totalCards: number = questions.reduce((accumulator, q) => accumulator + q.cards.length, 0);

        // throw `${noteText}, ${questions.length}, ${totalCards}`;
        
        let result: Note = new Note(noteFile, questions);
        return result;
    }

}