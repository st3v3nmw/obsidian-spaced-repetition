import { Notice, TFile, Vault } from "obsidian";

import { FLASHCARD_SCHEDULE_INFO } from "src/constants";
import { t } from "src/lang/helpers";

/**
 * Deletes all note scheduling data from a markdown file.
 *
 * @param {Vault} vault - The vault to delete the scheduling data from.
 * @param {TFile} file - The file to delete the scheduling data from.
 */
async function removeSchedulingInfoInNotes(vault: Vault, file: TFile) {
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
}

/**
 * Deletes all card scheduling data from a markdown file.
 *
 * @param {Vault} vault - The vault to delete the scheduling data from.
 * @param {TFile} file - The file to delete the scheduling data from.
 */
async function removeSchedulingInfoInCards(vault: Vault, file: TFile) {
    try {
        await vault.process(file, (data) => {
            return data.replace(FLASHCARD_SCHEDULE_INFO, "");
        });
    } catch (e) {
        console.log({ filePath: file.path, error: e });
    }
}

/**
 * Deletes all scheduling data from all markdown files in the vault.
 */
export async function deleteAllSchedulingData() {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInNotes(this.app.vault, files[i]);
        await removeSchedulingInfoInCards(this.app.vault, files[i]);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

/**
 * Deletes all note scheduling data from all files in the vault.
 */
export async function deleteAllSchedulingDataInNotes() {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInNotes(this.app.vault, files[i]);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}

/**
 * Deletes all card scheduling data from all files in the vault.
 */
export async function deleteAllSchedulingDataInCards() {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        await removeSchedulingInfoInCards(this.app.vault, files[i]);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}
