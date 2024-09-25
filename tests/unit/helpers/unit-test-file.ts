import * as fs from "fs";
import { TagCache, TFile } from "obsidian";

import { ISRFile } from "src/file";
import { TextDirection } from "src/utils/strings";

import { unitTestBasicFrontmatterParser, unitTestGetAllTagsFromTextEx } from "./unit-test-helper";

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

    get tfile(): TFile {
        throw "Not supported";
    }

    async getFrontmatter(): Promise<Map<string, string>> {
        return unitTestBasicFrontmatterParser(await this.read());
    }

    getAllTagsFromCache(): string[] {
        return unitTestGetAllTagsFromTextEx(this.content).map((item) => item.tag);
    }

    getAllTagsFromText(): TagCache[] {
        return unitTestGetAllTagsFromTextEx(this.content);
    }

    getQuestionContext(_: number): string[] {
        return [];
    }

    getTextDirection(): TextDirection {
        return TextDirection.Unspecified;
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
