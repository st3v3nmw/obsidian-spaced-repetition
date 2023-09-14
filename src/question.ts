
import { Card } from "./Card";
import { NoteCardScheduleParser } from "./CardSchedule";
import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "./constants";
import { Note } from "./Note";
import { SRSettings } from "./settings";
import { ISRFile } from "./SRFile";
import { TopicPath } from "./TopicPath";
import { cyrb53, escapeRegexString } from "./util/utils";

export enum CardType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

export class Question { 
    note: Note;
    questionType: CardType;
    topicPath: TopicPath;
    questionTextStrippedSR: string;
    questionTextCleaned: string;
    lineNo: number;
    hasEditLaterTag: boolean;
    questionTextHash: string;
    context: string;
    cards: Card[];
    hasChanged: boolean;

    private _questionTextOriginal: string;

    get questionTextOriginal(): string {
        return this._questionTextOriginal;
    }

    constructor(init?: Partial<Question>) {
        Object.assign(this, init);
    }

    doesQuestionTextEndWithCodeBlock(): boolean {
        return this.questionTextStrippedSR.endsWith("```");
    }

    getHtmlCommentSeparator(settings: SRSettings): string {
        let sep: string = settings.cardCommentOnSameLine ? " " : "\n";
        // Override separator if last block is a codeblock
        if (this.doesQuestionTextEndWithCodeBlock() && sep !== "\n") {
            sep = "\n";
        }
        return sep;
    }

    setCardList(cards: Card[]): void {
        this.cards = cards;
        this.cards.forEach((card) => card.question = this);
    }

    formatScheduleAsHtmlComment(settings: SRSettings): string {
        let result: string = SR_HTML_COMMENT_BEGIN;
        for (let i = 0; i < this.cards.length; i++)
            result += this.cards[i].formatSchedule(settings);
        result += SR_HTML_COMMENT_END;
        return result;
    }

    formatForNote(settings: SRSettings): string {
        let result = 
            this.questionTextStrippedSR + 
            this.getHtmlCommentSeparator(settings) + 
            this.formatScheduleAsHtmlComment(settings);
        return result;
    }

    async writeQuestion(settings: SRSettings): Promise<void> {

        let originalText: string = this.questionTextOriginal;
        const originalTextRegex = new RegExp(escapeRegexString(originalText), "gm");

        let fileText: string = await this.note.file.read();
        let replacementText = this.formatForNote(settings);
        let newText: string = fileText.replace(originalTextRegex, replacementText);
        await this.note.file.write(newText);
        this.questionTextStrippedSR = replacementText;
    }

    static Create(settings: SRSettings, questionType: CardType, noteTopicPath: TopicPath, questionTextOriginal: string, 
        lineNo: number, context: string): Question {

        let questionTextStrippedSR = NoteCardScheduleParser.removeCardScheduleInfo(questionTextOriginal).trim();
        let questionTextCleaned = questionTextStrippedSR;
        let hasEditLaterTag = questionTextStrippedSR.includes(settings.editLaterTag);
        let topicPath: TopicPath = noteTopicPath;
        if (!settings.convertFoldersToDecks) {
            const t = TopicPath.getTopicPathFromCardText(questionTextStrippedSR);
            if (t?.hasPath) {
                topicPath = t;
                questionTextCleaned = TopicPath.removeTopicPathFromStartOfCardText(questionTextCleaned)
            }
        }

        const questionTextHash: string = cyrb53(questionTextStrippedSR);
        let result: Question = new Question({ 
            questionType, 
            topicPath, 
            questionTextCleaned, 
            lineNo, 
            hasEditLaterTag, 
            questionTextHash, 
            context, 
            cards: null, 
            hasChanged: false
        });
        result._questionTextOriginal = questionTextOriginal;

        return result;
    }
}


