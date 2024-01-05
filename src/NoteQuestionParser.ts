import { Card } from "./Card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { parseEx, ParsedQuestionInfo } from "./parser";
import { CardType, Question } from "./Question";
import { CardFrontBack, CardFrontBackUtil } from "./QuestionType";
import { SRSettings } from "./settings";
import { ISRFile } from "./SRFile";
import { TopicPath, TopicPathList } from "./TopicPath";

export class NoteQuestionParser {
    settings: SRSettings;
    noteFile: ISRFile;
    noteTopicPathList: TopicPathList;
    noteText: string;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async createQuestionList(noteFile: ISRFile, folderTopicPath: TopicPath): Promise<Question[]> {
        this.noteFile = noteFile;
        const noteText: string = await noteFile.read();
        let noteTopicPathList: TopicPathList;
        if (this.settings.convertFoldersToDecks) {
            noteTopicPathList = new TopicPathList([ folderTopicPath ]);
        } else {
            const tagList: string[] = noteFile.getAllTags();
            noteTopicPathList = this.determineTopicPathListFromTags(tagList);
        }
        const result: Question[] = this.doCreateQuestionList(noteText, noteTopicPathList);
        return result;
    }

    private doCreateQuestionList(noteText: string, noteTopicPathList: TopicPathList): Question[] {
        this.noteText = noteText;
        this.noteTopicPathList = noteTopicPathList;

        const result: Question[] = [];
        const parsedQuestionInfoList: ParsedQuestionInfo[] = this.parseQuestions();
        for (const parsedQuestionInfo of parsedQuestionInfoList) {
            const question: Question = this.createQuestionObject(parsedQuestionInfo);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            const cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(
                question.questionType,
                question.questionText.actualQuestion,
                this.settings,
            );

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] =
                NoteCardScheduleParser.createCardScheduleInfoList(question.questionText.original);

            // we have some extra scheduling dates to delete
            const correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                question.hasChanged = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }

            // Create the list of card objects, and attach to the question
            const cardList: Card[] = this.createCardList(cardFrontBackList, cardScheduleInfoList);
            question.setCardList(cardList);
            result.push(question);
        }
        return result;
    }

    private parseQuestions(): ParsedQuestionInfo[] {
        const settings: SRSettings = this.settings;
        const result: ParsedQuestionInfo[] = parseEx(
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

        const questionContext: string[] = this.noteFile.getQuestionContext(parsedQuestionInfo.firstLineNum);
        const result = Question.Create(
            this.settings,
            parsedQuestionInfo,
            this.noteTopicPathList,
            questionContext,
        );
        return result;
    }

    private createCardList(
        cardFrontBackList: CardFrontBack[],
        cardScheduleInfoList: CardScheduleInfo[],
    ): Card[] {
        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {
            const { front, back } = cardFrontBackList[i];

            const hasScheduleInfo: boolean = i < cardScheduleInfoList.length;
            const schedule: CardScheduleInfo = cardScheduleInfoList[i];

            const cardObj: Card = new Card({
                front,
                back,
                cardIdx: i,
            });
            cardObj.scheduleInfo =
                hasScheduleInfo && !schedule.isDummyScheduleForNewCard() ? schedule : null;

            siblings.push(cardObj);
        }
        return siblings;
    }

    private determineTopicPathListFromTags(tagList: string[]): TopicPathList {
        let result: TopicPath[] = [];
        outer: for (const tagToReview of this.settings.flashcardTags) {
            for (const tag of tagList) {
                if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                    result.push(TopicPath.getTopicPathFromTag(tag));
                }
            }
        }
        return new TopicPathList(result);
    }
}
