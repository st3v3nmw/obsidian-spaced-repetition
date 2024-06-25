import { App, TFile, Vault } from "obsidian";
import { SrTFile } from "./SRFile";
import { OsrCore } from "./OsrCore";
import { SettingsUtil } from "./settings";

export class OsrAppCore extends OsrCore {
    private app: App;
    private _syncLock = false;

    get syncLock(): boolean {
        return this._syncLock;
    }

    constructor(app: App) {
        super();
        this.app = app;
    }
    
    async loadVault(): Promise<void> {
        if (this._syncLock) {
            return;
        }
        this._syncLock = true;

        try {
            this.loadInit();

            const notes: TFile[] = this.app.vault.getMarkdownFiles();
            for (const noteFile of notes) {
                if (SettingsUtil.isPathInNoteIgnoreFolder(this.settings, noteFile.path)) {
                    continue;
                }
    
                const file: SrTFile = this.createSrTFile(noteFile);
                await this.processFile(file);
            }

            this.finaliseLoad();
        } finally {
            this._syncLock = false;
        }        
    }
    
    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }

}