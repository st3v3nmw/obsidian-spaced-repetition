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
export type ParserStates = "READY_TO_PARSE" | "LOOKING_FOR_CARD_START" | "FOUND_CLOZE_LOOK_FOR_CONTINUATION";

export class QuestionParser {
    static debugParser = false; // Enable to see the parser state changes
    static currentParserState: ParserStates = "READY_TO_PARSE"; // The current parser state
    static readonly srCommentStart = "<!--SR:"; // The start of a scheduling info comment
    static readonly nonSrCommentStart = "<!--"; // The start of a non scheduling info comment
    static readonly commentEnd = "-->"; // The end of a comment
    static multilineCardEndMarker: string | undefined = undefined; // The multiline card end marker

    static cardText: string = ""; // The text of the current card
    static potentialCardTextLines: string[] = []; // The potential additional text of the previous card -> important for multiline cards
    static potentialFrontCardText: string = ""; // The potential text of the front of the current card -> important for multiline cards
    static potentialBackCardText: string = ""; // The potential text of the back of the current card -> important for multiline cards
    static firstLineNo: number = -1; // The first line number of the current card
    static lastLineNo: number = -1; // The last line number of the current card
    static cardType: CardType | null = null; // The type of the current card
    static cards: ParsedQuestionInfo[] = []; // The list of detected cards
    static lines: string[] = []; // The lines of the current note
    static currentLine: string = ""; // The current line
    static currentLineTrimmed: string = ""; // The current line trimmed without whitespace

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

        // Create the cloze crafter
        const clozeCrafter = new ClozeCrafter(options.clozePatterns);

        // Split the text into lines
        QuestionParser.lines = text.replaceAll("\r\n", "\n").split("\n");

        // Start parsing
        QuestionParser.firstLineNo = 0;
        QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";

        for (let i = 0; i < QuestionParser.lines.length; i++) {
            QuestionParser.currentLine = QuestionParser.lines[i];
            QuestionParser.currentLineTrimmed = QuestionParser.currentLine.trim();
            // define a function that will skip to the next line for quicker parsing
            const skipLine = () => {
                i++;
                QuestionParser.currentLine = QuestionParser.lines[i];
                QuestionParser.currentLineTrimmed = QuestionParser.currentLine.trim();
                if (QuestionParser.debugParser) {
                    console.log("Skipping line: " + QuestionParser.currentLine);
                    console.log("Current parser state: " + QuestionParser.currentParserState);
                }
                return i;
            };

            const getScheduleInfoIfPresent = () => {
                if (i + 1 < QuestionParser.lines.length && QuestionParser.lines[i + 1].startsWith("<!--SR:")) {
                    return QuestionParser.lines[i + 1].trim();
                }
                return "";
            };

            if (QuestionParser.debugParser) {
                console.log("Current line: " + QuestionParser.currentLine);
                console.log("Current parser state: " + QuestionParser.currentParserState);
            }

            // Analyze the current line based on the current state
            switch (QuestionParser.currentParserState as ParserStates) {
                case "FOUND_CLOZE_LOOK_FOR_CONTINUATION": {
                    if (QuestionParser.cards.last().cardType !== CardType.Cloze) {
                        throw new Error("Cloze card continuation state without cloze card");
                    }

                    // We are on the lookout for a multiline cloze card
                    if (QuestionParser.multilineCardEndMarker) {
                        // Here we consider all lines until the multiline card end marker shows up
                        // TODO: implement multiline cloze card detection
                    } else {
                        // Here only non empty lines are considered

                        if (QuestionParser.isMultiLineCardSeparator(
                            QuestionParser.currentLineTrimmed,
                            [options.multilineCardSeparator, options.multilineReversedCardSeparator])
                        ) {
                            // We found a multiline card separator, so the potential card text may be part of the coming multiline card -> we revert the current line

                            // Go back to last cloze card
                            if (QuestionParser.potentialCardTextLines.length === 0) {
                                // TODO: Test this case
                                // Found a headless multiline card separator like this:
                                /*
                                    This is a ==Cloze== question
                                    ??
                                    This is the answer of the headless multiline card
                                */

                                if (debugParser) {
                                    console.log("Found multiline card separator without a question text");
                                }

                                // Skip past the faulty multiline card separator and continue with the next line
                                QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";
                                break;
                            }

                            // Reset the current line for the card start state to handle the multiline card
                            i = QuestionParser.cards.last().lastLineNum;
                            QuestionParser.currentLine = QuestionParser.lines[i];
                            QuestionParser.currentLineTrimmed = QuestionParser.currentLine.trim();
                            QuestionParser.potentialCardTextLines = [];
                            QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";

                            break;
                        } else if (
                            QuestionParser.currentLineTrimmed.length === 0 ||
                            // IDEA: maybe collect all unused sr comments and clean them/warn user
                            QuestionParser.isSRHTMLComment(QuestionParser.currentLineTrimmed) ||
                            QuestionParser.isStartOfNonSRHTMLComment(QuestionParser.currentLineTrimmed)
                        ) {
                            // We found skippable text, so we are done here for this cloze
                            this.addPotentialCardTextToPreviousCard();
                            QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";
                        } else if (QuestionParser.hasInlineMarker(QuestionParser.currentLineTrimmed, QuestionParser.multilineCardEndMarker)) {
                            // We found an inline card, so we add it and are done here for this cloze
                            this.addPotentialCardTextToPreviousCard();
                            QuestionParser.checkForInlineCardAndAddToList(
                                i,
                                inlineSeparators,
                                skipLine.bind(this),
                                getScheduleInfoIfPresent.bind(this)
                            );
                            QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";
                            break;
                        } else {
                            // We found a cloze card or some text, which could belong to the previous cloze card so we store it and continue to look for further text or clozes
                            QuestionParser.potentialCardTextLines.push(QuestionParser.currentLine);

                            if (clozeCrafter.isClozeNote(QuestionParser.currentLineTrimmed)) {
                                QuestionParser.addPotentialCardTextToPreviousCard();
                            }

                            QuestionParser.potentialCardTextLines.push(QuestionParser.currentLine);
                            QuestionParser.currentParserState = "FOUND_CLOZE_LOOK_FOR_CONTINUATION";
                            break;
                        }
                    }
                    break;
                }
                case "LOOKING_FOR_CARD_START": { // Looking for the start of a card
                    QuestionParser.handleFreshCardStart(
                        i,
                        clozeCrafter,
                        inlineSeparators,
                        skipLine.bind(this),
                        getScheduleInfoIfPresent.bind(this)
                    );

                    break;
                }
                default:
                    throw new Error("Impossible parser state: " + QuestionParser.currentParserState);
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
        QuestionParser.multilineCardEndMarker = undefined;
        QuestionParser.cards = [];
        QuestionParser.lines = [];
        QuestionParser.currentLine = "";
        QuestionParser.currentLineTrimmed = "";

        QuestionParser.resetCardSpecificParserState();
    }

    private static resetCardSpecificParserState() {
        QuestionParser.cardText = "";
        QuestionParser.potentialFrontCardText = "";
        QuestionParser.potentialBackCardText = "";
        QuestionParser.potentialCardTextLines = [];
        QuestionParser.firstLineNo = -1;
        QuestionParser.lastLineNo = -1;
        QuestionParser.cardType = null;
    }

    /**
     * Handles the start of a new card
     *
     * This function should only be used when it really doesn't matter what the past line or the past card was
     *
     * @param i - The current line number
     * @param clozeCrafter - The cloze crafter
     * @param inlineSeparators - The inline separators
     * @param skipLine - The skip line function
     * @param getScheduleInfoIfPresent - The get schedule info if present function
     */
    private static handleFreshCardStart(i: number, clozeCrafter: ClozeCrafter, inlineSeparators: Array<{ separator: string, type: CardType }>, skipLine: () => number, getScheduleInfoIfPresent: () => string) {
        // Skip any non HTML Comments & empty lines, as we don't care about them yet in this parser state
        // because we are not yet looking out for multiline cards here
        let breakOut = false;
        while (!breakOut) {
            breakOut = !QuestionParser.skipPastNonSRHTMLComment(skipLine);
            breakOut = breakOut && !QuestionParser.skipPastSRHTMLComment(skipLine); // IDEA: Maybe collect all unused sr comments and clean them/warn user
            breakOut = breakOut && !QuestionParser.skipPastEmptyLines(skipLine);
        }

        // Now we are in a line, where we know that it isnt empty, and it isnt a comment
        // Pick up inline cards and add them to the list of cards
        const hadInlineCard = QuestionParser.checkForInlineCardAndAddToList(
            i,
            inlineSeparators,
            skipLine,
            getScheduleInfoIfPresent
        );

        if (hadInlineCard) {
            // Found an inline card, the next line could be anything, so we start again
            QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";
            return;
        }

        // Didn't find an inline card, so we are now looking for a cloze card
        const hadClozeCard = QuestionParser.checkForClozeCardAndAddToList(
            i,
            clozeCrafter,
            skipLine,
            getScheduleInfoIfPresent
        );

        if (hadClozeCard) {
            // Found a cloze card, so the next line could be anything, so we start again
            if (QuestionParser.cards.last().text.includes(QuestionParser.srCommentStart)) {
                // Because we found the sheduling info comment, we know that the next line is not part of the cloze
                QuestionParser.currentParserState = "LOOKING_FOR_CARD_START";
                return;
            }

            // Now we go and look for a new card, but this time we are on the lookout, if the cloze card continues
            // on to a multiline cloze card
            QuestionParser.currentParserState = "FOUND_CLOZE_LOOK_FOR_CONTINUATION";
            return;
        }

        // Didn't find an inline card or a cloze card, so we are now looking for a multiline card
        // TODO: implement multiline card detection
    }

    private static checkForClozeCardAndAddToList(i: number, clozeCrafter: ClozeCrafter, skipLine: () => number, getScheduleInfoIfPresent: () => string): boolean {
        const currentLineEndTrimmed = QuestionParser.currentLine.trimEnd();
        const hasClozeCard = clozeCrafter.isClozeNote(currentLineEndTrimmed);

        if (hasClozeCard) {
            QuestionParser.cardType = CardType.Cloze;
            QuestionParser.cardText = currentLineEndTrimmed;
            QuestionParser.firstLineNo = i;
            const scheduleInfo = getScheduleInfoIfPresent();
            if (scheduleInfo.length > 0) {
                QuestionParser.cardText += "\n" + scheduleInfo;
                skipLine();
            }

            QuestionParser.lastLineNo = scheduleInfo.length > 0 ? i + 1 : i; // Either the end of the card, or the schedule info of the card
            QuestionParser.addNewCardToList();

            // Clean up for next card
            QuestionParser.resetCardSpecificParserState();
        }

        return hasClozeCard;
    }

    private static checkForInlineCardAndAddToList(i: number, inlineSeparators: Array<{ separator: string, type: CardType }>, skipLine: () => number, getScheduleInfoIfPresent: () => string): boolean {
        let hadInlineCard = false;

        for (const { separator, type } of inlineSeparators) {
            if (QuestionParser.hasInlineMarker(QuestionParser.currentLine, separator)) {
                // We have found an inline card, setup all extractable info
                const currentLineEndTrimmed = QuestionParser.currentLine.trimEnd();
                QuestionParser.cardType = type;
                QuestionParser.cardText = currentLineEndTrimmed;
                QuestionParser.potentialFrontCardText = currentLineEndTrimmed.split(separator)[0];
                QuestionParser.potentialBackCardText = currentLineEndTrimmed.split(separator)[1];
                QuestionParser.firstLineNo = i;

                // Pick up scheduling information if present
                const scheduleInfo = getScheduleInfoIfPresent();
                if (scheduleInfo.length > 0) {
                    QuestionParser.cardText += "\n" + scheduleInfo;
                    skipLine();
                }

                QuestionParser.lastLineNo = scheduleInfo.length > 0 ? i + 1 : i; // Either the end of the card, or the schedule info of the card
                QuestionParser.addNewCardToList();

                // Clean up for next card
                QuestionParser.resetCardSpecificParserState();
                hadInlineCard = true;
                break;
            }
        }

        return hadInlineCard;
    }

    private static addNewCardToList() {
        QuestionParser.cards.push(
            new ParsedQuestionInfo(
                QuestionParser.cardType,
                QuestionParser.cardText,
                QuestionParser.firstLineNo,
                QuestionParser.lastLineNo
            )
        );
    }

    private static addPotentialCardTextToPreviousCard() {
        if (QuestionParser.potentialCardTextLines.length > 0) {
            QuestionParser.cards.last().lastLineNum += QuestionParser.potentialCardTextLines.length;
            // TODO: Test if one should use length - 1 instead of length
            QuestionParser.cards.last().text += "\n" + QuestionParser.potentialCardTextLines.join("\n");
            QuestionParser.potentialCardTextLines = [];
        }
    }

    static isStartOfNonSRHTMLComment(line: string): boolean {
        return line.startsWith(QuestionParser.nonSrCommentStart) && !line.startsWith(QuestionParser.srCommentStart);
    }

    static isEndOfHTMLComment(line: string): boolean {
        return line.includes(QuestionParser.commentEnd);
    }

    static isSRHTMLComment(line: string): boolean {
        return line.startsWith(QuestionParser.srCommentStart);
    }

    static isMultiLineCardEndMarker(line: string, multilineCardEndMarker: string): boolean {
        return line.trim() === multilineCardEndMarker;
    }

    private static skipPastEmptyLines(skipLine: () => number): boolean {
        // Skip empty lines until we find something that is not empty
        let foundEmptyLine = false;
        while (QuestionParser.currentLineTrimmed.length === 0) {
            foundEmptyLine = true;
            skipLine();
        }

        return foundEmptyLine;
    }

    private static skipPastSRHTMLComment(skipLine: () => number): boolean {
        // return true if we found the end of the sr comment
        if (
            QuestionParser.isSRHTMLComment(QuestionParser.currentLine)
        ) {
            if (QuestionParser.isEndOfHTMLComment(QuestionParser.currentLine)) {
                // End of sr comment should be in the same line as the start of the sr comment
                skipLine();
                return true;
            } else {
                throw new Error("SR comment not ended on same line as start");
            }
        }
        return false;
    }

    private static skipPastNonSRHTMLComment(skipLine: () => number) {
        // return true if we found the end of the non sr comment
        if (
            QuestionParser.isStartOfNonSRHTMLComment(QuestionParser.currentLine) &&
            QuestionParser.isEndOfHTMLComment(QuestionParser.currentLine)
        ) {
            // End of comment is in the same line as the start of the comment
            skipLine();
            return true;
        }


        if (QuestionParser.isStartOfNonSRHTMLComment(QuestionParser.currentLine)) {
            // Comment is on multiple lines
            // Could go on for a while, so we skipping till we are one line past the end of the comment
            let i = skipLine();
            while (
                i < QuestionParser.lines.length &&
                !QuestionParser.isEndOfHTMLComment(QuestionParser.currentLine)
            ) {
                i = skipLine();
            }

            i = skipLine();
            return true;
        }
        return false;
    }

    static isMultiLineCardSeparator(text: string, markers: string[]): boolean {
        markers.forEach((marker) => {
            if (text.includes(marker)) {
                return true;
            }
        });
        return false;
    }

    static markerInsideCodeBlock(text: string, marker: string, markerIndex: number): boolean {
        // TODO: Handle codeblocks
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