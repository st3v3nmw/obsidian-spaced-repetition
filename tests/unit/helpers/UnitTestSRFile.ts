import * as fs from "fs";
import { unitTest_BasicFrontmatterParser, unitTest_BasicFrontmatterParserEx, unitTest_GetAllTagsFromTextEx } from "./UnitTestHelper";
import { TFile, TagCache } from "obsidian";
import { ISRFile } from "src/SRFile";

export class UnitTestSRFile implements ISRFile {
    content: string;
    _path: string;

    constructor(content: string, path: string = null) {
        this.content = content;
        this._path = path;
    }

    get path(): string {
        return this._path;
    }

    get basename(): string {
        return "";
    }

    getAllTagsFromCache(): string[] {
        return unitTest_GetAllTagsFromTextEx(this.content).map((item) => item.tag);
    }

    getAllTagsFromText(): TagCache[] {
        return unitTest_GetAllTagsFromTextEx(this.content);
    }

    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    getQuestionContext(cardLine: number): string[] {
        return [];
    }

    async read(): Promise<string> {
        return this.content;
    }

    async write(content: string): Promise<void> {
        this.content = content;
    }

    static CreateFromFsFile(path: string): UnitTestSRFile {
        const content: string = fs.readFileSync(path, "utf8");
        return new UnitTestSRFile(content, path);
    }
}
