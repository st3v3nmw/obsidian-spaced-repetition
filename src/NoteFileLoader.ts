import { ISRFile } from "./SRFile";
import { Note } from "./Note";
import { Question } from "./Question";
import { TopicPath } from "./TopicPath";
import { NoteQuestionParser } from "./NoteQuestionParser";
import { SRSettings } from "./settings";

export class NoteFileLoader {
    fileText: string;
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: ISRFile;
    settings: SRSettings;
    private _hasTopicPaths: boolean;

    public get hasTopicPaths(): boolean {
        return this._hasTopicPaths;
    }

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async load(noteFile: ISRFile, folderTopicPath: TopicPath): Promise<Note | null> {
        this.noteFile = noteFile;

        const questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);

        const onlyKeepQuestionsWithTopicPath: boolean = true;
        const questionList: Question[] = await questionParser.createQuestionList(
            noteFile,
            folderTopicPath,
            onlyKeepQuestionsWithTopicPath,
        );
        this._hasTopicPaths = questionParser.hasTopicPaths;

        const result: Note = new Note(noteFile, questionList);
        return result;
    }
}
