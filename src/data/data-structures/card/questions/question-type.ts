import { ClozeCrafter, IClozeFormatter } from "clozecraft";

import {
    extractProgressiveHints,
    renderProgressiveHints,
} from "src/data/data-structures/card/questions/progressive-hints";
import { CardType } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { findLineIndexOfSearchStringIgnoringWs } from "src/utils/strings";

export class CardFrontBack {
    front: string;
    hintFronts: string[];
    back: string;

    // The caller is responsible for any required trimming of leading/trailing spaces
    constructor(front: string, back: string, hintFronts: string[] = []) {
        this.front = front;
        this.back = back;
        this.hintFronts = hintFronts;
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
        const progressiveHints = extractProgressiveHints(questionText);
        const clozecrafter = new ClozeCrafter(settings.clozePatterns);
        const clozeNote = clozecrafter.createClozeNote(progressiveHints.text);

        // Determine which question formatter to use based on settings (Cloze patterns as inputs or not).
        const clozeFormatter = settings.convertClozePatternsToInputs
            ? new QuestionTypeClozeInputFormatter()
            : new QuestionTypeClozeFormatter();

        let front: string, back: string;
        const result: CardFrontBack[] = [];
        if (clozeNote === null) return result;

        for (let i = 0; i < clozeNote.numCards; i++) {
            const rawFront = clozeNote.getCardFront(i, clozeFormatter);
            const rawBack = clozeNote.getCardBack(i, clozeFormatter);
            front = renderProgressiveHints(rawFront, progressiveHints.hints, null);
            const hintFronts = progressiveHints.levels.map((level) =>
                renderProgressiveHints(rawFront, progressiveHints.hints, level),
            );
            back = renderProgressiveHints(
                rawBack,
                progressiveHints.hints,
                progressiveHints.levels.length > 0
                    ? progressiveHints.levels[progressiveHints.levels.length - 1]
                    : null,
            );
            result.push(new CardFrontBack(front, back, hintFronts));
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
