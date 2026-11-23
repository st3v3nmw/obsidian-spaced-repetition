import { Notice, TFile } from "obsidian";

import { OsrCore } from "src/data/core";
import { DataManager } from "src/data/data-manager";
import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { SRNoteTFile } from "src/data/data-structures/file/note-file";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
import SRPlugin from "src/main";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../helpers/unit-test-setup";

afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

test("skips a note with an invalid FSRS state without rewriting it or aborting vault loading", async () => {
    setupStaticDateProvider20230906();
    const settings = { ...DEFAULT_SETTINGS };
    unitTestSetupStandardDataStoreAlgorithm(settings);
    const badText =
        "#flashcards\nBad::Answer<!--SR:!fsrs,2023-09-08T00:00:00.000Z,2,2.5,5.5,99,5,1,0,2023-09-06T00:00:00.000Z-->";
    const bad = new UnitTestSRFile(badText, "bad.md");
    const good = new UnitTestSRFile("#flashcards\nGood::Answer", "good.md");
    const badWrite = jest.spyOn(bad, "write");
    const goodWrite = jest.spyOn(good, "write");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const files = [{ path: bad.path }, { path: good.path }] as TFile[];
    const plugin = { app: { vault: { getMarkdownFiles: () => files } } } as unknown as SRPlugin;
    const manager = new DataManager(plugin, null, new SettingsManager(settings, jest.fn()));
    const core = new OsrCore(
        new QuestionPostponementList(null, settings, []),
        { getResolvedTargetLinksForNotePath: () => ({}) },
        settings,
        jest.fn(),
        new NoteReviewQueue(),
        TextDirection.Ltr,
    );
    manager.osrCore = core;
    jest.spyOn(manager, "createSRNoteTFile").mockImplementation(
        (file) => (file.path === bad.path ? bad : good) as unknown as SRNoteTFile,
    );
    const finalize = jest.spyOn(core, "finalizeLoad");

    await expect(manager.loadVault()).resolves.toBeUndefined();

    expect(finalize).toHaveBeenCalledTimes(1);
    expect(core.reviewableDeckTree.getDistinctRepItemCount(RepItemState.AnyItem, true)).toBe(1);
    expect(bad.content).toBe(badText);
    expect(badWrite).not.toHaveBeenCalled();
    expect(goodWrite).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("bad.md"), expect.any(Error));
    expect(Notice).toHaveBeenCalledWith(expect.stringContaining("bad.md"), 10000);
    expect(manager.syncLock).toBe(false);
});
