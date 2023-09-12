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
            
        let questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings, this.questionContextFinder);

        let questionList: Question[] = await questionParser.createQuestionList(noteFile, noteTopicPath);

        let result: Note = new Note(noteFile, questionList);
        return result;
    }

}
