import moment, { Moment } from "moment";
import {
    FileManager,
    FrontMatterCache,
    getAllTags as ObsidianGetAllTags,
    HeadingCache,
    MetadataCache,
    TagCache,
    TFile,
    Vault,
} from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { ALLOWED_DATE_FORMATS } from "src/data/constants";
import { formatDateYYYYMMDD } from "src/utils/dates";
import { parseObsidianFrontmatterTag, TextDirection } from "src/utils/strings";

/**
 * Represents a file from the Obsidian vault with some additional functionality for scheduling data.
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @interface ISRFile
 */
export interface ISRFile {
    get path(): string;
    get basename(): string;
    get tfile(): TFile;
    setNoteSchedule(repItemScheduleInfo: RepItemScheduleInfo): Promise<void>;
    getNoteSchedule(): Promise<RepItemScheduleInfo>;
    getNoteId(): Promise<string | null>;
    getOrCreateNoteId(): Promise<string>;
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

/**
 * Represents a file from the Obsidian vault with some additional functionality for scheduling data.
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @class SrTFile
 * @implements {ISRFile}
 */
export class SrTFile implements ISRFile {
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
     * Gets the scheduling information for the note.
     *
     * @returns {Promise<RepItemScheduleInfo>} - A promise that resolves with the scheduling information for the note.
     */
    async getNoteSchedule(): Promise<RepItemScheduleInfo> {
        let result: RepItemScheduleInfo = null;
        const frontmatter: Map<string, string> = await this.getFrontmatter();

        if (
            frontmatter &&
            frontmatter.has("sr-due") &&
            frontmatter.has("sr-interval") &&
            frontmatter.has("sr-ease")
        ) {
            const dueDate: Moment = moment(frontmatter.get("sr-due"), ALLOWED_DATE_FORMATS);
            const interval: number = parseFloat(frontmatter.get("sr-interval"));
            const ease: number = parseFloat(frontmatter.get("sr-ease"));
            result = new RepItemScheduleInfoOsr(dueDate, interval, ease);
        }
        return result;
    }

    /**
     * Sets the scheduling information for the note.
     *
     * @param {RepItemScheduleInfo} repItemScheduleInfo - The scheduling information for the note.
     * @returns {Promise<void>} - A promise that resolves when the scheduling information is set.
     */
    async setNoteSchedule(repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        const schedInfo: RepItemScheduleInfoOsr = repItemScheduleInfo as RepItemScheduleInfoOsr;
        const dueString: string = formatDateYYYYMMDD(schedInfo.dueDate);
        const interval: number = schedInfo.interval;
        const ease: number = schedInfo.latestEase;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.fileManager.processFrontMatter(this.tfile, (frontmatter: any) => {
            frontmatter["sr-due"] = dueString;
            frontmatter["sr-interval"] = interval;
            frontmatter["sr-ease"] = ease;
        });
    }

    /**
     * Gets the note ID from the frontmatter.
     *
     * @returns {Promise<string | null>} - A promise that resolves with the note ID from the frontmatter, or null if not found.
     */
    async getNoteId(): Promise<string | null> {
        const frontmatter = await this.getFrontmatter();
        return frontmatter?.get("sr-id") ?? null;
    }

    /**
     * Gets or creates the note ID from the frontmatter.
     *
     * @returns {Promise<string>} - A promise that resolves with the note ID from the frontmatter, or a new one if not found.
     */
    async getOrCreateNoteId(): Promise<string> {
        const existing = await this.getNoteId();
        if (existing) return existing;
        const id = crypto.randomUUID();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.fileManager.processFrontMatter(this.tfile, (frontmatter: any) => {
            frontmatter["sr-id"] = id;
        });
        return id;
    }

    /**
     * Gets the frontmatter from the file cache.
     *
     * @returns {Promise<Map<string, string>>} - A promise that resolves with the frontmatter from the file.
     */
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

    /**
     * Gets all tags from the file cache.
     *
     * @returns {string[]} - An array of all tags from the file cache.
     */
    getAllTagsFromCache(): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        const result: string[] = ObsidianGetAllTags(fileCachedData) || [];
        return result;
    }

    /**
     * Gets all tags from the text.
     *
     * @returns {TagCache[]} - An array of all tags from the text.
     */
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

    /**
     * Gets the tags from the frontmatter.
     *
     * @param {FrontMatterCache} frontmatter - The frontmatter from the file cache.
     * @returns {TagCache[]} - An array of tags from the frontmatter.
     */
    private getFrontmatterTags(frontmatter: FrontMatterCache): TagCache[] {
        const result: TagCache[] = [] as TagCache[];
        const frontmatterTags: string =
            frontmatter !== null && frontmatter !== undefined ? frontmatter["tags"] + "" : null;
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

    /**
     * Gets the question context for a given line number.
     *
     * @param {number} cardLine - The line number of the card.
     * @returns {string[]} - An array of strings representing the question context.
     */
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
