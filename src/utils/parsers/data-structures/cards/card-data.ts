import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import LineData from "src/utils/parsers/data-structures/lines/line-data";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import StringDetector from "src/utils/parsers/detectors/string-detector";

/**
 * The card data class
 *
 * This class is responsible for storing the list of cards and the index of the last card.
 * It also stores the potential new card, which is the card that is currently being parsed.
 *
 * @class CardData
 * @extends {CardData}
 */
export default class CardData {
    cards: ParsedCardInfo[]; // The list of detected cards
    lastCardIndex: number; // The index of the last card
    potentialNewCard: ParsedCardInfo | null; // The potential new card, which is the card that is currently being parsed if it couldn't be added to the list of cards right away

    /**
     * Creates a new instance of CardData
     */
    constructor() {
        this.cards = [];
        this.lastCardIndex = -1;
        this.potentialNewCard = null;
    }

    /**
     * Resets the potential card data
     */
    resetPotentialCardData() {
        this.potentialNewCard = null;
    }

    /**
     * Returns the last card or null if there is no last card
     * @returns ParsedCardInfo | null
     */
    getLastCard(): ParsedCardInfo | null {
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
        this.potentialNewCard = new ParsedCardInfo(
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

        const lastCard: ParsedCardInfo = this.cards[this.lastCardIndex];
        const modifiedLastCard: ParsedCardInfo = new ParsedCardInfo(
            lastCard.cardType,
            lastCard.text + "\n" + lineData.currentLineEndTrimmed,
            lastCard.firstLineNum,
            lineData.currentLineNum,
            lastCard.frontText,
            lastCard.backText !== null
                ? lastCard.backText + "\n" + lineData.currentLineEndTrimmed
                : searchForMultilineCards
                    ? lineData.currentLineEndTrimmed
                    : null,
            lastCard.lineNumOfFirstEmptyLine === -1 && lineData.currentLineTrimmed === ""
                ? lineData.currentLineNum
                : lastCard.lineNumOfFirstEmptyLine,
        );
        this.cards[this.lastCardIndex] = modifiedLastCard;
    }

    addMultilineCardToList(lineData: LineData, addMultilineCardFragment: () => void): void {
        const potentialNewCard: ParsedCardInfo | null = this.potentialNewCard;
        if (potentialNewCard === null) {
            // This should never happen, but we just return to be safe
            console.error("Potential new card is null when trying to add multiline card to list");
            return;
        }

        const multilineSeparators = lineData.multilineSeparators;
        const linesOfPotentialNewCard = potentialNewCard.text.split("\n");

        for (const line of linesOfPotentialNewCard) {
            // Go through each line of the potential new card and check if it contains a multiline card separator
            const trimmedLine = line.trim();

            if (
                StringDetector.isMultiLineCardSeparator(
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

                const separatorType = StringDetector.getMultilineCardType(
                    trimmedLine,
                    multilineSeparators,
                );

                if (separatorType === null) {
                    // This should never happen, but we just return to be safe
                    console.error("Separator type is null when trying to add multiline card to list");
                    return;
                }

                if (potentialNewCard.backText === null) {
                    potentialNewCard.backText = lineData.currentLine;
                } else {
                    potentialNewCard.backText += "\n" + lineData.currentLine;
                }

                const newCard: ParsedCardInfo = new ParsedCardInfo(
                    separatorType,
                    potentialNewCard.text + "\n" + lineData.currentLine,
                    potentialNewCard.firstLineNum,
                    lineData.currentLineNum,
                    potentialNewCard.frontText,
                    potentialNewCard.backText,
                    potentialNewCard.lineNumOfFirstEmptyLine === -1 && lineData.currentLineTrimmed === ""
                        ? lineData.currentLineNum
                        : potentialNewCard.lineNumOfFirstEmptyLine,
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
                StringDetector.hasInlineSeparator(lineData.currentLineTrimmed, [separator]) &&
                (lineData.currentLineTrimmed.length === separator.length || // No card text
                    lineData.currentLineTrimmed.endsWith(separator) || // Card text ends with separator
                    lineData.currentLineTrimmed.startsWith(separator)) // Card text starts with separator
            ) {
                CardParser.notesWithCardFragments.addCardFragment(notePath, noteText, {
                    endLineNum: lineData.currentLineNum,
                    startLineNum: lineData.currentLineNum,
                    type: "MALFORMED_INLINE_CARD",
                    text: lineData.currentLineTrimmed,
                });
                break;
            } else if (
                StringDetector.hasInlineSeparator(lineData.currentLineTrimmed, [separator])
            ) {
                // We have found an inline card, setup all extractable info
                const newCard = new ParsedCardInfo(
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
        const newCard = new ParsedCardInfo(
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
     * Returns true if the potential new card has already been added to the list of cards
     */
    wasPotentialNewCardAlreadyAddedToList(): boolean {
        /* Explanation:
            - If the potential new card is null, then it has not been added to the list of cards
            - If the potential new card has a back text & the cardtype is know, then it has been added to the list of cards already
        */
        return !(this.potentialNewCard !== null &&
            this.potentialNewCard.backText === null &&
            this.potentialNewCard.cardType !== null &&
            (this.potentialNewCard.cardType ===
                CardType.MultiLineBasic ||
                this.potentialNewCard.cardType ===
                CardType.MultiLineReversed));
    }

    /**
     * Adds the card to the list of cards and updates the last card index
     */
    private addCardToList(newCard: ParsedCardInfo): void {
        this.lastCardIndex++;
        this.cards.push(newCard);
    }
}
