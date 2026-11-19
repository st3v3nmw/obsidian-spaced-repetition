import { HistoryEvent } from "src/history/history-events";

/**
 * A line of a history file that couldn't be parsed (e.g. cut off by a crash, or a sync conflict).
 */
export interface CorruptHistoryLine {
    file: string;
    lineNo: number;
}

export interface HistoryReadResult {
    // All events, sorted by time
    events: HistoryEvent[];
    corruptLines: CorruptHistoryLine[];
}

export interface IHistoryStore {
    // Where the history is stored (for the default store: the folder path relative to the vault root)
    readonly location: string;

    append(event: HistoryEvent): Promise<void>;
    readAll(): Promise<HistoryReadResult>;
    /**
     * Stores the history in a different folder from now on, and moves the existing history files there. If moving
     * fails, the history stays in the old folder (some files may have been moved already, calling it again moves the
     * rest).
     *
     * @returns The number of moved files.
     */
    moveTo(folder: string): Promise<number>;
}

/**
 * The subset of Obsidian's DataAdapter used by the AdapterHistoryStore.
 */
export interface HistoryFileAdapter {
    exists(normalizedPath: string): Promise<boolean>;
    mkdir(normalizedPath: string): Promise<void>;
    write(normalizedPath: string, data: string): Promise<void>;
    append(normalizedPath: string, data: string): Promise<void>;
    read(normalizedPath: string): Promise<string>;
    list(normalizedPath: string): Promise<{ files: string[]; folders: string[] }>;
    rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
    remove(normalizedPath: string): Promise<void>;
}

const HISTORY_FILE_REGEX = /(^|\/)events-\d{4}-\d{2}-[0-9a-z]+\.jsonl$/;

/**
 * Parses the content of a history file (one JSON event per line).
 *
 * @param {string} text - The file content.
 * @param {string} file - The file name, used for reporting corrupt lines.
 */
export function parseHistoryFile(
    text: string,
    file: string,
): { events: HistoryEvent[]; corruptLines: CorruptHistoryLine[] } {
    const events: HistoryEvent[] = [];
    const corruptLines: CorruptHistoryLine[] = [];

    const lines: string[] = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line: string = lines[i].trim();
        if (line.length === 0) continue;

        let parsed: unknown;
        try {
            parsed = JSON.parse(line);
        } catch {
            // A single damaged line must not make the whole history unreadable. Damaged lines are reported to the
            // user on the statistics page instead.
            corruptLines.push({ file, lineNo: i + 1 });
            continue;
        }

        if (isHistoryEvent(parsed)) {
            events.push(parsed);
        } else {
            corruptLines.push({ file, lineNo: i + 1 });
        }
    }
    return { events, corruptLines };
}

function isHistoryEvent(value: unknown): value is HistoryEvent {
    if (typeof value !== "object" || value === null) return false;
    const record = value as Record<string, unknown>;
    return (
        typeof record.v === "number" &&
        typeof record.id === "string" &&
        typeof record.ts === "number" &&
        typeof record.type === "string" &&
        typeof record.device === "string"
    );
}

function sortEventsByTime(events: HistoryEvent[]): HistoryEvent[] {
    return events.sort((a, b) => a.ts - b.ts);
}

/**
 * Stores the history as JSON lines files within a folder (by default the plugin's folder).
 *
 * Every device writes to its own file per month, e.g. "events-2026-11-x7k2p9q1.jsonl". Files are only ever appended
 * to, and never written by two devices, so syncing the vault (Obsidian Sync, iCloud, git, ...) can't cause conflicts.
 */
export class AdapterHistoryStore implements IHistoryStore {
    private folder: string;
    private adapter: HistoryFileAdapter;
    private deviceId: string;
    private writeQueue: Promise<void> = Promise.resolve();
    private knownFiles: Set<string> = new Set();

    /**
     * @param {HistoryFileAdapter} adapter - Usually the vault's DataAdapter.
     * @param {string} folder - Normalized folder path relative to the vault root (see resolveHistoryFolder()).
     * @param {string} deviceId - This device's id, part of the file names.
     */
    constructor(adapter: HistoryFileAdapter, folder: string, deviceId: string) {
        if (!/^[0-9a-z]+$/.test(deviceId)) {
            throw new Error(`AdapterHistoryStore: invalid device id "${deviceId}"`);
        }
        this.adapter = adapter;
        this.folder = AdapterHistoryStore.checkFolder(folder);
        this.deviceId = deviceId;
    }

    get location(): string {
        return this.folder;
    }

    private static checkFolder(folder: string): string {
        if (folder.length === 0 || folder.startsWith("/") || folder.endsWith("/")) {
            throw new Error(`AdapterHistoryStore: invalid folder path "${folder}"`);
        }
        return folder;
    }

    filePathFor(event: HistoryEvent): string {
        const date: Date = new Date(event.ts);
        const month: string = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return `${this.folder}/events-${month}-${this.deviceId}.jsonl`;
    }

    append(event: HistoryEvent): Promise<void> {
        const line: string = JSON.stringify(event) + "\n";

        // Appends are serialized, so that lines can never interleave and the file order matches the event order
        return this.enqueue(async () => {
            // Determined when it's this append's turn, so that it goes to the new folder after a moveTo()
            const path: string = this.filePathFor(event);
            if (this.knownFiles.has(path)) {
                await this.adapter.append(path, line);
            } else if (await this.adapter.exists(path)) {
                await this.adapter.append(path, (await this.newlineNeeded(path)) + line);
            } else {
                await this.ensureFolder(this.folder);
                await this.adapter.write(path, line);
            }
            this.knownFiles.add(path);
        });
    }

    moveTo(folder: string): Promise<number> {
        const newFolder: string = AdapterHistoryStore.checkFolder(folder);
        return this.enqueue(async () => {
            const oldFolder: string = this.folder;
            if (newFolder === oldFolder) return 0;
            // Files are about to move away, even if the move fails halfway
            this.knownFiles.clear();

            let movedCount: number = 0;
            if (await this.adapter.exists(oldFolder)) {
                const files: string[] = (await this.adapter.list(oldFolder)).files.filter((file) =>
                    HISTORY_FILE_REGEX.test(file),
                );
                if (files.length > 0) await this.ensureFolder(newFolder);

                for (const file of files) {
                    const target: string = `${newFolder}/${file.split("/").pop()}`;
                    if (await this.adapter.exists(target)) {
                        // This device's file of the same month is in both folders (e.g. after moving back and forth).
                        // Both hold different events, so keep all of them.
                        const text: string = await this.adapter.read(file);
                        const lines: string = text.endsWith("\n") ? text : text + "\n";
                        await this.adapter.append(
                            target,
                            (await this.newlineNeeded(target)) + lines,
                        );
                        await this.adapter.remove(file);
                    } else {
                        await this.adapter.rename(file, target);
                    }
                    movedCount++;
                }
                // The old folder is kept, even if it's empty now. Removing it isn't worth the risk: Obsidian's
                // desktop adapter can only remove folders recursively, which would also delete files that another
                // device synced into it in the meantime.
            }

            this.folder = newFolder;
            return movedCount;
        });
    }

    /**
     * Runs file operations one after another. The caller gets the error of a failed operation, the queue itself
     * continues with the next operation.
     */
    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
        const result: Promise<T> = this.writeQueue.then(operation);
        this.writeQueue = result.then(
            (): void => undefined,
            (): void => undefined,
        );
        return result;
    }

    /**
     * Returns "\n" if the file doesn't end with a line break, e.g. because a write was cut off. Appending to it
     * directly would also damage the appended line.
     */
    private async newlineNeeded(path: string): Promise<string> {
        const text: string = await this.adapter.read(path);
        return text.length === 0 || text.endsWith("\n") ? "" : "\n";
    }

    private async ensureFolder(folder: string): Promise<void> {
        // Created one level at a time, as not every adapter creates missing parent folders
        const segments: string[] = folder.split("/");
        for (let i = 1; i <= segments.length; i++) {
            const path: string = segments.slice(0, i).join("/");
            if (!(await this.adapter.exists(path))) await this.adapter.mkdir(path);
        }
    }

    async readAll(): Promise<HistoryReadResult> {
        await this.writeQueue;

        const events: HistoryEvent[] = [];
        const corruptLines: CorruptHistoryLine[] = [];
        if (!(await this.adapter.exists(this.folder))) {
            return { events, corruptLines };
        }

        const listed = await this.adapter.list(this.folder);
        for (const file of listed.files) {
            if (!HISTORY_FILE_REGEX.test(file)) continue;
            const parsed = parseHistoryFile(await this.adapter.read(file), file);
            events.push(...parsed.events);
            corruptLines.push(...parsed.corruptLines);
        }
        return { events: sortEventsByTime(events), corruptLines };
    }
}

/**
 * Keeps the history in memory only. Used for unit tests.
 */
export class InMemoryHistoryStore implements IHistoryStore {
    public readonly location: string = "memory";

    public events: HistoryEvent[] = [];

    append(event: HistoryEvent): Promise<void> {
        this.events.push(event);
        return Promise.resolve();
    }

    readAll(): Promise<HistoryReadResult> {
        return Promise.resolve({ events: sortEventsByTime([...this.events]), corruptLines: [] });
    }

    moveTo(_folder: string): Promise<number> {
        return Promise.resolve(0);
    }
}
