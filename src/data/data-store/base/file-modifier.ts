import { TFile, Vault } from "obsidian";

import { StorageType } from "src/data/data-store/base/data-store";

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
