import { ISRFile } from "./SRFile";
import { CardScheduleInfo } from "./CardSchedule";
import { Note } from "./note";
import { Question } from "./question";
import { CardFrontBack } from "./QuestionType";
import { TopicPath } from "./TopicPath";


export class NoteFileLoader {
    fileText: string;
    fileCachedData: CachedMetadata;
    headings: HeadingCache[];
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: TFile;

    constructor() { 
    }

    async Load(noteFile: ISRFile, noteTopicPath: TopicPath): Promise<Note> { 
        this.noteFile = noteFile;
        this.fileCachedData = this.app.metadataCache.getFileCache(noteFile) || {};
        this.headings = this.fileCachedData.headings || [];
        this.fixesMade = false;
            
        const now: number = Date.now();
        
        


        return 0;
    }

}
