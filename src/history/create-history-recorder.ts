import { SettingsManager } from "src/data/settings-manager";
import { resolveHistoryFolder } from "src/history/history-folder";
import { generateDeviceId, HistoryRecorder } from "src/history/history-recorder";
import { AdapterHistoryStore } from "src/history/history-store";
import type SRPlugin from "src/main";

// Stored in the vault specific local storage, i.e. per device and vault, and never synced
const DEVICE_ID_STORAGE_KEY = "spaced-repetition-history-device-id";

function getOrCreateDeviceId(plugin: SRPlugin): string {
    const stored: unknown = plugin.app.loadLocalStorage(DEVICE_ID_STORAGE_KEY);
    if (typeof stored === "string" && /^[0-9a-z]+$/.test(stored)) return stored;
    if (stored !== null) {
        throw new Error(
            `Invalid usage history device id in local storage: ${JSON.stringify(stored)}`,
        );
    }

    const deviceId: string = generateDeviceId();
    plugin.app.saveLocalStorage(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
}

export function getPluginDir(plugin: SRPlugin): string {
    const pluginDir: string | undefined = plugin.manifest.dir;
    if (pluginDir === undefined) throw new Error("The plugin's folder is unknown");
    return pluginDir;
}

/**
 * Creates the recorder for the usage history, stored in the folder set in the settings (by default the "history"
 * folder within the plugin's folder).
 */
export function createHistoryRecorder(
    plugin: SRPlugin,
    settingsManager: SettingsManager,
): HistoryRecorder {
    const deviceId: string = getOrCreateDeviceId(plugin);
    const store = new AdapterHistoryStore(
        plugin.app.vault.adapter,
        resolveHistoryFolder(settingsManager.settings.usageHistoryFolder, getPluginDir(plugin)),
        deviceId,
    );
    return new HistoryRecorder(store, deviceId, () => settingsManager.settings.recordUsageHistory);
}
