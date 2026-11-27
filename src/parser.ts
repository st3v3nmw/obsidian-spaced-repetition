import { ClozeCrafter } from "clozecraft";

import { SR_METADATA_CALLOUT } from "src/data/constants";
import { CardType } from "src/data/data-structures/card/questions/question";

export let debugParser = false;

export interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string;
    clozePatterns: string[];
}

export function setDebugParser(value: boolean) {
    debugParser = value;
}

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

function markerInsideCodeBlock(text: string, marker: string, markerIndex: number): boolean {
    let goingBack = markerIndex - 1,
        goingForward = markerIndex + marker.length;
    let backTicksBefore = 0,
        backTicksAfter = 0;

    while (goingBack >= 0) {
        if (text[goingBack] === "`") backTicksBefore++;
        goingBack--;
    }

    while (goingForward < text.length) {
        if (text[goingForward] === "`") backTicksAfter++;
        goingForward++;
    }

    // If there's an odd number of backticks before and after,
    //  the marker is inside an inline code block
    return backTicksBefore % 2 === 1 && backTicksAfter % 2 === 1;
}

function hasInlineMarker(text: string, marker: string): boolean {
    // No marker provided
    if (marker.length === 0) return false;

    // Check if the marker is in the text
    const markerIdx = text.indexOf(marker);
    if (markerIdx === -1) return false;

    // Check if it's inside an inline code block
    return !markerInsideCodeBlock(text, marker, markerIdx);
}

/**
 * Determines whether a multiline card has no answer, i.e. there is nothing
 * after the separator line. Such cards are ignored, mirroring how a multiline
 * separator with an empty front is ignored.
 */
function hasEmptyAnswer(cardType: CardType, cardText: string, options: ParserOptions): boolean {
    if (cardType !== CardType.MultiLineBasic && cardType !== CardType.MultiLineReversed) {
        return false;
    }
    const separator: string =
        cardType === CardType.MultiLineBasic
            ? options.multilineCardSeparator
            : options.multilineReversedCardSeparator;
    const textLines: string[] = cardText.split("\n");
    const separatorIdx: number = textLines.findIndex((line) => line.trim() === separator);
    return textLines.slice(separatorIdx + 1).every((line) => line.trim().length === 0);
}

/**
 * Returns flashcards found in `text`
 *
 * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
 *
 * @param text - The text to extract flashcards from
 * @param ParserOptions - Parser options
 * @returns An array of parsed question information
 */
export function parse(text: string, options: ParserOptions): ParsedQuestionInfo[] {
    if (debugParser) {
        console.log("Text to parse:\n<<<" + text + ">>>");
    }

    // Sort inline separators by length, longest first
    const inlineSeparators = [
        { separator: options.singleLineCardSeparator, type: CardType.SingleLineBasic },
        { separator: options.singleLineReversedCardSeparator, type: CardType.SingleLineReversed },
    ];
    inlineSeparators.sort((a, b) => b.separator.length - a.separator.length);

    const cards: ParsedQuestionInfo[] = [];
    let cardText = "";
    let cardType: CardType | null = null;
    let firstLineNo = 0,
        lastLineNo: number;

    const clozecrafter = new ClozeCrafter(options.clozePatterns);
    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i],
            currentTrimmed = lines[i].trim();

        // Skip everything in HTML comments
        if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
            // Advance to the line closing the comment (may be the current line itself)
            while (i < lines.length && !lines[i].includes("-->")) i++;
            // If no card is being accumulated, the next card starts after the comment
            if (cardText.length === 0) {
                firstLineNo = i + 1;
            }
            // The for-loop's own i++ then moves past the comment's closing line
            continue;
        }

        // Have we reached the end of a card?
        const isEmptyLine = currentTrimmed.length === 0;
        const hasMultilineCardEndMarker =
            options.multilineCardEndMarker && currentTrimmed === options.multilineCardEndMarker;
        if (
            // We've probably reached the end of a card
            (isEmptyLine && !options.multilineCardEndMarker) ||
            // Empty line & we're not picking up any card
            (isEmptyLine && cardType === null) ||
            // We've reached the end of a multi line card &
            //  we're using custom end markers
            hasMultilineCardEndMarker
        ) {
            if (cardType) {
                // Create a new card, unless it's a multiline card with no answer
                if (!hasEmptyAnswer(cardType, cardText, options)) {
                    lastLineNo = i - 1;
                    cards.push(
                        new ParsedQuestionInfo(
                            cardType,
                            cardText.trimEnd(),
                            firstLineNo,
                            lastLineNo,
                        ),
                    );
                }
                cardType = null;
            }

            cardText = "";
            firstLineNo = i + 1;
            continue;
        }

        // Update card text
        if (cardText.length > 0) {
            cardText += "\n";
        }
        cardText += currentLine.trimEnd();

        // Pick up inline cards, but only while the card hasn't been given a
        // type yet — otherwise a "::" inside a multiline card's answer would
        // hijack (and discard) the card built up so far
        if (cardType === null) {
            for (const { separator, type } of inlineSeparators) {
                if (hasInlineMarker(currentLine, separator)) {
                    cardType = type;
                    break;
                }
            }
        }

        if (cardType === CardType.SingleLineBasic || cardType === CardType.SingleLineReversed) {
            cardText = currentLine;
            firstLineNo = i;

            // Pick up scheduling information if present
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            } else if (i + 1 < lines.length && lines[i + 1].startsWith(SR_METADATA_CALLOUT)) {
                for (let j = i + 1; j < lines.length; j++) {
                    cardText += "\n" + lines[j];
                    i++;
                    if (lines[j].includes("<!--SR:")) {
                        break;
                    }
                }
            }

            lastLineNo = i;
            cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));

            cardType = null;
            cardText = "";
        } else if (currentTrimmed === options.multilineCardSeparator) {
            // Ignore card if the front of the card is empty
            if (cardText.length > 1) {
                // Pick up multiline basic cards
                cardType = CardType.MultiLineBasic;
            }
        } else if (currentTrimmed === options.multilineReversedCardSeparator) {
            // Ignore card if the front of the card is empty
            if (cardText.length > 1) {
                // Pick up multiline basic cards
                cardType = CardType.MultiLineReversed;
            }
        } else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
            // Pick up codeblocks
            const codeBlockClose = currentLine.match(/`+|~+/)[0];
            while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + codeBlockClose;
            i++;
        } else if (cardType === null && clozecrafter.isClozeNote(currentLine)) {
            // Pick up cloze cards
            cardType = CardType.Cloze;
        }
    }

    // Do we have a card left in the queue?
    if (cardType && cardText && !hasEmptyAnswer(cardType, cardText, options)) {
        lastLineNo = lines.length - 1;
        cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
    }

    if (debugParser) {
        console.log("Parsed cards:\n", cards);
    }

    return cards;
}
