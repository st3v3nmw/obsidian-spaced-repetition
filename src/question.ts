
import { Card } from "./card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./card-schedule";
import { parse } from "./parser";
import { CardFrontBack, CardFrontBackUtil } from "./question-type";
import { SRSettings } from "./settings";
import { TopicPath } from "./topic-path";
import { cyrb53 } from "./utils";

export enum CardType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

export class Question { 
    questionType: CardType;
    topicPath: TopicPath;
    originalQuestionText: string;
    rawQuestionText: string;
    lineNo: number;
    hasEditLaterTag: boolean;
    questionTextHash: string;
    context: string;
    cards: Card[];
    hasChanged: boolean;

    constructor(init?: Partial<Question>) {
        Object.assign(this, init);
    }
}


export class ParsedQuestionInfo { 
    cardType: CardType;
    cardText: string;
    lineNo: number;

    constructor(cardType: CardType, cardText: string, lineNo: number) { 
        this.cardType = cardType;
        this.cardText = cardText;
        this.lineNo = lineNo;
    }
}


export interface IQuestionContextFinder { 
    getQuestionContext(lineNo: number): string;
}


export class NullImpl_IQuestionContextFinder implements IQuestionContextFinder {
    getQuestionContext(lineNo: number): string {
        return "";
    }
}


export class NoteQuestionParser { 
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;
    noteTopicPath: TopicPath;
    noteText: string;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
    }

    createQuestionList(noteText: string, noteTopicPath: TopicPath): Question[] { 
        this.noteText = noteText;
        this.noteTopicPath = noteTopicPath;

        let result: Question[] = [];
        let parsedQuestionInfoList: [CardType, string, number][] = this.parseQuestions();
        for (const t of parsedQuestionInfoList) {
            let parsedQuestionInfo: ParsedQuestionInfo = new ParsedQuestionInfo(t[0], t[1], t[2]);
            let question: Question = this.createQuestionObject(parsedQuestionInfo);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            let cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(question.questionType, question.rawQuestionText, this.settings);

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList(question.originalQuestionText);

            // we have some extra scheduling dates to delete
            let correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                question.hasChanged = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }

            // Create the list of card objects, and attach to the question
            let cardList: Card[] = this.createCardList(question, cardFrontBackList, cardScheduleInfoList);
            question.cards = cardList;
            result.push(question);
        }
        return result;
    }

    private parseQuestions(): [CardType, string, number][] { 
        let settings: SRSettings = this.settings;
        const lines: string[] = this.noteText.replaceAll("\r\n", "\n").split("\n");
        const result: [CardType, string, number][] = parse(
            this.noteText,
            settings.singleLineCardSeparator,
            settings.singleLineReversedCardSeparator,
            settings.multilineCardSeparator,
            settings.multilineReversedCardSeparator,
            settings.convertHighlightsToClozes,
            settings.convertBoldTextToClozes,
            settings.convertCurlyBracketsToClozes,
        );
        return result;
    }

    private createQuestionObject(parsedQuestionInfo: ParsedQuestionInfo): Question { 
        var {cardType, cardText, lineNo} = parsedQuestionInfo;
        let originalQuestionText: string = cardText;
        let rawQuestionText = originalQuestionText;
        let hasEditLaterTag = rawQuestionText.includes(this.settings.editLaterTag);
        let topicPath: TopicPath = this.noteTopicPath;
        if (!this.settings.convertFoldersToDecks) {
            const t = TopicPath.getTopicPathFromCardText(rawQuestionText);
            if (t?.hasPath) {
                topicPath = t;
                rawQuestionText = TopicPath.removeTopicPathFromCardText(rawQuestionText)
            }
        }
        rawQuestionText = NoteCardScheduleParser.removeCardScheduleInfo(rawQuestionText).trim();

        const context: string = this.questionContextFinder.getQuestionContext(lineNo);
        const questionTextHash: string = cyrb53(rawQuestionText);
        let result: Question = { 
            questionType: cardType, 
            topicPath, 
            originalQuestionText: originalQuestionText, 
            rawQuestionText: rawQuestionText, 
            lineNo, 
            hasEditLaterTag, 
            questionTextHash, 
            context, 
            cards: null, 
            hasChanged: false
        };
        return result;
    }

    private createCardList(question: Question, cardFrontBackList: CardFrontBack[], cardScheduleInfoList: CardScheduleInfo[]): Card[] { 

        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {

            let { front, back } = cardFrontBackList[i];

            let hasScheduleInfo: boolean = i < cardScheduleInfoList.length;
            const cardObj: Card = new Card({
                isDue: hasScheduleInfo,
                front,
                back,
                cardIdx: i,
                question,
            });
            cardObj.scheduleInfo = hasScheduleInfo ? cardScheduleInfoList[i] : null;

            siblings.push(cardObj);
        }
        return siblings;
    }

}