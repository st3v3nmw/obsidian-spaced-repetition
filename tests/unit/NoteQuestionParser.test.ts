import { CardScheduleInfo } from "src/card-schedule";
import { CardType, IQuestionContextFinder, NoteQuestionParser, NullImpl_IQuestionContextFinder, Question } from "src/question";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";

let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
let parser: NoteQuestionParser = new NoteQuestionParser(DEFAULT_SETTINGS, questionContextFinder);

test("No questions in the text", () => {
    let noteText: string = "An interesting note, but no questions";
    let noteTopicPath: TopicPath = TopicPath.rootPath;

    expect(
        parser.createQuestionList(noteText, noteTopicPath)
    ).toEqual([
    ]);
});


test("Single question in the text: SingleLineBasic: No schedule info", () => {
    let noteText: string = `#flashcards/test
A::B
`;

    let noteTopicPath: TopicPath = TopicPath.rootPath;
    let card1 = {
        cardIdx: 0, 
        isDue: false, 
        scheduleInfo: null as CardScheduleInfo, 
    };
    let expected = [{
        questionType: CardType.SingleLineBasic, 
        topicPath: TopicPath.rootPath, 
        originalQuestionText: `A::B`, 
        rawQuestionText: "A::B", 
        lineNo: 1, 
        hasEditLaterTag: false, 
        context: "", 
        cards: [ card1 ], 
        hasChanged: false
    }];
    expect(
        parser.createQuestionList(noteText, noteTopicPath)
    ).toMatchObject(expected);
});


test("Single question in the text: SingleLineBasic: With schedule info", () => {
    let noteText: string = `#flashcards/test
A::B
<!--SR:!2023-09-03,1,230-->
`;

    let noteTopicPath: TopicPath = TopicPath.rootPath;
    let card1 = {
        cardIdx: 0, 
        isDue: true, 
        scheduleInfo: new CardScheduleInfo("2023-09-03", 1, 230), 
    };
    let expected = [{
        questionType: CardType.SingleLineBasic, 
        topicPath: TopicPath.rootPath, 
        originalQuestionText: `A::B
<!--SR:!2023-09-03,1,230-->`, 
        rawQuestionText: "A::B", 
        lineNo: 1, 
        hasEditLaterTag: false, 
        questionTextHash: "1c6b0b01215dc4", 
        context: "", 
        cards: [ card1 ], 
        hasChanged: false
    }];
    expect(
        parser.createQuestionList(noteText, noteTopicPath)
    ).toMatchObject(expected);
});