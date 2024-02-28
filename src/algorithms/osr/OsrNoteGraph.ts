import { MetadataCache } from "obsidian";
import * as graph from "pagerank.js";
import { INoteEaseList } from "src/NoteEaseList";
import { SRSettings } from "src/settings";
import { isSupportedFileType } from "src/util/utils";

export interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

export interface NoteLinkStat {
    linkTotal: number;
    linkPGTotal: number;
    totalLinkCount: number;
}

export interface IOsrVaultNoteLinkInfoFinder {
    getResolvedLinks(path: string): Record<string, number>;
}

export class ObsidianVaultNoteLinkInfoFinder implements IOsrVaultNoteLinkInfoFinder {
    private metadataCache: MetadataCache;

    constructor(metadataCache: MetadataCache) {
        this.metadataCache = metadataCache;
    }

    getResolvedLinks(path: string): Record<string, number> {
        return this.metadataCache.resolvedLinks[path];
    }
}

export class OsrNoteGraph {
    private vaultNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    incomingLinks: Record<string, LinkStat[]> = {};
    pageranks: Record<string, number> = {};

    constructor(vaultNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder) {
        this.vaultNoteLinkInfoFinder = vaultNoteLinkInfoFinder;
        this.reset();
    }

    reset() {
        this.incomingLinks = {};
        this.pageranks = {};
        graph.reset();
    }

    processNote(path: string) {
        if (this.incomingLinks[path] === undefined) {
            this.incomingLinks[path] = [];
        }

        const links = this.vaultNoteLinkInfoFinder.getResolvedLinks(path) || {};
        for (const targetPath in links) {
            if (this.incomingLinks[targetPath] === undefined)
                this.incomingLinks[targetPath] = [];

            // markdown files only
            if (isSupportedFileType(targetPath)) {
                this.incomingLinks[targetPath].push({
                    sourcePath: path,
                    linkCount: links[targetPath],
                });

                graph.link(path, targetPath, links[targetPath]);
            }
        }
    }

    calcNoteLinkStat(notePath: string, noteEaseList: INoteEaseList, settings: SRSettings): NoteLinkStat {
        let linkTotal = 0,
        linkPGTotal = 0,
        totalLinkCount = 0;

        for (const statObj of this.incomingLinks[notePath] || []) {
            const ease: number = noteEaseList.getEaseByPath(statObj.sourcePath);
            if (ease) {
                linkTotal += statObj.linkCount * this.pageranks[statObj.sourcePath] * ease;
                linkPGTotal += this.pageranks[statObj.sourcePath] * statObj.linkCount;
                totalLinkCount += statObj.linkCount;
            }
        }

        const outgoingLinks = this.vaultNoteLinkInfoFinder.getResolvedLinks(notePath) || {};
        for (const linkedFilePath in outgoingLinks) {
            const ease: number = noteEaseList.getEaseByPath(linkedFilePath);
            if (ease) {
                linkTotal +=
                    outgoingLinks[linkedFilePath] * this.pageranks[linkedFilePath] * ease;
                linkPGTotal += this.pageranks[linkedFilePath] * outgoingLinks[linkedFilePath];
                totalLinkCount += outgoingLinks[linkedFilePath];
            }
        }

        const linkContribution: number =
            settings.maxLinkFactor *
            Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));

            return {linkTotal, linkPGTotal, totalLinkCount};
    }

    generatePageRanks() {
        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks[node] = rank * 10000;
        });
    }
}