import { DEFAULT_DATA, PluginData } from "src/data/plugin-data";
import { DEFAULT_SETTINGS, SRSettings, upgradeSettings } from "src/data/settings";
import SRPlugin from "src/main";
import { setDebugParser } from "src/parser";

/**
 * Custom error class for plugin data errors.
 */
export class PluginDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PluginDataError";
    }
}

/**
 * Manages the plugin data.
 */
export class PluginDataManager {
    private plugin: SRPlugin;
    private _pluginData: PluginData | null = null;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    get isLoaded(): boolean {
        return this.pluginData !== null;
    }

    get pluginData(): PluginData {
        if (this._pluginData === null)
            throw new PluginDataError(
                "Cant access the plugin data, as the plugin data is not yet loaded!!",
            );
        return this._pluginData;
    }

    set pluginData(pluginData: PluginData) {
        this._pluginData = pluginData;
    }

    /**
     * Loads the plugin data from the data.json from the plugin's folder.
     */
    async loadData(): Promise<void> {
        const loadedData: PluginData = (await this.plugin.loadData()) as PluginData;
        if (loadedData?.settings) upgradeSettings(loadedData.settings);
        this._pluginData = Object.assign({}, DEFAULT_DATA, loadedData);
        this._pluginData.settings = Object.assign({}, DEFAULT_SETTINGS, this._pluginData.settings);

        setDebugParser(this._pluginData.settings.showParserDebugMessages);
    }

    /**
     * Saves the plugin data.
     *
     * @returns {Promise<void>} - A promise that resolves when the plugin data is saved.
     * @throws {Error} - Throws an error if the plugin data is not loaded.
     */
    async savePluginData(): Promise<void> {
        if (this.pluginData === null)
            throw new PluginDataError("Cant save plugin data, as the data is not yet loaded!!");
        await this.plugin.saveData(this.pluginData);
    }

    /**
     * Writes the settings to the plugin data.
     *
     * @param {SRSettings} settings - The settings to write.
     * @returns {Promise<void>} - A promise that resolves when the settings are written.
     * @throws {Error} - Throws an error if the plugin data is not loaded.
     */
    public async writeSettings(settings: SRSettings): Promise<void> {
        if (this.pluginData === null)
            throw new PluginDataError(
                "Cant write settings, as the plugin data is not yet loaded!!",
            );
        this.pluginData.settings = settings;
        await this.savePluginData();
    }
}
