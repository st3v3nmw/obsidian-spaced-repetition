import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import { CardFragment, NotesWithCardFragments } from "src/parser/card-fragments";
import { ParsedQuestionInfo, ParserData, ParserOptions } from "src/parser/parser-data-structure";

// All the states that the parser can be in, when parsing a note for cards
export type ParserStates =
    | "READY_TO_PARSE"
    | "PARSE_LINE"
    | "EMPTY_LINE"
    | "TEXT"
    | "NON_SR_HTML_COMMENT"
    | "SR_HTML_COMMENT"
    | "CLOZE"
    | "INLINE_CARD"
    | "MULTILINE_SEPARATOR"
    | "MULTILINE_END_MARKER";

/**
 * The parser class
 *
 * This class is responsible for parsing the text of a note for cards.
 * It is a state machine that parses the text line by line and
 * always first determines in which state it should be in based on the current line. Then it parses the line based on the current state.
 *
 * While parsing it also keeps track of any card fragments that it finds in each note along the way, so that they can be handled later.This is done by keeping a list of note paths and a list of rouge card fragments for each note path.
 *
 * It also has an option for verbose debugging, which can be enabled or disabled.
 */
export class QuestionParser {
    static readonly srCommentStart = "<!--SR:"; // The start of a scheduling info comment
    static readonly nonSrCommentStart = "<!--"; // The start of a non scheduling info comment
    static readonly commentEnd = "-->"; // The end of a comment

    static debugParser = false; // Enable to see the parser state changes
    static notesWithCardFragments: NotesWithCardFragments = new NotesWithCardFragments(); // The list of notes with card fragments from the last parsing of each note

    /**
     * Returns flashcards found in `text`
     *
     * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
     *
     * @param noteText - The text to extract flashcards from
     * @param ParserOptions - Parser options
     * @returns An array of parsed question information
     */
    static parse(notePath: string, noteText: string, options: ParserOptions): ParsedQuestionInfo[] {
        if (QuestionParser.debugParser) {
            console.log("[DEBUG]: Text to parse:\n<<<" + noteText + ">>>");
        }

        // Reset the rouge card fragments for the note, as it will be rebuild while parsing
        QuestionParser.notesWithCardFragments.resetNote(notePath, noteText);

        // Create a fresh parser data object
        let parserData = new ParserData(options, noteText, notePath);

        // Parse the note line by line
        for (let i = 0; i < parserData.lineData.lines.length; i++) {
            parserData.lineData.setCurrentLine(i);

            // Set the current parser state to PARSE_LINE
            // which is the initial state, where it determines the next state based on the current line
            parserData.setParserState("PARSE_LINE");

            if (QuestionParser.debugParser) {
                console.log(
                    "[DEBUG]: Current line: " + parserData.lineData.currentLine,
                    parserData.lineData.currentLineNum,
                );
                console.log("[DEBUG]: Current parser state: " + parserData.currentParserState);
            }

            // Parse the current line based on the current parser data
            parserData = QuestionParser.parseLine(parserData);
        }

        if (QuestionParser.debugParser) {
            console.log("[DEBUG]: Parsed cards:\n", parserData.cardData.cards);
        }

        // Return the list of parsed cards
        return parserData.cardData.cards;
    }

    private static parseLine(parserData: ParserData): ParserData {
        // Trim the current line for easier parsing and use in function calls
        const currentLineTrimmed: string = parserData.lineData.currentLineTrimmed;

        if (QuestionParser.debugParser) {
            console.log("[DEBUG]: Current state: " + parserData.currentParserState);
            console.log(
                "[DEBUG]: Current line: " + parserData.lineData.currentLine,
                parserData.lineData.currentLineNum,
            );
        }

        // Handle any relevant states, that a line can be in
        switch (parserData.currentParserState) {
            case "PARSE_LINE": {
                // Route to the correct state based on line content
                if (currentLineTrimmed.length === 0) {
                    // Empty line
                    parserData.setParserState("EMPTY_LINE");
                } else if (
                    QuestionParser.isMultiLineCardEndMarker(
                        currentLineTrimmed,
                        parserData.options.multilineCardEndMarker,
                    )
                ) {
                    // Multiline card end marker
                    if (parserData.searchForMultilineCloze || parserData.searchForMultilineCards) {
                        parserData.setParserState("MULTILINE_END_MARKER");
                    } else {
                        // This shouldn't be here in the current line
                        QuestionParser.notesWithCardFragments.addCardFragment(
                            parserData.notePath,
                            parserData.noteText,
                            {
                                endLineNum: parserData.lineData.currentLineNum,
                                startLineNum: parserData.lineData.currentLineNum,
                                type: "ROUGE_MULTILINE_END_MARKER",
                                text: currentLineTrimmed,
                            },
                        );
                        break;
                    }
                } else if (QuestionParser.hasStartOfNonSRHTMLComment(currentLineTrimmed)) {
                    // Non sr info comment
                    parserData.setParserState("NON_SR_HTML_COMMENT");
                } else if (QuestionParser.hasSRHTMLComment(currentLineTrimmed)) {
                    // SR info comment
                    parserData.setParserState("SR_HTML_COMMENT");
                } else if (
                    QuestionParser.hasInlineSeparator(
                        currentLineTrimmed,
                        parserData.lineData.inlineSeparators.map((x) => x.separator),
                    )
                ) {
                    // Inline card
                    parserData.setParserState("INLINE_CARD");
                } else if (QuestionParser.hasClozes(currentLineTrimmed, parserData.clozeCrafter)) {
                    // Cloze card
                    parserData.setParserState("CLOZE");
                } else if (
                    QuestionParser.isMultiLineCardSeparator(
                        currentLineTrimmed,
                        parserData.lineData.multilineSeparators.map((x) => x.separator),
                    )
                ) {
                    // Multiline card separator
                    const potentialNewCard: ParsedQuestionInfo | null =
                        parserData.cardData.potentialNewCard;
                    if (
                        potentialNewCard === null ||
                        potentialNewCard.text.length === 0 ||
                        potentialNewCard.frontText.length === 0
                    ) {
                        // This shouldn't be here in the current line
                        QuestionParser.notesWithCardFragments.addCardFragment(
                            parserData.notePath,
                            parserData.noteText,
                            {
                                endLineNum: parserData.lineData.currentLineNum,
                                startLineNum: parserData.lineData.currentLineNum,
                                type: "MALFORMED_MULTILINE_CARD",
                                text: currentLineTrimmed,
                            },
                        );
                        break;
                    }
                    parserData.setParserState("MULTILINE_SEPARATOR");
                } else {
                    // Text
                    parserData.setParserState("TEXT");
                }
                return QuestionParser.parseLine(parserData);
            }

            case "EMPTY_LINE": {
                /* Empty line
                    -> relevant > we handle it
                    -> irrelevant > we skip it
                */
                if (
                    parserData.options.multilineCardEndMarker !== null &&
                    parserData.options.multilineCardEndMarker !== undefined &&
                    parserData.options.multilineCardEndMarker !== "" &&
                    parserData.options.multilineCardEndMarker.trim() !== "" &&
                    (parserData.searchForMultilineCards || parserData.searchForMultilineCloze)
                ) {
                    // Only handle this if multiline cards are enabled and we are already searching for multiline cards or clozes

                    parserData.setParserState("TEXT");
                    return QuestionParser.parseLine(parserData);
                } else {
                    parserData.endMultiLineSearch();
                }
                break;
            }

            case "NON_SR_HTML_COMMENT": {
                if (!QuestionParser.hasEndOfHTMLComment(currentLineTrimmed)) {
                    parserData.setParserState("NON_SR_HTML_COMMENT");
                }
                parserData.endMultiLineSearch();
                break;
            }

            case "SR_HTML_COMMENT": {
                const potentialRougeCardFragment: CardFragment = {
                    endLineNum: parserData.lineData.currentLineNum,
                    startLineNum: parserData.lineData.currentLineNum,
                    type: "ROUGE_SR_COMMENT",
                    text: parserData.lineData.currentLine,
                };

                const addRougeSRComment = () => {
                    QuestionParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        potentialRougeCardFragment,
                    );
                    parserData.endMultiLineSearch();
                    return parserData;
                };

                // We haven't parsed any cards yet, so we can't add a scheduling info comment
                if (parserData.cardData.lastCardIndex < 0) {
                    parserData = addRougeSRComment();
                    break;
                }

                const lastCard: ParsedQuestionInfo =
                    parserData.cardData.cards[parserData.cardData.lastCardIndex];
                // Last card is not connected to this SR comment
                if (lastCard.lastLineNum + 1 !== parserData.lineData.currentLineNum) {
                    parserData = addRougeSRComment();
                    break;
                }

                // Last card is connected to this SR comment, but it already has a scheduling info comment
                if (lastCard.text.includes("<!--SR:")) {
                    parserData = addRougeSRComment();
                    break;
                }

                // Last card is connected to this SR comment
                if (
                    parserData.cardData.potentialNewCard !== null &&
                    parserData.cardData.potentialNewCard.cardType !== null &&
                    (parserData.cardData.potentialNewCard.cardType === CardType.MultiLineBasic ||
                        parserData.cardData.potentialNewCard.cardType ===
                            CardType.MultiLineReversed) &&
                    (parserData.cardData.potentialNewCard.backText === null ||
                        parserData.cardData.potentialNewCard.backText.length === 0)
                ) {
                    parserData.endMultiLineSearch();
                }
                parserData.cardData.addCurrentLineToLastCard(parserData.lineData);

                if (
                    parserData.options.multilineCardEndMarker === null ||
                    parserData.options.multilineCardEndMarker.length === 0
                ) {
                    // Multiline card end marker is disabled, so we can be sure that the multiline search is finished
                    parserData.endMultiLineSearch();
                }
                break;
            }

            case "INLINE_CARD": {
                parserData.cardData.addInlineCardToList(
                    parserData.lineData,
                    parserData.notePath,
                    parserData.noteText,
                );
                parserData.endMultiLineSearch();
                break;
            }

            case "MULTILINE_SEPARATOR": {
                if (parserData.searchForMultilineCards || parserData.searchForMultilineCloze) {
                    // End multiline search if it is still active & transfer last line to the new card
                    // if it is possible

                    const lastCard = parserData.cardData.getLastCard();
                    if (lastCard === null) {
                        // This happens if there are somehow no cards in the list, so it doesn't make sense to continue
                        break;
                    }
                    const lastLineNum = lastCard.lastLineNum;
                    const linesOfLastCard = lastCard.text.split("\n");
                    const lastLine = linesOfLastCard[linesOfLastCard.length - 1];
                    // console.log("LAST CARD where we have to remove the last line", "\n", lastCard);

                    // To be able to add the last line to the new card, it must be text
                    // Parsing is done in the following order:
                    // 1. Read line -> STATE: PARSE_LINE
                    // 2. Handle detected line -> should be text here -> STATE: TEXT
                    const indexOfLastParserState = parserData.getIndexOfLastParserState();
                    // Here -1 because the last one should be PARSE_LINE and we want the one before that
                    if (
                        parserData.getPrevParserStateAtIndex(indexOfLastParserState - 1) === "TEXT"
                    ) {
                        // If this is the case, we can safely add the last line to the new card, because we have this situation:
                        /*
                            Prev Question
                            ?
                            Previous Answer
                            Previous Extra Answer / Maybe Question <- last line so we add it to the new card / remove it from the last card
                            ? <- We are here
                            New Answer
                        */

                        // Transfer last line to the new card
                        const newPotentialCard = parserData.cardData.potentialNewCard;

                        const cardType = QuestionParser.getMultilineCardType(
                            lastLine,
                            parserData.lineData.multilineSeparators,
                        );
                        if (cardType !== null) {
                            newPotentialCard.cardType = cardType;
                        }
                        newPotentialCard.text =
                            lastLine + "\n" + parserData.lineData.currentLineEndTrimmed;
                        newPotentialCard.firstLineNum = lastLineNum;
                        newPotentialCard.lastLineNum = parserData.lineData.currentLineNum;
                        newPotentialCard.frontText = lastLine;
                        newPotentialCard.backText = null;

                        // console.log("NEW POTENTIAL CARD with last line added", "\n", newPotentialCard);

                        parserData.cardData.potentialNewCard = newPotentialCard;

                        // Remove last line from last card
                        lastCard.lastLineNum--;
                        lastCard.text = lastCard.text.split("\n").slice(0, -1).join("\n");
                        if (lastCard.backText !== null && lastCard.backText.length > 0) {
                            lastCard.backText = lastCard.backText
                                .split("\n")
                                .slice(0, -1)
                                .join("\n");
                        }

                        // console.log("LAST CARD, where we removed the last line", "\n", lastCard);
                        parserData.cardData.cards[parserData.cardData.lastCardIndex] = lastCard;

                        break;
                    }

                    // If we are here, then its a malformed multiline card
                    parserData.endMultiLineSearch();
                    break;
                }

                parserData.cardData.potentialNewCard.lastLineNum =
                    parserData.lineData.currentLineNum;
                parserData.cardData.potentialNewCard.text +=
                    "\n" + parserData.lineData.currentLineEndTrimmed;
                const multilineCardType = QuestionParser.getMultilineCardType(
                    parserData.lineData.currentLineTrimmed,
                    parserData.lineData.multilineSeparators,
                );
                if (multilineCardType !== null) {
                    parserData.cardData.potentialNewCard.cardType = multilineCardType;
                }

                // Begin a new multiline search with multiline cards
                parserData.searchForMultilineCards = true;
                parserData.searchForMultilineCloze = false;
                break;
            }

            case "MULTILINE_END_MARKER": {
                const lastCard: ParsedQuestionInfo | null = parserData.cardData.getLastCard();

                if (lastCard === null)
                    throw new Error(
                        "Malformed multiline card -> somehow the fragment wasn't caught in PARSE_LINE",
                    );

                const addMalformedMultilineCardFragment = () => {
                    QuestionParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        {
                            endLineNum: lastCard.lastLineNum + 1,
                            startLineNum: lastCard.firstLineNum,
                            type: "MALFORMED_MULTILINE_CARD_WITH_END_MARKER",
                            text: lastCard.text + "\n" + parserData.lineData.currentLine,
                        },
                    );
                };

                if (
                    (lastCard.backText === null || lastCard.backText.length === 0) &&
                    parserData.searchForMultilineCards
                ) {
                    // Here the card fragment is malformed, as it doesn't have a back text
                    /*
                        Question
                        ?
                        +++
                    */

                    addMalformedMultilineCardFragment();
                }

                if (parserData.searchForMultilineCards && !parserData.searchForMultilineCloze) {
                    parserData.cardData.addMultilineCardToList(parserData.lineData, () => {
                        addMalformedMultilineCardFragment();
                    });
                } else {
                    parserData.cardData.addCurrentLineToLastCard(
                        parserData.lineData,
                        parserData.searchForMultilineCards,
                    );
                }

                parserData.endMultiLineSearch();
                break;
            }

            case "CLOZE": {
                if (parserData.searchForMultilineCards || parserData.options.useAtomicClozes) {
                    // End multiline search if it could be active
                    parserData.endMultiLineSearch();
                }

                if (parserData.options.useAtomicClozes) {
                    parserData.cardData.addAtomicClozeToList(parserData.lineData);
                    break;
                }

                if (parserData.searchForMultilineCloze) {
                    parserData.cardData.addCurrentLineToLastCard(parserData.lineData);
                    break;
                }

                parserData.cardData.addClozeToList(parserData.lineData);
                // Begin a new multiline search with clozes
                parserData.endMultiLineSearch();
                parserData.searchForMultilineCloze = true;
                break;
            }

            case "TEXT": {
                // Adds current line to the last card or potential new card
                // This state shall only be entered when the current line is connected to the last card or if it belongs to the potential new card

                if (parserData.searchForMultilineCloze || parserData.searchForMultilineCards) {
                    if (
                        parserData.cardData.potentialNewCard !== null &&
                        parserData.cardData.potentialNewCard.backText === null &&
                        parserData.cardData.potentialNewCard.cardType !== null &&
                        (parserData.cardData.potentialNewCard.cardType ===
                            CardType.MultiLineBasic ||
                            parserData.cardData.potentialNewCard.cardType ===
                                CardType.MultiLineReversed)
                    ) {
                        parserData.cardData.addMultilineCardToList(parserData.lineData, () => {
                            QuestionParser.notesWithCardFragments.addCardFragment(
                                parserData.notePath,
                                parserData.noteText,
                                {
                                    endLineNum: parserData.lineData.currentLineNum,
                                    startLineNum: parserData.lineData.currentLineNum,
                                    type: "MALFORMED_MULTILINE_CARD",
                                    text: parserData.lineData.currentLineTrimmed,
                                },
                            );
                        });

                        break;
                    }

                    if (
                        !parserData.cardData.cards[parserData.cardData.lastCardIndex].text.includes(
                            QuestionParser.srCommentStart,
                        )
                    ) {
                        parserData.cardData.addCurrentLineToLastCard(
                            parserData.lineData,
                            parserData.searchForMultilineCards,
                        );
                        break;
                    }
                    // This only happens if the multiline card end marker is enabled, but not used with this card
                    parserData.endMultiLineSearch();
                }

                // From here on, we know that this text could be long to a new card or it is just some random text in the note

                if (
                    parserData.cardData.potentialNewCard === null &&
                    parserData.lineData.currentLineTrimmed.length > 0
                ) {
                    parserData.cardData.initNewPotentialCard(
                        CardType.Cloze,
                        parserData.lineData.currentLineEndTrimmed,
                        parserData.lineData.currentLineNum,
                        parserData.lineData.currentLineNum,
                        parserData.lineData.currentLineEndTrimmed,
                    );
                    break;
                }

                // We have a potential new card, so we add the current line to it
                const modifiedPotentialCard: ParsedQuestionInfo =
                    parserData.cardData.potentialNewCard;
                modifiedPotentialCard.text += "\n" + parserData.lineData.currentLine;
                modifiedPotentialCard.frontText += "\n" + parserData.lineData.currentLine;
                modifiedPotentialCard.lastLineNum = parserData.lineData.currentLineNum;
                parserData.cardData.potentialNewCard = modifiedPotentialCard;

                break;
            }

            default:
                throw new Error("Impossible parser state: " + parserData.currentParserState);
        }
        return parserData;
    }

    public static setDebugParser(value: boolean) {
        QuestionParser.debugParser = value;
    }

    /**
     * Returns true if the trimmed line starts with the nonSrCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static hasStartOfNonSRHTMLComment(trimmedLine: string): boolean {
        return (
            trimmedLine.startsWith(QuestionParser.nonSrCommentStart) &&
            !trimmedLine.startsWith(QuestionParser.srCommentStart)
        );
    }

    /**
     * Returns true if the trimmed line ends with the commentEnd
     *
     * @param trimmedLine
     * @returns
     */
    static hasEndOfHTMLComment(trimmedLine: string): boolean {
        return trimmedLine.endsWith(QuestionParser.commentEnd);
    }

    /**
     * Returns true if the trimmed line starts with the srCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static hasSRHTMLComment(trimmedLine: string): boolean {
        return trimmedLine.startsWith(QuestionParser.srCommentStart);
    }

    /**
     * Returns true if the trimmed line is the multilineCardEndMarker
     *
     * @param trimmedLine
     * @param multilineCardEndMarker
     * @returns
     */
    static isMultiLineCardEndMarker(
        trimmedLine: string,
        multilineCardEndMarker: string | null,
    ): boolean {
        return (
            multilineCardEndMarker !== null &&
            multilineCardEndMarker !== "" &&
            trimmedLine.startsWith(multilineCardEndMarker) &&
            trimmedLine.length === multilineCardEndMarker.length
        );
    }

    /**
     * Returns true if the trimmed line is one of the multiline card separators
     *
     * @param trimmedLine - The text to check
     * @param separators - The multiline card separators
     * @returns
     */
    static isMultiLineCardSeparator(trimmedLine: string, separators: string[]): boolean {
        for (const separator of separators) {
            if (trimmedLine.startsWith(separator) && trimmedLine.length === separator.length) {
                return true;
            }
        }

        return false;
    }

    static getMultilineCardType(
        trimmedLine: string,
        separators: Array<{ separator: string; type: CardType }>,
    ): CardType | null {
        for (const separator of separators) {
            if (
                trimmedLine.startsWith(separator.separator) &&
                trimmedLine.length === separator.separator.length
            ) {
                return separator.type;
            }
        }
        return null;
    }

    /**
     * Returns true if the marker is inside a code block
     *
     * @param trimmedLine - The text to check
     * @param marker - The marker
     * @param markerIndex - The index of the marker in the text
     * @returns
     */
    static isMarkerInsideCodeBlock(
        trimmedLine: string,
        marker: string,
        markerIndex: number,
    ): boolean {
        // TODO: Handle codeblocks
        let goingBack = markerIndex - 1,
            goingForward = markerIndex + marker.length;
        let backTicksBefore = 0,
            backTicksAfter = 0;

        while (goingBack >= 0) {
            if (trimmedLine[goingBack] === "`") backTicksBefore++;
            goingBack--;
        }

        while (goingForward < trimmedLine.length) {
            if (trimmedLine[goingForward] === "`") backTicksAfter++;
            goingForward++;
        }

        // If there's an odd number of backticks before and after,
        //  the marker is inside an inline code block
        return backTicksBefore % 2 === 1 && backTicksAfter % 2 === 1;
    }

    /**
     * Returns true if the trimmed line has one of the inline separators
     *
     * @param trimmedLine - The text to check
     * @param separators - The inline separators
     * @returns
     */
    static hasInlineSeparator(trimmedLine: string, separators: string[]): boolean {
        // Check if the marker is in the text
        for (const separator of separators) {
            const separatorIdx = trimmedLine.indexOf(separator);
            if (separatorIdx === -1) continue;
            // Check if it's inside an inline code block
            if (QuestionParser.isMarkerInsideCodeBlock(trimmedLine, separator, separatorIdx))
                continue;
            return true;
        }

        return false;
    }

    /**
     * Returns there are any clozes within the trimmed line
     *
     * @param trimmedLine - The trimmed line to check
     * @param clozeCrafter - The cloze crafter
     * @returns True if there are clozes
     */
    static hasClozes(trimmedLine: string, clozeCrafter: ClozeCrafter): boolean {
        return clozeCrafter.isClozeNote(trimmedLine);
    }
}

//     // Skip everything in HTML comments
//     if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
//         while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
//         i++;
//         continue;
//     }

//     // Have we reached the end of a card?
//     const isEmptyLine = currentTrimmed.length === 0;
//     const hasMultilineCardEndMarker =
//         options.multilineCardEndMarker && !isEmptyLine && currentTrimmed === options.multilineCardEndMarker;

//     if (
//         // We've probably reached the end of a card
//         (isEmptyLine && !options.multilineCardEndMarker) ||
//         // Empty line & we're not picking up any card
//         (isEmptyLine && cardType === null) ||
//         // We've reached the end of a multi line card &
//         //  we're using custom end markers
//         hasMultilineCardEndMarker
//     ) {
//         if (cardType) {
//             // Create a new card
//             lastLineNo = i - 1;
//             if (options.multilineCardEndMarker && (cardType === CardType.MultiLineBasic || cardType === CardType.MultiLineReversed)) {
//                 console.log(cardText);
//             }

//             cards.push(
//                 new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo),
//             );
//             cardType = null;
//         }

//         cardText = "";
//         firstLineNo = i + 1;
//         continue;
//     }

//     // Update card text
//     if (cardText.length > 0) {
//         cardText += "\n";
//     }
//     cardText += currentLine.trimEnd();

//     // Pick up inline cards
//     for (const { separator, type } of inlineSeparators) {
//         if (QuestionParser.hasInlineMarker(currentLine, separator)) {
//             cardType = type;
//             break;
//         }
//     }

//     if (cardType === CardType.SingleLineBasic || cardType === CardType.SingleLineReversed) {
//         cardText = currentLine;
//         firstLineNo = i;

//         // Pick up scheduling information if present
//         if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
//             cardText += "\n" + lines[i + 1];
//             i++;
//         }

//         lastLineNo = i;
//         cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));

//         cardType = null;
//         cardText = "";
//     } else if (currentTrimmed === options.multilineCardSeparator) {
//         // Ignore card if the front of the card is empty
//         if (cardText.length > 1) {
//             // Pick up multiline basic cards
//             cardType = CardType.MultiLineBasic;
//         }
//     } else if (currentTrimmed === options.multilineReversedCardSeparator) {
//         // Ignore card if the front of the card is empty
//         if (cardText.length > 1) {
//             // Pick up multiline basic cards
//             cardType = CardType.MultiLineReversed;
//         }
//     } else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
//         // Pick up codeblocks
//         const codeBlockClose = currentLine.match(/`+|~+/)[0];
//         while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
//             i++;
//             cardText += "\n" + lines[i];
//         }
//         cardText += "\n" + codeBlockClose;
//         i++;
//     } else if (cardType === null && clozeCrafter.isClozeNote(currentLine)) {
//         // Pick up cloze cards
//         cardType = CardType.Cloze;
//     }
// }

// // Do we have a card left in the queue?
// if (cardType && cardText) {
//     lastLineNo = lines.length - 1;
//     cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
// }
