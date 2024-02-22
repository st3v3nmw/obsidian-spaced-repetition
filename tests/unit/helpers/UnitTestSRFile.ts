import { TagCache } from "obsidian";
import { ISRFile, YamlValue } from "src/SRFile";
import { unitTest_BasicFrontmatterParser, unitTest_GetAllTagsFromTextEx } from "./UnitTestHelper";
import { splitNoteIntoFrontmatterAndContent } from "src/util/utils";

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
    
    async getFrontmatter(): Promise<Map<string, YamlValue[]>> {
        return unitTest_BasicFrontmatterParser(await this.read());
    }

    getAllTags(): string[] {
        return this.getAllTagsFromText().map((item) => item.tag);
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
}
