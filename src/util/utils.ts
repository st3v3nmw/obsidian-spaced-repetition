import moment from "moment";
import { Moment } from "moment";
import { PREFERRED_DATE_FORMAT, YAML_FRONT_MATTER_REGEX } from "src/constants";

type Hex = number;

// https://stackoverflow.com/a/69019874
type ObjectType = Record<PropertyKey, unknown>;
type PickByValue<OBJ_T, VALUE_T> = // https://stackoverflow.com/a/55153000
    Pick<OBJ_T, { [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never }[keyof OBJ_T]>;
type ObjectEntries<OBJ_T> = // https://stackoverflow.com/a/60142095
    { [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]] }[keyof OBJ_T][];
export function getTypedObjectEntries<OBJ_T extends ObjectType>(obj: OBJ_T): ObjectEntries<OBJ_T> {
    return Object.entries(obj) as ObjectEntries<OBJ_T>;
}

/**
 * Returns an array of the keys of an object with type `(keyof T)[]`
 * instead of `string[]`
 * Please see https://stackoverflow.com/a/59459000 for more details
 *
 * @param obj - An object
 * @returns An array of the keys of `obj` with type `(keyof T)[]`
 */
export const getKeysPreserveType = Object.keys as <T extends Record<string, unknown>>(
    obj: T,
) => Array<keyof T>;

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

export function ticksFromDate(year: number, month: number, day: number): number {
    return moment({ year, month, day }).utc().valueOf();
}

// 👇️ format as "YYYY-MM-DD"
// https://bobbyhadz.com/blog/typescript-date-format
export function formatDate_YYYY_MM_DD(ticks: Moment): string {
    return ticks.format(PREFERRED_DATE_FORMAT);
}

export function splitTextIntoLineArray(text: string): string[] {
    return text.replaceAll("\r\n", "\n").split("\n");
}

export function stringTrimStart(str: string): [string, string] {
    const trimmed: string = str.trimStart();
    const wsCount: number = str.length - trimmed.length;
    const ws: string = str.substring(0, wsCount);
    return [ws, trimmed];
}

//
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
export function extractFrontmatter(str: string): [string, string] {
    let frontmatter: string = "";
    let content: string = "";
    let frontmatterEndLineNum: number = null;
    if (YAML_FRONT_MATTER_REGEX.test) {
        const lines: string[] = splitTextIntoLineArray(str);

        // The end "---" marker must be on the third line (index 2) or later
        for (let i = 2; i < lines.length; i++) {
            if (lines[i] == "---") {
                frontmatterEndLineNum = i;
                break;
            }
        }

        if (frontmatterEndLineNum) {
            const frontmatterStartLineNum: number = 0;
            const frontmatterLines: string[] = [];
            for (let i = frontmatterStartLineNum; i <= frontmatterEndLineNum; i++) {
                frontmatterLines.push(lines[i]);
                lines[i] = "";
            }
            frontmatter = frontmatterLines.join("\n");
            content = lines.join("\n");
        }
    }
    if (frontmatter.length == 0) content = str;
    return [frontmatter, content];
}

//
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
    const tagStrList: string[] = tagStr.split(",");
    for (const tag of tagStrList) {
        result.push(tag.startsWith("#") ? tag : "#" + tag);
    }
    return result;
}
