import { MetadataCache } from "obsidian";

export interface IOsrVaultNoteLinkInfoFinder {
    getResolvedTargetLinksForNotePath(sourcePath: string): Record<string, number>;
}

export class ObsidianVaultNoteLinkInfoFinder implements IOsrVaultNoteLinkInfoFinder {
    private metadataCache: MetadataCache;

    constructor(metadataCache: MetadataCache) {
        this.metadataCache = metadataCache;
    }

    getResolvedTargetLinksForNotePath(path: string): Record<string, number> {
        return this.metadataCache.resolvedLinks[path];
    }
}
