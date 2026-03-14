import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import { ParserStates, QuestionParser } from "src/parser/parser";

export interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string | null;
    clozePatterns: string[];
    useAtomicClozes: boolean;
}

export class ParsedQuestionInfo {
    cardType: CardType;
    text: string;
    frontText: string | null;
    backText: string | null;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;

    constructor(
        cardType: CardType,
        text: string,
        firstLineNum: number,
        lastLineNum: number,
        frontText: string | null = null,
        backText: string | null = null,
    ) {
        this.cardType = cardType;
        this.text = text;
        this.firstLineNum = firstLineNum;
        this.lastLineNum = lastLineNum;
        this.frontText = frontText;
        this.backText = backText;
    }

    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }
}

/**
 * The line data class
 *
 * This class is responsible for storing the lines of the current note, the current line number,
 * the current line, the current line trimmed without whitespace, the current line trimmed without whitespace at end,
 * the inline separators, and the multiline separators.
 *
 * @class LineData
 * @extends {LineData}
 */
export class LineData {
    lines: string[]; // The lines of the current note
    currentLineNum: number; // The current line number
    currentLine: string; // The current line
    currentLineEndTrimmed: string; // The current line trimmed without whitespace at end
    currentLineTrimmed: string; // The current line trimmed without whitespace
    inlineSeparators: Array<{ separator: string; type: CardType }>; // The inline separators
    multilineSeparators: Array<{ separator: string; type: CardType }>; // The multiline separators

    /**
     * Creates a new instance of LineData
     *
     * @param noteText - The note text
     * @param inlineSeparators - The inline separators
     * @param multilineSeparators - The multiline separators
     */
    constructor(
        noteText: string,
        inlineSeparators: Array<{ separator: string; type: CardType }>,
        multilineSeparators: Array<{ separator: string; type: CardType }>,
    ) {
        this.reset(noteText, inlineSeparators, multilineSeparators);
    }

    /**
     * Resets the line data
     *
     * @param noteText - The note text
     * @param inlineSeparators - The inline separators
     * @param multilineSeparators - The multiline separators
     */
    reset(
        noteText: string,
        inlineSeparators: Array<{ separator: string; type: CardType }>,
        multilineSeparators: Array<{ separator: string; type: CardType }>,
    ): void {
        this.lines = noteText.replaceAll("\r\n", "\n").split("\n");
        this.currentLineNum = -1;
        this.currentLine = "";
        this.currentLineEndTrimmed = "";
        this.currentLineTrimmed = "";
        this.inlineSeparators = inlineSeparators;
        this.multilineSeparators = multilineSeparators;
    }

    setCurrentLine(lineNum: number): void {
        this.currentLine = this.lines[lineNum];
        this.currentLineNum = lineNum;
        this.currentLineEndTrimmed = this.currentLine.trimEnd();
        this.currentLineTrimmed = this.currentLineEndTrimmed.trimStart();
    }
}

/**
 * The card data class
 *
 * This class is responsible for storing the list of cards and the index of the last card.
 * It also stores the potential new card, which is the card that is currently being parsed.
 *
 * @class CardData
 * @extends {CardData}
 */
export class CardData {
    cards: ParsedQuestionInfo[]; // The list of detected cards
    lastCardIndex: number; // The index of the last card
    potentialNewCard: ParsedQuestionInfo | null; // The potential new card, which is the card that is currently being parsed

    /**
     * Creates a new instance of CardData
     */
    constructor() {
        this.reset();
    }

    /**
     * Resets the card data
     */
    reset() {
        this.cards = [];
        this.lastCardIndex = -1;
        this.resetPotentialCardData();
    }

    /**
     * Resets the potential card data
     */
    resetPotentialCardData() {
        this.potentialNewCard = null;
    }

    /**
     * Returns the last card or null if there is no last card
     * @returns ParsedQuestionInfo | null
     */
    getLastCard(): ParsedQuestionInfo | null {
        if (this.lastCardIndex < 0 || this.lastCardIndex >= this.cards.length) {
            return null;
        }
        return this.cards[this.lastCardIndex];
    }

    /**
     * Initializes a new potential card
     */
    initNewPotentialCard(
        type: CardType,
        text: string,
        firstLineNum: number,
        lastLineNum: number,
        frontText: string | null = null,
        backText: string | null = null,
    ) {
        this.potentialNewCard = new ParsedQuestionInfo(
            type,
            text,
            firstLineNum,
            lastLineNum,
            frontText,
            backText,
        );
    }

    /**
     * Adds the current line to the last card
     *
     * @param lineData - The line data
     */
    addCurrentLineToLastCard(lineData: LineData, searchForMultilineCards: boolean = false): void {
        if (this.lastCardIndex < 0) {
            return;
        }

        const lastCard: ParsedQuestionInfo = this.cards[this.lastCardIndex];
        const modifiedLastCard: ParsedQuestionInfo = new ParsedQuestionInfo(
            lastCard.cardType,
            lastCard.text + "\n" + lineData.currentLine,
            lastCard.firstLineNum,
            lineData.currentLineNum,
            lastCard.frontText,
            lastCard.backText !== null
                ? lastCard.backText + "\n" + lineData.currentLine
                : searchForMultilineCards
                  ? lineData.currentLine
                  : null,
        );
        this.cards[this.lastCardIndex] = modifiedLastCard;
    }

    addMultilineCardToList(lineData: LineData, addMultilineCardFragment: () => void): void {
        const potentialNewCard: ParsedQuestionInfo | null = this.potentialNewCard;

        const multilineSeparators = lineData.multilineSeparators;

        const linesOfPotentialNewCard = potentialNewCard.text.split("\n");

        for (const line of linesOfPotentialNewCard) {
            const trimmedLine = line.trim();

            if (
                QuestionParser.isMultiLineCardSeparator(
                    trimmedLine,
                    multilineSeparators.map((x) => x.separator),
                )
            ) {
                if (
                    potentialNewCard.frontText === null ||
                    potentialNewCard.frontText.length === 0
                ) {
                    addMultilineCardFragment();
                    return;
                }

                const separatorType = QuestionParser.getMultilineCardType(
                    trimmedLine,
                    multilineSeparators,
                );

                if (potentialNewCard.backText === null) {
                    potentialNewCard.backText = lineData.currentLine;
                } else {
                    potentialNewCard.backText += "\n" + lineData.currentLine;
                }

                const newCard: ParsedQuestionInfo = new ParsedQuestionInfo(
                    separatorType,
                    potentialNewCard.text + "\n" + lineData.currentLine,
                    potentialNewCard.firstLineNum,
                    lineData.currentLineNum,
                    potentialNewCard.frontText,
                    potentialNewCard.backText,
                );

                this.addCardToList(newCard);
                return;
            }
        }
    }

    /**
     * Adds the inline card to the list of cards
     *
     * @param lineData - The line data
     * @param notePath - The note path
     */
    addInlineCardToList(lineData: LineData, notePath: string, noteText: string): void {
        const inlineSeparators = lineData.inlineSeparators;
        for (const { separator, type } of inlineSeparators) {
            if (
                // We have found an inline card separator
                QuestionParser.hasInlineSeparator(lineData.currentLineTrimmed, [separator]) &&
                (lineData.currentLineTrimmed.length === separator.length || // No card text
                    lineData.currentLineTrimmed.endsWith(separator) || // Card text ends with separator
                    lineData.currentLineTrimmed.startsWith(separator)) // Card text starts with separator
            ) {
                QuestionParser.notesWithCardFragments.addCardFragment(notePath, noteText, {
                    endLineNum: lineData.currentLineNum,
                    startLineNum: lineData.currentLineNum,
                    type: "MALFORMED_INLINE_CARD",
                    text: lineData.currentLineTrimmed,
                });
                break;
            } else if (
                QuestionParser.hasInlineSeparator(lineData.currentLineTrimmed, [separator])
            ) {
                // We have found an inline card, setup all extractable info
                const newCard = new ParsedQuestionInfo(
                    type,
                    lineData.currentLineEndTrimmed,
                    lineData.currentLineNum,
                    lineData.currentLineNum,
                    lineData.currentLineEndTrimmed.split(separator)[0],
                    lineData.currentLineEndTrimmed.split(separator)[1],
                );
                this.addCardToList(newCard);
                break;
            }
        }
    }

    /**
     * Adds the atomic cloze card to the list of cards
     *
     * @param lineData - The line data
     */
    addAtomicClozeToList(lineData: LineData): void {
        const newCard = new ParsedQuestionInfo(
            CardType.Cloze,
            lineData.currentLineEndTrimmed,
            lineData.currentLineNum,
            lineData.currentLineNum,
            null,
            null,
        );
        this.addCardToList(newCard);
    }

    addClozeToList(lineData: LineData): void {
        // first just add cloze line to list
        this.addAtomicClozeToList(lineData);

        // Then add any preceding text to the last card, if there is one
        if (this.potentialNewCard !== null && this.potentialNewCard.text.length > 0) {
            this.cards[this.lastCardIndex].text =
                this.potentialNewCard.text + "\n" + this.cards[this.lastCardIndex].text;
            this.cards[this.lastCardIndex].firstLineNum = this.potentialNewCard.firstLineNum;
            this.resetPotentialCardData();
        }
    }

    /**
     * Adds the card to the list of cards and updates the last card index
     */
    private addCardToList(newCard: ParsedQuestionInfo): void {
        this.lastCardIndex++;
        this.cards.push(newCard);
    }
}

/**
 * The parser data class
 *
 * This class is responsible for storing all the data related to the parser.
 * It includes the parser options, the note path, the note text, the current parser state,
 * the line data, the card data, the cloze crafter, whether to search for multiline cards,
 * whether to search for multiline clozes, and the searchForMultilineCloze flag.
 *
 * @class ParserData
 * @extends {ParserData}
 */
export class ParserData {
    options: ParserOptions; // The parser options
    notePath: string; // The note path
    noteText: string; // The note text
    prevParserStates: ParserStates[]; // The previous parser states
    prevParserStatesWithoutParseLine: ParserStates[]; // The previous parser states without parse line
    currentParserState: ParserStates; // The current parser state
    lineData: LineData; // All line related data
    cardData: CardData; // All card related data
    clozeCrafter: ClozeCrafter; // The cloze crafter
    searchForMultilineCards: boolean; // Whether to search for multiline cards
    searchForMultilineCloze: boolean; // Whether to search for lines for the prev cloze card

    /**
     * Creates a new instance of ParserData
     *
     * @param options - The parser options
     * @param noteText - The note text
     * @param notePath - The note path
     */
    constructor(options: ParserOptions, noteText: string, notePath: string) {
        this.reset(options, noteText, notePath);
    }

    /**
     * Resets the parser data
     *
     * @param options - The parser options
     * @param noteText - The note text
     * @param notePath - The note path
     */
    reset(options: ParserOptions, noteText: string, notePath: string) {
        this.prevParserStates = [];
        this.prevParserStatesWithoutParseLine = [];
        this.options = options;
        this.notePath = notePath;
        this.noteText = noteText;
        // Sort inline and multiline separators by length, longest first
        const inlineSeparators = [
            { separator: options.singleLineCardSeparator, type: CardType.SingleLineBasic },
            {
                separator: options.singleLineReversedCardSeparator,
                type: CardType.SingleLineReversed,
            },
        ];
        inlineSeparators.sort((a, b) => b.separator.length - a.separator.length);

        const multilineSeparators = [
            { separator: options.multilineCardSeparator, type: CardType.MultiLineBasic },
            { separator: options.multilineReversedCardSeparator, type: CardType.MultiLineReversed },
        ];

        multilineSeparators.sort((a, b) => b.separator.length - a.separator.length);

        this.setParserState("READY_TO_PARSE");
        this.lineData = new LineData(noteText, inlineSeparators, multilineSeparators);
        this.cardData = new CardData();
        this.searchForMultilineCards = false;
        this.searchForMultilineCloze = false;
        this.clozeCrafter = new ClozeCrafter(options.clozePatterns);
    }

    /**
     * Ends the multiline search & prepares the parser for a new potential card
     */
    endMultiLineSearch() {
        if (
            this.cardData.potentialNewCard !== null &&
            this.cardData.potentialNewCard.cardType !== null &&
            (this.cardData.potentialNewCard.cardType === CardType.MultiLineBasic ||
                this.cardData.potentialNewCard.cardType === CardType.MultiLineReversed) &&
            (this.cardData.potentialNewCard.backText === null ||
                this.cardData.potentialNewCard.backText.length === 0)
        ) {
            QuestionParser.notesWithCardFragments.addCardFragment(this.notePath, this.noteText, {
                endLineNum: this.lineData.currentLineNum,
                startLineNum: this.lineData.currentLineNum,
                type: "MALFORMED_MULTILINE_CARD",
                text: this.lineData.currentLineTrimmed,
            });
        }

        this.cardData.resetPotentialCardData();
        this.searchForMultilineCards = false;
        this.searchForMultilineCloze = false;
    }

    /**
     * Sets the current parser state & stores the previous states
     *
     * @param state - The new parser state
     */
    setParserState(state: ParserStates) {
        if (this.currentParserState !== undefined) {
            if (this.currentParserState !== "PARSE_LINE") {
                this.prevParserStatesWithoutParseLine.push(this.currentParserState);
            }
            this.prevParserStates.push(this.currentParserState);
        }
        this.currentParserState = state;
    }

    /**
     * Returns the last parser state
     *
     * @param withoutParseLine - Whether to return the last parser state without the parse line state
     * @returns The last parser state. If there are no previous states, returns the current state
     */
    getLastParserState(
        withoutParseLine: "WITH_PARSE_LINE" | "WITHOUT_PARSE_LINE" = "WITH_PARSE_LINE",
    ): ParserStates {
        if (
            (this.prevParserStates.length === 0 && withoutParseLine === "WITH_PARSE_LINE") ||
            (this.prevParserStatesWithoutParseLine.length === 0 &&
                withoutParseLine === "WITHOUT_PARSE_LINE")
        ) {
            return this.currentParserState;
        }

        if (withoutParseLine === "WITHOUT_PARSE_LINE") {
            return this.prevParserStatesWithoutParseLine[
                this.prevParserStatesWithoutParseLine.length - 1
            ];
        }
        return this.prevParserStates[this.prevParserStates.length - 1];
    }

    /**
     * Returns the previous parser state at the specified index
     *
     * @param index - The index of the previous parser state
     * @param withoutParseLine - Whether to return the previous parser state without the parse line state
     * @returns The previous parser state at the specified index. If there are no previous states, returns the current state
     */
    getPrevParserStateAtIndex(
        index: number,
        withoutParseLine: "WITH_PARSE_LINE" | "WITHOUT_PARSE_LINE" = "WITH_PARSE_LINE",
    ) {
        if (
            (this.prevParserStates.length === 0 && withoutParseLine === "WITH_PARSE_LINE") ||
            (this.prevParserStatesWithoutParseLine.length === 0 &&
                withoutParseLine === "WITHOUT_PARSE_LINE")
        ) {
            return this.currentParserState;
        }

        if (withoutParseLine === "WITHOUT_PARSE_LINE") {
            return this.prevParserStatesWithoutParseLine[index];
        }
        return this.prevParserStates[index];
    }

    /**
     * Returns the last previous parser state index
     *
     * @param withoutParseLine - Whether to return the last previous parser state index without the parse line state
     * @returns The last previous parser state index
     */
    getIndexOfLastParserState(
        withoutParseLine: "WITH_PARSE_LINE" | "WITHOUT_PARSE_LINE" = "WITH_PARSE_LINE",
    ) {
        if (
            (this.prevParserStates.length === 0 && withoutParseLine === "WITH_PARSE_LINE") ||
            (this.prevParserStatesWithoutParseLine.length === 0 &&
                withoutParseLine === "WITHOUT_PARSE_LINE")
        ) {
            return -1;
        }

        if (withoutParseLine === "WITHOUT_PARSE_LINE") {
            return this.prevParserStatesWithoutParseLine.length - 1;
        }
        return this.prevParserStates.length - 1;
    }
}
