import {
    MetadataCache,
    TFile,
    Vault,
    getAllTags as ObsidianGetAllTags,
} from "obsidian";
import { OBSIDIAN_TAG_AT_STARTOFLINE_REGEX } from "./constants";
import { getAllTagsFromText } from "./util/utils";


export interface ISRFile {
    get path(): string;
    getAllTags(): string[];
    read(): Promise<string>;
    write(content: string): Promise<void>;
}

export class ObsidianTFile implements ISRFile {
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

    getAllTags(): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        return ObsidianGetAllTags(fileCachedData) || [];
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

    getAllTags(): string[] {
        return getAllTagsFromText(this.content);      
    }

    async read(): Promise<string> {
        return this.content;
    }

    async write(content: string): Promise<void> {
        this.content = content;
    }
}