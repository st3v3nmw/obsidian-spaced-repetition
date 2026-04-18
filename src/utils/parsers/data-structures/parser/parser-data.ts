import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import CardData from "src/utils/parsers/data-structures/cards/card-data";
import HTMLCommentSearchResultElement from "src/utils/parsers/data-structures/lines/html-comment";
import LineData from "src/utils/parsers/data-structures/lines/line-data";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import ParserOptions from "src/utils/parsers/data-structures/parser/parser-options";
import { ParserStates } from "src/utils/parsers/data-structures/parser/parser-states";
import PotentialCardInfo from "src/utils/parsers/data-structures/parser/potential-card-info";
import StringDetector from "src/utils/parsers/detectors/string-detector";
import { CardFragmentType } from "../cards/card-fragments/card-fragment";

/**
 * The parser data class
 *
 * This class is responsible for storing all the data related to the parser.
 * It includes the parser options, the note path, the note text, the current parser state,
 * the line data, the card data, the cloze crafter, whether to search for multiline cards,
 * whether to search for multiline clozes, and the searchForMultilineCloze flag.
 *
 * @class ParserData
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
    stillOpenHTMLComments: HTMLCommentSearchResultElement[]; // The still open html comments
    noHTMLCommentsInCurrentLine: boolean; // Flag to indicate if there are no HTML comments in the current line, which is used for parsing a line with comments a second time after they were removed
    isInCodeBlock: boolean; // Flag to indicate if all current detected lines are within a code block, which determines if they are handled as text or not

    /**
     * Creates a new instance of ParserData
     *
     * @param options - The parser options
     * @param noteText - The note text
     * @param notePath - The note path
     */
    constructor(options: ParserOptions, noteText: string, notePath: string) {
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
        this.currentParserState = "READY_TO_PARSE"; // This is needed to satisfy the type checker
        this.lineData = new LineData(noteText, inlineSeparators, multilineSeparators);
        this.cardData = new CardData();
        this.isInCodeBlock = false;
        this.clozeCrafter = new ClozeCrafter(options.clozePatterns);
    }

    // MARK: Potential card handling

    /**
     * Ends the multiline search & prepares the parser for a new potential card
     */
    addPotentialCardToList() {
        // Nothing to do if there is no potential new card
        if (this.cardData.potentialCard === null) return;

        let leftoverCardText = "";

        // TODO: Reimplement this
        if (
            this.cardData.potentialCard.cardType !== null &&
            (this.cardData.potentialCard.cardType === CardType.MultiLineBasic ||
                this.cardData.potentialCard.cardType === CardType.MultiLineReversed) &&
            (this.cardData.potentialCard.backText === null ||
                this.cardData.potentialCard.backText.length === 0)
        ) {
            // Here we add a fragment for the current multiline card, as it is malformed, because it doesn't have a back text
            CardParser.notesWithCardFragments.addCardFragment(this.notePath, this.noteText, {
                type: "MALFORMED_MULTILINE_CARD",
                fragmentInfo: new PotentialCardInfo(
                    this.cardData.potentialCard.cardType,
                    this.cardData.potentialCard.text,
                    this.cardData.potentialCard.firstLineNum,
                    this.lineData.currentLineNum,
                    this.cardData.potentialCard.frontText,
                ),
            });
        } else {
            if (
                StringDetector.isMultiLineCardSeparator(
                    this.lineData.currentLineTrimmed,
                    this.lineData.multilineSeparators.map((x) => x.separator)
                )
            ) {
                // If the current line is a multiline separator, we want to add the text after the last newline as a new potential card, because it could be the start of a new card
                const linesOfCurrentCard = this.cardData.potentialCard.text.split("\n");
                leftoverCardText = linesOfCurrentCard[linesOfCurrentCard.length - 1][0];

                // Remove last line from last card
                this.cardData.potentialCard.lastLineNum--;
                this.cardData.potentialCard.text = this.cardData.potentialCard.text.split("\n").slice(0, -1).join("\n");
                if (this.cardData.potentialCard.backText !== null && this.cardData.potentialCard.backText.length > 0) {
                    this.cardData.potentialCard.backText = this.cardData.potentialCard.backText
                        .split("\n")
                        .slice(0, -1)
                        .join("\n");
                }
            }

            this.cardData.addCardToList(this.cardData.potentialCard);
        }

        if (leftoverCardText !== "") {
            // If there is leftover text, we want to add it as a new potential card, because it could be the start of a new card
            this.cardData.potentialCard = new PotentialCardInfo(
                null,
                leftoverCardText,
                this.lineData.currentLineNum,
                this.lineData.currentLineNum,
            );
        } else {
            // If there is no leftover text, we want to reset the potential card
            this.cardData.potentialCard.reset();
        }
    }

    // MARK: State handling

    /**
     * Returns the next parser state based on the current line
     * @returns The next parser state
     */
    determineNextParserState(): ParserStates {
        // Route to the correct state based on line content
        if (
            !this.noHTMLCommentsInCurrentLine &&
            (StringDetector.indexOfHTMLCommentStart(this.lineData.currentLineTrimmed) >= 0 ||
                StringDetector.indexOfHTMLCommentEnd(this.lineData.currentLineTrimmed) >= 0)
        ) {
            // Non sr info comment -> Start/End
            return "HTML_COMMENT_START_OR_END";
        } else if (this.isParserInMultilineHTMLComment()) {
            // Non sr info comment -> Middle of multiline comment
            return "HTML_COMMENT_MIDDLE";
        } else if (this.lineData.currentLineTrimmed.length === 0) {
            // Empty line -> Treats any line with only whitespace or empty lines as empty lines
            return "EMPTY_LINE";
        } else if (StringDetector.indexOfCodeBlockMarker(this.lineData.currentLineTrimmed) >= 0) {
            // Has code block start/end
            return "CODE_BLOCK_START_OR_END";
        } else if (this.isInCodeBlock) {
            // Is in the middle of a multiline code block
            return "CODE_BLOCK_MIDDLE";
        } else if (
            StringDetector.isMultiLineCardEndMarker(
                this.lineData.currentLineTrimmed,
                this.options.multilineCardEndMarker,
            )
        ) {
            // The current line has a multiline card end marker so we check if it is connected to a potential card
            const currentPotentialCard = this.cardData.potentialCard;
            let fragmentInfo: PotentialCardInfo | null = null;

            if (currentPotentialCard.isEmpty() || currentPotentialCard.isJustText()) {
                fragmentInfo = new PotentialCardInfo(
                    null,
                    this.lineData.currentLineTrimmed,
                    this.lineData.currentLineNum,
                    this.lineData.currentLineNum,
                );
            } else if (
                (!this.options.useAtomicClozes && currentPotentialCard.isValidClozeCard()) ||
                currentPotentialCard.isValidMultiLineCard()
            ) {
                return "MULTILINE_END_MARKER";
            } else {
                //
                // The potential card is empty or just text, so we can flag a rouge multiline end marker
                // The potential card is not eligible for a multiline end marker, so we can flag a rouge multiline end marker
                fragmentInfo = new PotentialCardInfo(
                    this.
                );
                CardParser.notesWithCardFragments.addCardFragment(
                    this.notePath,
                    this.noteText,
                    {
                        type: "ROUGE_MULTILINE_END_MARKER",
                        fragmentInfo: new PotentialCardInfo(
                            null,
                            this.lineData.currentLineTrimmed,
                            this.lineData.currentLineNum,
                            this.lineData.currentLineNum,
                        ),
                    },
                );
            }
            return "PARSE_LINE";
        } else if (
            StringDetector.hasAnyInlineSeparator(
                this.lineData.currentLineTrimmed,
                this.lineData.inlineSeparators.map((x) => x.separator),
            )
        ) {
            // Inline card
            return "INLINE_CARD";
        } else if (
            StringDetector.hasClozes(
                this.lineData.currentLineTrimmed,
                this.clozeCrafter,
                this.options.clozePatterns,
            )
        ) {
            // Cloze card
            return "CLOZE";
        } else if (
            StringDetector.isMultiLineCardSeparator(
                this.lineData.currentLineTrimmed,
                this.lineData.multilineSeparators.map((x) => x.separator),
            )
        ) {
            // Multiline card separator
            const potentialNewCard: ParsedCardInfo | null =
                this.cardData.potentialCard;
            if (
                potentialNewCard === null ||
                potentialNewCard.text.length === 0 ||
                potentialNewCard.frontText === null ||
                potentialNewCard.frontText.length === 0
            ) {
                // The multi line card separator shouldn't be here in the current line
                CardParser.notesWithCardFragments.addCardFragment(
                    this.notePath,
                    this.noteText,
                    {
                        type: "MALFORMED_MULTILINE_CARD",
                        fragmentInfo: new PotentialCardInfo(
                            null,
                            this.lineData.currentLineTrimmed,
                            this.lineData.currentLineNum,
                            this.lineData.currentLineNum,
                        ),
                    },
                );
                return "PARSE_LINE";
            }
            return "MULTILINE_SEPARATOR";
        } else {
            // Text
            return "TEXT";
        }
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

    /**
     * Returns true if the parser is currently in a multiline html comment
     *
     * @returns True if the parser is currently in a multiline html comment, false otherwise
     */
    isParserInMultilineHTMLComment(): boolean {
        return this.stillOpenHTMLComments.length > 0;
    }
}
