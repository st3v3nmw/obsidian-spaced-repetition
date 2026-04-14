import * as fs from "fs";
import moment, { Moment } from "moment";
import { TagCache, TFile } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { ALLOWED_DATE_FORMATS } from "src/constants";
import { ISRFile } from "src/file";
import { formatDateYYYYMMDD } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { unitTestBasicFrontmatterParser, unitTestGetAllTagsFromTextEx } from "./unit-test-helper";

export class UnitTestSRFile implements ISRFile {
    content: string;
    _path: string;

    constructor(content: string, path: string = null) {
        this.content = content;
        this._path = path;
    }

    async setNoteSchedule(repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        let fileText: string = await this.read();
        const schedInfo: RepItemScheduleInfoOsr = repItemScheduleInfo as RepItemScheduleInfoOsr;
        const dueString: string = formatDateYYYYMMDD(schedInfo.dueDate);
        const interval: number = schedInfo.interval;
        const ease: number = schedInfo.latestEase;

        const SCHEDULING_INFO_DUE_REGEX = /^(---(?:.*\r?\n)*sr-due: )(.+)((?:.*\r?\n)*---)/;
        const SCHEDULING_INFO_EASE_REGEX = /^(---(?:.*\r?\n)*sr-ease: )(.+)((?:.*\r?\n)*---)/;
        const SCHEDULING_INFO_INTERVAL_REGEX =
            /^(---(?:.*\r?\n)*sr-interval: )(.+)((?:.*\r?\n)*---)/;
        const YAML_FRONT_MATTER_REGEX = /^---\r?\n((?:.*\r?\n)*)---/;

        const hasSchedulingDueString = SCHEDULING_INFO_DUE_REGEX.test(fileText);
        const hasSchedulingEase = SCHEDULING_INFO_EASE_REGEX.test(fileText);
        const hasSchedulingInterval = SCHEDULING_INFO_INTERVAL_REGEX.test(fileText);
        if (hasSchedulingDueString && hasSchedulingEase && hasSchedulingInterval) {
            const schedulingDueString = SCHEDULING_INFO_DUE_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_DUE_REGEX,
                `${schedulingDueString[1]}${dueString}${schedulingDueString[3]}`,
            );

            const schedulingEase = SCHEDULING_INFO_EASE_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_EASE_REGEX,
                `${schedulingEase[1]}${ease}${schedulingEase[3]}`,
            );

            const schedulingInterval = SCHEDULING_INFO_INTERVAL_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_INTERVAL_REGEX,
                `${schedulingInterval[1]}${interval}${schedulingInterval[3]}`,
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            const existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                    `sr-ease: ${ease}\nsr-interval: ${interval}\n---`,
            );
        } else {
            fileText =
                `---\nsr-due: ${dueString}\nsr-ease: ${ease}\n` +
                `sr-interval: ${interval}\n---\n\n${fileText}`;
        }

        await this.write(fileText);
    }

    async getNoteSchedule(): Promise<RepItemScheduleInfo> {
        let result: RepItemScheduleInfo = null;
        const frontmatter: Map<string, string> = await this.getFrontmatter();

        if (
            frontmatter &&
            frontmatter.has("sr-due") &&
            frontmatter.has("sr-interval") &&
            frontmatter.has("sr-ease")
        ) {
            const dueDate: Moment = moment(frontmatter.get("sr-due"), ALLOWED_DATE_FORMATS);
            const interval: number = parseFloat(frontmatter.get("sr-interval"));
            const ease: number = parseFloat(frontmatter.get("sr-ease"));
            result = new RepItemScheduleInfoOsr(dueDate, interval, ease);
        }
        return result;
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
