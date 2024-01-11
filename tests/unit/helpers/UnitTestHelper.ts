import { TagCache } from "obsidian";
import { extractFrontmatter, splitTextIntoLineArray } from "src/util/utils";

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
    const [frontmatter, content] = extractFrontmatter(text);
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
