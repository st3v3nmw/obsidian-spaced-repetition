import {
    FileManager,
    FrontMatterCache,
    getAllTags as ObsidianGetAllTags,
    MetadataCache,
    TagCache,
    TFile,
    Vault,
} from "obsidian";

import { parseObsidianFrontmatterTag, TextDirection } from "src/utils/strings";

/**
 * Represents a file from the Obsidian vault with some additional functionality for reading tags
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @interface ISRFile
 */
export interface ISRFile {
    get path(): string;
    get basename(): string;
    get tfile(): TFile;
    getFrontmatter(): Promise<Map<string, string>>;
    getAllTagsFromCache(): string[];
    getAllTagsFromText(): TagCache[];
    getTextDirection(): TextDirection;
    read(): Promise<string>;
    write(content: string): Promise<void>;
}

// The Obsidian frontmatter cache doesn't include the line number for the specific tag.
// We define as -1 so that we can differentiate tags within the frontmatter and tags within the content
export const frontmatterTagPseudoLineNum: number = -1;
export const frontmatterTagPseudoCol: number = -1;
export const frontmatterTagPseudoOffset: number = -1;

/**
 * Represents a file from the Obsidian vault with some additional functionality for reading tags and frontmatter, backed by an Obsidian TFile.
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @class SrTFile
 * @implements {ISRFile}
 */
export abstract class SRTFile implements ISRFile {
    file: TFile; // Reference to the Obsidian TFile
    fileManager: FileManager; // Reference to the FileManager
    vault: Vault; // Reference to the Obsidian Vault
    metadataCache: MetadataCache; // Reference to the Obsidian MetadataCache

    constructor(vault: Vault, metadataCache: MetadataCache, fileManager: FileManager, file: TFile) {
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.file = file;
        this.fileManager = fileManager;
    }

    /**
     * Gets the path of the file.
     *
     * @returns {string} - The path of the file.
     */
    get path(): string {
        return this.file.path;
    }

    /**
     * Gets the basename of the file.
     *
     * @returns {string} - The basename of the file.
     */
    get basename(): string {
        return this.file.basename;
    }

    /**
     * Gets the Obsidian TFile.
     *
     * @returns {TFile} - The Obsidian TFile.
     */
    get tfile(): TFile {
        return this.file;
    }

    /**
     * Gets the frontmatter from the file cache.
     *
     * @returns {Promise<Map<string, string>>} - A promise that resolves with the frontmatter from the file.
     */
    async getFrontmatter(): Promise<Map<string, string>> {
        const fileCachedData = this.metadataCache.getFileCache(this.file);

        if (!fileCachedData || !fileCachedData.frontmatter) {
            return new Map<string, string>();
        }

        const frontmatter: FrontMatterCache = fileCachedData.frontmatter;
        const result: Map<string, string> = new Map<string, string>();

        for (const [key, value] of Object.entries(frontmatter)) {
            const v = Array.isArray(value) && value.length > 0 ? value[0] : value;
            const vStr: string = v + "";
            result.set(key, vStr);
        }

        return result;
    }

    /**
     * Gets all tags from the file cache.
     *
     * @returns {string[]} - An array of all tags from the file cache.
     */
    getAllTagsFromCache(): string[] {
        // TODO: Fix bug where tags are not being read from the cache here
        const fileCachedData = this.metadataCache.getFileCache(this.file);

        if (!fileCachedData) {
            return [];
        }

        const tags: string[] = ObsidianGetAllTags(fileCachedData) || [];

        return tags;
    }

    /**
     * Gets all tags from the text.
     *
     * @returns {TagCache[]} - An array of all tags from the text.
     */
    getAllTagsFromText(): TagCache[] {
        const result: TagCache[] = [] as TagCache[];
        const fileCachedData = this.metadataCache.getFileCache(this.file);
        if (fileCachedData && fileCachedData.tags && fileCachedData.tags.length > 0) {
            result.push(...fileCachedData.tags);
        }

        // RZ: 2024-01-28 fileCachedData.tags doesn't include the tags within the frontmatter, need to access those separately
        // This is different to the Obsidian function getAllTags() which does return all tags including those within the
        // frontmatter.
        if (fileCachedData && fileCachedData.frontmatter) {
            result.push(...this.getFrontmatterTags(fileCachedData.frontmatter));
        }

        return result;
    }

    /**
     * Gets the tags from the frontmatter.
     *
     * @param {FrontMatterCache} frontmatter - The frontmatter from the file cache.
     * @returns {TagCache[]} - An array of tags from the frontmatter.
     */
    protected getFrontmatterTags(frontmatter: FrontMatterCache): TagCache[] {
        const result: TagCache[] = [] as TagCache[];
        const frontmatterTags: string | null =
            frontmatter !== null && frontmatter !== undefined
                ? (frontmatter["tags"] as string) + "" // For some obscure reason, the tags don't have the split function so one needs to add a string to add those?
                : null;

        if (!frontmatterTags) return result;

        // Parse the frontmatter tag string into a list, each entry including the leading "#"
        const tagStrList: string[] = parseObsidianFrontmatterTag(frontmatterTags);
        for (const str of tagStrList) {
            const tag: TagCache = {
                tag: str,
                position: {
                    start: {
                        line: frontmatterTagPseudoLineNum,
                        col: frontmatterTagPseudoCol,
                        offset: frontmatterTagPseudoOffset,
                    },
                    end: {
                        line: frontmatterTagPseudoLineNum,
                        col: frontmatterTagPseudoCol,
                        offset: frontmatterTagPseudoOffset,
                    },
                },
            };
            result.push(tag);
        }
        return result;
    }

    /**
     * Gets the text direction from the frontmatter.
     *
     * @returns {TextDirection} - The text direction from the frontmatter.
     */
    getTextDirection(): TextDirection {
        let result: TextDirection = TextDirection.Unspecified;
        const fileCache = this.metadataCache.getFileCache(this.file);
        const frontMatter = fileCache?.frontmatter;
        if (frontMatter && frontMatter?.direction) {
            const str: string = (frontMatter.direction + "").toLowerCase();
            result = str === "rtl" ? TextDirection.Rtl : TextDirection.Ltr;
        }
        return result;
    }

    /**
     * Reads the content of the file from the Obsidian vault.
     *
     * @returns {Promise<string>} - A promise that resolves with the content of the file.
     */
    async read(): Promise<string> {
        return await this.vault.read(this.file);
    }

    /**
     * Writes the content to the file in the Obsidian vault.
     *
     * @param {string} content - The content to write to the file.
     * @returns {Promise<void>} - A promise that resolves when the content is written to the file.
     */
    async write(content: string): Promise<void> {
        await this.vault.modify(this.file, content);
    }
}
