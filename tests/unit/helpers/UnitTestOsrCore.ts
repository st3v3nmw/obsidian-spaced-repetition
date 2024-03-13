import * as fs from "fs";
import * as path from "path";
import { OsrCore } from "src/OsrCore";
import { QuestionPostponementList } from "src/QuestionPostponementList";
import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/OsrNoteGraph";
import { SRSettings } from "src/settings";
import { UnitTestSRFile } from "./UnitTestSRFile";

export class UnitTestOsrCore extends OsrCore {
    private buryList: string[];

    constructor(settings: SRSettings) {
        super();
        this.buryList = [] as string[];
        const osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder = null;
        const questionPostponementList = new QuestionPostponementList(null, settings, this.buryList);
        this.init(questionPostponementList, osrNoteLinkInfoFinder, settings, () => {

        });
    }
    
    async loadVault(vaultSubfolder: string): Promise<void> {

        this.loadInit();

        const dir: string = path.join(__dirname, "..", "..", "vaults", vaultSubfolder);
        const files: string[] = fs.readdirSync(dir);
        for (const filename of files) {
            const fullPath: string = path.join(dir, filename);
            const f: UnitTestSRFile = UnitTestSRFile.CreateFromFsFile(fullPath);
            await this.processFile(f);
        }

        this.finaliseLoad();
    }
}