import {
    MetadataCache,
    TFile,
    Vault,
    getAllTags as ObsidianGetAllTags,
    HeadingCache,
} from "obsidian";
import { getAllTagsFromText } from "./util/utils";

export interface ISRFile {
    get path(): string;
    get basename(): string;
    getAllTags(): string[];
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

    getAllTags(): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        return ObsidianGetAllTags(fileCachedData) || [];
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

export class UnitTestSRFile implements ISRFile {
    content: string;
    _path: string;

    constructor(content: string, path: string = null) {
        this.content = content;
        this._path = path;
    }

    get path(): string {
        return this._path;
    }

    get basename(): string {
        return "";
    }

    getAllTags(): string[] {
        return getAllTagsFromText(this.content);
    }

    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    getQuestionContext(cardLine: number): string[] {
        return [];
    }

    async read(): Promise<string> {
        return this.content;
    }

    async write(content: string): Promise<void> {
        this.content = content;
    }
}
