import { Question } from "src/data/data-structures/card/questions/question";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { NoteQuestionParser } from "src/note/note-question-parser";
import { TextDirection } from "src/utils/strings";

export class NoteFileLoader {
    fileText: string;
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: ISRNoteTFile;
    settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async load(
        noteFile: ISRNoteTFile,
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
