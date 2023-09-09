import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardScheduleInfo } from "src/CardSchedule";
import { TICKS_PER_DAY } from "src/constants";
import { CardType, Question } from "src/question";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TopicPath } from "src/TopicPath";
import { createTest_NoteQuestionParser, test_RefDate_20230906 } from "./SampleItems";

let parserWithDefaultSettings: NoteQuestionParser = createTest_NoteQuestionParser(DEFAULT_SETTINGS);

test("No questions in the text", () => {
    let noteText: string = "An interesting note, but no questions";
    let noteTopicPath: TopicPath = TopicPath.emptyPath;

    expect(
        parserWithDefaultSettings.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
    ).toEqual([
    ]);
});


describe("Single question in the text", () => {
    test("SingleLineBasic: No schedule info", () => {
        let noteText: string = `#flashcards/test
A::B
`;

            let noteTopicPath: TopicPath = TopicPath.emptyPath;
            let card1 = {
                cardIdx: 0, 
                isDue: false, 
                scheduleInfo: null as CardScheduleInfo, 
            };
            let expected = [{
                questionType: CardType.SingleLineBasic, 
                topicPath: TopicPath.emptyPath, 
                questionTextOriginal: `A::B`, 
                questionTextCleaned: "A::B", 
                lineNo: 1, 
                hasEditLaterTag: false, 
                context: "", 
                cards: [ card1 ], 
                hasChanged: false
            }];
            expect(
                parserWithDefaultSettings.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
            ).toMatchObject(expected);
    });

    test("SingleLineBasic: With schedule info", () => {
        let noteText: string = `#flashcards/test
A::B
<!--SR:!2023-09-03,1,230-->
    `;

        let noteTopicPath: TopicPath = TopicPath.emptyPath;
        let delayDays = 6 - 3;
        let card1 = {
            cardIdx: 0, 
            isDue: true, 
            scheduleInfo: CardScheduleInfo.fromDueDateStr("2023-09-03", 1, 230, delayDays * TICKS_PER_DAY), 
        };
        let expected = [{
            questionType: CardType.SingleLineBasic, 
            topicPath: TopicPath.emptyPath, 
            questionTextOriginal: `A::B
<!--SR:!2023-09-03,1,230-->`, 
            questionTextCleaned: "A::B", 
            lineNo: 1, 
            hasEditLaterTag: false, 
            questionTextHash: "1c6b0b01215dc4", 
            context: "", 
            cards: [ card1 ], 
            hasChanged: false
        }];
        expect(
            parserWithDefaultSettings.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
        ).toMatchObject(expected);
    });
});


describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
`;
        let settings = DEFAULT_SETTINGS;
        settings.convertFoldersToDecks = true;
        let parser: NoteQuestionParser = createTest_NoteQuestionParser(settings);
            let noteTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(2);

            
    });

    test("SingleLineBasic: Note topic applies to all questions when not overriden", () => {
        let noteText: string = `
Q1::A1
Q2::A2
Q3::A3
`;

            let noteTopicPath: TopicPath = new TopicPath(["flashcards", "science"]);
            let questionList: Question[] = parserWithDefaultSettings.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPath).toEqual(new TopicPath(["flashcards", "science"]));
            expect(questionList[1].topicPath).toEqual(new TopicPath(["flashcards", "science"]));
            expect(questionList[2].topicPath).toEqual(new TopicPath(["flashcards", "science"]));
    });

});

describe("Handling tags within note", () => {
    describe("Settings mode: Convert folder path to tag", () => {
        let settings: SRSettings = { ...DEFAULT_SETTINGS };
        settings.convertFoldersToDecks = true;
        let parser2: NoteQuestionParser = createTest_NoteQuestionParser(settings);

        test("Folder path applies to all questions within note", () => {
            let noteText: string = `
    Q1::A1
    Q2::A2
    Q3::A3
    `;

            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = parser2.createQuestionList(noteText, folderTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPath).toEqual(new TopicPath(["folder", "subfolder"]));
        });

        test("Topic tag within note is ignored (outside all questions)", () => {
            let noteText: string = `#flashcards/test
Q1::A1
    `;
            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = parser2.createQuestionList(noteText, folderTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPath).toEqual(new TopicPath(["folder", "subfolder"]));
        });

        // Behavior here mimics SR_ORIGINAL
        // It could be argued that topic tags within a question should override the folder based topic
        test("Topic tag within note is ignored (within specific question)", () => {
            // The tag "#flashcards/test" specifies a different topic than the folderTopicPath below
            let noteText: string = `
#flashcards/test Q1::A1
    `;
            let folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            let questionList: Question[] = parser2.createQuestionList(noteText, folderTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPath).toEqual(new TopicPath(["folder", "subfolder"]));
        });
    });

    describe("Settings mode: Use tags within note", () => {
        expect(parserWithDefaultSettings.settings.convertFoldersToDecks).toEqual(false);

        test("Topic tag before first question applies to all questions", () => {
            let noteText: string = `#flashcards/test
    Q1::A1
    Q2::A2
    Q3::A3
    `;
            let expectedPath: TopicPath = new TopicPath(["flashcards", "test"]);
            let questionList: Question[] = parserWithDefaultSettings.createQuestionList(noteText, TopicPath.emptyPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPath).toEqual(expectedPath);
        });

        test("Topic tag within question overrides the note topic, for that topic only", () => {
            let noteText: string = `#flashcards/test
    Q1::A1
    #flashcards/examination Q2::A2
    Q3::This has the "flashcards/test" topic, not "flashcards/examination"
    `;
            let questionList: Question[] = parserWithDefaultSettings.createQuestionList(noteText, TopicPath.emptyPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPath).toEqual(new TopicPath(["flashcards", "test"]));
            expect(questionList[1].topicPath).toEqual(new TopicPath(["flashcards", "examination"]));
            expect(questionList[2].topicPath).toEqual(new TopicPath(["flashcards", "test"]));
        });
    });

    test("First topic tag within note (outside questions) is used as the note's topic tag, even if it appears after the first question", () => {
        let noteText: string = `
Q1::A1
#flashcards/test
Q2::A2
Q3::A3
`;
        let expectedPath: TopicPath = new TopicPath(["flashcards", "test"]);
        let questionList: Question[] = parserWithDefaultSettings.createQuestionList(noteText, TopicPath.emptyPath, test_RefDate_20230906);
        expect(questionList.length).toEqual(3);
        for (let i = 0; i < questionList.length; i++)
            expect(questionList[i].topicPath).toEqual(expectedPath);
    });

    test("Only first topic tag within note (outside questions) is used as the note's topic tag, subsequent ignored", () => {
        let noteText: string = `
Q1::A1
#flashcards/test
Q2::A2
#flashcards/examination
Q3::This has the "flashcards/test" topic, not "flashcards/examination"
`;
        let expectedPath: TopicPath = new TopicPath(["flashcards", "test"]);
        let questionList: Question[] = parserWithDefaultSettings.createQuestionList(noteText, TopicPath.emptyPath, test_RefDate_20230906);
        expect(questionList.length).toEqual(3);
        for (let i = 0; i < questionList.length; i++)
            expect(questionList[i].topicPath).toEqual(expectedPath);
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
        hasChanged: false
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
        hasChanged: false
    };
    expect(question).toMatchObject(expected);
    expect(question.cards[0]).toMatchObject(card1);
    return question;
}

