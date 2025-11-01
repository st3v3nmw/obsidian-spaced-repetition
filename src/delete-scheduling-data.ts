import { TFile, Vault } from "obsidian";
import { SCHEDULING_EXTRACTOR, SCHEDULING_INFO_REGEX } from "src/constants";

function modifyFile(vault: Vault, file: TFile): Promise<string> {
  return vault.process(file, (data) => {
    return data.replace(SCHEDULING_INFO_REGEX, '')
               .replace(SCHEDULING_EXTRACTOR, '')
               .trim();
  });
}

export function deleteSchedulingData() {
    const files = this.app.vault.getMarkdownFiles()
    
    for (const file of files) {
        modifyFile(this.app.vault, file);
    }
}

