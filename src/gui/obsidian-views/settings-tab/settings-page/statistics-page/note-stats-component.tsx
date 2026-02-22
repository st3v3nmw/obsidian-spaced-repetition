import { Grid } from "gridjs";

import SettingsItemOverrideComponent from "src/gui/obsidian-views/settings-tab/settings-page/statistics-page/settings-item-override-component";
import { t } from "src/lang/helpers";

export default class NoteStatsComponent extends SettingsItemOverrideComponent {
    private noteStatsGrid: Grid;

    constructor(parentContainerEl: HTMLElement, noteEases: Record<string, number>) {
        super(parentContainerEl);
        this.containerEl.id = "noteStats";

        const rowsPerPage = 10;

        this.noteStatsGrid = new Grid({
            columns: [
                {
                    name: t("NOTE"),
                },
                {
                    name: t("EASE"),
                    sort: true,
                    width: "200px",
                },
            ],
            search: true,
            autoWidth: false,
            data: Object.entries(noteEases).sort((a, b) => b[1] - a[1]),
            pagination: Object.entries(noteEases).length > rowsPerPage
                ? {
                    limit: rowsPerPage,
                    summary: false,
                }
                : undefined,
            language: {
                search: {
                    placeholder: t("SEARCH"),
                },
                pagination: {
                    previous: "<",
                    next: ">",
                },
            },
        });
        this.noteStatsGrid.render(this.containerEl);
    }

    destroy(): void {
        if (this.noteStatsGrid) this.noteStatsGrid.destroy();
        this.containerEl.empty();
    }
}