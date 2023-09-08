import { NoteParser } from "src/NoteParser";
import { IQuestionContextFinder, NullImpl_IQuestionContextFinder } from "src/NoteQuestionParser";
import { UnitTestSRFile } from "src/SRFile";
import { TopicPath } from "src/TopicPath";
import { Note } from "src/note";
import { Question } from "src/question";
import { DEFAULT_SETTINGS } from "src/settings";


let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
let parser: NoteParser = new NoteParser(DEFAULT_SETTINGS, questionContextFinder);
let refDate: Date = new Date(2023, 8, 6);

describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
Q3::A3
`;
        let file: UnitTestSRFile = new UnitTestSRFile(noteText);
        let noteTopicPath = TopicPath.emptyPath;
        let note: Note = await parser.parse(file, noteTopicPath, refDate);
        let questionList = note.questionList;
        expect(questionList.length).toEqual(2);

    });
    
});

