import {CardType} from "src/scheduling";

export function escapeSeparator(separator: string): string {
    return separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function containsOnlySpacesAndOneSeparator(text: string, separator: string): boolean {
    // Remove any leading or trailing spaces
    text = text.trim();

    // Check if the text consists of only spaces and exactly one question mark
    const escapedSeparator = escapeSeparator(separator);

    const regexPattern = `^[ ]*${escapedSeparator}[ ]*$`;

    // console.log(regexPattern);

    const regex = new RegExp(regexPattern);
    return regex.test(text);
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
export function parse(
    text: string,
    singlelineCardSeparator: string,
    singlelineReversedCardSeparator: string,
    multilineCardSeparator: string,
    multilineReversedCardSeparator: string,
    convertHighlightsToClozes: boolean,
    convertBoldTextToClozes: boolean,
    convertCurlyBracketsToClozes: boolean
): [CardType, string, number][] {
    let cardText = "";
    const cards: [CardType, string, number][] = [];
    let cardType: CardType | null = null;
    let separatorLineNo = 0;

    // console.log("parser working...");

    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        // creates new card off newline
        // if (lines[i].length === 0) {
        //     if (cardType === null) {
        //         // the default card type is note, if we did not assign any other card types
        //         cardType = CardType.Note;
        //     }
        //
        //     console.log("cardType");
        //     console.log(cardType);
        //     console.log("cardText");
        //     console.log(cardText);
        //     cards.push([cardType, cardText, separatorLineNo]);
        //
        //     // reset card before continuing parsing
        //     cardType = null;
        //     cardText = "";
        //     continue;
        if (lines[i].startsWith("<!--") && !lines[i].startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !lines[i].includes("-->")) i++;
            i++;
            continue;
        }

        if (cardText.length > 0) {
            cardText += "\n";
        }

        // keep adding lines to cardText
        cardText += lines[i];

        if (
            lines[i].includes(singlelineReversedCardSeparator) ||
            lines[i].includes(singlelineCardSeparator)
        ) {
            cardType = lines[i].includes(singlelineReversedCardSeparator)
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            cardText = lines[i];
            separatorLineNo = i;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            cards.push([cardType, cardText, separatorLineNo]);
            cardType = null;
            cardText = "";
        } else if (
            cardType === null &&
            ((convertHighlightsToClozes && /==.*?==/gm.test(lines[i])) ||
                (convertBoldTextToClozes && /\*\*.*?\*\*/gm.test(lines[i])) ||
                (convertCurlyBracketsToClozes && /{{.*?}}/gm.test(lines[i])))
        ) {
            cardType = CardType.Cloze;
            separatorLineNo = i;
        } else if (containsOnlySpacesAndOneSeparator(lines[i], multilineCardSeparator)) {
            cardType = CardType.MultiLineBasic;
            separatorLineNo = i;
        } else if (containsOnlySpacesAndOneSeparator(lines[i], multilineReversedCardSeparator)) {
            cardType = CardType.MultiLineReversed;
            separatorLineNo = i;
        } else if (lines[i].startsWith("```") || lines[i].startsWith("~~~")) {
            const codeBlockClose = lines[i].match(/`+|~+/)[0];
            while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + codeBlockClose;
            i++;
        }
    }


    // add the last card
    // if (cardText) {
    if (cardType === null) {
        // we always want to create cards, so if no cardtype is found, make the cardtype note
        cardType = CardType.Note;
    }

    // console.log("cardType");
    // console.log(cardType);
    // console.log("cardText");
    // console.log(cardText);

    if (cardText == null) {
        cardText = "dummy";
    }
    cards.push([cardType, cardText, separatorLineNo]);
    // }


    return cards;
}
