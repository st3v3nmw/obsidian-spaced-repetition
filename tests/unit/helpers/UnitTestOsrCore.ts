import * as fs from "fs";
import * as path from "path";
import { OsrCore } from "src/OsrCore";
import { QuestionPostponementList } from "src/QuestionPostponementList";
import { SRSettings } from "src/settings";
import { UnitTestSRFile } from "./UnitTestSRFile";
import { UnitTestLinkInfoFinder } from "./UnitTestLinkInfoFinder";

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
        const questionPostponementList = new QuestionPostponementList(null, settings, this.buryList);
        this.init(questionPostponementList, this.infoFinder, settings, () => {

        });
    }
    
    async loadTestVault(vaultSubfolder: string): Promise<void> {

        this.loadInit();
        this.fileMap = new Map<string, UnitTestSRFile>();

        const dir: string = path.join(__dirname, "..", "..", "vaults", vaultSubfolder);
        const files: string[] = fs.readdirSync(dir).filter((f) => f != ".obsidian");

        // Pass 1: Setup fileMap
        for (const filename of files) {
            const fullPath: string = path.join(dir, filename);
            const f: UnitTestSRFile = UnitTestSRFile.CreateFromFsFile(fullPath);
            this.fileMap.set(fullPath, f);
            await this.processFile(f);
        }

        // Analyse the links between the notes before calling finaliseLoad()
        this.infoFinder.init(this.fileMap);

        // Pass 2: Setup osrNoteGraph (depends on infoFinder)
        for (const filename of files) {
            const fullPath: string = path.join(dir, filename);
            this.osrNoteGraph.processNote(fullPath);
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
