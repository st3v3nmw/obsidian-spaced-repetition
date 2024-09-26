import { ISRFile } from "src/file";
import { Note } from "src/note";
import { NoteQuestionParser } from "src/note-question-parser";
import { Question } from "src/question";
import { SRSettings } from "src/settings";
import { TopicPath } from "src/topic-path";
import { TextDirection } from "src/utils/strings";

export class NoteFileLoader {
    fileText: string;
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: ISRFile;
    settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async load(
        noteFile: ISRFile,
        defaultTextDirection: TextDirection,
        folderTopicPath: TopicPath,
    ): Promise<Note | null> {
        this.noteFile = noteFile;

        const questionParser: NoteQuestionParser = new NoteQuestionParser(this.settings);

        const onlyKeepQuestionsWithTopicPath: boolean = true;
        const questionList: Question[] = await questionParser.createQuestionList(
            noteFile,
            defaultTextDirection,
            folderTopicPath,
            onlyKeepQuestionsWithTopicPath,
        );

        const result: Note = new Note(noteFile, questionList);
        return result;
    }
}
