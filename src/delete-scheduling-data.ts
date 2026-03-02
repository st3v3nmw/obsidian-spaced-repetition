import { TFile, Vault } from "obsidian";

import {
    FLASHCARD_SCHEDULE_INFO,
    NOTE_SCHEDULE_INFO_BLOCK,
    NOTE_SCHEDULE_INFO_TEXT,
} from "src/constants";

/**
 * Modifies a file to remove scheduling data.
 * @param vault - The Obsidian vault instance.
 * @param file - The file to modify.
 */
function removeSchedulingInfo(vault: Vault, file: TFile) {
    vault.process(file, (data) => {
        return data
            .replace(NOTE_SCHEDULE_INFO_BLOCK, "")
            .replace(NOTE_SCHEDULE_INFO_TEXT, "")
            .replace(FLASHCARD_SCHEDULE_INFO, "");
    });
}

/**
 * Deletes all scheduling data from all markdown files in the vault.
 */
export function deleteAllSchedulingData() {
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < files.length; i++) {
        removeSchedulingInfo(this.app.vault, files[i]);
    }
}
