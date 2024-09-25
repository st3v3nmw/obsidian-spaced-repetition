import * as graph from "pagerank.js";

import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { INoteEaseList } from "src/note-ease-list";
import { isSupportedFileType } from "src/utils/fs";

export interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

export interface NoteLinkStat {
    linkTotal: number;
    linkPGTotal: number;
    totalLinkCount: number;
}

export class OsrNoteGraph {
    private vaultNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    // Key: targetFilename
    // Value: Map<sourceFilename, linkCount>
    // This is the number of links from sourceFilename to targetFilename
    // For simplicity, we just store the filename without the directory or filename extension
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

    processLinks(path: string) {
        if (this.incomingLinks[path] === undefined) {
            this.incomingLinks[path] = [];
        }

        const targetLinks =
            this.vaultNoteLinkInfoFinder.getResolvedTargetLinksForNotePath(path) || {};
        for (const targetPath in targetLinks) {
            if (this.incomingLinks[targetPath] === undefined) this.incomingLinks[targetPath] = [];

            // markdown files only
            if (isSupportedFileType(targetPath)) {
                const linkCount: number = targetLinks[targetPath];
                this.incomingLinks[targetPath].push({
                    sourcePath: path,
                    linkCount,
                });

                graph.link(path, targetPath, linkCount);
            }
        }
    }

    calcNoteLinkStat(notePath: string, noteEaseList: INoteEaseList): NoteLinkStat {
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

        const outgoingLinks =
            this.vaultNoteLinkInfoFinder.getResolvedTargetLinksForNotePath(notePath) || {};
        for (const outgoingLink in outgoingLinks) {
            const ease: number = noteEaseList.getEaseByPath(outgoingLink);
            const linkCount: number = outgoingLinks[outgoingLink];
            const pageRank: number = this.pageranks[outgoingLink];
            if (ease) {
                linkTotal += linkCount * pageRank * ease;
                linkPGTotal += pageRank * linkCount;
                totalLinkCount += linkCount;
            }
        }

        return { linkTotal, linkPGTotal, totalLinkCount };
    }

    generatePageRanks() {
        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks[node] = rank * 10000;
        });
    }
}
