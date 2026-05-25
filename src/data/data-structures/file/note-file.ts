import moment, { Moment } from "moment";
import { FileManager, HeadingCache, MetadataCache, TFile, Vault } from "obsidian";

import { ALLOWED_DATE_FORMATS, PREFERRED_DATE_FORMAT } from "src/data/constants";
import { ISRFile, SRTFile } from "src/data/data-structures/file/sr-file";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { formatDate } from "src/utils/dates";

/**
 * Represents a file from the Obsidian vault with some additional functionality for scheduling data.
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @interface ISRNoteTFile
 */
export interface ISRNoteTFile extends ISRFile {
    setNoteSchedule(repItemScheduleInfo: RepItemScheduleInfo): Promise<void>;
    getNoteSchedule(): Promise<RepItemScheduleInfo | null>;
    getNoteId(): Promise<string | null>;
    getOrCreateNoteId(): Promise<string>;
    getQuestionContext(cardLine: number): string[];
}

/**
 * Represents a file from the Obsidian vault with some additional functionality for scheduling data.
 *
 * IMPORTANT: Lines are zero based, not one based.
 *
 * @class SRNoteTFile
 * @implements {ISRNoteTFile}
 */
export class SRNoteTFile extends SRTFile implements ISRNoteTFile {
    constructor(vault: Vault, metadataCache: MetadataCache, fileManager: FileManager, file: TFile) {
        super(vault, metadataCache, fileManager, file);
    }

    /**
     * Gets the scheduling information for the note.
     *
     * @returns {Promise<RepItemScheduleInfo>} - A promise that resolves with the scheduling information for the note.
     */
    async getNoteSchedule(): Promise<RepItemScheduleInfo | null> {
        const frontmatter: Map<string, string> = await this.getFrontmatter();
        const srInterval = frontmatter.get("sr-interval");
        const srEase = frontmatter.get("sr-ease");
        const srDue = frontmatter.get("sr-due");

        if (!(srInterval && srEase && srDue)) return null;

        const dueDate: Moment = moment(srDue, ALLOWED_DATE_FORMATS);
        const interval: number = parseFloat(srInterval);
        const ease: number = parseFloat(srEase);

        return new RepItemScheduleInfoOsr(dueDate, interval, ease);
    }

    /**
     * Sets the scheduling information for the note.
     *
     * @param {RepItemScheduleInfo} repItemScheduleInfo - The scheduling information for the note.
     * @returns {Promise<void>} - A promise that resolves when the scheduling information is set.
     */
    async setNoteSchedule(repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        const scheduleInfo: RepItemScheduleInfoOsr = repItemScheduleInfo;
        const dueString: string = formatDate(scheduleInfo.dueDateAsUnix, PREFERRED_DATE_FORMAT);
        const interval: number = scheduleInfo.interval;
        const ease: number = scheduleInfo.latestEase;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.fileManager.processFrontMatter(this.tfile, (frontmatter: any) => {
            frontmatter["sr-due"] = dueString;
            frontmatter["sr-interval"] = interval;
            frontmatter["sr-ease"] = ease;
        });
    }

    /**
     * Gets the note ID from the frontmatter.
     *
     * @returns {Promise<string | null>} - A promise that resolves with the note ID from the frontmatter, or null if not found.
     */
    async getNoteId(): Promise<string | null> {
        const frontmatter = await this.getFrontmatter();
        return frontmatter?.get("sr-id") ?? null;
    }

    /**
     * Gets or creates the note ID from the frontmatter.
     *
     * @returns {Promise<string>} - A promise that resolves with the note ID from the frontmatter, or a new one if not found.
     */
    async getOrCreateNoteId(): Promise<string> {
        const existing = await this.getNoteId();
        if (existing) return existing;
        const id = crypto.randomUUID();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.fileManager.processFrontMatter(this.tfile, (frontmatter: any) => {
            frontmatter["sr-id"] = id;
        });
        return id;
    }

    /**
     * Gets the question context for a given line number.
     *
     * @param {number} cardLine - The line number of the card.
     * @returns {string[]} - An array of strings representing the question context.
     */
    getQuestionContext(cardLine: number): string[] {
        const fileCachedData = this.metadataCache.getFileCache(this.file) || {};
        const headings: HeadingCache[] = fileCachedData.headings || [];
        const stack: HeadingCache[] = [];
        for (const heading of headings) {
            if (heading.position.start.line > cardLine) {
                break;
            }

            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            stack.push(heading);
        }

        const result = [];
        for (const headingObj of stack) {
            headingObj.heading = headingObj.heading.replace(/\[\^\d+\]/gm, "").trim();
            result.push(headingObj.heading);
        }
        return result;
    }
}
