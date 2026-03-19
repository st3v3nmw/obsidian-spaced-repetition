import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import CardData from "src/utils/parsers/data-structures/cards/card-data";
import HTMLCommentSearchResultElement from "src/utils/parsers/data-structures/lines/html-comment";
import LineData from "src/utils/parsers/data-structures/lines/line-data";
import ParserOptions from "src/utils/parsers/data-structures/parser/parser-options";
import { ParserStates } from "src/utils/parsers/data-structures/parser/parser-states";

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
    stillOpenHTMLComments: HTMLCommentSearchResultElement[]; // The still open html comments
    noHTMLCommentsInCurrentLine: boolean; // Flag to indicate if there are no HTML comments in the current line

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
        this.noHTMLCommentsInCurrentLine = false;
        this.stillOpenHTMLComments = [];
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
            CardParser.notesWithCardFragments.addCardFragment(this.notePath, this.noteText, {
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
