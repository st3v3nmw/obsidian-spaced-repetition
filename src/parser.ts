import { CardType } from "./Question";

export class ParsedQuestionInfo {
    cardType: CardType;
    text: string;
    firstLineNum: number;
    lastLineNum: number;

    constructor(cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) {
        this.cardType = cardType;
        this.text = text;
        this.firstLineNum = firstLineNum;
        this.lastLineNum = lastLineNum;
    }

    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }
}

/**
 * Returns flashcards found in `text`
 *
 * @param text - The text to extract flashcards from
 * @param singlelineCardSeparator - Separator for inline basic cards
 * @param singlelineReversedCardSeparator - Separator for inline reversed cards
 * @param multilineCardSeparator - Separator for multiline basic cards
 * @param multilineReversedCardSeparator - Separator for multiline basic card
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(
    text: string,
    singlelineCardSeparator: string,
    singlelineReversedCardSeparator: string,
    multilineCardSeparator: string,
    multilineReversedCardSeparator: string,
    convertHighlightsToClozes: boolean,
    convertBoldTextToClozes: boolean,
    convertCurlyBracketsToClozes: boolean,
): ParsedQuestionInfo[] {
    let cardText = "";
    const cards: ParsedQuestionInfo[] = [];
    let cardType: CardType | null = null;
    let firstLineNo = 0;
    let lastLineNo = 0;

    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        if (currentLine.length === 0) {
            if (cardType) {
                lastLineNo = i - 1;
                cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));
                cardType = null;
            }

            cardText = "";
            continue;
        } else if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
            i++;
            continue;
        }

        if (cardText.length > 0) {
            cardText += "\n";
        } else if (cardText.length === 0) {
            // This could be the first line of a multi line question
            firstLineNo = i;
        }
        cardText += currentLine.trimEnd();

        if (
            currentLine.includes(singlelineReversedCardSeparator) ||
            currentLine.includes(singlelineCardSeparator)
        ) {
            cardType = lines[i].includes(singlelineReversedCardSeparator)
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            cardText = lines[i];
            firstLineNo = i;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            lastLineNo = i;
            cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));
            cardType = null;
            cardText = "";
        } else if (
            cardType === null &&
            ((convertHighlightsToClozes && /==.*?==/gm.test(currentLine)) ||
                (convertBoldTextToClozes && /\*\*.*?\*\*/gm.test(currentLine)) ||
                (convertCurlyBracketsToClozes && /{{.*?}}/gm.test(currentLine)))
        ) {
            cardType = CardType.Cloze;

            // Explicitly don't change firstLineNo, as we might not see the cloze markers on the first line
            // of a multi line cloze question. I.e. firstLineNo may be less than i;
        } else if (currentLine.trim() === multilineCardSeparator) {
            cardType = CardType.MultiLineBasic;
            // Explicitly don't change firstLineNo, as per above comment
        } else if (currentLine.trim() === multilineReversedCardSeparator) {
            cardType = CardType.MultiLineReversed;
            // Explicitly don't change firstLineNo, as per above comment
        } else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
            const codeBlockClose = currentLine.match(/`+|~+/)[0];
            while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + codeBlockClose;
            i++;
        }
    }

    if (cardType && cardText) {
        lastLineNo = lines.length - 1;
        cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));
    }

    return cards;
}
