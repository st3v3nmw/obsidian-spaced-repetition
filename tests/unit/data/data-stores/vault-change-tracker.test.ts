import { VaultChangeTracker } from "src/data/data-store/base/vault-change-tracker";

beforeEach(() => {
    VaultChangeTracker.instance.reset();
});

describe("VaultChangeTracker", () => {
    test("is a singleton", () => {
        expect(VaultChangeTracker.instance).toBe(VaultChangeTracker.instance);
    });

    test("reports no pending changes when freshly reset", () => {
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(false);
    });

    test("a changed path is pending and is returned by consume", () => {
        VaultChangeTracker.instance.markChanged("a.md");
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(true);

        const pending = VaultChangeTracker.instance.consume();
        expect(pending.changedPaths).toEqual(["a.md"]);
        expect(pending.removedPaths).toEqual([]);
    });

    test("a removed path is pending and is returned by consume", () => {
        VaultChangeTracker.instance.markRemoved("gone.md");
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(true);

        const pending = VaultChangeTracker.instance.consume();
        expect(pending.removedPaths).toEqual(["gone.md"]);
        expect(pending.changedPaths).toEqual([]);
    });

    test("markDirty makes a sync pending without naming a path", () => {
        VaultChangeTracker.instance.markDirty();
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(true);

        const pending = VaultChangeTracker.instance.consume();
        expect(pending.changedPaths).toEqual([]);
        expect(pending.removedPaths).toEqual([]);
        // The forced flag is cleared by consume.
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(false);
    });

    test("paths are de-duplicated", () => {
        VaultChangeTracker.instance.markChanged("a.md");
        VaultChangeTracker.instance.markChanged("a.md");
        VaultChangeTracker.instance.markRemoved("b.md");
        VaultChangeTracker.instance.markRemoved("b.md");

        const pending = VaultChangeTracker.instance.consume();
        expect(pending.changedPaths).toEqual(["a.md"]);
        expect(pending.removedPaths).toEqual(["b.md"]);
    });

    test("consume resets the tracker", () => {
        VaultChangeTracker.instance.markChanged("a.md");
        VaultChangeTracker.instance.markRemoved("b.md");
        VaultChangeTracker.instance.consume();

        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(false);
        const second = VaultChangeTracker.instance.consume();
        expect(second.changedPaths).toEqual([]);
        expect(second.removedPaths).toEqual([]);
    });

    test("reset clears everything", () => {
        VaultChangeTracker.instance.markChanged("a.md");
        VaultChangeTracker.instance.markRemoved("b.md");
        VaultChangeTracker.instance.markDirty();

        VaultChangeTracker.instance.reset();
        expect(VaultChangeTracker.instance.hasPendingChanges()).toBe(false);
    });
});
