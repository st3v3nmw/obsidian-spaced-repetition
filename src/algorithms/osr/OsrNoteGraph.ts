import { MetadataCache } from "obsidian";
import * as graph from "pagerank.js";

export interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

export class OsrNoteGraph {
    private metadataCache: MetadataCache;
    incomingLinks: Record<string, LinkStat[]> = {};
    pageranks: Record<string, number> = {};

    constructor(metadataCache: MetadataCache) {
        this.metadataCache = metadataCache;
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

        const links = this.metadataCache.resolvedLinks[path] || {};
        for (const targetPath in links) {
            if (this.incomingLinks[targetPath] === undefined)
                this.incomingLinks[targetPath] = [];

            // markdown files only
            if (targetPath.split(".").pop().toLowerCase() === "md") {
                this.incomingLinks[targetPath].push({
                    sourcePath: path,
                    linkCount: links[targetPath],
                });

                graph.link(path, targetPath, links[targetPath]);
            }
        }

    }

    generatePageRanks() {
        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks[node] = rank * 10000;
        });
    }
}