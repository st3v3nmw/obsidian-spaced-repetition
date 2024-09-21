import { Note } from "src/note";
import { NoteParser } from "src/note-parser";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";
import { setupStaticDateProvider_20230906 } from "src/utils/date-provider";
import { TextDirection } from "src/utils/text-direction";

import { UnitTestSRFile } from "./helpers/unit-test-file";
import { unitTestSetup_StandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

const parser: NoteParser = new NoteParser(DEFAULT_SETTINGS);

beforeAll(() => {
    setupStaticDateProvider_20230906();
    unitTestSetup_StandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        const noteText: string = `#flashcards/test
Q1::A1
Q2::A2
Q3::A3
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const folderTopicPath = TopicPath.emptyPath;
        const note: Note = await parser.parse(file, TextDirection.Ltr, folderTopicPath);
        const questionList = note.questionList;
        expect(questionList.length).toEqual(3);
    });
});
