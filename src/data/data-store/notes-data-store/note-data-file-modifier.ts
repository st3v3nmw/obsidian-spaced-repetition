import { Notice, TFile, Vault } from "obsidian";

import { SR_COMMENT_AND_WHITESPACE_FINDER, SR_METADATA_CALLOUT } from "src/data/constants";
import { StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier as IFileModifier } from "src/data/data-store/base/file-modifier";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";

// TODO: Implement this for each data store

export class NoteDataFileModifier implements IFileModifier {
    private plugin: SRPlugin;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
    }

    async migrateCommentsToCallouts(): Promise<void> {

        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.migrateCommentsToCalloutsInFile(files[i], this.plugin.app.vault);
        }
    }

    async migrateCommentsToCalloutsInFile(file: TFile, vault: Vault): Promise<void> {
        try {
            await vault.process(file, (data) => {
                let newData = "";

                const srCommentWithinMetadataRegex = /.*<!--SR:!.*-->/gm;
                const matches = data.matchAll(srCommentWithinMetadataRegex);
                let index = 0;

                for (const match of matches) {
                    if (!match[0].startsWith("> <!--SR:")) {
                        const srComment = match[0];
                        const newText = `${match.index !== 0 && data[match.index - 1] === "\n" ? "" : "\n"}${SR_METADATA_CALLOUT}\n> ${srComment}`;

                        if (match.index > index) {
                            newData += data.substring(index, match.index);
                        }

                        newData += newText;

                        index = match.index + srComment.length;
                    }
                }

                if (index < data.length) {
                    newData += data.substring(index);
                }

                return newData;
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }
    }


    migrateDataStore(_: StorageType): Promise<void> {
        // TODO: Implement this
        // switch (oldMode) {
        //     case StorageType.FOLDER:
        //     case StorageType.PLUGIN_DATA:
        //     default:

        //         // We don't need to migrate the data store if it is the same as the new mode
        // return Promise.resolve();
        // }
        return Promise.resolve();
    }

    /**
     * Deletes all note scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    async removeSchedulingInfoInNotes(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
                delete frontmatter["sr-due"];
                delete frontmatter["sr-interval"];
                delete frontmatter["sr-ease"];
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }

        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    async removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]) {
        await this.removeTagsFromFrontmatter(vault, file, tagsToDelete);
        try {
            await vault.process(file, (data) => {
                let newData = data;
                for (const tagToDelete of tagsToDelete.sort((a, b) => b.length - a.length)) {
                    const regex = new RegExp(
                        // eslint-disable-next-line no-useless-escape
                        `(${tagToDelete}[\/[a-zA-z\-[0-9]*]*\/]*[a-zA-z\-[0-9]*]*)`,
                        "gm",
                    );
                    newData = newData.replace(regex, "");
                    newData = newData.replace(tagToDelete, "");
                }
                return newData;
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }
    }

    async removeTagsFromFrontmatter(vault: Vault, file: TFile, tagsToDelete: string[]) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
                frontmatter["tags"] = (frontmatter["tags"] as string[]).filter((tag: string) => {
                    let deleteTag = false;
                    for (const tagToDelete of tagsToDelete.sort((a, b) => b.length - a.length)) {
                        if (tag.startsWith(tagToDelete.replace("#", ""))) {
                            deleteTag = true;
                            break;
                        }
                    }
                    return !deleteTag;
                });
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }
    }

    /**
     * Deletes all card scheduling data from a markdown file.
     *
     * @param {Vault} vault - The vault to delete the scheduling data from.
     * @param {TFile} file - The file to delete the scheduling data from.
     */
    async removeSchedulingInfoInCards(
        vault: Vault,
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[] = [],
    ) {
        try {
            await vault.process(file, (data) => {
                return data.replace(SR_COMMENT_AND_WHITESPACE_FINDER, "");
            });
        } catch (e) {
            console.log({ filePath: file.path, error: e });
        }

        if (deleteTags) {
            await this.removeTagsFromFile(vault, file, tagsToDelete);
        }
    }

    /**
     * Deletes all scheduling data from all markdown files in the vault.
     */
    async deleteAllSchedulingData(
        deleteTags: boolean,
        deckTagsToDelete: string[] = [],
        noteTagsToDelete: string[] = [],
    ) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInNotes(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                noteTagsToDelete,
            );
            await this.removeSchedulingInfoInCards(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                deckTagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    async deleteAllSchedulingDataInNotes(deleteTags: boolean, tagsToDelete: string[] = []) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInNotes(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                tagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all card scheduling data from all files in the vault.
     */
    async deleteAllSchedulingDataInCards(deleteTags: boolean, tagsToDelete: string[] = []) {
        const files = this.plugin.app.vault.getMarkdownFiles();

        for (let i = 0; i < files.length; i++) {
            await this.removeSchedulingInfoInCards(
                this.plugin.app.vault,
                files[i],
                deleteTags,
                tagsToDelete,
            );
        }

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    async deleteAllSchedulingDataOfCardsInNote(
        file: TFile,
        deleteTags: boolean,
        tagsToDelete: string[],
    ) {
        await this.removeSchedulingInfoInCards(
            this.plugin.app.vault,
            file,
            deleteTags,
            tagsToDelete,
        );

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }

    /**
     * Deletes all note scheduling data from all files in the vault.
     */
    async deleteNoteSchedulingDataInNote(file: TFile, deleteTags: boolean, tagsToDelete: string[]) {
        await this.removeSchedulingInfoInNotes(
            this.plugin.app.vault,
            file,
            deleteTags,
            tagsToDelete,
        );

        new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
    }
}
