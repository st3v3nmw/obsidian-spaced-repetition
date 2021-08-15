import { CardType } from "src/types";

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
export function parse(
    text: string,
    singlelineCardSeparator: string,
    singlelineReversedCardSeparator: string,
    multilineCardSeparator: string,
    multilineReversedCardSeparator: string
): [CardType, string, number][] {
    let cardText: string = "";
    let cards: [CardType, string, number][] = [];
    let cardType: CardType | null = null;
    let lineNo: number = 0;

    let lines: string[] = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) {
            if (cardType) {
                cards.push([cardType, cardText, lineNo]);
                cardType = null;
            }

            cardText = "";
            continue;
        } else if (lines[i].startsWith("<!--") && !lines[i].startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !lines[i + 1].includes("-->")) i++;
            i++;
            continue;
        }

        if (cardText.length > 0) {
            cardText += "\n";
        }
        cardText += lines[i];

        if (
            lines[i].includes(singlelineReversedCardSeparator) ||
            lines[i].includes(singlelineCardSeparator)
        ) {
            cardType = lines[i].includes(singlelineReversedCardSeparator)
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            cardText = lines[i];
            lineNo = i;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            cards.push([cardType, cardText, lineNo]);
            cardType = null;
            cardText = "";
        } else if (cardType === null && /==.*?==/gm.test(lines[i])) {
            cardType = CardType.Cloze;
            lineNo = i;
        } else if (lines[i] === multilineCardSeparator) {
            cardType = CardType.MultiLineBasic;
            lineNo = i;
        } else if (lines[i] === multilineReversedCardSeparator) {
            cardType = CardType.MultiLineReversed;
            lineNo = i;
        } else if (lines[i].startsWith("```")) {
            while (i + 1 < lines.length && !lines[i + 1].startsWith("```")) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + "```";
            i++;
        }
    }

    if (cardType && cardText) {
        cards.push([cardType, cardText, lineNo]);
    }

    return cards;
}
