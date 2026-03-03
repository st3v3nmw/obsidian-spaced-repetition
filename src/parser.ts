import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";

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
    QuestionParser.debugParser = value;
    debugParser = value; // TODO: remove this
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

// All the states that the parser can be in, when parsing a note for cards
export type ParserStates = "READY_TO_PARSE" | "NOTHING_DETECTED" | "SR_HTML_COMMENT_DETECTED" | "NON_SR_HTML_COMMENT_DETECTED" |
    "SINGLE_LINE_BASIC_DETECTED" | "SINGLE_LINE_REVERSED_DETECTED" | "MULTI_LINE_BASIC_DETECTED" |
    "MULTI_LINE_REVERSED_DETECTED" | "CLOZE_DETECTED";

export class QuestionParser {
    static debugParser = false;
    static currentParserState: ParserStates = "READY_TO_PARSE";

    /**
     * Returns flashcards found in `text`
     *
     * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
     *
     * @param text - The text to extract flashcards from
     * @param ParserOptions - Parser options
     * @returns An array of parsed question information
     */
    static parse(text: string, options: ParserOptions): ParsedQuestionInfo[] {
        QuestionParser.resetParserState();

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

        const clozeCrafter = new ClozeCrafter(options.clozePatterns);
        const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");

        // TODO: make this a final state machine
        // TODO: keep in mind that cleanup is also needed for rouge sr comments
        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const currentTrimmed = lines[i].trim();

            // Analyze the current line based on the current state
            switch (QuestionParser.currentParserState) {
                case "READY_TO_PARSE": // Start of parsing a note at Line 0
                    break;
                case "NON_SR_HTML_COMMENT_DETECTED": // Reached a line that is a non SR HTML comment
                    // Could go on for a while, so we skip till we find the end of the comment
                    break;
                case "SR_HTML_COMMENT_DETECTED": // Reached a line that is a SR HTML comment
                    // Shouldn't be multiline
                    break;
                case "SINGLE_LINE_BASIC_DETECTED": // Reached a line that is a single line basic card
                    // Shouldn't be multiline
                    break;
                case "SINGLE_LINE_REVERSED_DETECTED": // Reached a line that is a single line reversed card
                    // Shouldn't be multiline
                    break;
                case "MULTI_LINE_BASIC_DETECTED":
                    break;
                case "MULTI_LINE_REVERSED_DETECTED":
                    break;
                case "NOTHING_DETECTED": // This is an empty line
                    // Could go on for a while
                    break;
            }

            // ----- OLD CODE -----

            // Skip everything in HTML comments
            if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
                while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
                i++;
                continue;
            }

            // Have we reached the end of a card?
            const isEmptyLine = currentTrimmed.length === 0;
            const hasMultilineCardEndMarker =
                options.multilineCardEndMarker && !isEmptyLine && currentTrimmed === options.multilineCardEndMarker;

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
                    // Create a new card
                    lastLineNo = i - 1;
                    if (options.multilineCardEndMarker && (cardType === CardType.MultiLineBasic || cardType === CardType.MultiLineReversed)) {
                        console.log(cardText);
                    }

                    cards.push(
                        new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo),
                    );
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

            // Pick up inline cards
            for (const { separator, type } of inlineSeparators) {
                if (QuestionParser.hasInlineMarker(currentLine, separator)) {
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
            } else if (cardType === null && clozeCrafter.isClozeNote(currentLine)) {
                // Pick up cloze cards
                cardType = CardType.Cloze;
            }
        }

        // Do we have a card left in the queue?
        if (cardType && cardText) {
            lastLineNo = lines.length - 1;
            cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
        }

        if (debugParser) {
            console.log("Parsed cards:\n", cards);
        }

        this.resetParserState();

        return cards;
    }

    private static resetParserState() {
        QuestionParser.currentParserState = "READY_TO_PARSE";
    }

    static isStartOfNonSRHTMLComment(line: string): boolean {
        return line.startsWith("<!--") && !line.startsWith("<!--SR:");
    }

    static isEndOfHTMLComment(line: string): boolean {
        return line.includes("-->");
    }

    static isSRHTMLComment(line: string): boolean {
        return line.startsWith("<!--SR:");
    }

    static isMultiLineCardEndMarker(line: string, multilineCardEndMarker: string): boolean {
        return line.trim() === multilineCardEndMarker;
    }

    static markerInsideCodeBlock(text: string, marker: string, markerIndex: number): boolean {
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

    static hasInlineMarker(text: string, marker: string): boolean {
        // No marker provided
        if (marker.length === 0) return false;

        // Check if the marker is in the text
        const markerIdx = text.indexOf(marker);
        if (markerIdx === -1) return false;

        // Check if it's inside an inline code block
        return !QuestionParser.markerInsideCodeBlock(text, marker, markerIdx);
    }
}