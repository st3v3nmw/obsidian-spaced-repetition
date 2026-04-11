import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import { CardFragment } from "src/utils/parsers/data-structures/cards/card-fragments/card-fragment";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import { ParserData } from "src/utils/parsers/data-structures/parser/parser-data";
import StringDetector from "src/utils/parsers/detectors/string-detector";

/**
 * The line parser class
 *
 * This class is responsible for parsing a line of text into potential new cards.
 * It is a state machine that parses the line depending on the current state.
 * always first determines in which state it should be in based on the current line. Then it parses the line based on the current state.
 *
 * While parsing it also keeps track of any card fragments that it finds in each note along the way, so that they can be handled later.This is done by keeping a list of note paths and a list of rouge card fragments for each note path.
 *
 */
export default class LineParser {
    static parseLine(parserData: ParserData): ParserData {
        // Trim the current line for easier parsing and use in function calls
        const currentLineTrimmed: string = parserData.lineData.currentLineTrimmed;

        if (CardParser.debugParser) {
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
                if (
                    !parserData.noHTMLCommentsInCurrentLine &&
                    (StringDetector.indexOfHTMLCommentStart(currentLineTrimmed) >= 0 ||
                        StringDetector.indexOfHTMLCommentEnd(currentLineTrimmed) >= 0)
                ) {
                    // Non sr info comment
                    parserData.setParserState("HTML_COMMENT_START_OR_END");
                } else if (LineParser.parserIsInMiddleOfNonSRHTMLComment(parserData)) {
                    // Non sr info comment
                    parserData.setParserState("HTML_COMMENT_MIDDLE");
                } else if (currentLineTrimmed.length === 0) {
                    // Empty line
                    parserData.setParserState("EMPTY_LINE");
                } else if (StringDetector.indexOfCodeBlockMarker(currentLineTrimmed) >= 0) {
                    // Code block start/end
                    parserData.setParserState("CODE_BLOCK_START_OR_END");
                } else if (parserData.isInCodeBlock) {
                    // Code block middle
                    parserData.setParserState("CODE_BLOCK_MIDDLE");
                } else if (
                    StringDetector.isMultiLineCardEndMarker(
                        currentLineTrimmed,
                        parserData.options.multilineCardEndMarker,
                    )
                ) {
                    // Multiline card end marker
                    if (parserData.searchForMultilineCloze || parserData.searchForMultilineCards) {
                        parserData.setParserState("MULTILINE_END_MARKER");
                    } else {
                        // This shouldn't be here in the current line
                        CardParser.notesWithCardFragments.addCardFragment(
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
                } else if (
                    StringDetector.hasInlineSeparator(
                        currentLineTrimmed,
                        parserData.lineData.inlineSeparators.map((x) => x.separator),
                    )
                ) {
                    // Inline card
                    parserData.setParserState("INLINE_CARD");
                } else if (
                    StringDetector.hasClozes(
                        currentLineTrimmed,
                        parserData.clozeCrafter,
                        parserData.options.clozePatterns,
                    )
                ) {
                    // Cloze card

                    console.log(currentLineTrimmed);
                    parserData.setParserState("CLOZE");
                } else if (
                    StringDetector.isMultiLineCardSeparator(
                        currentLineTrimmed,
                        parserData.lineData.multilineSeparators.map((x) => x.separator),
                    )
                ) {
                    // Multiline card separator
                    const potentialNewCard: ParsedCardInfo | null =
                        parserData.cardData.potentialNewCard;
                    if (
                        potentialNewCard === null ||
                        potentialNewCard.text.length === 0 ||
                        potentialNewCard.frontText.length === 0
                    ) {
                        // The multi line card separator shouldn't be here in the current line
                        CardParser.notesWithCardFragments.addCardFragment(
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
                parserData = LineParser.parseLine(parserData);
                break;
            }

            case "HTML_COMMENT_START_OR_END": {
                // TODO: Improve this mess, as it is too complex to understand
                const srCommentsInLine = StringDetector.getSRCommentsInLine(
                    parserData.lineData.currentLineTrimmed,
                    parserData.lineData.currentLineNum,
                );

                const htmlCommentsInLine = StringDetector.getHTMLCommentsInLine(
                    parserData.lineData.currentLineTrimmed,
                    parserData.lineData.currentLineNum,
                    srCommentsInLine,
                );

                if (htmlCommentsInLine.length === 0 && srCommentsInLine.length > 0) {
                    // No html comments & not within a html comment, but there are SR comments

                    if (LineParser.parserIsInMiddleOfNonSRHTMLComment(parserData)) {
                        // We are in the middle of a non sr html comment, so we can't handle this as a SR comment, so we just skip this line
                        break;
                    }

                    if (
                        parserData.lineData.currentLineTrimmed.startsWith("<!--SR:") &&
                        !LineParser.parserIsInMiddleOfNonSRHTMLComment(parserData)
                    ) {
                        parserData.setParserState("SR_HTML_COMMENT");
                    } else {
                        // There is a mix of SR comments and text, so we can handle it differently by parsing the text first
                        parserData.noHTMLCommentsInCurrentLine = true;
                        parserData.setParserState("PARSE_LINE");
                    }
                    parserData = LineParser.parseLine(parserData);

                    break;
                }

                // We know now that there is a mix of SR comments, HTML comments and text so we can handle it
                // all new starts of HTML comments that are new in this line and not handled somewhere
                let commentsWithoutEnd = htmlCommentsInLine
                    .filter((htmlComment) => htmlComment.endIndex < 0)
                    .sort((a, b) => a.startIndex - b.startIndex);

                // Save whitespace before text
                const whitespaceBeforeText = StringDetector.getWhitespaceBeforeText(
                    parserData.lineData.currentLine,
                    parserData.lineData.currentLineTrimmed,
                    parserData.lineData.currentLineEndTrimmed,
                );

                // Prep to collect uncommented text
                let uncommentedText = "";
                let indexOfNextComment = -1;
                // Check if we are still in a comment from the previous line
                let isInCommentFromPrevLine = parserData.stillOpenHTMLComments.length > 0; // Flag to indicate if we are still in a comment from the previous line

                // Skip all text in comments and extract the text outside of them
                for (let i = 0; i < parserData.lineData.currentLineTrimmed.length; i++) {
                    // Check if we are still in a comment from the previous line
                    if (isInCommentFromPrevLine) {
                        // If still in a comment, then we need to close it else we skip that whole line
                        const nextCommentEnd = htmlCommentsInLine.filter(
                            (comment) => comment.endIndex >= i,
                        );

                        if (nextCommentEnd.length > 0) {
                            const nextCommentEndIndex = nextCommentEnd[0].endIndex;
                            // Jump to the end of the comment
                            i = nextCommentEndIndex;
                            // Close all open comments from the previous line
                            parserData.stillOpenHTMLComments = [];

                            // Remove all comments from the list of comments without end, which are in the comment, that we just closed
                            commentsWithoutEnd = commentsWithoutEnd.filter(
                                (comment) => comment.startIndex > i,
                            );
                            // Update the flag
                            isInCommentFromPrevLine = false;
                            continue;
                        } else {
                            // We are still in a comment from the previous line
                            // But there are no more end of comments in the current line
                            // So we can stop parsing the line
                            break;
                        }
                    }

                    // Now we are either not in a comment(We are also not in a comment, if it is just a rouge end) or we are right at the start of a new comment
                    // Check if we are right at the start of a new comment
                    if (indexOfNextComment < 0) {
                        // Find the next start index
                        indexOfNextComment = htmlCommentsInLine.findIndex((comment) => {
                            return comment.startIndex >= i;
                        });
                    }

                    if (
                        indexOfNextComment >= 0 &&
                        htmlCommentsInLine[indexOfNextComment].startIndex === i
                    ) {
                        // A new comment is starting here
                        const newComment = htmlCommentsInLine[indexOfNextComment];
                        indexOfNextComment = -1; // Reset the next start index for the next iteration

                        if (newComment.endIndex >= 0) {
                            // this comment end in the same line, so we can skip to the end of the comment
                            i = newComment.endIndex;
                            continue;
                        }

                        // The comment doesn't end in the same line, we can stop parsing the line, as any text after this is part of the comment, until it is closed
                        break;
                    }

                    // We are not in a comment, so we add the text to the uncommented text
                    uncommentedText += parserData.lineData.currentLineTrimmed[i];
                }

                // We have gone through the whole line, so now we can handle any remaining uncommented text
                if (uncommentedText.trim().length > 0) {
                    // There is some text left, so we st the current line to the trimmed text
                    const uncommentedTextEndTrimmed =
                        whitespaceBeforeText + uncommentedText.trimEnd();
                    parserData.lineData.currentLineTrimmed = uncommentedText.trim();
                    parserData.lineData.currentLineEndTrimmed = uncommentedTextEndTrimmed;
                    parserData.lineData.currentLine = uncommentedTextEndTrimmed;

                    // Disable HTML comment detection here because we have handled any comments.
                    // There are only fragments of comments left like "-->" which can now just be handled as text
                    parserData.noHTMLCommentsInCurrentLine = true;
                    parserData.setParserState("PARSE_LINE");
                    parserData = LineParser.parseLine(parserData);

                    // Reset the no HTML comments in current line flag for the next line
                    parserData.noHTMLCommentsInCurrentLine = false;
                }

                // Now add all the remaining open comments so that we can handle them later, if there are any
                parserData.stillOpenHTMLComments =
                    parserData.stillOpenHTMLComments.concat(commentsWithoutEnd);

                break;
            }

            case "HTML_COMMENT_MIDDLE": {
                // Skip line till all start comments are closed
                parserData.setParserState("PARSE_LINE");
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
                    CardParser.notesWithCardFragments.addCardFragment(
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

                const lastCard: ParsedCardInfo =
                    parserData.cardData.cards[parserData.cardData.lastCardIndex];
                // Last card is not connected to this SR comment by being on the next line
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

                // Check if it is also connected in the case of atomic clozes, where no text from the next line is added apart from the scheduling info comment
                if (parserData.options.useAtomicClozes && lastCard.cardType === CardType.Cloze) {
                    // It will only be connected if there is no other text in the current line

                    if (
                        !parserData.lineData.currentLineTrimmed.startsWith("<!--SR:") &&
                        !StringDetector.hasClozes(
                            parserData.lineData.currentLineTrimmed,
                            parserData.clozeCrafter,
                            parserData.options.clozePatterns,
                        ) &&
                        !StringDetector.hasInlineSeparator(
                            parserData.lineData.currentLineTrimmed,
                            parserData.lineData.inlineSeparators.map((x) => x.separator),
                        ) &&
                        !StringDetector.isMultiLineCardSeparator(
                            parserData.lineData.currentLineTrimmed,
                            parserData.lineData.multilineSeparators.map((x) => x.separator),
                        )
                    ) {
                        parserData = addRougeSRComment();
                        break;
                    }
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

                        const cardType = StringDetector.getMultilineCardType(
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
                const multilineCardType = StringDetector.getMultilineCardType(
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
                const lastCard: ParsedCardInfo | null = parserData.cardData.getLastCard();

                if (lastCard === null)
                    throw new Error(
                        "Malformed multiline card -> somehow the fragment wasn't caught in PARSE_LINE",
                    );

                const addMalformedMultilineCardFragment = () => {
                    CardParser.notesWithCardFragments.addCardFragment(
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

            case "CODE_BLOCK_START_OR_END": {
                parserData.isInCodeBlock = !parserData.isInCodeBlock;
                parserData.setParserState("TEXT");
                parserData = LineParser.parseLine(parserData);
                break;
            }

            case "CODE_BLOCK_MIDDLE": {
                parserData.setParserState("TEXT");
                parserData = LineParser.parseLine(parserData);
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
                            CardParser.notesWithCardFragments.addCardFragment(
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
                            StringDetector.srCommentStart,
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
                const modifiedPotentialCard: ParsedCardInfo = parserData.cardData.potentialNewCard;
                modifiedPotentialCard.text += "\n" + parserData.lineData.currentLine;
                modifiedPotentialCard.frontText += "\n" + parserData.lineData.currentLine;
                modifiedPotentialCard.lastLineNum = parserData.lineData.currentLineNum;
                parserData.cardData.potentialNewCard = modifiedPotentialCard;

                break;
            }

            case "EMPTY_LINE": {
                /* Empty line
                    -> relevant > we handle it
                    -> irrelevant > we skip it
                */
                if (
                    parserData.isInCodeBlock ||
                    (parserData.options.multilineCardEndMarker !== null &&
                        parserData.options.multilineCardEndMarker !== undefined &&
                        parserData.options.multilineCardEndMarker !== "" &&
                        parserData.options.multilineCardEndMarker.trim() !== "" &&
                        (parserData.searchForMultilineCards || parserData.searchForMultilineCloze))
                ) {
                    // Only handle this if multiline cards are enabled and we are already searching for multiline cards or clozes

                    parserData.setParserState("TEXT");
                    parserData = LineParser.parseLine(parserData);
                    break;
                } else {
                    parserData.endMultiLineSearch();
                }
                break;
            }

            default:
                throw new Error("Impossible parser state: " + parserData.currentParserState);
        }
        return parserData;
    }

    /**
     * Returns true if the parser is currently in the middle of a non sr html comment
     *
     * @param parserData
     * @returns
     */
    private static parserIsInMiddleOfNonSRHTMLComment(parserData: ParserData): boolean {
        return parserData.stillOpenHTMLComments.length > 0;
    }
}
