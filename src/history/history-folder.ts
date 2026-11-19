// Within the plugin's folder, used when no custom history folder is set
const DEFAULT_HISTORY_SUBFOLDER = "history";

/**
 * Normalizes a folder path relative to the vault root, e.g. "/Spaced Repetition\\history/" ->
 * "Spaced Repetition/history".
 *
 * @param {string} path - The folder path.
 * @returns {string} - The normalized path.
 * @throws If the path is empty or contains "." or ".." segments.
 */
export function normalizeVaultFolderPath(path: string): string {
    const segments: string[] = path
        .replace(/\\/g, "/")
        .split("/")
        .filter((segment) => segment.trim().length > 0);
    if (segments.length === 0) {
        throw new Error(`"${path}" is not a folder path`);
    }
    if (segments.some((segment) => segment.trim() === "." || segment.trim() === "..")) {
        throw new Error(
            `"${path}" must not contain "." or "..". Use a path relative to the vault root, e.g. "Spaced Repetition/history".`,
        );
    }
    return segments.join("/");
}

/**
 * The folder the usage history is stored in.
 *
 * @param {string} customFolder - The "history folder" setting: empty for the default folder, otherwise a folder path
 *                                relative to the vault root.
 * @param {string} pluginDir - The plugin's folder, e.g. ".obsidian/plugins/obsidian-spaced-repetition".
 * @returns {string} - The folder path relative to the vault root.
 */
export function resolveHistoryFolder(customFolder: string, pluginDir: string): string {
    if (customFolder.trim().length === 0) {
        return `${normalizeVaultFolderPath(pluginDir)}/${DEFAULT_HISTORY_SUBFOLDER}`;
    }
    return normalizeVaultFolderPath(customFolder);
}
