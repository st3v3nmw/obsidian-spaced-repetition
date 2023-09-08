import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardScheduleInfo } from "src/CardSchedule";
import { TICKS_PER_DAY } from "src/constants";
import { CardType, Question } from "src/question";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/TopicPath";
import { createTest_NoteQuestionParser, test_RefDate_20230906 } from "./SampleItems";

let parser: NoteQuestionParser = createTest_NoteQuestionParser();

test("No questions in the text", () => {
    let noteText: string = "An interesting note, but no questions";
    let noteTopicPath: TopicPath = TopicPath.emptyPath;

    expect(
        parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
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
                parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
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
            parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906)
        ).toMatchObject(expected);
    });
});


describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", () => {
        let noteText: string = `#flashcards/test
Q1::A1
Q2::A2
`;

            let noteTopicPath: TopicPath = TopicPath.emptyPath;
            let questionList: Question[] = parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(2);

            checkQuestion1(questionList[0]);
            checkQuestion2(questionList[1]);
    });

    test("SingleLineBasic: Note topic applies to all questions when not overriden", () => {
        let noteText: string = `
Q1::A1
Q2::A2
Q3::A3
`;

            let noteTopicPath: TopicPath = new TopicPath(["flashcards", "science"]);
            let questionList: Question[] = parser.createQuestionList(noteText, noteTopicPath, test_RefDate_20230906);
            expect(questionList.length).toEqual(2);
            expect(questionList[0].topicPath).toEqual(new TopicPath(["flashcards", "science"]));
            expect(questionList[1].topicPath).toEqual(new TopicPath(["flashcards", "science"]));
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

