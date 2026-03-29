import { CardType } from "src/card/questions/question";

export default class ParsedCardInfo {
    cardType: CardType;
    text: string;
    frontText: string | null;
    backText: string | null;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;

    constructor(
        cardType: CardType,
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

    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }
}