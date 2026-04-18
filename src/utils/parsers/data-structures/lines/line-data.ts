import { CardType } from "src/card/questions/question";

/**
 * The line data class
 *
 * This class is responsible for storing the lines of the current note, the current line number,
 * the current line, the current line trimmed without whitespace, the current line trimmed without whitespace at end,
 * the inline separators, and the multiline separators.
 *
 * @class LineData
 * @extends {LineData}
 */
export default class LineData {
    lines: string[]; // The lines of the current note
    currentLineNum: number; // The current line number
    currentLine: string; // The current line
    currentLineEndTrimmed: string; // The current line trimmed without whitespace at end
    currentLineTrimmed: string; // The current line trimmed without whitespace
    inlineSeparators: Array<{ separator: string; type: CardType }>; // The inline separators
    multilineSeparators: Array<{ separator: string; type: CardType }>; // The multiline separators

    /**
     * Creates a new instance of LineData
     *
     * @param noteText - The note text
     * @param inlineSeparators - The inline separators
     * @param multilineSeparators - The multiline separators
     */
    constructor(
        noteText: string,
        inlineSeparators: Array<{ separator: string; type: CardType }>,
        multilineSeparators: Array<{ separator: string; type: CardType }>,
    ) {
        this.lines = noteText.replaceAll("\r\n", "\n").split("\n");
        this.currentLineNum = -1;
        this.currentLine = "";
        this.currentLineEndTrimmed = "";
        this.currentLineTrimmed = "";
        this.inlineSeparators = inlineSeparators;
        this.multilineSeparators = multilineSeparators;
    }

    /**
     * Sets the current line
     * @param lineNum - The line number
     */
    setCurrentLine(lineNum: number): void {
        this.currentLine = this.lines[lineNum];
        this.currentLineNum = lineNum;
        this.currentLineEndTrimmed = this.currentLine.trimEnd();
        this.currentLineTrimmed = this.currentLineEndTrimmed.trimStart();
    }
}
