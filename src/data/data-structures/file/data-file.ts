import { FileManager, MetadataCache, TFile, Vault } from "obsidian";

import { ISRFile, SRTFile } from "src/data/data-structures/file/sr-file";

export class SRDataFile extends SRTFile implements ISRFile {
    constructor(vault: Vault, metadataCache: MetadataCache, fileManager: FileManager, file: TFile) {
        super(vault, metadataCache, fileManager, file);
    }
}