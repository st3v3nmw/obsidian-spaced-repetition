import { CardType } from "./Question";

export class ParsedQuestionInfo {
    cardType: CardType;
    text: string;

    // Line numbers start at 0
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
 * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
 *
 * Multi-line question with blank lines user workaround:
 *      As of 3/04/2024 there is no support for including blank lines within multi-line questions
 *      As a workaround, one user uses a zero width Unicode character - U+200B
 *      https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/915#issuecomment-2031003092
 *
 * @param text - The text to extract flashcards from
 * @param singlelineCardSeparator - Separator for inline basic cards
 * @param singlelineReversedCardSeparator - Separator for inline reversed cards
 * @param multilineCardSeparator - Separator for multiline basic cards
 * @param multilineReversedCardSeparator - Separator for multiline basic card
 * @param multilineCardEndMarker - Marker indicating the end of a multi-line card
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(
    text: string,
    singlelineCardSeparator: string,
    singlelineReversedCardSeparator: string,
    multilineCardSeparator: string,
    multilineReversedCardSeparator: string,
    multilineCardEndMarker: string,
    convertHighlightsToClozes: boolean,
    convertBoldTextToClozes: boolean,
    convertCurlyBracketsToClozes: boolean,
): ParsedQuestionInfo[] {
    let cardText = "";
    const cards: ParsedQuestionInfo[] = [];
    let cardType: CardType | null = null;
    let firstLineNo = 0;
    
    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];

        if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !lines[i + 1].includes("-->")) i++;
            i++;
            continue;
        }

        if (
            cardType &&
            currentLine.trim() === multilineCardEndMarker
        ) {
            const lastLineNo = i;
            cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));
            cardType = null;
            cardText = "";
            continue;
        }

        if (cardText.length > 0) {
            cardText += "\n";
        } else {
            firstLineNo = i;
        }
        cardText += currentLine;

        if (
            currentLine.includes(singlelineReversedCardSeparator) ||
            currentLine.includes(singlelineCardSeparator)
        ) {
            cardType = currentLine.includes(singlelineReversedCardSeparator)
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            cardText = currentLine;
            firstLineNo = i;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            const lastLineNo = i;
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
        const lastLineNo = lines.length - 1;
        cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));
    }

    return cards;
}
