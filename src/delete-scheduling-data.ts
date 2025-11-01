import { TFile, Vault } from "obsidian";
import { SCHEDULING_EXTRACTOR, SCHEDULING_INFO_REGEX } from "src/constants";

/**
 * Modifies a file to remove scheduling data.
 * @param vault - The Obsidian vault instance.
 * @param file - The file to modify.
 * @returns - A promise that resolves to the modified file content.
 */
function modifyFile(vault: Vault, file: TFile): Promise<string> {
  return vault.process(file, (data) => {
    return data.replace(SCHEDULING_INFO_REGEX, '')
               .replace(SCHEDULING_EXTRACTOR, '')
               .trim();
  });
}

/**
 * Deletes all scheduling data from all markdown files in the vault.
 */
export function deleteSchedulingData() {
    const files = this.app.vault.getMarkdownFiles()
    
    for (const file of files) {
      modifyFile(this.app.vault, file);
    }
}