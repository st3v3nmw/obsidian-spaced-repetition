import { App, TFile, Vault } from "obsidian";
import { generate } from "short-uuid";

import {
    ONE_SR_COMMENT_FINDER,
    SR_DATA_ID_TAG,
    SR_HTML_COMMENT_BEGIN,
    SR_HTML_COMMENT_END,
} from "src/data/constants";
import { StorageType } from "src/data/data-store/base/data-store";
import { ISerializedScheduleEntry } from "src/data/plugin-data";
import SRPlugin from "src/main";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleFactory } from "src/scheduling/algorithms/base/rep-item-info-factory";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { CommentParser } from "src/utils/comment-parser";

/**
 * Handles the deletion of scheduling data from notes and flashcards.
 */
export interface IFileModifier {
    migrateDataStore(oldMode: StorageType): Promise<void>;

    /**
     * Deletes all note scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    removeSchedulingInfoInNotes(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    /**
     * Removes tags from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     * @param {string[]} tagsToDelete - The tags to delete.
     */
    removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]): Promise<void>;

    /**
     * Removes tags from a markdown file's frontmatter.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     * @param {string[]} tagsToDelete - The tags to delete.
     */
    removeTagsFromFrontmatter(vault: Vault, file: TFile, tagsToDelete: string[]): Promise<void>;

    /**
     * Deletes all card scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    removeSchedulingInfoInCards(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    /**
     * Deletes all scheduling data from all markdown files in the vault.
     */
    deleteAllSchedulingData(
        deleteTags: boolean,
        deckTagsToDelete: string[],
        noteTagsToDelete: string[],
    ): Promise<void>;

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    deleteAllSchedulingDataInNotes(deleteTags: boolean, tagsToDelete: string[]): Promise<void>;

    /**
     * Deletes all card scheduling data from all files in the vault.
     */
    deleteAllSchedulingDataInCards(deleteTags: boolean, tagsToDelete: string[]): Promise<void>;

    /**
     * Deletes all card scheduling data from a markdown file.
     *
     * @param {TFile} file - The file to delete the scheduling data from.
     * @param {boolean} deleteTags - Whether to delete tags associated with scheduling data.
     * @param {string[]} tagsToDelete - The tags to delete.
     */
    deleteAllSchedulingDataOfCardsInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    deleteNoteSchedulingDataInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;
}

/**
 * This file modifier is used by data stores that are storing their data in external files
 */
export abstract class ExternalDataFileModifier implements IFileModifier {
    protected plugin: SRPlugin;
    protected app: App;

    constructor(plugin: SRPlugin, app: App) {
        this.plugin = plugin;
        this.app = app;
    }

    /**
     * Replaces all scheduling comments with a fresh dataId.
     *
     * @param {Vault} vault - The vault to replace the scheduling comments in.
     * @param {TFile} file - The file to replace the scheduling comments in.
     * @param {(dataId: string, schedule: RepItemScheduleInfo[]) => Promise<void>} updateCardSchedule - A function that updates the scheduling data for a given dataId.
     */
    async replaceSchedulingCommentWithDataId(
        vault: Vault,
        file: TFile,
        updateCardSchedule: (dataId: string, schedule: RepItemScheduleInfo[]) => Promise<void>,
    ) {
        const updateQueue: { dataId: string; schedule: ISerializedScheduleEntry[] }[] = [];

        try {
            await vault.process(file, (data) => {
                let modifiedData = data;
                let match = modifiedData.match(ONE_SR_COMMENT_FINDER);

                let index = 0;

                while (match !== null && index < 100) {
                    index++;
                    const scheduleComment = match[0];
                    const newSRDataId = generate().substring(0, 8);
                    const newSRDataIdWithTag = SR_DATA_ID_TAG + newSRDataId;

                    // Extract scheduling info from the match
                    const scheduleInfo: ISerializedScheduleEntry[] =
                        this.extractScheduleInfoFromComment(scheduleComment);

                    // Queue the scheduling info to be written to the file
                    updateQueue.push({ dataId: newSRDataId, schedule: scheduleInfo });

                    modifiedData = modifiedData.replace(ONE_SR_COMMENT_FINDER, newSRDataIdWithTag);

                    match = modifiedData.match(ONE_SR_COMMENT_FINDER);
                }

                return modifiedData;
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }

        // Save scheduling info to the file
        for (let i = 0; i < updateQueue.length; i++) {
            const { dataId, schedule } = updateQueue[i];
            await updateCardSchedule(
                dataId,
                schedule.map((s) => RepItemScheduleFactory.create(s.algorithm, s)),
            );
        }
    }

    /**
     * Extracts scheduling information from a scheduling comment.
     *
     * @param {string} scheduleComment - The scheduling comment to extract information from.
     * @returns {ISerializedScheduleEntry[]} - The extracted scheduling information.
     */
    private extractScheduleInfoFromComment(scheduleComment: string): ISerializedScheduleEntry[] {
        const algorithm = scheduleComment.contains("fsrs")
            ? SRAlgorithmType.FSRS
            : SRAlgorithmType.SM_2_OSR;

        switch (algorithm) {
            case SRAlgorithmType.FSRS: {
                const bareData = scheduleComment
                    .replace(SR_HTML_COMMENT_BEGIN, "")
                    .replace(SR_HTML_COMMENT_END, "");
                const entries = CommentParser.parseMultiScheduleComment(bareData).map((s) =>
                    s.serializeSchedule(),
                );

                return entries;
            }
            case SRAlgorithmType.SM_2_OSR: {
                const bareData = scheduleComment
                    .replace(SR_HTML_COMMENT_BEGIN, "")
                    .replace(SR_HTML_COMMENT_END, "");
                const entries = CommentParser.parseMultiScheduleComment(bareData).map((s) =>
                    s.serializeSchedule(),
                );

                return entries;
            }
        }
    }

    abstract updateCardSchedule(dataId: string, schedule: RepItemScheduleInfo[]): Promise<void>;
    abstract deleteCardSchedule(dataId: string): Promise<void>;
    abstract readCardSchedule(dataId: string): Promise<RepItemScheduleInfo[] | null>;

    abstract migrateDataStore(oldMode: StorageType): Promise<void>;

    abstract removeSchedulingInfoInNotes(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]): Promise<void>;

    abstract removeTagsFromFrontmatter(
        vault: Vault,
        file: TFile,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract removeSchedulingInfoInCards(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract deleteAllSchedulingData(
        deleteTags: boolean,
        deckTagsToDelete: string[],
        noteTagsToDelete: string[],
    ): Promise<void>;

    abstract deleteAllSchedulingDataInNotes(
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract deleteAllSchedulingDataInCards(
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract deleteAllSchedulingDataOfCardsInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;

    abstract deleteNoteSchedulingDataInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void>;
}
