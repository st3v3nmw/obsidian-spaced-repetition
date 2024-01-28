import { MetadataCache, TFile, Vault, HeadingCache, TagCache, FrontMatterCache } from "obsidian";

export interface ISRFile {
    get path(): string;
    get basename(): string;
    getAllTagsFromText(): TagCache[];
    getQuestionContext(cardLine: number): string[];
    read(): Promise<string>;
    write(content: string): Promise<void>;
}

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

    getAllTagsFromText(): TagCache[] {
        let result: TagCache[] = [] as TagCache[];
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        if (fileCachedData.tags?.length > 0) {
            result.push(...fileCachedData.tags);
        }

        // RZ: 2024-01-28 fileCachedData.tags doesn't include the tags within the frontmatter, need to access those separately
        // This is different to the Obsidian function getAllTags() which does return all tags including those within the
        // frontmatter
        result.push(...this.getFrontmatterTags(fileCachedData.frontmatter));

        return result;
    }

    private getFrontmatterTags(frontmatter: FrontMatterCache): TagCache[] {
        let result: TagCache[] = [] as TagCache[];
        const frontmatterTags: string = (frontmatter != null) ? frontmatter["tags"] + '' : null;
        if (frontmatterTags) {
            // The frontmatter doesn't include the line number for the specific tag, defining as line 1 is good enough.
            // (determineQuestionTopicPathList() only needs to know that these frontmatter tags come before all others
            // in the file)
            const line: number = 1;

            // Frontmatter tags are comma separated and don't include the "#", so we need to add that in
            const tagStrList: string[] = frontmatterTags.split(",");
            for (const str of tagStrList) {
                const tag: TagCache = {
                    tag: "#" + str,
                    position: {
                        start: { line: line, col: null, offset: null },
                        end: { line: line, col: null, offset: null },
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

    async read(): Promise<string> {
        return await this.vault.read(this.file);
    }

    async write(content: string): Promise<void> {
        await this.vault.modify(this.file, content);
    }
}
