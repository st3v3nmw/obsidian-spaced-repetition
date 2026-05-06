import { MetadataCache } from "obsidian";

// The finder is exported & passed around via the interface to allow for testing, as we cant use the obsidian MetadataCache in the unit tests
export interface IOsrVaultNoteLinkInfoFinder {
    getResolvedTargetLinksForNotePath(sourcePath: string): Record<string, number>;
}

/**
 * Finds the links between notes in the Obsidian vault.
 *
 * IMPORTANT: Never store this in a variable with the type ObsidianVaultNoteLinkInfoFinder, always use the interface to enable testing of the class.
 *
 * @class ObsidianVaultNoteLinkInfoFinder
 * @implements {IOsrVaultNoteLinkInfoFinder}
 */
export class ObsidianVaultNoteLinkInfoFinder implements IOsrVaultNoteLinkInfoFinder {
    private metadataCache: MetadataCache; // Reference to the Obsidian MetadataCache

    constructor(metadataCache: MetadataCache) {
        this.metadataCache = metadataCache;
    }

    /**
     * Returns the resolved target links for a note path.
     *
     * @param {string} path - The note path.
     * @returns {Record<string, number>} - The resolved target links for the note path.
     */
    getResolvedTargetLinksForNotePath(path: string): Record<string, number> {
        return this.metadataCache.resolvedLinks[path];
    }
}
