import { Setting } from "obsidian";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { applySettingsUpdate } from "src/settings";

export function addignoreSetting(containerEl: HTMLElement, plugin: SRPlugin) {
    const settings = plugin.data.settings;
    new Setting(containerEl)
        .setName(t("TAGS_TO_IGNORE"))
        .setDesc(t("TAGS_TO_IGNORE_DESC"))
        .addTextArea((text) =>
            text.setValue(settings.tagsToIgnore.join("\n")).onChange((value) => {
                applySettingsUpdate(async () => {
                    settings.tagsToIgnore = value
                        .split(/\n+/)
                        .map((v) => v.trim())
                        .filter((v) => v);
                    await plugin.savePluginData();
                });
            }),
        );
}
