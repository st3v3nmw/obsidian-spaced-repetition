import { CardType } from "src/card/questions/question";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";

/**
 * The potential card info class
 *
 * This class is responsible for storing the information about a potential card.
 * It extends the ParsedCardInfo class and adds additional methods for checking the validity of the potential card and for resetting the potential card.
 *
 * @class PotentialCardInfo
 * @extends {ParsedCardInfo}
 */
export default class PotentialCardInfo extends ParsedCardInfo {
    constructor(
        type: CardType | null = null,
        text: string = "",
        firstLineNum: number = -1,
        lastLineNum: number = -1,
        frontText: string | null = null,
        backText: string | null = null,
    ) {
        super(type, text, firstLineNum, lastLineNum, frontText, backText);
    }

    // MARK: Validation of cards

    /**
     * Returns true if the potential card is a valid multiline card
     * @returns True if the potential card is a valid multiline card, false otherwise
     */
    isValidMultiLineCard(): boolean {
        return (
            (
                this.cardType === CardType.MultiLineBasic ||
                this.cardType === CardType.MultiLineReversed
            ) &&
            this.hasText() &&
            this.hasFrontText() &&
            this.hasBackText() &&
            this.hasValidLineNum()
        );
    }

    /**
     * Returns true if the potential card is a valid atomic cloze card
     * @returns True if the potential card is a valid atomic cloze card, false otherwise
     */
    isValidAtomicClozeCard(): boolean {
        return (
            this.isValidClozeCard() &&
            this.hasOneLineOfText()
        );
    }

    /**
     * Returns true if the potential card is a valid cloze card
     * @returns True if the potential card is a valid cloze card, false otherwise
     */
    isValidClozeCard(): boolean {
        return (
            this.cardType === CardType.Cloze &&
            this.hasText() &&
            !this.hasFrontText() &&
            !this.hasBackText() &&
            this.hasValidLineNum()
        );
    }

    /**
     * Returns true if the potential card is a valid single line card
     * @returns True if the potential card is a valid single line card, false otherwise
     */
    isValidSingleLineCard(): boolean {
        return (
            (
                this.cardType === CardType.SingleLineBasic ||
                this.cardType === CardType.SingleLineReversed
            ) &&
            this.hasText() &&
            this.hasFrontText() &&
            this.hasBackText() &&
            this.hasValidLineNum() &&
            this.hasOneLineOfText()
        );
    }

    /**
     * Returns true if the card type is valid
     * @returns True if the card type is valid, false otherwise
     */
    hasValidCardType(): boolean {
        return this.cardType !== null;
    }

    /**
     * Returns true if the potential card is a valid multiline card
     * @returns True if the potential card is a valid multiline card, false otherwise
     */
    hasValidLineNum(): boolean {
        return this.firstLineNum >= 0 && this.lastLineNum >= 0 && this.firstLineNum <= this.lastLineNum;
    }

    // MARK: Properties

    /**
     * Returns true if the potential card has just text
     * @returns True if the potential card has just text, false otherwise
     */
    isJustText(): boolean {
        return (
            this.cardType === null &&
            this.hasText() &&
            !this.hasFrontText() &&
            !this.hasBackText()
        );
    }

    /**
    * Returns true if the potential card is empty and does not have any information about the card
    * @returns True if the potential card is empty, false otherwise
    */
    isEmpty(): boolean {
        return (
            this.cardType === null &&
            !this.hasText() &&
            !this.hasFrontText() &&
            !this.hasBackText()
        );
    }

    // MARK: Reset

    /**
     * Resets the potential card to its initial state
     */
    reset(): void {
        this.cardType = null;
        this.text = "";
        this.firstLineNum = -1;
        this.lastLineNum = -1;
        this.frontText = null;
        this.backText = null;
        this.hasSchedulingInfoFlag = null;
    }
}