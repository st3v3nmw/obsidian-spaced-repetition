import { Notice, TFile, Vault } from "obsidian";

import { SR_CARD_BLOCK_ID_PREFIX } from "src/data/constants";
import { StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { NoteDataFileModifier } from "src/data/data-store/notes-data-store/note-data-file-modifier";
import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { SRNoteTFile } from "src/data/data-structures/file/note-file";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";

const CARD_BLOCK_ID_FINDER = new RegExp(`\\^${SR_CARD_BLOCK_ID_PREFIX}[a-zA-Z0-9]+`, "g");

/**
 * File modifier for the external "SR markdown file" store.
 *
 * Schedule data lives in {@link ScheduleDataFileRepository}, so the delete operations clear the
 * relevant entries there. Tag/frontmatter manipulation in notes is store-agnostic and delegated
 * to {@link NoteDataFileModifier}.
 *
 * Data-store *migration* is driven by {@link ScheduleDataMigrator} from the settings UI, so the
 * `migrate*` methods here are no-ops.
 */
export class SrMdDataFileModifier implements IFileModifier {
    private plugin: SRPlugin;
    private repository: ScheduleDataFileRepository;
    private noteModifier: NoteDataFileModifier;

    constructor(plugin: SRPlugin, repository: ScheduleDataFileRepository) {
        this.plugin = plugin;
        this.repository = repository;
        this.noteModifier = new NoteDataFileModifier(plugin);
    }

    migrateDataStore(_: StorageType): Promise<void> {
        // Migration is handled by ScheduleDataMigrator (invoked from the settings UI).
        return Promise.resolve();
    }

    migrateCommentsToCallouts(): Promise<void> {
        // Not applicable: SR_MD writes no inline scheduling comments.
        return Promise.resolve();
    }

    private srNoteTFile(file: TFile): SRNoteTFile {
        return new SRNoteTFile(
            this.plugin.app.vault,
            this.plugin.app.metadataCache,
            this.plugin.app.fileManager,
            file,
        );
    }

    private async deleteCardEntriesForFile(file: TFile): Promise<void> {
        const text = await this.plugin.app.vault.read(file);
        const ids = text.match(CARD_BLOCK_ID_FINDER) ?? [];
        for (const id of ids) {
            await this.repository.deleteCardSchedule(id, false);
        }
        await this.repository.save();
    }

    private async deleteNoteEntryForFile(file: TFile): Promise<void> {
        const noteId = await this.srNoteTFile(file).getNoteId();
        if (noteId) {
            await this.repository.deleteNoteSchedule(noteId);
        }
    }

    async removeSchedulingInfoInNotes(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ): Promise<void> {
        await this.deleteNoteEntryForFile(file);
        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    async removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]): Promise<void> {
        await this.noteModifier.removeTagsFromFile(vault, file, tagsToDelete);
    }

    async removeTagsFromFrontmatter(
        vault: Vault,
        file: TFile,
        tagsToDelete: string[],
    ): Promise<void> {
        await this.noteModifier.removeTagsFromFrontmatter(vault, file, tagsToDelete);
    }

    async removeSchedulingInfoInCards(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ): Promise<void> {
        await this.deleteCardEntriesForFile(file);
        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    async deleteAllSchedulingData(
        deleteTags: boolean,
        deckTagsToDelete: string[] = [],
        noteTagsToDelete: string[] = [],
    ): Promise<void> {
        await this.repository.clear();
        if (deleteTags) {
            for (const file of this.plugin.app.vault.getMarkdownFiles()) {
                await this.removeTagsFromFile(this.plugin.app.vault, file, [
                    ...deckTagsToDelete,
                    ...noteTagsToDelete,
                ]);
            }
        }
        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteAllSchedulingDataInNotes(
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ): Promise<void> {
        await this.repository.clearNotes();
        if (deleteTags) {
            for (const file of this.plugin.app.vault.getMarkdownFiles()) {
                await this.removeTagsFromFile(this.plugin.app.vault, file, tagsToDelete);
            }
        }
        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteAllSchedulingDataInCards(
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ): Promise<void> {
        await this.repository.clearCards();
        if (deleteTags) {
            for (const file of this.plugin.app.vault.getMarkdownFiles()) {
                await this.removeTagsFromFile(this.plugin.app.vault, file, tagsToDelete);
            }
        }
        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteAllSchedulingDataOfCardsInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void> {
        await this.deleteCardEntriesForFile(file);
        if (deleteTags) {
            await this.removeTagsFromFile(this.plugin.app.vault, file, tagsToDelete);
        }
        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteNoteSchedulingDataInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ): Promise<void> {
        await this.deleteNoteEntryForFile(file);
        if (deleteTags) {
            await this.removeTagsFromFile(this.plugin.app.vault, file, tagsToDelete);
        }
        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }
}
