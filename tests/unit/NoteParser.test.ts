import { NoteParser } from "src/NoteParser";
import { TopicPath } from "src/TopicPath";
import { Note } from "src/Note";
import { Question } from "src/Question";
import { DEFAULT_SETTINGS } from "src/settings";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";

let parser: NoteParser = new NoteParser(DEFAULT_SETTINGS);

beforeAll(() => {
    setupStaticDateProvider_20230906();
});

describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
Q3::A3
`;
        let file: UnitTestSRFile = new UnitTestSRFile(noteText);
        let folderTopicPath = TopicPath.emptyPath;
        let note: Note = await parser.parse(file, folderTopicPath);
        let questionList = note.questionList;
        expect(questionList.length).toEqual(3);
    });
});
