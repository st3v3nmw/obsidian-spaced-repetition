import { Grid } from "gridjs";

import { t } from "src/lang/helpers";
import SettingsItemOverrideComponent from "src/ui/obsidian-ui-components/content-container/settings-page/statistics-page/settings-item-override-component";

/**
 * Represents a component that displays the note stats.
 *
 * @class NoteStatsComponent
 * @extends {SettingsItemOverrideComponent}
 */
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
                    width: "110px",
                },
            ],
            search: true,
            autoWidth: false,
            data: Object.entries(noteEases).sort((a, b) => b[1] - a[1]),
            pagination:
                Object.entries(noteEases).length > rowsPerPage
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

    /**
     * Destroys the NoteStatsComponent and its Grid.
     */
    destroy(): void {
        if (this.noteStatsGrid) this.noteStatsGrid.destroy();
        this.containerEl.empty();
    }
}
