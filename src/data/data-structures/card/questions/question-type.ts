import { ClozeCrafter, IClozeFormatter } from "clozecraft";

import { CardType } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import {
    findLineIndexEndingWithTag,
    findLineIndexOfSearchStringIgnoringWs,
    removeTrailingTag,
} from "src/utils/strings";

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

// Splits a multiline basic question into front & back.
// The question is written either with a separator line ("?"), or with a tag at the end of the
// last question line ("Question #card"); whichever appears first is used.
export function splitMultiLineBasic(
    questionText: string,
    settings: SRSettings,
): { front: string; back: string; usesTag: boolean } {
    // We don't need to worry about "\r\n", as multi line questions processed by parse() concatenates lines explicitly with "\n"
    const questionLines = questionText.split("\n");
    const separatorIdx = findLineIndexOfSearchStringIgnoringWs(
        questionLines,
        settings.multilineCardSeparator,
    );
    const tagIdx = findLineIndexEndingWithTag(questionLines, settings.multilineCardTag);

    if (tagIdx !== -1 && (separatorIdx === -1 || tagIdx < separatorIdx)) {
        const frontLines = questionLines.slice(0, tagIdx);
        frontLines.push(removeTrailingTag(questionLines[tagIdx], settings.multilineCardTag));
        return {
            front: frontLines.join("\n"),
            back: questionLines.slice(tagIdx + 1).join("\n"),
            usesTag: true,
        };
    }

    return {
        front: questionLines.slice(0, separatorIdx).join("\n"),
        back: questionLines.slice(separatorIdx + 1).join("\n"),
        usesTag: false,
    };
}

class QuestionTypeMultiLineBasic implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const { front, back } = splitMultiLineBasic(questionText, settings);

        const result: CardFrontBack[] = [new CardFrontBack(front, back)];
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
        const clozecrafter = new ClozeCrafter(settings.clozePatterns);
        const clozeNote = clozecrafter.createClozeNote(questionText);

        // Determine which question formatter to use based on settings (Cloze patterns as inputs or not).
        const clozeFormatter = settings.convertClozePatternsToInputs
            ? new QuestionTypeClozeInputFormatter()
            : new QuestionTypeClozeFormatter();

        let front: string, back: string;
        const result: CardFrontBack[] = [];
        if (clozeNote === null) return result;

        for (let i = 0; i < clozeNote.numCards; i++) {
            front = clozeNote.getCardFront(i, clozeFormatter);
            back = clozeNote.getCardBack(i, clozeFormatter);
            result.push(new CardFrontBack(front, back));
        }

        return result;
    }
}

export class QuestionTypeClozeFormatter implements IClozeFormatter {
    asking(_?: string, hint?: string): string {
        return `<span style='color:#2196f3'>${!hint ? "[...]" : `[${hint}]`}</span>`;
    }

    showingAnswer(answer: string, _?: string): string {
        return `<span style='color:#2196f3'>${answer}</span>`;
    }

    hiding(_?: string, hint?: string): string {
        return `<span style='color:var(--code-comment)'>${!hint ? "[...]" : `[${hint}]`}</span>`;
    }
}

export class QuestionTypeClozeInputFormatter implements IClozeFormatter {
    asking(answer?: string, hint?: string): string {
        return `<span style='color:#2196f3'><input class="cloze-input" type="text" size="${!answer ? 1 : answer.length}" />${!hint ? "" : `[${hint}]`}</span>`;
    }

    showingAnswer(answer: string, _?: string): string {
        return `<span class="cloze-answer" style='color:#2196f3'>${answer}</span>`;
    }

    hiding(_?: string, hint?: string): string {
        return `<span style='color:var(--code-comment)'>${!hint ? "[...]" : `[${hint}]`}</span>`;
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
