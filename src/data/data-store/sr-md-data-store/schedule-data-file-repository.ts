import { normalizePath, TFile, Vault } from "obsidian";

import { SCHEDULE_DATA_FILENAME } from "src/data/constants";
import { SRSettings } from "src/data/settings";

/**
 * Shape of the JSON payload stored inside {@link SCHEDULE_DATA_FILENAME}.
 *
 * Both maps are keyed by an id:
 *  - `cards` is keyed by the card's Obsidian block id (e.g. "^sr-id-abc123").
 *  - `notes` is keyed by the note's `sr-id` frontmatter value.
 *
 * The value is the *inline* schedule string exactly as it would otherwise appear inside a
 * `<!--SR:...-->` comment (e.g. "!2023-10-16,34,290", and "!..!..!.." for multi-cloze cards).
 * Storing the existing string format lets us reuse {@link CommentParser} for both OSR and FSRS
 * without duplicating any serialization logic.
 */
export interface IScheduleData {
    version: number;
    cards: Record<string, string>;
    notes: Record<string, string>;
}

const CURRENT_VERSION = 1;

const FILE_PREAMBLE =
    "This file stores Spaced Repetition scheduling data.\n" +
    "It is managed by the plugin — avoid editing it by hand.\n\n";

/**
 * Owns the single schedule-data markdown file used by {@link StorageType.SR_MD}.
 *
 * The data is held as JSON inside a fenced ```json block in a markdown file so that the
 * Obsidian Sync service picks it up by default (plugin-folder files are not synced by default
 * and are hard to write on mobile).
 *
 * Reads are served synchronously from an in-memory copy that is (re)populated by {@link load};
 * only writes touch the disk. This keeps the question-parser read path synchronous.
 *
 * All reads are intentionally null/parse tolerant: a missing or corrupt file yields empty data
 * rather than throwing, so a malformed file can never break loading the vault.
 */
export class ScheduleDataFileRepository {
    private vault: Vault;
    private settings: SRSettings;
    private data: IScheduleData = ScheduleDataFileRepository.emptyData();

    constructor(vault: Vault, settings: SRSettings) {
        this.vault = vault;
        this.settings = settings;
    }

    private static emptyData(): IScheduleData {
        return { version: CURRENT_VERSION, cards: {}, notes: {} };
    }

    /**
     * The folder (relative to the vault root) that holds the schedule-data file.
     */
    get folderPath(): string {
        const location = this.settings.scheduleDataVaultLocation?.trim() || "Spaced Repetition";
        return normalizePath(location);
    }

    /**
     * The full vault-relative path of the schedule-data file.
     */
    get filePath(): string {
        return normalizePath(`${this.folderPath}/${SCHEDULE_DATA_FILENAME}`);
    }

    /**
     * Ensures the folder and the schedule-data file exist, creating them if necessary.
     *
     * @returns true once the structure is present.
     */
    async ensureStructure(): Promise<boolean> {
        try {
            if (!this.vault.getAbstractFileByPath(this.folderPath)) {
                await this.vault.createFolder(this.folderPath);
            }
        } catch {
            // Folder may already exist (race / case differences) — ignore and continue.
        }

        const existing = this.vault.getAbstractFileByPath(this.filePath);
        if (!(existing instanceof TFile)) {
            await this.vault.create(
                this.filePath,
                this.serialize(ScheduleDataFileRepository.emptyData()),
            );
        }
        return true;
    }

    /**
     * Loads and parses the schedule-data file into memory. Never throws: any problem results in
     * empty in-memory data.
     */
    async load(): Promise<void> {
        const file = this.vault.getAbstractFileByPath(this.filePath);
        if (!(file instanceof TFile)) {
            this.data = ScheduleDataFileRepository.emptyData();
            return;
        }

        try {
            const content = await this.vault.read(file);
            this.data = this.parse(content);
        } catch {
            this.data = ScheduleDataFileRepository.emptyData();
        }
    }

    // --- synchronous read path (served from memory) ---

    getCardSchedule(blockId: string): string | undefined {
        return this.data.cards[blockId];
    }

    getNoteSchedule(noteId: string): string | undefined {
        return this.data.notes[noteId];
    }

    // --- async mutators (persist to disk) ---

    async setCardSchedule(blockId: string, schedule: string, persist = true): Promise<void> {
        this.data.cards[blockId] = schedule;
        if (persist) await this.save();
    }

    async deleteCardSchedule(blockId: string, persist = true): Promise<void> {
        delete this.data.cards[blockId];
        if (persist) await this.save();
    }

    async setNoteSchedule(noteId: string, schedule: string, persist = true): Promise<void> {
        this.data.notes[noteId] = schedule;
        if (persist) await this.save();
    }

    async deleteNoteSchedule(noteId: string, persist = true): Promise<void> {
        delete this.data.notes[noteId];
        if (persist) await this.save();
    }

    /**
     * Clears all stored schedule data (used when migrating away from this store).
     */
    async clear(): Promise<void> {
        this.data = ScheduleDataFileRepository.emptyData();
        await this.save();
    }

    async clearCards(): Promise<void> {
        this.data.cards = {};
        await this.save();
    }

    async clearNotes(): Promise<void> {
        this.data.notes = {};
        await this.save();
    }

    /**
     * Persists the current in-memory data to the schedule-data file, creating it if needed.
     */
    async save(): Promise<void> {
        await this.ensureStructure();
        const file = this.vault.getAbstractFileByPath(this.filePath);
        if (file instanceof TFile) {
            await this.vault.modify(file, this.serialize(this.data));
        }
    }

    // --- (de)serialization: JSON inside a fenced markdown code block ---

    private serialize(data: IScheduleData): string {
        const json = JSON.stringify(data, null, 2);
        return `${FILE_PREAMBLE}\`\`\`json\n${json}\n\`\`\`\n`;
    }

    private parse(content: string): IScheduleData {
        const fenceMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
        const jsonText = fenceMatch ? fenceMatch[1] : content;

        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            return ScheduleDataFileRepository.emptyData();
        }

        if (typeof parsed !== "object" || parsed === null) {
            return ScheduleDataFileRepository.emptyData();
        }

        const obj = parsed as Partial<IScheduleData>;
        return {
            version: typeof obj.version === "number" ? obj.version : CURRENT_VERSION,
            cards: this.asStringRecord(obj.cards),
            notes: this.asStringRecord(obj.notes),
        };
    }

    private asStringRecord(value: unknown): Record<string, string> {
        const result: Record<string, string> = {};
        if (typeof value === "object" && value !== null) {
            for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
                if (typeof v === "string") result[key] = v;
            }
        }
        return result;
    }
}
