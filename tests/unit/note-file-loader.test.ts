import { Note } from "src/note";
import { NoteFileLoader } from "src/note-file-loader";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "./helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";

const noteFileLoader: NoteFileLoader = new NoteFileLoader(DEFAULT_SETTINGS);

beforeAll(() => {
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("load", () => {
    test("Multiple questions, none with too many schedule details", async () => {
        const noteText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270-->
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        expect(note.hasChanged).toEqual(false);
    });

    test("Multiple questions, some with too many schedule details", async () => {
        const noteText: string = `#flashcards/test
Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270!2023-09-02,4,270-->
Q3:::A3
<!--SR:!2023-09-02,4,270-->
`;
        const file: UnitTestSRFile = new UnitTestSRFile(noteText);
        const note: Note = await noteFileLoader.load(file, TextDirection.Ltr, TopicPath.emptyPath);
        expect(note.hasChanged).toEqual(true);
    });
});
