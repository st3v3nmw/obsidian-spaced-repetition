
import { Card } from "./card";
import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "./constants";
import { Note } from "./note";
import { SRSettings } from "./settings";
import { ISRFile } from "./SRFile";
import { TopicPath } from "./TopicPath";

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
    questionTextOriginal: string;
    questionTextStrippedSR: string;
    questionTextCleaned: string;
    lineNo: number;
    hasEditLaterTag: boolean;
    questionTextHash: string;
    context: string;
    cards: Card[];
    hasChanged: boolean;

    constructor(init?: Partial<Question>) {
        Object.assign(this, init);
    }

    doesQuestionTextEndWithCodeBlock(): boolean {
        return this.questionTextStrippedSR.endsWith("```");
    }

    getQuestionTextSeparator(settings: SRSettings): string {
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
}


