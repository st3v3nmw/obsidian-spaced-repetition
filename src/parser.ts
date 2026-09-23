import { ClozeCrafter } from "clozecraft";

import { SR_METADATA_CALLOUT } from "src/data/constants";
import { CardType } from "src/data/data-structures/card/questions/question";

export let debugParser = false;

export interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardStartMarker: string;
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
    // When start marker is empty, behave as always "in region" (legacy)
    const startMarkerMode = !!options.multilineCardStartMarker;
    let inCardRegion = !startMarkerMode;

    const clozecrafter = new ClozeCrafter(options.clozePatterns);
    const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");

    const isStartMarker = (s: string) =>
        !!options.multilineCardStartMarker && s === options.multilineCardStartMarker;
    const isEndMarker = (s: string) =>
        !!options.multilineCardEndMarker && s === options.multilineCardEndMarker;
    const markersAreSame =
        startMarkerMode &&
        !!options.multilineCardEndMarker &&
        options.multilineCardStartMarker === options.multilineCardEndMarker;

    const commit = (endLineNo: number) => {
        if (cardType && cardText) {
            cards.push(
                new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, endLineNo),
            );
        }
        cardType = null;
        cardText = "";
    };

    const tryParseSingleLineCard = (i: number, currentLine: string): number | null => {
        let matchedType: CardType | null = null;
        for (const { separator, type } of inlineSeparators) {
            if (hasInlineMarker(currentLine, separator)) {
                matchedType = type;
                break;
            }
        }
        if (
            matchedType !== CardType.SingleLineBasic &&
            matchedType !== CardType.SingleLineReversed
        ) {
            return null;
        }

        let text = currentLine;
        let lineIndex = i;
        firstLineNo = i;

        // Pick up scheduling information if present
        if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
            text += "\n" + lines[i + 1];
            lineIndex++;
        } else if (i + 1 < lines.length && lines[i + 1].startsWith(SR_METADATA_CALLOUT)) {
            for (let j = i + 1; j < lines.length; j++) {
                text += "\n" + lines[j];
                lineIndex = j;
                if (lines[j].includes("<!--SR:")) {
                    break;
                }
            }
        }

        cards.push(new ParsedQuestionInfo(matchedType, text, firstLineNo, lineIndex));
        return lineIndex;
    };

    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i],
            currentTrimmed = lines[i].trim();

        // Skip everything in HTML comments
        if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
            while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
            i++;
            continue;
        }

        // Explicit start boundary
        if (isStartMarker(currentTrimmed)) {
            if (inCardRegion) {
                if (markersAreSame) {
                    // Same start/end marker: toggle closed
                    commit(i - 1);
                    inCardRegion = false;
                    firstLineNo = i + 1;
                    continue;
                }
                // Different markers: close previous (if any) then reopen
                commit(i - 1);
            }
            inCardRegion = true;
            cardText = "";
            cardType = null;
            firstLineNo = i + 1;
            continue;
        }

        // Explicit end boundary
        if (isEndMarker(currentTrimmed)) {
            if (inCardRegion) {
                commit(i - 1);
                if (startMarkerMode) {
                    inCardRegion = false;
                }
                firstLineNo = i + 1;
            }
            continue;
        }

        // Outside an explicit region: only single-line cards are allowed
        if (startMarkerMode && !inCardRegion) {
            const consumedUntil = tryParseSingleLineCard(i, currentLine);
            if (consumedUntil !== null) {
                i = consumedUntil;
            }
            continue;
        }

        // Legacy / region blank-line handling
        const isEmptyLine = currentTrimmed.length === 0;
        if (isEmptyLine) {
            const endOnBlank =
                // Classic mode: blank line ends the card when no end marker
                (!options.multilineCardEndMarker && !startMarkerMode) ||
                // End-marker-only mode: blank line resets while type not yet known
                (!startMarkerMode && cardType === null);

            if (endOnBlank) {
                commit(i - 1);
                firstLineNo = i + 1;
                continue;
            }
            // Start-marker mode (or typed card with end marker): keep blank line in buffer
        }

        // Update card text
        if (cardText.length > 0) {
            cardText += "\n";
        }
        cardText += currentLine.trimEnd();

        // Pick up inline cards
        for (const { separator, type } of inlineSeparators) {
            if (hasInlineMarker(currentLine, separator)) {
                cardType = type;
                break;
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
    if (inCardRegion) {
        commit(lines.length - 1);
    }

    if (debugParser) {
        console.log("Parsed cards:\n", cards);
    }

    return cards;
}
