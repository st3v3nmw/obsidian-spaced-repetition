import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import { CardFragment } from "src/utils/parsers/data-structures/cards/card-fragments/card-fragment";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import { ParserData } from "src/utils/parsers/data-structures/parser/parser-data";
import PotentialCardInfo from "src/utils/parsers/data-structures/parser/potential-card-info";
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
        if (CardParser.debugParser) {
            console.log("[DEBUG]: Current state: " + parserData.currentParserState);
            console.log(
                "[DEBUG]: Current line: " + parserData.lineData.currentLine,
                parserData.lineData.currentLineNum,
            );
        }
        // TODO: Reimplement multiline card end marker
        // TODO: Reimplement how potential new card is handled -> only add when fully sure that it ends

        // Handle any relevant states, that a line can be in
        switch (parserData.currentParserState) {
            case "PARSE_LINE": {
                // Route to the correct state based on line content
                const nextParserState = parserData.determineNextParserState();
                parserData.setParserState(nextParserState);

                if (nextParserState === "PARSE_LINE") {
                    // No relevant content in the line, so we just skip it and stay in the PARSE_LINE state
                    break;
                }

                // Parse any relevant content in the line
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

                    if (parserData.isParserInMultilineHTMLComment()) {
                        // We are in the middle of a non sr html comment, so we can't handle this as a SR comment, so we just skip this line
                        break;
                    }

                    if (
                        parserData.lineData.currentLineTrimmed.startsWith("<!--SR:") &&
                        !parserData.isParserInMultilineHTMLComment()
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
                    type: "ROUGE_SR_COMMENT",
                    fragmentInfo: new PotentialCardInfo(
                        null,
                        parserData.lineData.currentLine,
                        parserData.lineData.currentLineNum,
                        parserData.lineData.currentLineNum,
                    ),
                };

                const addRougeSRComment = () => {
                    CardParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        potentialRougeCardFragment,
                    );
                    parserData.addPotentialCardToList();
                    return parserData;
                };

                const lastCard: ParsedCardInfo | null = parserData.cardData.potentialCard;

                // Check if the last card is connected to this SR comment, if not, then we add a rouge SR comment fragment, because this shouldn't be here in the current line
                if (
                    // We haven't parsed any cards yet, so we can't add a scheduling info comment
                    lastCard === null ||
                    lastCard.cardType === null ||
                    // Last card is not connected to this SR comment by being on the next line
                    lastCard.lastLineNum + 1 !== parserData.lineData.currentLineNum ||
                    // Last card is connected to this SR comment, but it already has a scheduling info comment
                    lastCard.text.includes("<!--SR:") ||
                    // Check if it is also connected in the case of atomic clozes, where no text from the next line is added apart from the scheduling info comment
                    (parserData.options.useAtomicClozes &&
                        lastCard.cardType === CardType.Cloze &&
                        // It will only be connected if there is no other text in the current line
                        !parserData.lineData.currentLineTrimmed.startsWith("<!--SR:") &&
                        !StringDetector.hasClozes(
                            parserData.lineData.currentLineTrimmed,
                            parserData.clozeCrafter,
                            parserData.options.clozePatterns,
                        ) &&
                        !StringDetector.hasAnyInlineSeparator(
                            parserData.lineData.currentLineTrimmed,
                            parserData.lineData.inlineSeparators.map((x) => x.separator),
                        ) &&
                        !StringDetector.isMultiLineCardSeparator(
                            parserData.lineData.currentLineTrimmed,
                            parserData.lineData.multilineSeparators.map((x) => x.separator),
                        ))
                ) {
                    parserData = addRougeSRComment();
                    break;
                }

                // Last card is connected to this SR comment
                parserData.cardData.addCurrentLineToPotentialCard(parserData.lineData);

                // Multiline card end marker is disabled, so we can be sure that the potential multiline card is finished
                if (
                    parserData.options.multilineCardEndMarker === null ||
                    parserData.options.multilineCardEndMarker.length === 0
                ) {
                    parserData.addPotentialCardToList();
                }

                break;
            }

            case "INLINE_CARD": {
                parserData.addPotentialCardToList();

                parserData.cardData.initInlineCardInPotentialCard(
                    parserData.lineData,
                    parserData.notePath,
                    parserData.noteText,
                );
                break;
            }

            case "MULTILINE_SEPARATOR": {
                const cardType = StringDetector.getMultilineCardType(
                    parserData.lineData.currentLineTrimmed,
                    parserData.lineData.multilineSeparators,
                );

                if (cardType === null) {
                    // This should never happen, but we just return to be safe
                    console.error(
                        "Separator type is null when trying to add multiline card to list",
                    );
                    break;
                }

                if (
                    parserData.cardData.potentialCard !== null &&
                    parserData.cardData.potentialCard.cardType !== null
                ) {
                    // If we are here, then we have two cards back to back
                    parserData.addPotentialCardToList();
                    parserData.cardData.addCurrentLineToPotentialCard(
                        parserData.lineData,
                        cardType,
                    );
                    break;
                }

                if (parserData.cardData.potentialCard !== null) {
                    // We are currently building a potential card, so we add the current line to it, as it belongs to the potential card
                    parserData.cardData.addCurrentLineToPotentialCard(
                        parserData.lineData,
                        cardType,
                    );
                } else {
                    // We are not currently building a potential card, which means that this is a malformed multiline card
                    CardParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        {
                            type: "MALFORMED_MULTILINE_CARD",
                            fragmentInfo: new PotentialCardInfo(
                                null,
                                parserData.lineData.currentLineTrimmed,
                                parserData.lineData.currentLineNum,
                                parserData.lineData.currentLineNum,
                            ),
                        },
                    );
                }

                break;
            }

            case "MULTILINE_END_MARKER": {
                // TODO: Implement back stepping if multilineendmarker isn't found

                const lastCard: ParsedCardInfo | null = parserData.cardData.potentialCard;

                if (
                    lastCard === null ||
                    lastCard.cardType === null ||
                    (lastCard.cardType === CardType.Cloze && parserData.options.useAtomicClozes)
                ) {
                    // Rouge multiline end marker
                    CardParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        {
                            type: "MALFORMED_MULTILINE_CARD_WITH_END_MARKER",
                            fragmentInfo: new PotentialCardInfo(
                                null,
                                parserData.lineData.currentLine,
                                parserData.lineData.currentLineNum,
                                parserData.lineData.currentLineNum,
                            ),
                        },
                    );
                    break;
                }

                const addMalformedMultilineCardFragment = () => {
                    CardParser.notesWithCardFragments.addCardFragment(
                        parserData.notePath,
                        parserData.noteText,
                        {
                            type: "MALFORMED_MULTILINE_CARD_WITH_END_MARKER",
                            fragmentInfo: new PotentialCardInfo(
                                lastCard.cardType,
                                lastCard.text + "\n" + parserData.lineData.currentLine,
                                lastCard.firstLineNum,
                                lastCard.lastLineNum + 1,
                                lastCard.frontText,
                                lastCard.backText,
                            ),
                        },
                    );
                };

                if (
                    (lastCard.backText === null || lastCard.backText.length === 0) &&
                    lastCard.cardType !== CardType.MultiLineBasic &&
                    lastCard.cardType !== CardType.MultiLineReversed
                ) {
                    // Here the card fragment is malformed, as it doesn't have a back text
                    /*
                        Question
                        ?
                        +++
                    */

                    addMalformedMultilineCardFragment();
                }

                parserData.cardData.addCurrentLineToPotentialCard(parserData.lineData);
                parserData.addPotentialCardToList();
                break;
            }

            case "CLOZE": {
                if (
                    parserData.options.useAtomicClozes ||
                    (parserData.cardData.potentialCard !== null &&
                        parserData.cardData.potentialCard.cardType !== null &&
                        parserData.cardData.potentialCard.cardType !== CardType.Cloze)
                ) {
                    // Add any open potential card, that isn't a cloze card or just text
                    // Or add it as an atomic cloze ends the multi line card
                    parserData.addPotentialCardToList();
                }

                // Here we know that we either have a cloze card as potential card or we don't have a potential card at all
                if (parserData.cardData.potentialCard === null) {
                    // We are not currently building a potential card, so we can start a potential card with this line
                    parserData.cardData.initPotentialCard(
                        CardType.Cloze,
                        parserData.lineData.currentLineEndTrimmed,
                        parserData.lineData.currentLineNum,
                        parserData.lineData.currentLineNum,
                    );
                    break;
                }

                parserData.cardData.addCurrentLineToPotentialCard(
                    parserData.lineData,
                    parserData.cardData.potentialCard.cardType === null
                        ? CardType.Cloze
                        : undefined,
                );

                break;
            }

            case "CODE_BLOCK_START_OR_END": {
                // Close potential card, if there is a single line one open
                if (
                    parserData.cardData.potentialCard !== null &&
                    (parserData.cardData.potentialCard.cardType === CardType.SingleLineBasic ||
                        parserData.cardData.potentialCard.cardType ===
                            CardType.SingleLineReversed ||
                        (parserData.cardData.potentialCard.cardType === CardType.Cloze &&
                            parserData.options.useAtomicClozes))
                ) {
                    parserData.addPotentialCardToList();
                }

                // Set the isInCodeBlock flag and parse the line as text
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
                // Adds current line to the last card or the current potential new card (also starts a new potential card)
                // This state shall only be entered when the current line is connected to the last card or if it belongs to the current  potential new card

                if (
                    parserData.cardData.potentialCard !== null &&
                    ((parserData.options.useAtomicClozes &&
                        parserData.cardData.potentialCard.cardType === CardType.Cloze) ||
                        parserData.cardData.potentialCard.cardType === CardType.SingleLineBasic ||
                        parserData.cardData.potentialCard.cardType === CardType.SingleLineReversed)
                ) {
                    // Close the potential card, as we are not adding any more text to it, as it is an atomic cloze
                    parserData.addPotentialCardToList();
                }

                if (parserData.cardData.potentialCard !== null) {
                    // We are currently building a potential card, so we add the current line to it, as it belongs to the potential card, otherwise we would have entered the PARSE_LINE state
                    parserData.cardData.addCurrentLineToPotentialCard(parserData.lineData);
                } else {
                    // We are not currently building a potential card, so we can start a new potential card with this line
                    parserData.cardData.initPotentialCard(
                        null,
                        parserData.lineData.currentLineEndTrimmed,
                        parserData.lineData.currentLineNum,
                        parserData.lineData.currentLineNum,
                    );
                }
                break;
            }

            case "EMPTY_LINE": {
                /* Empty line
                    -> relevant > we handle it
                    -> irrelevant > we skip it and close the potential card
                */
                if (
                    parserData.isInCodeBlock ||
                    (parserData.options.multilineCardEndMarker !== null &&
                        parserData.options.multilineCardEndMarker !== undefined &&
                        parserData.options.multilineCardEndMarker !== "" &&
                        parserData.options.multilineCardEndMarker.trim() !== "" &&
                        parserData.cardData.potentialCard !== null &&
                        (parserData.cardData.potentialCard.cardType === CardType.MultiLineBasic ||
                            parserData.cardData.potentialCard.cardType ===
                                CardType.MultiLineReversed ||
                            parserData.cardData.potentialCard.cardType === CardType.Cloze))
                ) {
                    // Only handle this if multiline cards are enabled and we are already searching for multiline cards or clozes
                    parserData.setParserState("TEXT");
                    parserData = LineParser.parseLine(parserData);
                    break;
                } else {
                    parserData.addPotentialCardToList();
                }
                break;
            }

            default:
                throw new Error("Impossible parser state: " + parserData.currentParserState);
        }
        return parserData;
    }
}
