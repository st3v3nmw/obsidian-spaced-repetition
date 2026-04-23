import { App, TFile } from "obsidian";

import { FLASHCARD_SCHEDULE_INFO } from "src/constants";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DataStoreInNoteAlgorithmOsr } from "src/data-store-algorithm/data-store-in-note-algorithm-osr";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { TopicPath } from "src/deck/topic-path";
import { SrTFile } from "src/file";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { SettingsUtil, SRSettings } from "src/settings";
import { TextDirection } from "src/utils/strings";

export class DataStoreMigrator {
    /**
     * Migrate scheduling data from inline notes (NOTES mode) to plugin data (PLUGIN_DATA mode).
     *
     * Must be called while DataStore.instance is still StoreInNotes, so that
     * NoteFileLoader reads card schedules from existing inline comments.
     * After this returns, all schedules are in the repository and all
     * <!--SR:...--> comments and sr-* frontmatter fields have been stripped.
     */
    static async migrateToPluginData(
        app: App,
        settings: SRSettings,
        textDirection: TextDirection,
        scheduleDataRepository: ScheduleDataRepository,
    ): Promise<void> {
        for (const tFile of app.vault.getMarkdownFiles()) {
            if (SettingsUtil.isPathInNoteIgnoreFolder(settings, tFile.path)) {
                continue;
            }

            try {
                await DataStoreMigrator.migrateFileToPluginData(
                    app,
                    tFile,
                    settings,
                    textDirection,
                    scheduleDataRepository,
                );
            } catch (e) {
                console.error(`SR: failed to migrate ${tFile.path} to plugin data`, e);
            }
        }
    }

    private static async migrateFileToPluginData(
        app: App,
        tFile: TFile,
        settings: SRSettings,
        textDirection: TextDirection,
        scheduleDataRepository: ScheduleDataRepository,
    ): Promise<void> {
        const srFile = new SrTFile(app.vault, app.metadataCache, app.fileManager, tFile);

        // Note schedule: frontmatter → repository
        const noteSchedule = await srFile.getNoteSchedule();
        if (noteSchedule) {
            await scheduleDataRepository.setNoteSchedule(srFile.path, noteSchedule);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await app.fileManager.processFrontMatter(tFile, (fm: any) => {
                delete fm["sr-due"];
                delete fm["sr-interval"];
                delete fm["sr-ease"];
            });
        }

        // Card schedules: inline comments → repository
        const folderTopicPath = TopicPath.getFolderPathFromFilename(srFile, settings);
        const loader = new NoteFileLoader(settings);
        const note: Note | null = await loader.load(srFile, textDirection, folderTopicPath);

        if (note === null || note.questionList.length === 0) {
            return;
        }

        let fileHasScheduledCards = false;
        for (const question of note.questionList) {
            const schedules = question.cards.map((c) => (c.hasSchedule ? c.scheduleInfo : null));
            if (schedules.some((s) => s !== null)) {
                await scheduleDataRepository.setCardSchedules(
                    question.questionText.textHash,
                    schedules,
                );
                fileHasScheduledCards = true;
            }
        }

        if (fileHasScheduledCards) {
            await app.vault.process(tFile, (data) => data.replace(FLASHCARD_SCHEDULE_INFO, ""));
        }
    }

    /**
     * Migrate scheduling data from plugin data (PLUGIN_DATA mode) back to inline notes (NOTES mode).
     *
     * Must be called while DataStore.instance is still StoreInPluginData, so that
     * NoteFileLoader populates card schedules from the repository.
     * After this returns, all schedules are written as inline comments / frontmatter
     * and the repository state is cleared.
     */
    static async migrateToNotes(
        app: App,
        settings: SRSettings,
        textDirection: TextDirection,
        scheduleDataRepository: ScheduleDataRepository,
    ): Promise<void> {
        // Temporarily use the note algorithm so formatForNote emits <!--SR:...--> comments.
        const prevAlgorithm = DataStoreAlgorithm.instance;
        DataStoreAlgorithm.instance = new DataStoreInNoteAlgorithmOsr(settings);

        try {
            for (const tFile of app.vault.getMarkdownFiles()) {
                if (SettingsUtil.isPathInNoteIgnoreFolder(settings, tFile.path)) {
                    continue;
                }

                try {
                    await DataStoreMigrator.migrateFileToNotes(
                        app,
                        tFile,
                        settings,
                        textDirection,
                        scheduleDataRepository,
                    );
                } catch (e) {
                    console.error(`SR: failed to migrate ${tFile.path} to notes`, e);
                }
            }

            scheduleDataRepository.clearState();
        } finally {
            DataStoreAlgorithm.instance = prevAlgorithm;
        }
    }

    private static async migrateFileToNotes(
        app: App,
        tFile: TFile,
        settings: SRSettings,
        textDirection: TextDirection,
        scheduleDataRepository: ScheduleDataRepository,
    ): Promise<void> {
        const srFile = new SrTFile(app.vault, app.metadataCache, app.fileManager, tFile);

        // Note schedule: repository → frontmatter
        if (scheduleDataRepository.hasNoteSchedule(srFile.path)) {
            const noteSchedule = scheduleDataRepository.getNoteSchedule(srFile.path);
            if (noteSchedule) {
                await srFile.setNoteSchedule(noteSchedule);
            }
        }

        // Card schedules: repository → inline comments
        // NoteFileLoader with StoreInPluginData active will populate card.scheduleInfo from repo.
        const folderTopicPath = TopicPath.getFolderPathFromFilename(srFile, settings);
        const loader = new NoteFileLoader(settings);
        const note: Note | null = await loader.load(srFile, textDirection, folderTopicPath);

        if (note === null || note.questionList.length === 0) {
            return;
        }

        let noteChanged = false;
        for (const question of note.questionList) {
            if (question.cards.some((c) => c.hasSchedule)) {
                question.hasChanged = true;
                noteChanged = true;
            }
        }

        if (noteChanged) {
            // writeNoteFile uses DataStoreAlgorithm (swapped to note algorithm above)
            // to format the <!--SR:...--> comment into each question's text.
            await note.writeNoteFile(settings);
        }
    }
}
