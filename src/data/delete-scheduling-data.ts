import { Notice, TFile, Vault } from "obsidian";

import { FLASHCARD_SCHEDULE_INFO } from "src/constants";
import { t } from "src/lang/helpers";

/**
 * Deletes all note scheduling data from a markdown file.
 *
 * @param {Vault} vault - The vault to delete the scheduling data from.
 * @param {TFile} file - The file to delete the scheduling data from.
 */
async function removeSchedulingInfoInNotes(
    vault: Vault,
    file: TFile,
    deleteTags: boolean,
    tagsToDelete: string[] = [],
) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
            delete frontmatter["sr-due"];
            delete frontmatter["sr-interval"];
            delete frontmatter["sr-ease"];
        });
    } catch (e) {
        console.log({ filePath: file.path, error: e });
    }

    if (deleteTags) {
        await removeTagsFromFile(vault, file, tagsToDelete);
    }
}

async function removeTagsFromFile(vault: Vault, file: TFile, tagsToDelete: string[]) {
    await removeTagsFromFrontmatter(vault, file, tagsToDelete);
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

async function removeTagsFromFrontmatter(vault: Vault, file: TFile, tagsToDelete: string[]) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
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
async function removeSchedulingInfoInCards(
    vault: Vault,
    file: TFile,
    deleteTags: boolean,
    tagsToDelete: string[] = [],
) {
    try {
        await vault.process(file, (data) => {
            return data.replace(FLASHCARD_SCHEDULE_INFO, "");
        });
    } catch (e) {
        console.log({ filePath: file.path, error: e });
    }

    if (deleteTags) {
        await removeTagsFromFile(vault, file, tagsToDelete);
    }
}

/**
 * Deletes all scheduling data from all markdown files in the vault.
 */
export async function deleteAllSchedulingData(
    deleteTags: boolean,
    deckTagsToDelete: string[] = [],
    noteTagsToDelete: string[] = [],
) {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInNotes(this.app.vault, files[i], deleteTags, noteTagsToDelete);
        await removeSchedulingInfoInCards(this.app.vault, files[i], deleteTags, deckTagsToDelete);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

/**
 * Deletes all note scheduling data from all files in the vault.
 */
export async function deleteAllSchedulingDataInNotes(
    deleteTags: boolean,
    tagsToDelete: string[] = [],
) {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInNotes(this.app.vault, files[i], deleteTags, tagsToDelete);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

/**
 * Deletes all card scheduling data from all files in the vault.
 */
export async function deleteAllSchedulingDataInCards(
    deleteTags: boolean,
    tagsToDelete: string[] = [],
) {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInCards(this.app.vault, files[i], deleteTags, tagsToDelete);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

export async function deleteAllSchedulingDataOfCardsInNote(
    file: TFile,
    deleteTags: boolean,
    tagsToDelete: string[],
) {
    await removeSchedulingInfoInCards(this.app.vault, file, deleteTags, tagsToDelete);

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

/**
 * Deletes all note scheduling data from all files in the vault.
 */
export async function deleteNoteSchedulingDataInNote(
    file: TFile,
    deleteTags: boolean,
    tagsToDelete: string[],
) {
    await removeSchedulingInfoInNotes(this.app.vault, file, deleteTags, tagsToDelete);

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}
