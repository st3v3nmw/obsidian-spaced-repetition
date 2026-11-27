/**
 * Records vault changes observed via Obsidian's `vault` / `metadataCache` events, so that a sync
 * can (a) skip entirely when nothing changed since the last one and (b) invalidate only the
 * affected notes in the note parse cache.
 *
 * The plugin wires the Obsidian events to the mark* methods (see SRPlugin), and OsrCore /
 * DataManager consume the accumulated changes. Anything that mutates the model without a file
 * event (a settings change, a data store swap, a review write) calls {@link markDirty} so the
 * next sync still runs.
 *
 * Implemented as a process-wide singleton to mirror the existing DataStore / SRAlgorithm
 * singletons and avoid threading a reference through the plugin.
 */
export class VaultChangeTracker {
    private static _instance: VaultChangeTracker | null = null;

    public static get instance(): VaultChangeTracker {
        if (this._instance === null) {
            this._instance = new VaultChangeTracker();
        }
        return this._instance;
    }

    private changedPaths: Set<string> = new Set<string>();
    private removedPaths: Set<string> = new Set<string>();
    // A change that requires a sync but isn't tied to a specific note path.
    private forced = false;

    /** A note's content/metadata changed, or it was created. */
    public markChanged(path: string): void {
        this.changedPaths.add(path);
    }

    /** A note was deleted, or renamed away from this path. */
    public markRemoved(path: string): void {
        this.removedPaths.add(path);
    }

    /** Something changed that requires a sync but isn't a specific note (settings, store, write). */
    public markDirty(): void {
        this.forced = true;
    }

    /** Whether anything changed since the last {@link consume}. Drives the sync short-circuit. */
    public hasPendingChanges(): boolean {
        return this.forced || this.changedPaths.size > 0 || this.removedPaths.size > 0;
    }

    /**
     * Returns the accumulated changes and resets the tracker. Called once at the start of a sync's
     * rebuild; any change arriving afterwards is recorded for the following sync.
     */
    public consume(): { changedPaths: string[]; removedPaths: string[] } {
        const result = {
            changedPaths: [...this.changedPaths],
            removedPaths: [...this.removedPaths],
        };
        this.changedPaths.clear();
        this.removedPaths.clear();
        this.forced = false;
        return result;
    }

    /** Clears all pending state. */
    public reset(): void {
        this.consume();
    }
}
