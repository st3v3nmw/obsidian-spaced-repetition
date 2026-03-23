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
     * Returns the index of the start of the next HTML comment start
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
     * Returns the index of the start of the next HTML comment end
     *
     * @param trimmedLine
     * @returns
     */
    static indexOfHTMLCommentEnd(trimmedLine: string, index: number = 0): number {
        return (
            trimmedLine.indexOf(StringDetector.commentEnd, index)
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

        if (startIndex > trimmedLine.length) {
            throw new Error("Malformed SR comment start with out of bounds index");
        }

        let endIndex = trimmedLine.indexOf(StringDetector.commentEnd, startIndex);
        if (endIndex === -1) {
            // Vaulty sr comment, as it doesn't have a closing comment
            return { startIndex: -1, endIndex: -1, text: trimmedLine, lineNumber };
        }

        if (endIndex > trimmedLine.length) {
            throw new Error("Malformed SR comment end with out of bounds index");
        }

        endIndex += StringDetector.commentEnd.length - 1;

        return { startIndex, endIndex, text: trimmedLine.substring(startIndex, endIndex + 1), lineNumber };
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

        let nextSRComment = StringDetector.getSRHTMLComment(trimmedLine, lineNumber);
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

        // List of any fragments of HTML comments that we found
        let potentialHtmlCommentsInLine: HTMLCommentSearchResultElement[] = [];

        // List of any actual HTML comments that we found -> We try to reconstruct them from the fragments
        // It contains only the following:
        // - Any closed html comments before the first uncloseable open comment
        // - Any leftover unclosable open start comments
        // - Any leftover un opened end comments
        const actualHtmlCommentsInLine: HTMLCommentSearchResultElement[] = [];

        // Find all HTML comments in the line (Regardless if they just start or end)
        // Loop until we find no more HTML comments or reach the end of the line
        for (let i = 0; i < trimmedLine.length; i++) {
            const nextIndexOfStart = StringDetector.indexOfHTMLCommentStart(trimmedLine, i);
            const nextIndexOfEnd = StringDetector.indexOfHTMLCommentEnd(trimmedLine, i);

            // No more start / end of comments found
            if (nextIndexOfStart < 0 && nextIndexOfEnd < 0) break;

            // Jump to next relevant index
            if (nextIndexOfStart === nextIndexOfEnd) {
                // This shouldn't happen, so it must be a bug in the detector of start and end
                throw new Error("Malformed HTML comment with start and end index the same");
            }

            // Here we know start !== end and they can't be -1 at the same time
            if (nextIndexOfStart !== -1 && (nextIndexOfStart < nextIndexOfEnd || nextIndexOfEnd === -1)) {
                i = nextIndexOfStart;
            } else if (nextIndexOfEnd !== -1 && (nextIndexOfStart === -1 || nextIndexOfEnd < nextIndexOfStart)) {
                i = nextIndexOfEnd;
            } else {
                // This shouldn't happen, so it must be a bug in the detector of start and end
                throw new Error(`Weird arrangement of indices in the detection of html comments. Start index: ${nextIndexOfStart} | End index: ${nextIndexOfEnd}`);
            }

            // Now we are at an index, that is either the start or the end of a comment
            // Check if comment index at i is a part of an SR comment
            if (
                (i === nextIndexOfStart &&
                    srCommentsInLine.filter(srComment => srComment.startIndex === i).length > 0) ||
                (i === nextIndexOfEnd &&
                    srCommentsInLine.filter(srComment => srComment.endIndex === i + StringDetector.commentEnd.length - 1).length > 0)
            ) {
                // This start or end index is part of an SR comment so we don't add it to the list
                continue;
            }

            // Here we know that it isn't an sr comment, so it must be a HTML comment
            // -> Add it to the list if it is a new comment start
            // -> Or close an open one like obsidian does:
            //      -> If we found an end of a comment, we close the first open comment, that we find
            //      -> Any other start of a comment within the range from first open comment to this close comment is fully ignored in any further parsing

            // Handle closing of open comments
            if (potentialHtmlCommentsInLine.length > 0 && i === nextIndexOfEnd) {
                let foundOpenComment = false;
                for (let j = 0; j < potentialHtmlCommentsInLine.length; j++) {
                    // Potential candidates for first open comment
                    const htmlComment = potentialHtmlCommentsInLine[j];

                    if (htmlComment.endIndex === -1) {
                        // This is the first open comment so we can update / close it
                        htmlComment.endIndex = i + StringDetector.commentEnd.length - 1;
                        htmlComment.text = trimmedLine.substring(
                            htmlComment.startIndex,
                            htmlComment.endIndex + 1
                        );
                        actualHtmlCommentsInLine.push(htmlComment);
                        // Remove any potential open comments that are before this one, as they are either closed or within the closed comment
                        potentialHtmlCommentsInLine = potentialHtmlCommentsInLine.filter(htmlComment => htmlComment.startIndex > i);
                        foundOpenComment = true;
                        break;
                    }
                }

                if (foundOpenComment) {
                    // We found an open comment so we can continue
                    continue;
                }
            }

            // Handle adding of new comments to the list of potential comments
            // We only add comments to the actual list if they are closed or if we definitely know that they are not closeable
            potentialHtmlCommentsInLine.push({
                startIndex: i === nextIndexOfStart ? i : -1,
                endIndex: i === nextIndexOfEnd ? i + StringDetector.commentEnd.length - 1 : -1,
                text: i === nextIndexOfStart
                    ? StringDetector.nonSrCommentStart
                    : StringDetector.commentEnd,
                lineNumber,
            });
        }

        // Are there any still open comments?
        // If so, then we just return them, plus any closed comments, that we found before them
        const commentFragments = potentialHtmlCommentsInLine.filter(htmlComment => htmlComment.endIndex === -1 || htmlComment.startIndex === -1);

        if (commentFragments.length > 0) {
            // We found some fragments of comments, so we add them to the actual list
            // These should be one of the following (Can't be both):
            // - Any leftover unclosable open start comments
            // - Any leftover un opened end comments
            actualHtmlCommentsInLine.push(...commentFragments);
        }

        return actualHtmlCommentsInLine;
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