export enum TextDirection {
    Unspecified,
    Ltr,
    Rtl,
}

type Hex = number;

/**
 * Escapes the input string so that it can be converted to a regex
 * while making sure that symbols like `?` and `*` aren't interpreted
 * as regex specials.
 * Please see https://stackoverflow.com/a/6969486 for more details
 *
 * @param str - The string to be escaped
 * @returns The escaped string
 */
export const escapeRegexString = (text: string): string =>
    text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function literalStringReplace(
    text: string,
    searchStr: string,
    replacementStr: string,
): string {
    let result: string = text;
    const startIdx: number = text.indexOf(searchStr);
    if (startIdx >= 0) {
        const startStr: string = text.substring(0, startIdx);
        const endIdx: number = startIdx + searchStr.length;
        const endStr: string = text.substring(endIdx);
        result = startStr + replacementStr + endStr;
    }
    return result;
}

/**
 * Returns the cyrb53 hash (hex string) of the input string
 * Please see https://stackoverflow.com/a/52171480 for more details
 *
 * @param str - The string to be hashed
 * @param seed - The seed for the cyrb53 function
 * @returns The cyrb53 hash (hex string) of `str` seeded using `seed`
 */
export function cyrb53(str: string, seed = 0): string {
    let h1: Hex = 0xdeadbeef ^ seed,
        h2: Hex = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToStringOrEmpty(v: any): string {
    let result: string = "";
    if (v != null && v != undefined) {
        result = v + "";
    }
    return result;
}

/**
 * Splits the input text into an array of lines.
 * Normalizes line endings to \n before splitting.
 *
 * @param text The input text to be split into lines.
 * @returns The array of lines from the input text.
 */
export function splitTextIntoLineArray(text: string): string[] {
    return text.replaceAll(/\r\n|\r/g, "\n").split("\n");
}

/**
 * Trims the leading whitespace from the input string and returns both the leading whitespace and the trimmed string.
 *
 * @param str The input string to be trimmed.
 * @returns A tuple where the first element is the leading whitespace and the second is the trimmed string.
 */
export function stringTrimStart(str: string): [string, string] {
    if (!str) {
        return ["", ""];
    }
    const trimmed: string = str.trimStart();
    const wsCount: number = str.length - trimmed.length;
    const ws: string = str.substring(0, wsCount);
    return [ws, trimmed];
}

// This returns [frontmatter, content]
//
// The returned content has the same number of lines as the supplied str string, but with the
// frontmatter lines (if present) blanked out.
//
// 1. We don't want the parser to see the frontmatter, as it would deem it to be part of a multi-line question
// if one started on the line immediately after the "---" closing marker.
//
// 2. The lines are blanked out rather than deleted so that line numbers are not affected
// e.g. for calls to getQuestionContext(cardLine: number)
//
export function splitNoteIntoFrontmatterAndContent(str: string): [string, string] {
    const lines = splitTextIntoLineArray(str);
    let lineIndex = 0;
    let hasFrontmatter = false;
    do {
        // Starts file with '---'
        if (lineIndex === 0 && lines[lineIndex] === "---") {
            hasFrontmatter = true;
        }
        // Line is end of front matter
        else if (hasFrontmatter && lines[lineIndex] === "---") {
            hasFrontmatter = false;
            lineIndex++;
        }
        if (hasFrontmatter) {
            lineIndex++;
        }
    } while (hasFrontmatter && lineIndex < lines.length);
    // No end of Frontmatter found
    if (hasFrontmatter) {
        lineIndex = 0;
    }

    const frontmatter: string = lines.slice(0, lineIndex).join("\n");
    const emptyLines: string[] = lineIndex > 0 ? Array(lineIndex).join(".").split(".") : [];
    const content: string = emptyLines.concat(lines.slice(lineIndex)).join("\n");

    return [frontmatter, content];
}

// Returns the index of the line that consists of the search string.
//
// A line is considered a match if it is identical to the search string, (ignoring leading and
// trailing spaces of the line)
//
export function findLineIndexOfSearchStringIgnoringWs(
    lines: string[],
    searchString: string,
): number {
    let result: number = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() == searchString) {
            result = i;
            break;
        }
    }
    return result;
}

/*
Prompted by flashcards being missed, here are some "experiments" with different frontmatter,
showing the difference in the value of CachedMetadata.frontmatter["tags"]

----------------- EXPERIMENT 1

---
tags:
  - flashcards/philosophy/philosophers
  - flashcards/toes
---

CachedMetadata.frontmatter["tags"]: flashcards/philosophy/philosophers,flashcards/toes


----------------- EXPERIMENT 2

---
tags:
  - "#flashcards/philosophy/philosophers"
---

CachedMetadata.frontmatter["tags"]: #flashcards/philosophy/philosophers


----------------- EXPERIMENT 3

---
tags:
  - "#flashcards/philosophy/philosophers"
  - "#flashcards/toes"
---

CachedMetadata.frontmatter["tags"]: #flashcardsX/philosophy/philosophers,#flashcardsX/toes


----------------- EXPERIMENT 4

---
tags:
  - #flashcards/philosophy/philosophers
---

Obsidian does not recognize that the frontmatter has any tags
(i.e. if the frontmatter includes the "#" it must be enclosed in quotes)

----------------- CONCLUSION

CachedMetadata.frontmatter["tags"]: tags are comma separated. They may or may not include the "#".
Any double quotes in the frontmatter are stripped by Obsidian and not present in this variable.

*/
export function parseObsidianFrontmatterTag(tagStr: string): string[] {
    const result: string[] = [] as string[];
    if (tagStr) {
        const tagStrList: string[] = tagStr.split(",");
        for (const tag of tagStrList) {
            if (tag !== "") {
                result.push(tag.startsWith("#") ? tag : "#" + tag);
            }
        }
    }
    return result;
}

export class MultiLineTextFinder {
    static findAndReplace(
        sourceText: string,
        searchText: string,
        replacementText: string,
    ): string | null {
        let result: string = null;
        if (sourceText.includes(searchText)) {
            result = literalStringReplace(sourceText, searchText, replacementText);
        } else {
            const sourceTextArray = splitTextIntoLineArray(sourceText);
            const searchTextArray = splitTextIntoLineArray(searchText);
            const lineNo: number | null = MultiLineTextFinder.find(
                sourceTextArray,
                searchTextArray,
            );
            if (lineNo !== null) {
                const replacementTextArray = splitTextIntoLineArray(replacementText);
                const linesToRemove: number = searchTextArray.length;
                sourceTextArray.splice(lineNo, linesToRemove, ...replacementTextArray);
                result = sourceTextArray.join("\n");
            }
        }
        return result;
    }

    static find(sourceText: string[], searchText: string[]): number | null {
        let result: number = null;
        let searchIdx: number = 0;
        const maxSearchIdx: number = searchText.length - 1;
        for (let sourceIdx = 0; sourceIdx < sourceText.length; sourceIdx++) {
            const sourceLine: string = sourceText[sourceIdx].trim();
            const searchLine: string = searchText[searchIdx].trim();
            if (searchLine == sourceLine) {
                if (searchIdx == maxSearchIdx) {
                    result = sourceIdx - searchIdx;
                    break;
                }
                searchIdx++;
            } else {
                searchIdx = 0;
            }
        }
        return result;
    }
}
