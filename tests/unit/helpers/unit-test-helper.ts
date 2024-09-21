import { TagCache } from "obsidian";

import { frontmatterTagPseudoLineNum } from "src/sr-file";
import { splitNoteIntoFrontmatterAndContent, splitTextIntoLineArray } from "src/utils/utils";

export function unitTest_CreateTagCacheObj(tag: string, line: number): TagCache {
    return {
        tag: tag,
        position: {
            start: { line: line, col: null, offset: null },
            end: { line: line, col: null, offset: null },
        },
    };
}

export function unitTest_GetAllTagsFromTextEx(text: string): TagCache[] {
    const [frontmatter, _] = splitNoteIntoFrontmatterAndContent(text);
    const result = [] as TagCache[];
    let lines: string[];

    if (frontmatter) {
        const dataPrefix: string = "  - ";
        lines = splitTextIntoLineArray(frontmatter);
        let foundTagHeading: boolean = false;
        for (let i = 0; i < lines.length; i++) {
            const line: string = lines[i];
            if (foundTagHeading) {
                if (line.startsWith(dataPrefix)) {
                    const tagStr: string = line.substring(dataPrefix.length);
                    result.push(
                        unitTest_CreateTagCacheObj("#" + tagStr, frontmatterTagPseudoLineNum),
                    );
                } else {
                    break;
                }
            } else {
                if (line.startsWith("tags:")) {
                    foundTagHeading = true;
                }
            }
        }
    }

    lines = splitTextIntoLineArray(text);
    for (let i = 0; i < lines.length; i++) {
        const tagRegex = /#[^\s#]+/gi;
        const matchList: RegExpMatchArray = lines[i].match(tagRegex);
        if (matchList) {
            for (const match of matchList) {
                const tag: TagCache = {
                    tag: match,
                    position: {
                        start: { line: i, col: null, offset: null },
                        end: { line: i, col: null, offset: null },
                    },
                };
                result.push(tag);
            }
        }
    }
    return result;
}

export function unitTest_GetAllTagsFromText(text: string): string[] {
    const tagRegex = /#[^\s#]+/gi;
    const result: RegExpMatchArray = text.match(tagRegex);
    if (!result) return [];
    return result;
}

export function unitTest_BasicFrontmatterParser(text: string): Map<string, string> {
    const result = new Map<string, string>();
    const map: Map<string, string[]> = unitTest_BasicFrontmatterParserEx(text);
    map.forEach((value, key) => {
        result.set(key, value.pop());
    });
    return result;
}

export function unitTest_BasicFrontmatterParserEx(text: string): Map<string, string[]> {
    const [frontmatter, _] = splitNoteIntoFrontmatterAndContent(text);
    const result = new Map<string, string[]>();

    if (!frontmatter) return result;

    const keyRegex = /^([A-Za-z0-9_-]+):(.*)$/;
    const dataRegex = /^(\s+)-\s+(.+)$/;
    const lines: string[] = splitTextIntoLineArray(frontmatter);
    let keyName: string = null;
    let valueList: string[] = [] as string[];

    for (let i = 0; i < lines.length; i++) {
        const line: string = lines[i];

        // Is there a key, and optional value?
        const keyMatch: RegExpMatchArray = line.match(keyRegex);
        if (keyMatch) {
            if (keyName) {
                result.set(keyName, valueList);
            }
            keyName = keyMatch[1];
            valueList = [] as string[];
            const value = keyMatch[2].trim();
            if (value) {
                valueList.push(value);
            }
        } else {
            // Just a value, related to the last key
            const dataMatch: RegExpMatchArray = line.match(dataRegex);
            if (keyName && dataMatch) {
                const value = dataMatch[1].trim();
                if (value) {
                    valueList.push(value);
                }
            }
        }
    }
    if (keyName) {
        result.set(keyName, valueList);
    }
    return result;
}

export function unitTest_ParseForOutgoingLinks(text: string): string[] {
    const linkRegex = /\[\[([\w\s]+)\]\]+/gi;
    const matches = text.matchAll(linkRegex);
    const result: string[] = [] as string[];
    for (const m of matches) {
        result.push(m[1]);
    }
    return result;
}

export function unitTest_CheckNoteFrontmatter(
    text: string,
    expectedDueDate: string,
    expectedInterval: number,
    expectedEase: number,
): void {
    const frontmatter: Map<string, string> = unitTest_BasicFrontmatterParser(text);

    expect(frontmatter).toBeTruthy();
    expect(frontmatter.get("sr-due")).toEqual(expectedDueDate);
    expect(frontmatter.get("sr-interval")).toEqual(expectedInterval + "");
    expect(frontmatter.get("sr-ease")).toEqual(expectedEase + "");
}
