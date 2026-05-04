import { CardType } from "src/card/questions/question";
import StringDetector from "src/utils/parsers/detectors/string-detector";

export default class ParsedCardInfo {
    cardType: CardType | null; // Will be null if we just picked up some text, but we don't know yet if it is a card or not
    text: string;
    frontText: string | null;
    backText: string | null;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;
    protected hasSchedulingInfoFlag: boolean | null = null; // Flag to indicate if the potential card already has a scheduling info comment

    constructor(
        cardType: CardType | null,
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

    // MARK: Properties

    /**
     * Returns true if the line number is within the range of the card
     * @param lineNum - The line number
     * @returns True if the line number is within the range of the card, false otherwise
     */
    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }

    /**
     * Returns true if the potential card already has a scheduling info comment
     * @returns True if the potential card already has a scheduling info comment, false otherwise
     */
    hasSchedulingInfo(): boolean {
        if (this.hasSchedulingInfoFlag !== null) {
            return this.hasSchedulingInfoFlag;
        }

        const srComment = StringDetector.getSRHTMLComment(this.text, 0, 0, false);
        // Save information about the scheduling info comment, as it is a intensive operation
        this.hasSchedulingInfoFlag =
            srComment.startIndex !== -1 && srComment.endIndex !== -1 && srComment.text.length > 0;

        return this.hasSchedulingInfoFlag;
    }

    /**
     * Returns true if the potential card has one line of text
     *
     * It also accounts for the case where the potential card has a scheduling info comment and only counts any non-scheduling info comment lines
     *
     * @returns True if the potential card has one line of text, false otherwise
     */
    hasOneLineOfText(): boolean {
        return (
            this.firstLineNum === this.lastLineNum ||
            (this.hasSchedulingInfo() && this.firstLineNum === this.lastLineNum - 1)
        );
    }

    /**
     * Returns true if the potential card has just text
     * @returns True if the potential card has just text, false otherwise
     */
    hasBackText(): boolean {
        return this.backText !== null && this.backText.length > 0;
    }

    /**
     * Returns true if the potential card has front text
     * @returns True if the potential card has front text, false otherwise
     */
    hasFrontText(): boolean {
        return this.frontText !== null && this.frontText.length > 0;
    }

    /**
     * Returns true if the potential card has text
     * @returns True if the potential card has text, false otherwise
     */
    hasText(): boolean {
        return this.text.length > 0;
    }
}
