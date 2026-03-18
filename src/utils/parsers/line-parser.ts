import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import { CardFragment } from "src/utils/parsers/data-structures/cards/card-fragments/card-fragment";
import HTMLCommentSearchResultElement from "src/utils/parsers/data-structures/lines/html-comment";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import { ParserData } from "src/utils/parsers/data-structures/parser/parser-data-structure";

export default class LineParser {
    static readonly srCommentStart = "<!--SR:"; // The start of a scheduling info comment
    static readonly nonSrCommentStart = "<!--"; // The start of a non scheduling info comment
    static readonly commentEnd = "-->"; // The end of a comment

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
                if (LineParser.isMiddleOfNonSRHTMLComment(parserData)) {
                    parserData.setParserState("HTML_COMMENT_MIDDLE");
                } else if (currentLineTrimmed.length === 0) {
                    // Empty line
                    parserData.setParserState("EMPTY_LINE");
                } else if (
                    LineParser.isMultiLineCardEndMarker(
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
                    LineParser.indexOfHTMLCommentStart(currentLineTrimmed) >= 0 ||
                    LineParser.indexOfHTMLCommentEnd(currentLineTrimmed) >= 0
                ) {
                    // Non sr info comment
                    parserData.setParserState("HTML_COMMENT_START_OR_END");
                } else if (
                    LineParser.hasInlineSeparator(
                        currentLineTrimmed,
                        parserData.lineData.inlineSeparators.map((x) => x.separator),
                    )
                ) {
                    // Inline card
                    parserData.setParserState("INLINE_CARD");
                } else if (LineParser.hasClozes(currentLineTrimmed, parserData.clozeCrafter)) {
                    // Cloze card
                    parserData.setParserState("CLOZE");
                } else if (
                    LineParser.isMultiLineCardSeparator(
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
                        // This shouldn't be here in the current line
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
                return LineParser.parseLine(parserData);
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
                    return LineParser.parseLine(parserData);
                } else {
                    parserData.endMultiLineSearch();
                }
                break;
            }

            case "HTML_COMMENT_START_OR_END": {
                // TODO: Implement end of HTML comment
                // TODO: Decrement with amount of comments end markers
                // Maybe merge with HTML COMMENT START, as there could be a start in an endline and vice versa

                let whitespaceBeforeText = "";
                if (parserData.lineData.currentLine.length !== parserData.lineData.currentLineEndTrimmed.length) {
                    // Has whitespace before text so we save it for later

                    const indexOfFirstNonWhitespace = parserData.lineData.currentLine.indexOf(parserData.lineData.currentLineEndTrimmed);
                    whitespaceBeforeText = parserData.lineData.currentLine.substring(0, indexOfFirstNonWhitespace);
                }

                const srCommentsInLine = LineParser.getSRCommentsInLine(parserData.lineData.currentLineTrimmed, parserData.lineData.currentLineNum);
                const htmlCommentsInLine = LineParser.getHTMLCommentsInLine(parserData.lineData.currentLineTrimmed, parserData.lineData.currentLineNum, srCommentsInLine);

                const commentsWithoutEnd = htmlCommentsInLine.filter((htmlComment) => htmlComment.endIndex < 0);

                let uncommentedText = "";

                for (let i = 0; i < parserData.lineData.currentLineTrimmed.length; i++) {
                    const htmlComment = htmlCommentsInLine.find((htmlComment) => htmlComment.startIndex === i);

                    if (!htmlComment) {
                        // Add any text or sr comment before next comment
                        uncommentedText += parserData.lineData.currentLineTrimmed[i];
                        continue;
                    }

                    if (htmlComment.endIndex < 0) {
                        // Comment doesn't have an end
                        // Exit search for end of comment -> comment ends on next few lines
                        break;
                    }

                    // Skip till end of comment to add text after comment
                    i = htmlComment.endIndex;
                }

                // Removed all html comments so we handle any remaining text
                const uncommentedTextEndTrimmed = whitespaceBeforeText + uncommentedText.trimEnd();
                parserData.lineData.currentLineTrimmed = uncommentedText.trim();
                parserData.lineData.currentLineEndTrimmed = uncommentedTextEndTrimmed;
                parserData.lineData.currentLine = uncommentedTextEndTrimmed;

                parserData.setParserState("PARSE_LINE");
                parserData = LineParser.parseLine(parserData);

                // Now add all the remaining open comments so that we can handle them later, if there are any
                parserData.stillOpenHTMLComments = parserData.stillOpenHTMLComments.concat(commentsWithoutEnd);

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

                        const cardType = LineParser.getMultilineCardType(
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
                const multilineCardType = LineParser.getMultilineCardType(
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
                            LineParser.srCommentStart,
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
                const modifiedPotentialCard: ParsedCardInfo =
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


    /**
     * Returns true if the trimmed line starts with the nonSrCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static indexOfHTMLCommentStart(trimmedLine: string, index: number = 0): number {
        return (
            trimmedLine.indexOf(LineParser.nonSrCommentStart, index)
        );
    }

    /**
     * Returns true if the parser is currently in the middle of a non sr html comment
     *
     * @param parserData
     * @returns
     */
    private static isMiddleOfNonSRHTMLComment(parserData: ParserData): boolean {
        return (
            parserData.stillOpenHTMLComments.length > 0
        );
    }

    /**
     * Returns true if the trimmed line starts with the nonSrCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static indexOfHTMLCommentEnd(trimmedLine: string, index: number = 0): number {
        return (
            trimmedLine.indexOf(LineParser.nonSrCommentStart, index)
        );
    }

    /**
     * Returns true if the trimmed line starts with the srCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static getSRHTMLComment(trimmedLine: string, lineNumber: number, index: number = 0): HTMLCommentSearchResultElement {
        const startIndex = trimmedLine.indexOf(LineParser.srCommentStart, index);
        if (startIndex < 0) {
            return { startIndex: -1, endIndex: -1, text: "", lineNumber };
        }

        const endIndex = trimmedLine.indexOf(LineParser.commentEnd, startIndex);

        return { startIndex, endIndex, text: trimmedLine.substring(startIndex, endIndex + 1), lineNumber };
    }

    /**
     * Returns the sr comments in the line
     *
     * @param trimmedLine
     * @returns
     */
    static getSRCommentsInLine(trimmedLine: string, lineNumber: number): HTMLCommentSearchResultElement[] {
        const srCommentsInLine: HTMLCommentSearchResultElement[] = [];

        let nextSRComment = LineParser.getSRHTMLComment(trimmedLine, 0);

        while (nextSRComment.text.length > 0) {
            srCommentsInLine.push(nextSRComment);

            nextSRComment = LineParser.getSRHTMLComment(trimmedLine, lineNumber, nextSRComment.endIndex + 1);
        }

        return srCommentsInLine;
    }

    static getHTMLCommentsInLine(trimmedLine: string, lineNumber: number, externalSrCommentsInLine: HTMLCommentSearchResultElement[] = []): HTMLCommentSearchResultElement[] {
        let srCommentsInLine = externalSrCommentsInLine;

        if (srCommentsInLine.length === 0) {
            srCommentsInLine = LineParser.getSRCommentsInLine(trimmedLine, lineNumber);
        }

        const htmlCommentsInLine: HTMLCommentSearchResultElement[] = [];

        for (let i = 0; i < trimmedLine.length; i++) {
            const indexOfStart = LineParser.indexOfHTMLCommentStart(trimmedLine, i);
            if (indexOfStart < 0) {
                // No start found
                break;
            }

            const srCommentWithSameStartIndex = srCommentsInLine.find((srComment) => srComment.startIndex === indexOfStart);
            if (srCommentWithSameStartIndex) {
                // Skip sr comment
                i = srCommentWithSameStartIndex.endIndex;
                continue;
            }

            let indexOfEnd = LineParser.indexOfHTMLCommentEnd(trimmedLine, indexOfStart);

            if (indexOfEnd < 0) {
                // No end found
                htmlCommentsInLine.push({ startIndex: indexOfStart, endIndex: -1, text: trimmedLine.substring(indexOfStart), lineNumber });
                return htmlCommentsInLine;
            }

            let srCommentWithSameEndIndex = srCommentsInLine.find((srComment) => srComment.endIndex === indexOfEnd);

            while (srCommentWithSameEndIndex) {
                // Skip sr comment end till
                indexOfEnd = LineParser.indexOfHTMLCommentEnd(trimmedLine, srCommentWithSameEndIndex.endIndex + 1);
                if (indexOfEnd < 0) {
                    // No valid end found
                    htmlCommentsInLine.push({ startIndex: indexOfStart, endIndex: -1, text: trimmedLine.substring(indexOfStart), lineNumber });
                    return htmlCommentsInLine;
                }
                srCommentWithSameEndIndex = srCommentsInLine.find((srComment) => srComment.endIndex === indexOfEnd);
            }

            // Found end
            htmlCommentsInLine.push({ startIndex: indexOfStart, endIndex: indexOfEnd, text: trimmedLine.substring(indexOfStart, indexOfEnd + 1), lineNumber });

            i = indexOfEnd;
        }

        return htmlCommentsInLine;
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
            if (LineParser.isMarkerInsideCodeBlock(trimmedLine, separator, separatorIdx))
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