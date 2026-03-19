import { ClozeCrafter } from "clozecraft";

import { CardType } from "src/card/questions/question";
import HTMLCommentSearchResultElement from "src/utils/parsers/data-structures/lines/html-comment";

/**
 * The string detector class
 *
 * This class is responsible for detecting certain strings in a line and returning information for the parsers to use
 */
export default class StringDetector {
    static readonly srCommentStart = "<!--SR:"; // The start of a scheduling info comment
    static readonly nonSrCommentStart = "<!--"; // The start of a non scheduling info comment
    static readonly commentEnd = "-->"; // The end of a comment

    /**
     * Returns true if the trimmed line starts with the nonSrCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static indexOfHTMLCommentStart(trimmedLine: string, index: number = 0): number {
        return (
            trimmedLine.indexOf(StringDetector.nonSrCommentStart, index)
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
            trimmedLine.indexOf(StringDetector.nonSrCommentStart, index)
        );
    }

    /**
     * Returns true if the trimmed line starts with the srCommentStart
     *
     * @param trimmedLine
     * @returns
     */
    static getSRHTMLComment(trimmedLine: string, lineNumber: number, index: number = 0): HTMLCommentSearchResultElement {
        const startIndex = trimmedLine.indexOf(StringDetector.srCommentStart, index);
        if (startIndex === -1) {
            return { startIndex: -1, endIndex: -1, text: trimmedLine, lineNumber };
        }

        let endIndex = trimmedLine.indexOf(StringDetector.commentEnd, startIndex);
        if (endIndex === -1) {
            // Vaulty sr comment, as it doesn't have a closing comment
            return { startIndex: -1, endIndex: -1, text: trimmedLine, lineNumber };
        }

        endIndex += StringDetector.commentEnd.length;

        return { startIndex, endIndex, text: trimmedLine.substring(startIndex, endIndex), lineNumber };
    }

    /**
     * Returns the sr comments in the line
     *
     * @param trimmedLine
     * @returns
     */
    static getSRCommentsInLine(trimmedLine: string, lineNumber: number): HTMLCommentSearchResultElement[] {
        // TODO: Maybe merge this with getHTMLCommentsInLine
        const srCommentsInLine: HTMLCommentSearchResultElement[] = [];

        let nextSRComment = StringDetector.getSRHTMLComment(trimmedLine, 0);
        while (nextSRComment.startIndex >= 0) {
            srCommentsInLine.push(nextSRComment);

            nextSRComment = StringDetector.getSRHTMLComment(trimmedLine, lineNumber, nextSRComment.startIndex + nextSRComment.text.length);
        }

        return srCommentsInLine;
    }

    static getHTMLCommentsInLine(trimmedLine: string, lineNumber: number, externalSrCommentsInLine: HTMLCommentSearchResultElement[] = []): HTMLCommentSearchResultElement[] {
        // Prepare the list of SR comments in the line to filter those out, as they are not HTML comments
        const srCommentsInLine = externalSrCommentsInLine.length > 0
            ? externalSrCommentsInLine
            : StringDetector.getSRCommentsInLine(trimmedLine, lineNumber);

        const htmlCommentsInLine: HTMLCommentSearchResultElement[] = [];
        const indicesWithoutStart: number[] = [];
        const indicesWithoutEnd: number[] = [];

        // Find all HTML comments in the line (Regardless if they just start or end)
        // Loop until we find no more HTML comments or reach the end of the line
        for (let i = 0; i < trimmedLine.length; i++) {
            const lastHtmlComment = htmlCommentsInLine.length > 0
                ? htmlCommentsInLine[htmlCommentsInLine.length - 1]
                : null;

            const indexOfStart = StringDetector.indexOfHTMLCommentStart(trimmedLine, i);

            // No more start of comments found
            if (indexOfStart < 0 && (lastHtmlComment === null || lastHtmlComment.endIndex !== -1)) break;

            if (indexOfStart >= 0 && indexOfStart >= i) {
                if (
                    indexOfStart > trimmedLine.length
                ) {
                    throw new Error("Malformed HTML comment start");
                }

                if (indexOfStart !== i) {
                    // Jump to start of comment
                    i = indexOfStart;
                }
            }

            if (indexOfStart >= 0) {
                // Check if comment at i is a SR comment
                const srCommentWithSameStartIndex = srCommentsInLine.filter((srComment) => srComment.startIndex === indexOfStart);

                if (srCommentWithSameStartIndex.length > 0) {
                    // It is an sr comment -> skip it
                    if (
                        srCommentWithSameStartIndex[0].endIndex < 0 ||
                        srCommentWithSameStartIndex[0].endIndex > trimmedLine.length ||
                        srCommentWithSameStartIndex[0].endIndex < i
                    ) {
                        throw new Error("Malformed SR comment end");
                    }

                    i = srCommentWithSameStartIndex[0].endIndex;
                    continue;
                }

                // It isn't an sr comment, so it must be an HTML comment
                htmlCommentsInLine.push({ startIndex: indexOfStart, endIndex: -1, text: trimmedLine.substring(indexOfStart), lineNumber });
            }

            // Find the end of the comment and check if it is the end of an sr comment
            let indexOfEnd = StringDetector.indexOfHTMLCommentEnd(trimmedLine, indexOfStart);

            if (indexOfEnd < 0) {
                // No more end of comments found
                return htmlCommentsInLine;
            } else if (indexOfEnd >= 0 && indexOfEnd >= i) {
                indexOfEnd += StringDetector.commentEnd.length;

                // Jump to next end of comment
                if (
                    indexOfEnd < 0 ||
                    indexOfEnd > trimmedLine.length ||
                    indexOfEnd < i
                ) {
                    throw new Error("Malformed HTML comment end");
                }

                i = indexOfEnd;
                continue;
            }

            // indexOfEnd >= 0 && indexOfEnd === i
            // Check if end of comment at i is part of an SR comment
            const srCommentWithSameEndIndex = srCommentsInLine.filter((srComment) => srComment.endIndex === indexOfEnd);
            if (srCommentWithSameEndIndex.length > 0) {
                // It is an sr comment -> skip it
                continue;
            }

            // It isn't an sr comment, so it must be an HTML comment
            // Update the last HTML comment if it is still open else create a new one
            if (lastHtmlComment !== null && lastHtmlComment.endIndex === -1) {
                lastHtmlComment.endIndex = indexOfEnd;
                lastHtmlComment.text = trimmedLine.substring(lastHtmlComment.startIndex, indexOfEnd);

                htmlCommentsInLine[htmlCommentsInLine.length - 1] = lastHtmlComment;
            } else {
                htmlCommentsInLine.push({ startIndex: -1, endIndex: indexOfEnd, text: "", lineNumber });
            }

            // Continue with the next start of comment
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
            if (StringDetector.isMarkerInsideCodeBlock(trimmedLine, separator, separatorIdx))
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

    /**
     * Returns the whitespace before text
     *
     * @param currentLine - The current line
     * @param currentLineTrimmed - The current line trimmed
     * @param currentLineEndTrimmed - The current line end trimmed
     * @returns The whitespace before text
     */
    static getWhitespaceBeforeText(currentLine: string, currentLineTrimmed: string, currentLineEndTrimmed: string): string {
        let whitespaceBeforeText = "";
        if (currentLineTrimmed.length !== currentLineEndTrimmed.length) {
            // Has whitespace before text so we extract it
            const indexOfFirstNonWhitespace = currentLine.indexOf(currentLineTrimmed);
            whitespaceBeforeText = currentLine.substring(0, indexOfFirstNonWhitespace);
        }
        return whitespaceBeforeText;
    }
}