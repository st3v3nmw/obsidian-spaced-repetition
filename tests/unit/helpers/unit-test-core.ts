import * as fs from "fs";
import * as path from "path";

import { OsrCore } from "src/core";
import { NoteReviewQueue } from "src/note-review-queue";
import { QuestionPostponementList } from "src/question-postponement-list";
import { SRSettings } from "src/settings";

import { UnitTestSRFile } from "./unit-test-file";
import { UnitTestLinkInfoFinder } from "./unit-test-link-info-finder";

export class UnitTestOsrCore extends OsrCore {
    private buryList: string[];
    // Key: Path
    // Value: File content
    private fileMap: Map<string, UnitTestSRFile>;
    private infoFinder: UnitTestLinkInfoFinder;

    constructor(settings: SRSettings) {
        super();
        this.buryList = [] as string[];
        this.infoFinder = new UnitTestLinkInfoFinder();
        const questionPostponementList = new QuestionPostponementList(
            null,
            settings,
            this.buryList,
        );
        this.init(
            questionPostponementList,
            this.infoFinder,
            settings,
            () => {},
            new NoteReviewQueue(),
        );
    }

    // Needed for unit testing: Setup fileMap and the link "info finder"
    initializeFileMap(dir: string, files: string[]): void {
        this.fileMap = new Map<string, UnitTestSRFile>();

        for (const filename of files) {
            const fullPath: string = path.join(dir, filename);
            const f: UnitTestSRFile = UnitTestSRFile.CreateFromFsFile(fullPath);
            this.fileMap.set(fullPath, f);
        }

        // Analyse the links between the notes before calling  processFile() finaliseLoad()
        this.infoFinder.init(this.fileMap);
    }

    async loadTestVault(vaultSubfolder: string): Promise<void> {
        this.loadInit();

        const dir: string = path.join(__dirname, "..", "..", "vaults", vaultSubfolder);
        const files: string[] = fs.readdirSync(dir).filter((f) => f != ".obsidian");

        // Pass 1
        this.initializeFileMap(dir, files);

        // Pass 2: Process all files
        for (const filename of files) {
            const fullPath: string = path.join(dir, filename);
            const f: UnitTestSRFile = this.fileMap.get(fullPath);
            await this.processFile(f);
        }

        this.finaliseLoad();
    }

    getFileByNoteName(noteName: string): UnitTestSRFile {
        const filename: string = this.infoFinder.getFilenameForLink(noteName);
        return this.fileMap.get(filename);
    }

    getFileMap(): Map<string, UnitTestSRFile> {
        return this.fileMap;
    }
}
