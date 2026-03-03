import { Notice, TFile, Vault } from "obsidian";

import { FLASHCARD_SCHEDULE_INFO } from "src/constants";
import { t } from "src/lang/helpers";

/**
 * Removes scheduling information from a file.
 * @param vault - The Obsidian vault instance.
 * @param file - The file to remove scheduling information from.
 */
async function removeSchedulingInfo(vault: Vault, file: TFile) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.app.fileManager.processFrontMatter(file, (frontmatter: any) => {
            delete frontmatter["sr-due"];
            delete frontmatter["sr-interval"];
            delete frontmatter["sr-ease"];
        });

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
        await removeSchedulingInfo(this.app.vault, files[i]);
    }

    new Notice(t("SCHEDULING_DATA_HAS_BEEN_DELETED"));
}
