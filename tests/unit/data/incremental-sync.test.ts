import { VaultChangeTracker } from "src/data/data-store/base/vault-change-tracker";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestOsrCore } from "../helpers/unit-test-core";
import { UnitTestSRFile } from "../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../helpers/unit-test-setup";

function cardCount(osrCore: UnitTestOsrCore): number {
    return osrCore.reviewableDeckTree.getRepItemCount(RepItemState.AnyItem, true);
}

const ONE_CARD = "#flashcards\n\nQ1::A1\n";
const TWO_CARDS = "#flashcards\n\nQ1::A1\nQ2::A2\n";

beforeAll(() => {
    setupStaticDateProvider20230906();
});

beforeEach(() => {
    unitTestSetupStandardDataStoreAlgorithm({ ...DEFAULT_SETTINGS });
    // The tracker is a process-wide singleton, so reset it to avoid leaking state between tests.
    VaultChangeTracker.instance.reset();
});

describe("Incremental sync (note parse cache)", () => {
    test("an unchanged note is served from the cache, so new content is ignored until its mtime changes", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");
        file.setMtime(1000);

        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        // Add a card but keep the same mtime: a cache hit, so the new card is not picked up.
        file.content = TWO_CARDS;
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        // Bump the mtime: a cache miss, so the re-parse picks up the new card.
        file.setMtime(2000);
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(2);
    });

    test("a note reported changed by the tracker is re-parsed even when its mtime is unchanged", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");
        file.setMtime(1000);

        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        // An external edit that an mtime comparison alone could miss, but an event reported.
        file.content = TWO_CARDS;
        VaultChangeTracker.instance.markChanged(file.path);
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(2);
    });

    test("a note reported removed by the tracker is evicted from the cache", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");
        file.setMtime(1000);

        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        // e.g. deleted and recreated at the same path with the same mtime.
        file.content = TWO_CARDS;
        VaultChangeTracker.instance.markRemoved(file.path);
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(2);
    });

    test("a null mtime disables caching, so the note is always re-parsed", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        // mtime left as null (the UnitTestSRFile default).
        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");

        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        file.content = TWO_CARDS;
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(2);
    });

    test("a settings change invalidates the cache, so notes re-parse under the new settings", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");
        file.setMtime(1000);

        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(1);

        // Change a parse-relevant setting in place (OsrCore holds this same settings object) while
        // keeping the mtime: "Q1::A1" no longer matches the separator, so it yields no cards.
        settings.singleLineCardSeparator = "@@@";
        await osrCore.loadFiles([file]);
        expect(cardCount(osrCore)).toEqual(0);
    });

    test("cache entries for notes no longer present are pruned", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        const fileA: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "a.md");
        fileA.setMtime(1000);

        await osrCore.loadFiles([fileA]);
        expect(cardCount(osrCore)).toEqual(1);

        // A sync without fileA prunes its entry.
        const fileB: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "b.md");
        fileB.setMtime(1000);
        await osrCore.loadFiles([fileB]);
        expect(cardCount(osrCore)).toEqual(1);

        // Re-introduce fileA at the same mtime but with new content. Had the old entry survived,
        // this would be a stale cache hit (1 card); pruning means it is re-parsed (2 cards).
        fileA.content = TWO_CARDS;
        await osrCore.loadFiles([fileA]);
        expect(cardCount(osrCore)).toEqual(2);
    });

    test("hasCompletedInitialLoad is false until the first sync finishes", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(settings);
        expect(osrCore.hasCompletedInitialLoad).toBe(false);

        const file: UnitTestSRFile = new UnitTestSRFile(ONE_CARD, "note.md");
        file.setMtime(1000);
        await osrCore.loadFiles([file]);

        expect(osrCore.hasCompletedInitialLoad).toBe(true);
    });
});
