import { TFile } from "obsidian";

/**
 * Minimal in-memory stand-in for the subset of the Obsidian {@link Vault} API used by
 * {@link ScheduleDataFileRepository}. Folders are tracked as a set of paths; files as TFile
 * instances with their content kept in a map.
 */
export class UnitTestVault {
    private folders = new Set<string>();
    private files = new Map<string, TFile>();
    private contents = new Map<string, string>();

    getAbstractFileByPath(path: string): TFile | { path: string } | null {
        if (this.files.has(path)) return this.files.get(path);
        if (this.folders.has(path)) return { path };
        return null;
    }

    async createFolder(path: string): Promise<void> {
        this.folders.add(path);
    }

    async create(path: string, content: string): Promise<TFile> {
        const file = new TFile();
        file.path = path;
        this.files.set(path, file);
        this.contents.set(path, content);
        return file;
    }

    async modify(file: TFile, content: string): Promise<void> {
        this.contents.set(file.path, content);
    }

    async read(file: TFile): Promise<string> {
        return this.contents.get(file.path) ?? "";
    }

    /** Test helper: raw content currently stored at a path (or undefined). */
    rawContent(path: string): string | undefined {
        return this.contents.get(path);
    }
}
