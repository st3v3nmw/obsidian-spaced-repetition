import { ISRFile } from "./SRFile";
import { CardScheduleInfo } from "./CardSchedule";
import { Note } from "./note";
import { Question } from "./question";
import { CardFrontBack } from "./QuestionType";
import { TopicPath } from "./TopicPath";
import { IQuestionContextFinder, NoteQuestionParser } from "./NoteQuestionParser";
import { SRSettings } from "./settings";


export class NoteFileLoader {
    fileText: string;
    /* fileCachedData: CachedMetadata;
    headings: HeadingCache[]; */
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: ISRFile;
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
    }

    async Load(noteFile: ISRFile, noteTopicPath: TopicPath): Promise<Note> { 
        this.noteFile = noteFile;
        /* this.fileCachedData = this.app.metadataCache.getFileCache(noteFile) || {};
        this.headings = this.fileCachedData.headings || [];
        this.fixesMade = false; */
            
        const refDate: Date = new Date();
        
        let questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings, this.questionContextFinder);

        this.fileText = await noteFile.read();
        let questionList: Question[] = questionParser.createQuestionList(this.fileText, noteTopicPath, refDate);

        let result: Note = new Note(noteFile, questionList);
        return result;
    }

}
