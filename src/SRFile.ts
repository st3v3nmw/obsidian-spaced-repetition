import {
    TFile,
    Vault,
} from "obsidian";

export interface ISRFile {
    get path(): string;
    read(): Promise<string>;
    write(content: string): Promise<void>;
}

export class ObsidianTFile implements ISRFile {
    file: TFile;
    vault: Vault;

    constructor(vault: Vault, file: TFile) {
        this.vault = vault;
        this.file = file;
    }

    get path(): string {
        return this.file.path;
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

    constructor(content: string) {
        this.content = content;
    }

    get path(): string {
        throw "Not supported";
    }

    async read(): Promise<string> {
        return this.content;
    }

    async write(content: string): Promise<void> {
        this.content = content;
    }
}