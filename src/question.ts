
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





export class NoteQuestionParser { 
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;
    noteTopicPath: TopicPath;
    noteText: string;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
    }

    parseQuestions(): [CardType, string, number][] { 
        let settings: SRSettings = this.settings;
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

    createQuestionList(noteText: string, noteTopicPath: TopicPath): Question[] { 
        let result: Question[] = [];
        let parsedQuestionInfoList: [CardType, string, number][] = this.parseQuestions();
        for (const t of parsedQuestionInfoList) {
            let parsedQuestionInfo: ParsedQuestionInfo = new ParsedQuestionInfo(t[0], t[1], t[2]);
            let question: Question = this.createQuestionObject(parsedQuestionInfo);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            let cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(question.questionType, question.rawQuestionText, this.settings);

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList(question.rawQuestionText);

            // we have some extra scheduling dates to delete
            let correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                question.hasChanged = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }

            // Create the list of card objects, and attach to the question
            let cardList: Card[] = this.createCardList(question, cardFrontBackList, cardScheduleInfoList);
            question.cards = cardList;
        }
        return result;
    }



    private createQuestionObject(parsedQuestionInfo: ParsedQuestionInfo): Question { 
        var {cardType, cardText, lineNo} = parsedQuestionInfo;
        let originalCardText: string = cardText;
        let rawCardText = originalCardText;
        let hasEditLaterTag = rawCardText.includes(this.settings.editLaterTag);
        let topicPath: TopicPath = this.noteTopicPath;
        if (!this.settings.convertFoldersToDecks) {
            const t = TopicPath.getTopicPathFromCardText(rawCardText);
            if (t.hasPath) {
                topicPath = t;
                rawCardText = TopicPath.removeTopicPathFromCardText(rawCardText)
            }
        }
        const context: string = this.questionContextFinder.getQuestionContext(lineNo);
        const questionTextHash: string = cyrb53(rawCardText);
        let result: Question = { 
            questionType: cardType, 
            topicPath, 
            originalQuestionText: originalCardText, 
            rawQuestionText: rawCardText, 
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

            const cardObj: Card = {
                isDue: i < cardScheduleInfoList.length,
                front,
                back,
                cardIdx: i,
                question,
            };
            siblings.push(cardObj);
        }
        return siblings;
    }

}