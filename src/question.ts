
import { parse } from "./parser";
import { SRSettings } from "./settings";
import { TopicPath } from "./topic-path";
import { cyrb53 } from "./utils";

export enum QuestionType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

export class Question { 
    cardType: QuestionType;
    topicPath: TopicPath;
    originalCardText: string;
    rawCardText: string;
    lineNo: number;
    hasEditLaterTag: boolean;
    questionTextHash: string;
    context: string;
}

export interface IQuestionContextFinder { 
    getQuestionContext(lineNo: number): string;
}

export class NoteQuestionParser { 
    settings: SRSettings;
    questionContextFinder: IQuestionContextFinder;

    constructor(settings: SRSettings, questionContextFinder: IQuestionContextFinder) { 
        this.settings = settings;
        this.questionContextFinder = questionContextFinder;
    }

    createRawCardInfoList(noteText: string, noteTopicPath: TopicPath): Question[] { 
        let settings: SRSettings = this.settings;
        const parsedCards: [QuestionType, string, number][] = parse(
            noteText,
            settings.singleLineCardSeparator,
            settings.singleLineReversedCardSeparator,
            settings.multilineCardSeparator,
            settings.multilineReversedCardSeparator,
            settings.convertHighlightsToClozes,
            settings.convertBoldTextToClozes,
            settings.convertCurlyBracketsToClozes,
        );
        let result: Question[] = [];
        for (const parsedCard of parsedCards) {
            const cardType: QuestionType = parsedCard[0];
            let lineNo: number = parsedCard[2];
            let originalCardText: string = parsedCard[1];
            let rawCardText = originalCardText;
            let hasEditLaterTag = rawCardText.includes(settings.editLaterTag);
            let topicPath: TopicPath = noteTopicPath;
            if (!settings.convertFoldersToDecks) {
                const t = TopicPath.getTopicPathFromCardText(rawCardText);
                if (t.hasPath) {
                    topicPath = t;
                    rawCardText = TopicPath.removeTopicPathFromCardText(rawCardText)
                }
            }
            const context: string = this.questionContextFinder.getQuestionContext(lineNo);
            const questionTextHash: string = cyrb53(rawCardText);
            let info: Question = { cardType, topicPath, originalCardText, rawCardText, lineNo, hasEditLaterTag, questionTextHash, context };
            result.push(info);
        }
        return result;
    }

}