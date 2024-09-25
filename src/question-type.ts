import { CardType } from "src/question";
import { SRSettings } from "src/settings";
import { findLineIndexOfSearchStringIgnoringWs } from "src/utils/strings";

export class CardFrontBack {
    front: string;
    back: string;

    // The caller is responsible for any required trimming of leading/trailing spaces
    constructor(front: string, back: string) {
        this.front = front;
        this.back = back;
    }
}

export class CardFrontBackUtil {
    static expand(
        questionType: CardType,
        questionText: string,
        settings: SRSettings,
    ): CardFrontBack[] {
        const handler: IQuestionTypeHandler = QuestionTypeFactory.create(questionType);
        return handler.expand(questionText, settings);
    }
}

export interface IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[];
}

class QuestionTypeSingleLineBasic implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const idx: number = questionText.indexOf(settings.singleLineCardSeparator);
        const item: CardFrontBack = new CardFrontBack(
            questionText.substring(0, idx),
            questionText.substring(idx + settings.singleLineCardSeparator.length),
        );
        const result: CardFrontBack[] = [item];
        return result;
    }
}

class QuestionTypeSingleLineReversed implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const idx: number = questionText.indexOf(settings.singleLineReversedCardSeparator);
        const side1: string = questionText.substring(0, idx),
            side2: string = questionText.substring(
                idx + settings.singleLineReversedCardSeparator.length,
            );
        const result: CardFrontBack[] = [
            new CardFrontBack(side1, side2),
            new CardFrontBack(side2, side1),
        ];
        return result;
    }
}

class QuestionTypeMultiLineBasic implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        // We don't need to worry about "\r\n", as multi line questions processed by parse() concatenates lines explicitly with "\n"
        const questionLines = questionText.split("\n");
        const lineIdx = findLineIndexOfSearchStringIgnoringWs(
            questionLines,
            settings.multilineCardSeparator,
        );
        const side1: string = questionLines.slice(0, lineIdx).join("\n");
        const side2: string = questionLines.slice(lineIdx + 1).join("\n");

        const result: CardFrontBack[] = [new CardFrontBack(side1, side2)];
        return result;
    }
}

class QuestionTypeMultiLineReversed implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        // We don't need to worry about "\r\n", as multi line questions processed by parse() concatenates lines explicitly with "\n"
        const questionLines = questionText.split("\n");
        const lineIdx = findLineIndexOfSearchStringIgnoringWs(
            questionLines,
            settings.multilineReversedCardSeparator,
        );
        const side1: string = questionLines.slice(0, lineIdx).join("\n");
        const side2: string = questionLines.slice(lineIdx + 1).join("\n");

        const result: CardFrontBack[] = [
            new CardFrontBack(side1, side2),
            new CardFrontBack(side2, side1),
        ];
        return result;
    }
}

class QuestionTypeCloze implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const siblings: RegExpMatchArray[] = [];
        if (settings.convertHighlightsToClozes) {
            siblings.push(...questionText.matchAll(/==(.*?)==/gm));
        }
        if (settings.convertBoldTextToClozes) {
            siblings.push(...questionText.matchAll(/\*\*(.*?)\*\*/gm));
        }
        if (settings.convertCurlyBracketsToClozes) {
            siblings.push(...questionText.matchAll(/{{(.*?)}}/gm));
        }
        siblings.sort((a, b) => {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            // What is unit test to cover following statement; otherwise jest please ignore
            return 0;
        });

        let front: string, back: string;
        const result: CardFrontBack[] = [];
        for (const m of siblings) {
            const deletionStart: number = m.index,
                deletionEnd: number = deletionStart + m[0].length;
            front =
                questionText.substring(0, deletionStart) +
                QuestionTypeClozeUtil.renderClozeFront() +
                questionText.substring(deletionEnd);
            front = QuestionTypeClozeUtil.removeClozeTokens(front, settings);
            back =
                questionText.substring(0, deletionStart) +
                QuestionTypeClozeUtil.renderClozeBack(
                    questionText.substring(deletionStart, deletionEnd),
                ) +
                questionText.substring(deletionEnd);
            back = QuestionTypeClozeUtil.removeClozeTokens(back, settings);
            result.push(new CardFrontBack(front, back));
        }

        return result;
    }
}

export class QuestionTypeClozeUtil {
    static renderClozeFront(): string {
        return "<span style='color:#2196f3'>[...]</span>";
    }

    static renderClozeBack(str: string): string {
        return "<span style='color:#2196f3'>" + str + "</span>";
    }

    static removeClozeTokens(text: string, settings: SRSettings): string {
        let result: string = text;
        if (settings.convertHighlightsToClozes) result = result.replace(/==/gm, "");
        if (settings.convertBoldTextToClozes) result = result.replace(/\*\*/gm, "");
        if (settings.convertCurlyBracketsToClozes) {
            result = result.replace(/{{/gm, "").replace(/}}/gm, "");
        }
        return result;
    }
}

export class QuestionTypeFactory {
    static create(questionType: CardType): IQuestionTypeHandler {
        let handler: IQuestionTypeHandler;
        switch (questionType) {
            case CardType.SingleLineBasic:
                handler = new QuestionTypeSingleLineBasic();
                break;
            case CardType.SingleLineReversed:
                handler = new QuestionTypeSingleLineReversed();
                break;
            case CardType.MultiLineBasic:
                handler = new QuestionTypeMultiLineBasic();
                break;
            case CardType.MultiLineReversed:
                handler = new QuestionTypeMultiLineReversed();
                break;
            case CardType.Cloze:
                handler = new QuestionTypeCloze();
                break;
        }
        return handler;
    }
}
