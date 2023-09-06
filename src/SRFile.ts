import {
    TFile,
    Vault,
} from "obsidian";

export interface ISRFile {
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

    async read(): Promise<string> {
        return this.content;
    }

    async write(content: string): Promise<void> {
        this.content = content;
    }
}