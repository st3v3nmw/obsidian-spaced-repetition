import { CardType } from "src/card/questions/question";

export default class ParsedCardInfo {
    cardType: CardType;
    text: string;
    frontText: string | null;
    backText: string | null;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;
    lineNumOfFirstEmptyLine: number; // The line number of the first empty line, if any

    constructor(
        cardType: CardType,
        text: string,
        firstLineNum: number,
        lastLineNum: number,
        frontText: string | null = null,
        backText: string | null = null,
        lineNumOfFirstEmptyLine: number = -1,
    ) {
        this.cardType = cardType;
        this.text = text;
        this.firstLineNum = firstLineNum;
        this.lastLineNum = lastLineNum;
        this.frontText = frontText;
        this.backText = backText;
        this.lineNumOfFirstEmptyLine = lineNumOfFirstEmptyLine;
    }

    isQuestionLineNum(lineNum: number): boolean {
        return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
    }
}
