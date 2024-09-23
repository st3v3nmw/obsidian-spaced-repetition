import {
    FrontMatterCache,
    getAllTags as ObsidianGetAllTags,
    HeadingCache,
    MetadataCache,
    TagCache,
    TFile,
    Vault,
} from "obsidian";

import { parseObsidianFrontmatterTag, TextDirection } from "src/utils/strings";

// NOTE: Line numbers are zero based
export interface ISRFile {
    get path(): string;
    get basename(): string;
    get tfile(): TFile;
    getFrontmatter(): Promise<Map<string, string>>;
    getAllTagsFromCache(): string[];
    getAllTagsFromText(): TagCache[];
    getQuestionContext(cardLine: number): string[];
    getTextDirection(): TextDirection;
    read(): Promise<string>;
    write(content: string): Promise<void>;
}

// The Obsidian frontmatter cache doesn't include the line number for the specific tag.
// We define as -1 so that we can differentiate tags within the frontmatter and tags within the content
export const frontmatterTagPseudoLineNum: number = -1;

// NOTE: Line numbers are zero based
export class SrTFile implements ISRFile {
    file: TFile;
    vault: Vault;
    metadataCache: MetadataCache;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile) {
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.file = file;
    }

    get path(): string {
        return this.file.path;
    }

    get basename(): string {
        return this.file.basename;
    }

    get tfile(): TFile {
        return this.file;
    }

    async getFrontmatter(): Promise<Map<string, string>> {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};

        const frontmatter: FrontMatterCache = fileCachedData.frontmatter || {};
        const result: Map<string, string> = new Map<string, string>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const [key, value] of Object.entries(frontmatter) as [string, any][]) {
            const v = Array.isArray(value) && value.length > 0 ? value[0] : value;
            const vStr: string = v + "";
            result.set(key, vStr);
        }
        return result;
    }

    getAllTagsFromCache(): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        const result: string[] = ObsidianGetAllTags(fileCachedData) || [];
        return result;
    }

    getAllTagsFromText(): TagCache[] {
        const result: TagCache[] = [] as TagCache[];
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        if (fileCachedData.tags?.length > 0) {
            result.push(...fileCachedData.tags);
        }

        // RZ: 2024-01-28 fileCachedData.tags doesn't include the tags within the frontmatter, need to access those separately
        // This is different to the Obsidian function getAllTags() which does return all tags including those within the
        // frontmatter.
        result.push(...this.getFrontmatterTags(fileCachedData.frontmatter));

        return result;
    }

    private getFrontmatterTags(frontmatter: FrontMatterCache): TagCache[] {
        const result: TagCache[] = [] as TagCache[];
        const frontmatterTags: string = frontmatter != null ? frontmatter["tags"] + "" : null;
        if (frontmatterTags) {
            // Parse the frontmatter tag string into a list, each entry including the leading "#"
            const tagStrList: string[] = parseObsidianFrontmatterTag(frontmatterTags);
            for (const str of tagStrList) {
                const tag: TagCache = {
                    tag: str,
                    position: {
                        start: {
                            line: frontmatterTagPseudoLineNum,
                            col: null,
                            offset: null,
                        },
                        end: {
                            line: frontmatterTagPseudoLineNum,
                            col: null,
                            offset: null,
                        },
                    },
                };
                result.push(tag);
            }
        }
        return result;
    }

    getQuestionContext(cardLine: number): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        const headings: HeadingCache[] = fileCachedData.headings || [];
        const stack: HeadingCache[] = [];
        for (const heading of headings) {
            if (heading.position.start.line > cardLine) {
                break;
            }

            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            stack.push(heading);
        }

        const result = [];
        for (const headingObj of stack) {
            headingObj.heading = headingObj.heading.replace(/\[\^\d+\]/gm, "").trim();
            result.push(headingObj.heading);
        }
        return result;
    }

    getTextDirection(): TextDirection {
        let result: TextDirection = TextDirection.Unspecified;
        const fileCache = this.metadataCache.getFileCache(this.file);
        const frontMatter = fileCache?.frontmatter;
        if (frontMatter && frontMatter?.direction) {
            const str: string = (frontMatter.direction + "").toLowerCase();
            result = str == "rtl" ? TextDirection.Rtl : TextDirection.Ltr;
        }
        return result;
    }

    async read(): Promise<string> {
        return await this.vault.read(this.file);
    }

    async write(content: string): Promise<void> {
        await this.vault.modify(this.file, content);
    }
}
