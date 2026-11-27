import { VaultChangeTracker } from "src/data/data-store/base/vault-change-tracker";
import { SRSettings } from "src/data/settings";

/**
 * Manages the plugin settings.
 */
export class SettingsManager {
    private _settings: SRSettings;
    private writeSettings: (settings: SRSettings) => Promise<void>;

    constructor(settings: SRSettings, writeSettings: (settings: SRSettings) => Promise<void>) {
        this._settings = settings;
        this.writeSettings = writeSettings;
    }

    get settings(): SRSettings {
        return this._settings;
    }

    /**
     * Saves the settings.
     *
     * @param {SRSettings} settings - The settings to save.
     * @returns {Promise<void>} - A promise that resolves when the settings are saved.
     */
    async saveSettings(settings: SRSettings): Promise<void> {
        this._settings = settings;
        // Settings affect parsing and scheduling, so the next sync must run. OsrCore invalidates
        // the note parse cache via its own settings snapshot.
        VaultChangeTracker.instance.markDirty();
        try {
            await this.writeSettings(this._settings);
        } catch (error) {
            console.warn(error);
        }
    }

    async save(): Promise<void> {
        await this.saveSettings(this._settings);
    }
}
