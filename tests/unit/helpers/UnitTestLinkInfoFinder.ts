import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/OsrNoteGraph";
import { UnitTestSRFile } from "./UnitTestSRFile";
import { unitTest_ParseForOutgoingLinks } from "./UnitTestHelper";
import path from "path";

export class UnitTestLinkInfoFinder implements IOsrVaultNoteLinkInfoFinder {
    // Key: targetFilename
    // Value: Map<sourceFilename, linkCount>
    // This is the number of links from sourceFilename to targetFilename
    // For simplicity, we just store the filename without the directory or filename extension
    private targetSourceLinkCountRecord: Map<string, Map<string, number>>;

    init(fileMap: Map<string, UnitTestSRFile>) {
        // 
        this.targetSourceLinkCountRecord = new Map<string, Map<string, number>>();
        fileMap.forEach((file, sourceFilename) => {
            // Find all the (outgoing) links present in the file
            const outgoingLinks: string[] = unitTest_ParseForOutgoingLinks(file.content);

            for (const targetFilename of outgoingLinks) {
                this.incrementTargetSourceCount(sourceFilename, targetFilename);
            }
        });
    }

    private incrementTargetSourceCount(sourceFilename: string, targetFilename: string): void {
        // Just the filename without the directory or filename extension
        sourceFilename = path.parse(sourceFilename).name;

        if (!this.targetSourceLinkCountRecord.has(targetFilename)) {
            this.targetSourceLinkCountRecord.set(targetFilename, new Map<string, number>());
        }
        const rec = this.targetSourceLinkCountRecord.get(targetFilename)
        if (!rec.has(sourceFilename)) {
            rec.set(sourceFilename, 0);
        }

        rec.set(sourceFilename, rec.get(sourceFilename) + 1);
    }

    getResolvedLinks(filePath: string): Record<string, number> {
        const filename = path.parse(filePath).name;
        let result: Record<string, number> = {};
        if (this.targetSourceLinkCountRecord.has(filename)) {
            const rec = this.targetSourceLinkCountRecord.get(filename)
            rec.forEach((n, filename) => {
                result[filename] = n;
            });
        }
        return result;
    }

}