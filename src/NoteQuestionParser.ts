import { Card } from "./card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { parse } from "./parser";
import { CardType, Question } from "./question";
import { CardFrontBack, CardFrontBackUtil } from "./QuestionType";
import { SRSettings } from "./settings";
import { ISRFile, UnitTestSRFile } from "./SRFile";
import { TopicPath } from "./TopicPath";
import { cyrb53 } from "./utils";
import { getAllTagsFromText } from "src/utils";

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

    async createQuestionList(noteFile: ISRFile, folderTopicPath: TopicPath, refDate: Date): Promise<Question[]> { 
        let noteText: string = await noteFile.read();
        var noteTopicPath: TopicPath;
        if (this.settings.convertFoldersToDecks) {
            noteTopicPath = folderTopicPath;
        } else {
            let tagList: string[] = noteFile.getAllTags();
            noteTopicPath = this.determineTopicPathFromTags(tagList);
        }
        var result: Question[] = this.doCreateQuestionList(noteText, noteTopicPath, refDate);
        return result;
    }

    /* createQuestionList_WithNoteTags(noteText: string, tagList: string[], refDate: Date): Question[] { 
        if (this.settings.convertFoldersToDecks)
            throw "Invalid usage";
        let noteTopicPath: TopicPath = this.determineTopicPathFromTags(tagList);
        return this.doCreateQuestionList(noteText, noteTopicPath, refDate);
    }

    createQuestionList_WithFolderTopicPath(noteText: string, folderTopicPath: TopicPath, refDate: Date): Question[] { 
        if (!this.settings.convertFoldersToDecks)
            throw "Invalid usage";
        return this.doCreateQuestionList(noteText, folderTopicPath, refDate);
    } */

    private doCreateQuestionList(noteText: string, noteTopicPath: TopicPath, refDate: Date): Question[] { 
        this.noteText = noteText;
        this.noteTopicPath = noteTopicPath;

        let result: Question[] = [];
        let parsedQuestionInfoList: [CardType, string, number][] = this.parseQuestions();
        for (const t of parsedQuestionInfoList) {
            let parsedQuestionInfo: ParsedQuestionInfo = new ParsedQuestionInfo(t[0], t[1], t[2]);
            let question: Question = this.createQuestionObject(parsedQuestionInfo);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            let cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(question.questionType, question.questionTextCleaned, this.settings);

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList(question.questionTextOriginal, refDate);

            // we have some extra scheduling dates to delete
            let correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                question.hasChanged = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }

            // Create the list of card objects, and attach to the question
            let cardList: Card[] = this.createCardList(cardFrontBackList, cardScheduleInfoList);
            question.setCardList(cardList);
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
        let result: Question = new Question({ 
            questionType: cardType, 
            topicPath, 
            questionTextOriginal: originalQuestionText, 
            questionTextCleaned: rawQuestionText, 
            lineNo, 
            hasEditLaterTag, 
            questionTextHash, 
            context, 
            cards: null, 
            hasChanged: false
        });
        return result;
    }

    private createCardList(cardFrontBackList: CardFrontBack[], cardScheduleInfoList: CardScheduleInfo[]): Card[] { 

        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {

            let { front, back } = cardFrontBackList[i];

            let hasScheduleInfo: boolean = i < cardScheduleInfoList.length;
            const cardObj: Card = new Card({
                isDue: hasScheduleInfo,
                front,
                back,
                cardIdx: i
            });
            cardObj.scheduleInfo = hasScheduleInfo ? cardScheduleInfoList[i] : null;

            siblings.push(cardObj);
        }
        return siblings;
    }

    private determineTopicPathFromTags(tagList: string[]): TopicPath {
        let result: TopicPath = TopicPath.emptyPath;
        outer: for (const tagToReview of this.settings.flashcardTags) {
            for (const tag of tagList) {
                if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                    result = TopicPath.getTopicPathFromTag(tag);
                    break outer;
                }
            }
        }
        return result;
    }

}