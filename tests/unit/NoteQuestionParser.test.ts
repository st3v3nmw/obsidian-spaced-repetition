import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardScheduleInfo } from "src/CardSchedule";
import { TICKS_PER_DAY } from "src/constants";
import { CardType, Question } from "src/Question";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TopicPath, TopicPathList } from "src/TopicPath";
import { createTest_NoteQuestionParser } from "./SampleItems";
import { ISRFile } from "src/SRFile";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";

let parserWithDefaultSettings: NoteQuestionParser = createTest_NoteQuestionParser(DEFAULT_SETTINGS);
let settings_ConvertFoldersToDecks: SRSettings = { ...DEFAULT_SETTINGS };
settings_ConvertFoldersToDecks.convertFoldersToDecks = true;
let parser_ConvertFoldersToDecks: NoteQuestionParser = createTest_NoteQuestionParser(
    settings_ConvertFoldersToDecks,
);

beforeAll(() => {
    setupStaticDateProvider_20230906();
});

describe("No flashcard questions", () => {
    test("No questions in the text", async () => {
        let noteText: string = "An interesting note, but no questions";
        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        expect(
            await parserWithDefaultSettings.createQuestionList(noteFile, folderTopicPath, true),
        ).toEqual([]);
    });

    test("A question in the text, but no flashcard tag", async () => {
        let noteText: string = "A::B";
        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        expect(
            await parserWithDefaultSettings.createQuestionList(noteFile, folderTopicPath, true),
        ).toEqual([]);
    });
});

describe("Single question in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        let noteText: string = `#flashcards
A::B
`;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let card1 = {
            cardIdx: 0,
            scheduleInfo: null as CardScheduleInfo,
        };
        let expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards", 0),
                questionText: {
                    original: `A::B`,
                    actualQuestion: "A::B",
                },

                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(noteFile, folderTopicPath, true),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: With schedule info", async () => {
        let noteText: string = `#flashcards/test
A::B
<!--SR:!2023-09-03,1,230-->
    `;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let delayDays = 3 - 6;
        let card1 = {
            cardIdx: 0,
            scheduleInfo: CardScheduleInfo.fromDueDateStr(
                "2023-09-03",
                1,
                230,
                delayDays * TICKS_PER_DAY,
            ),
        };
        let expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards/test", 0),
                questionText: {
                    original: `A::B
<!--SR:!2023-09-03,1,230-->`,
                    actualQuestion: "A::B",
                    textHash: "1c6b0b01215dc4",
                },
                lineNo: 1,
                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(noteFile, folderTopicPath, true),
        ).toMatchObject(expected);
    });
});

describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
`;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);
        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let questionList: Question[] = await parser_ConvertFoldersToDecks.createQuestionList(
            noteFile,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(2);
    });

    test("SingleLineBasic: Note topic applies to all questions when not overriden", async () => {
        let noteText: string = `
Q1::A1
Q2::A2
Q3::A3
`;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        let folderTopicPath: TopicPath = new TopicPath(["flashcards", "science"]);
        let questionList: Question[] = await parser_ConvertFoldersToDecks.createQuestionList(
            noteFile,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(3);
        expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/science");
        expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/science");
        expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/science");
    });

    test("SingleLineBasic: Tags within frontmatter applies to all questions when not overriden", async () => {
        let noteText: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
---
Q1::A1
Q2::A2
Q3::A3
`;
        let noteFile: ISRFile = new UnitTestSRFile(noteText);

        let folderTopicPath: TopicPath = TopicPath.emptyPath;
        let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
            noteFile,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(3);
        expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/aws");
        expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/aws");
        expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/aws");
    });
});

describe("Handling tags within note", () => {
    describe("Settings mode: Convert folder path to tag", () => {
        let settings: SRSettings = { ...DEFAULT_SETTINGS };
        settings.convertFoldersToDecks = true;
        let parser2: NoteQuestionParser = createTest_NoteQuestionParser(settings);

        test("Folder path applies to all questions within note", async () => {
            let noteText: string = `
    Q1::A1
    Q2::A2
    Q3::A3
    `;

            let noteFile: ISRFile = new UnitTestSRFile(noteText);
            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });

        test("Topic tag within note is ignored (outside all questions)", async () => {
            let noteText: string = `#flashcards/test
Q1::A1
    `;

            let noteFile: ISRFile = new UnitTestSRFile(noteText);
            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });

        // Behavior here mimics SR_ORIGINAL
        // It could be argued that topic tags within a question should override the folder based topic
        test("Topic tag within note is ignored (within specific question)", async () => {
            // The tag "#flashcards/test" specifies a different topic than the folderTopicPath below
            let noteText: string = `
#flashcards/test Q1::A1
    `;

            let noteFile: ISRFile = new UnitTestSRFile(noteText);
            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });
    });

    describe("Settings mode: Use tags within note", () => {
        expect(parserWithDefaultSettings.settings.convertFoldersToDecks).toEqual(false);

        test("Topic tag before first question applies to all questions", async () => {
            let noteText: string = `#flashcards/test
    Q1::A1
    Q2::A2
    Q3::A3
    `;
            let noteFile: ISRFile = new UnitTestSRFile(noteText);

            let expectedPath: string = "#flashcards/test";
            let folderTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual(expectedPath);
            expect(questionList[1].topicPathList.formatPsv()).toEqual(expectedPath);
            expect(questionList[2].topicPathList.formatPsv()).toEqual(expectedPath);
        });

        test("Topic tag within question overrides the note topic, for that topic only", async () => {
            let noteText: string = `#flashcards/test
    Q1::A1
    #flashcards/examination Q2::A2
    Q3::This has the "flashcards/test" topic, not "flashcards/examination"
    `;
            let noteFile: ISRFile = new UnitTestSRFile(noteText);

            let folderTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/examination");
            expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/test");
        });

        test("First topic tag within note (outside questions) is used as the note's topic tag, even if it appears after the first question", async () => {
            let noteText: string = `
    Q1::A1 This has the "flashcards/test" topic, even though the first topic tag is after this line in the file
    #flashcards/test
    Q2::A2
    Q3::A3
    `;
            let noteFile: ISRFile = new UnitTestSRFile(noteText);

            let expectedPath: TopicPath = new TopicPath(["flashcards", "test"]);
            let folderTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPathList.formatPsv()).toEqual("#flashcards/test");
        });

        test("The last topic tag within note prior to the question is used as the note's topic tag", async () => {
            let noteText: string = `
    Q1::A1
    #flashcards/test
    Q2::A2
    #flashcards/examination
    Q3::This has the "flashcards/examination" topic, not "flashcards/test"
    `;
            let noteFile: ISRFile = new UnitTestSRFile(noteText);

            let folderTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/examination");
        });
    });

    describe("Tags within question", () => {
        expect(parserWithDefaultSettings.settings.convertFoldersToDecks).toEqual(false);

        test("Leading white space before topic tag", async () => {
            let noteText: string = `
            #flashcards/science Q5::A5 <!--SR:!2023-09-02,4,270-->
    `;
            let noteFile: ISRFile = new UnitTestSRFile(noteText);

            let expectedPath: TopicPath = new TopicPath(["flashcards", "science"]);
            let folderTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/science");
            expect(questionList[0].cards.length).toEqual(1);
            expect(questionList[0].cards[0].front).toEqual("Q5");
        });
    });
});

function checkQuestion1(question: Question) {
    expect(question.cards.length).toEqual(1);
    let card1 = {
        cardIdx: 0,
        isDue: false,
        front: "Q1",
        back: "A1",
        scheduleInfo: null as CardScheduleInfo,
    };
    let expected = {
        questionType: CardType.SingleLineBasic,
        topicPath: TopicPath.emptyPath,
        questionTextOriginal: `Q1::A1`,
        questionTextCleaned: "Q1::A1",
        lineNo: 1,
        hasEditLaterTag: false,
        context: "",
        hasChanged: false,
    };
    expect(question).toMatchObject(expected);
    expect(question.cards[0]).toMatchObject(card1);
    return question;
}

function checkQuestion2(question: Question) {
    expect(question.cards.length).toEqual(1);
    let card1 = {
        cardIdx: 0,
        isDue: false,
        front: "Q2",
        back: "A2",
        scheduleInfo: null as CardScheduleInfo,
    };
    let expected = {
        questionType: CardType.SingleLineBasic,
        topicPath: TopicPath.emptyPath,
        questionTextOriginal: `Q2::A2`,
        questionTextCleaned: "Q2::A2",
        lineNo: 2,
        hasEditLaterTag: false,
        context: "",
        hasChanged: false,
    };
    expect(question).toMatchObject(expected);
    expect(question.cards[0]).toMatchObject(card1);
    return question;
}
