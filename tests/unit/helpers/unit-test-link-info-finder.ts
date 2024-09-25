import path from "path";

import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";

import { UnitTestSRFile } from "./unit-test-file";
import { unitTestParseForOutgoingLinks } from "./unit-test-helper";

export class UnitTestLinkInfoFinder implements IOsrVaultNoteLinkInfoFinder {
    private linkPathMap: Map<string, string>;
    // Key: sourceFilename
    // Value: Map<targetFilename, linkCount>
    //      This is the number of links from sourceFilename to targetFilename
    //      For simplicity, we just store the filename without the directory or filename extension
    private outgoingLinks: Map<string, Map<string, number>>;

    init(fileMap: Map<string, UnitTestSRFile>) {
        // We first need to generate a map between the link names (e.g. the "A" in "[[A]]"), and it's file path)
        this.linkPathMap = new Map<string, string>();
        fileMap.forEach((_, filePath) => {
            this.linkPathMap.set(path.parse(filePath).name, filePath);
        });

        //
        this.outgoingLinks = new Map<string, Map<string, number>>();
        fileMap.forEach((file, sourceFilename) => {
            // Find all the (outgoing) links present in the file
            const outgoingLinks2: string[] = unitTestParseForOutgoingLinks(file.content);

            for (const targetLink of outgoingLinks2) {
                const targetFilename: string = this.linkPathMap.get(targetLink);
                this.incrementOutgoingLinksCount(sourceFilename, targetFilename);
            }
        });
    }

    private incrementOutgoingLinksCount(sourceFilename: string, targetFilename: string): void {
        if (!this.outgoingLinks.has(sourceFilename)) {
            this.outgoingLinks.set(sourceFilename, new Map<string, number>());
        }
        const rec = this.outgoingLinks.get(sourceFilename);
        if (!rec.has(targetFilename)) {
            rec.set(targetFilename, 0);
        }

        rec.set(targetFilename, rec.get(targetFilename) + 1);
    }

    getFilenameForLink(linkName: string): string {
        return this.linkPathMap.get(linkName);
    }

    getResolvedTargetLinksForNoteLink(linkName: string): Record<string, number> {
        const filename = this.linkPathMap.get(linkName);
        return this.getResolvedTargetLinksForNotePath(filename);
    }

    getResolvedTargetLinksForNotePath(sourcePath: string): Record<string, number> {
        const result: Record<string, number> = {};
        if (this.outgoingLinks.has(sourcePath)) {
            const rec = this.outgoingLinks.get(sourcePath);
            rec.forEach((n, filename) => {
                result[filename] = n;
            });
        }
        return result;
    }
}
