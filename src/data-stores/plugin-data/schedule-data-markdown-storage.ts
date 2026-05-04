import { App, TFile, TFolder } from "obsidian";

import { PluginDataScheduleState, SerializedScheduleInfo } from "src/plugin-data";

type NoteScheduleMap = Record<string, SerializedScheduleInfo | null>;
type CardScheduleMap = Record<string, (SerializedScheduleInfo | null)[]>;

interface NoteScheduleFile {
    version: number;
    noteSchedules: NoteScheduleMap;
}

interface CardScheduleFile {
    version: number;
    cardSchedules: CardScheduleMap;
}

export class ScheduleDataMarkdownStorage {
    static readonly DEFAULT_ROOT_FOLDER = "Spaced Repetition";
    static readonly SCHEDULE_DATA_FOLDER = "Schedule Data";
    static readonly CARD_FILE_NAME = "card-schedule-data.sr.md";
    static readonly NOTE_FILE_NAME = "note-schedule-data.sr.md";

    private app: App;
    private getRootFolder: () => string;

    constructor(app: App, getRootFolder: () => string) {
        this.app = app;
        this.getRootFolder = getRootFolder;
    }

    private sanitizeRootFolder(rawPath: string): string {
        const cleaned = (rawPath || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
        return cleaned || ScheduleDataMarkdownStorage.DEFAULT_ROOT_FOLDER;
    }

    private getScheduleDataFolderPath(): string {
        const root = this.sanitizeRootFolder(this.getRootFolder());
        return `${root}/${ScheduleDataMarkdownStorage.SCHEDULE_DATA_FOLDER}`;
    }

    private getCardFilePath(): string {
        return `${this.getScheduleDataFolderPath()}/${ScheduleDataMarkdownStorage.CARD_FILE_NAME}`;
    }

    private getNoteFilePath(): string {
        return `${this.getScheduleDataFolderPath()}/${ScheduleDataMarkdownStorage.NOTE_FILE_NAME}`;
    }

    private async ensureFolder(path: string): Promise<void> {
        const parts = path.split("/").filter((part) => part.length > 0);
        let currentPath = "";
        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const existing =
                this.app.vault.getFolderByPath(currentPath) ||
                this.app.vault.getAbstractFileByPath(currentPath);
            if (!existing) {
                await this.app.vault.createFolder(currentPath);
            }
        }
    }

    private renderMarkdown(payload: unknown): string {
        return `# Spaced Repetition Schedule Data\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;
    }

    private parseJsonCodeBlock(text: string): unknown {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/m);
        if (!match) {
            return null;
        }

        try {
            return JSON.parse(match[1]);
        } catch {
            return null;
        }
    }

    private async ensureFile(path: string, initialPayload: unknown): Promise<void> {
        const existing = this.app.vault.getAbstractFileByPath(path);
        if (!existing) {
            await this.app.vault.create(path, this.renderMarkdown(initialPayload));
            return;
        }

        if (existing instanceof TFolder) {
            throw new Error(`SR: expected file but found folder at ${path}`);
        }
    }

    private async writeFile(path: string, payload: unknown): Promise<void> {
        const existing = this.app.vault.getAbstractFileByPath(path);
        const text = this.renderMarkdown(payload);

        if (existing instanceof TFile) {
            await this.app.vault.modify(existing, text);
            return;
        }

        await this.ensureFile(path, payload);
    }

    private async readFile(path: string): Promise<unknown> {
        const existing = this.app.vault.getAbstractFileByPath(path);
        if (!(existing instanceof TFile)) {
            return null;
        }

        const text = await this.app.vault.read(existing);
        return this.parseJsonCodeBlock(text);
    }

    async ensureFiles(): Promise<void> {
        await this.ensureFolder(this.getScheduleDataFolderPath());
        await this.ensureFile(this.getCardFilePath(), { version: 1, cardSchedules: {} });
        await this.ensureFile(this.getNoteFilePath(), { version: 1, noteSchedules: {} });
    }

    async load(): Promise<PluginDataScheduleState> {
        await this.ensureFiles();

        const noteData = (await this.readFile(this.getNoteFilePath())) as NoteScheduleFile | null;
        const cardData = (await this.readFile(this.getCardFilePath())) as CardScheduleFile | null;

        return {
            version: 1,
            noteSchedules: noteData?.noteSchedules ?? {},
            cardSchedules: cardData?.cardSchedules ?? {},
        };
    }

    async save(state: PluginDataScheduleState): Promise<void> {
        await this.ensureFiles();

        await this.writeFile(this.getNoteFilePath(), {
            version: state.version,
            noteSchedules: state.noteSchedules,
        });

        await this.writeFile(this.getCardFilePath(), {
            version: state.version,
            cardSchedules: state.cardSchedules,
        });
    }
}
