import * as fs from "fs";
import * as path from "path";
import { OsrCore } from "src/OsrCore";
import { QuestionPostponementList } from "src/QuestionPostponementList";
import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/OsrNoteGraph";
import { SRSettings } from "src/settings";
import { UnitTestSRFile } from "./UnitTestSRFile";
import { UnitTestLinkInfoFinder } from "./UnitTestLinkInfoFinder";

export class UnitTestOsrCore extends OsrCore {
    private buryList: string[];
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
    
    async loadVault(vaultSubfolder: string): Promise<void> {

        this.loadInit();
        this.fileMap = new Map<string, UnitTestSRFile>();

        const dir: string = path.join(__dirname, "..", "..", "vaults", vaultSubfolder);
        const files: string[] = fs.readdirSync(dir);
        for (const filename of files.filter((f) => f != ".obsidian")) {
            const fullPath: string = path.join(dir, filename);
            const f: UnitTestSRFile = UnitTestSRFile.CreateFromFsFile(fullPath);
            this.fileMap.set(filename, f);
            await this.processFile(f);
        }

        // Analyse the links between the notes before calling finaliseLoad()
        this.infoFinder.init(this.fileMap);

        this.finaliseLoad();
    }

    getFile(filename: string): UnitTestSRFile {
        return this.fileMap.get(filename);
    }

    getFileMap(): Map<string, UnitTestSRFile> {
        return this.fileMap;
    }

    getFileContent(filename: string): string {
        return this.getFile(filename).content;
    }
}