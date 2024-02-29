import { TagCache } from "obsidian";
import { splitNoteIntoFrontmatterAndContent, splitTextIntoLineArray } from "src/util/utils";

export function unitTest_CreateTagCache(tag: string, lineNum: number): TagCache {
    return {
        tag,
        position: {
            start: { line: lineNum, col: null, offset: null },
            end: { line: lineNum, col: null, offset: null },
        },
    };
}

export function unitTest_GetAllTagsFromTextEx(text: string): TagCache[] {
    const [frontmatter, content] = splitNoteIntoFrontmatterAndContent(text);
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
                    result.push(unitTest_CreateTagCache("#" + tagStr, i));
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

export function unitTest_BasicFrontmatterParser(text: string): Map<string, string[]> {
    const [frontmatter, _] = splitNoteIntoFrontmatterAndContent(text);
    const result = new Map<string, string[]>;

    if (!frontmatter) return;

    const keyRegex = /^(\w+):(.*)$/;
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
            keyName = keyMatch.groups[0];
            valueList = [] as string[];
            const value = keyMatch.groups[1].trim();
            if (value) {
                valueList.push(value);
            }
        } else {
            // Just a value, related to the last key
            const dataMatch: RegExpMatchArray = line.match(dataRegex);
            if (keyName && dataMatch) {
                const value = keyMatch.groups[0].trim();
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