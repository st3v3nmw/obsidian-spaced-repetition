import { CardType } from "src/card/questions/question";
import { CardParser } from "src/utils/parsers/card-parser";
import LineData from "src/utils/parsers/data-structures/lines/line-data";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import PotentialCardInfo from "src/utils/parsers/data-structures/parser/potential-card-info";
import StringDetector from "src/utils/parsers/detectors/string-detector";

/**
 * The card data class
 *
 * This class is responsible for storing the list of cards and the index of the last card.
 * It also stores the potential new card, which is the card that is currently being parsed.
 *
 * @class CardData
 */
export default class CardData {
    cards: ParsedCardInfo[]; // The list of detected cards
    lastCardIndex: number; // The index of the last card
    potentialCard: PotentialCardInfo; // The potential card, which is the card that is currently being parsed if it couldn't be added to the list of cards right away

    /**
     * Creates a new instance of CardData
     */
    constructor() {
        this.cards = [];
        this.lastCardIndex = -1;
        this.potentialCard = new PotentialCardInfo();
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
     * Initializes a potential card with the known parameters
     * @param type - The card type
     * @param text - The card text
     * @param firstLineNum - The first line number
     * @param lastLineNum - The last line number
     * @param frontText - The front text
     * @param backText - The back text
     */
    initPotentialCard(
        type: CardType | null,
        text: string,
        firstLineNum: number,
        lastLineNum: number,
        frontText: string | null = null,
        backText: string | null = null,
    ) {
        this.potentialCard = new PotentialCardInfo(
            type,
            text,
            firstLineNum,
            lastLineNum,
            frontText,
            backText,
        );
    }

    /**
     * Adds the current line to the potential new card
     *
     * @param lineData - The line data
     * @param newCardType - The new card type if it can be determined from the current line, otherwise should be undefined
     */
    addCurrentLineToPotentialCard(lineData: LineData, newCardType?: CardType): boolean {
        if (newCardType !== undefined) {
            if (!this.potentialCard.hasValidCardType()) {
                // We know now the card type of the potential new card, so we can set it
                this.potentialCard.cardType = newCardType;
            } else {
                // The method has been mistakenly called with a new card type, but the potential card already has a card type
                console.error("Potential card already has a card type, so it can't be changed");
                return false;
            }

            // Set the front text to be the same as the text if the card type is not cloze, as it is then a front text
            // Clozes don't have a front text, so we shouldn't set it
            if (newCardType !== CardType.Cloze) {
                // If the card type is not cloze, then we can set the front text to be the same as the text
                this.potentialCard.frontText = this.potentialCard.text;
            }
        } else {
            // Set back text if possible
            if (this.potentialCard.cardType !== null && this.potentialCard.cardType !== CardType.Cloze) {
                // If the card type is not cloze and newCardType is undefined, then we can safely set the back text, without adding a separator or anything else unwanted
                if (this.potentialCard.backText === null) {
                    this.potentialCard.backText = lineData.currentLineEndTrimmed;
                } else {
                    this.potentialCard.backText += "\n" + lineData.currentLineEndTrimmed;
                }
            }
        }

        // Add the current line to the potential card text and update the last line number of the potential card
        this.potentialCard.text += "\n" + lineData.currentLineEndTrimmed;
        this.potentialCard.lastLineNum = lineData.currentLineNum;

        return true;
    }

    /**
     * Initializes an inline card in the potential card
     *
     * @param lineData - The line data
     * @param notePath - The note path
     */
    initInlineCardInPotentialCard(lineData: LineData, notePath: string, noteText: string): void {
        const separator = StringDetector.getSingleLineSeparatorInLine(lineData.currentLineTrimmed, lineData.inlineSeparators);

        if (separator === null) {
            console.error("Could not find correct inline separator for line: " + lineData.currentLineTrimmed);
            return;
        }

        if (
            // We have found an inline card separator
            (lineData.currentLineTrimmed.length === separator.separator.length || // No card text
                lineData.currentLineTrimmed.endsWith(separator.separator) || // Card text ends with separator
                lineData.currentLineTrimmed.startsWith(separator.separator)) // Card text starts with separator
        ) {
            // We have found an inline card, but it is malformed
            CardParser.notesWithCardFragments.addCardFragment(notePath, noteText, {
                type: "MALFORMED_INLINE_CARD",
                fragmentInfo: new PotentialCardInfo(
                    separator.type,
                    lineData.currentLineTrimmed,
                    lineData.currentLineNum,
                    lineData.currentLineNum,
                ),
            });

            return;
        }

        // We have found an inline card, setup all extractable info
        this.potentialCard = new PotentialCardInfo(
            separator.type,
            lineData.currentLineEndTrimmed,
            lineData.currentLineNum,
            lineData.currentLineNum,
            lineData.currentLineEndTrimmed.split(separator.separator)[0],
            lineData.currentLineEndTrimmed.split(separator.separator)[1],
        );
    }

    /**
     * Adds the card to the list of cards and updates the last card index
     * @param newCard - The new card to add
     */
    addCardToList(newCard: ParsedCardInfo): void {
        this.lastCardIndex++;
        this.cards.push(newCard);
    }
}
