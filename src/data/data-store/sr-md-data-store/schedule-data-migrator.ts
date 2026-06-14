import { TFile } from "obsidian";

import { DataStore, IDataStore, StorageType } from "src/data/data-store/base/data-store";
import { DataStoreAlgorithm } from "src/data/data-store/base/data-store-algorithm";
import { NoteDataFileModifier } from "src/data/data-store/notes-data-store/note-data-file-modifier";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store/notes-data-store/note-data-store-algorithm-osr";
import { NotesDataStore } from "src/data/data-store/notes-data-store/notes-data-store";
import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile, SRNoteTFile } from "src/data/data-structures/file/note-file";
import { SettingsUtil, SRSettings } from "src/data/settings";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { CommentParser } from "src/utils/comment-parser";

/**
 * Migrates scheduling data between the inline-notes store ({@link StorageType.NOTES}) and the
 * external "SR markdown file" store ({@link StorageType.SR_MD}).
 *
 * The migration is two-phase so that it can reuse the full, well-tested parser and the stores'
 * own write paths instead of doing bespoke text surgery:
 *
 *  - NOTES → SR_MD: read every note with the NOTES store active (so cards/notes load their
 *    schedules from inline comments / frontmatter), then write them out with the SR_MD store
 *    active (which assigns "^sr-id-..." block ids, stores schedules in the external file, and
 *    writes no inline comments). Note-level `sr-due/sr-interval/sr-ease` frontmatter is then
 *    removed (the `sr-id` is kept).
 *  - SR_MD → NOTES: read every note with the NOTES store active (notes hold only block ids), look
 *    each schedule up in the external file by block id / note id, set it on the cards/notes, and
 *    write it back inline; finally clear the external file.
 *
 * The active {@link DataStore}/{@link DataStoreAlgorithm} instances are saved and restored around
 * the read phase, so the caller's configured store stays in effect afterwards.
 */
export class ScheduleDataMigrator {
    private plugin: SRPlugin;
    private settings: SRSettings;
    private repository: ScheduleDataFileRepository;

    constructor(plugin: SRPlugin, settings: SRSettings, repository: ScheduleDataFileRepository) {
        this.plugin = plugin;
        this.settings = settings;
        this.repository = repository;
    }

    /**
     * Migrates from `oldMode` to `newMode`. No-op if the modes are the same or unsupported.
     */
    async migrate(oldMode: StorageType, newMode: StorageType): Promise<void> {
        if (oldMode === newMode) return;

        if (oldMode === StorageType.NOTES && newMode === StorageType.SR_MD) {
            await this.notesToSrMd();
        } else if (oldMode === StorageType.SR_MD && newMode === StorageType.NOTES) {
            await this.srMdToNotes();
        }
    }

    private noteFiles(): TFile[] {
        const scheduleFilePath = this.repository.filePath;
        return this.plugin.app.vault
            .getMarkdownFiles()
            .filter((f) => f.path !== scheduleFilePath)
            .filter((f) => !SettingsUtil.isPathInFoldersToIgnore(this.settings, f.path));
    }

    private createSRNoteTFile(file: TFile): SRNoteTFile {
        return new SRNoteTFile(
            this.plugin.app.vault,
            this.plugin.app.metadataCache,
            this.plugin.app.fileManager,
            file,
        );
    }

    private async loadNote(srFile: ISRNoteTFile): Promise<Note | null> {
        const loader = new NoteFileLoader(this.settings);
        const folderTopicPath = TopicPath.getFolderPathFromFilename(srFile, this.settings);
        return await loader.load(srFile, this.plugin.getObsidianRtlSetting(), folderTopicPath);
    }

    private async notesToSrMd(): Promise<void> {
        await this.repository.ensureStructure();
        await this.repository.load();

        // Phase 1: read with the NOTES store active so schedules load from inline comments.
        const collected: {
            srFile: ISRNoteTFile;
            note: Note | null;
            noteSchedule: RepItemScheduleInfo | null;
        }[] = [];

        await this.withTemporaryStore(
            new NotesDataStore(this.settings, new NoteDataFileModifier(this.plugin)),
            new NoteDataStoreAlgorithmOsr(this.settings),
            async () => {
                for (const file of this.noteFiles()) {
                    const srFile = this.createSRNoteTFile(file);
                    const note = await this.loadNote(srFile);
                    const noteSchedule = await srFile.getNoteSchedule();
                    collected.push({ srFile, note, noteSchedule });
                }
            },
        );

        // Phase 2: write with the (restored) SR_MD store active — assigns block ids, stores
        // schedules in the external file, writes no inline comments.
        const srMdStore = DataStore.getInstance();
        for (const { srFile, note, noteSchedule } of collected) {
            if (note) {
                for (const question of note.questionList) {
                    if (question.cards.some((card) => card.hasSchedule)) {
                        await srMdStore.writeSchedule(question);
                    }
                }
            }
            if (noteSchedule) {
                await srMdStore.writeNoteSchedule(srFile, noteSchedule);
                await this.stripNoteFrontmatterSchedule(srFile);
            }
        }
    }

    private async srMdToNotes(): Promise<void> {
        await this.repository.load();

        // The NOTES store is already active (set by the caller before migrating).
        const notesStore = DataStore.getInstance();

        for (const file of this.noteFiles()) {
            const srFile = this.createSRNoteTFile(file);
            const note = await this.loadNote(srFile);

            if (note) {
                for (const question of note.questionList) {
                    const blockId = question.questionText.obsidianBlockId;
                    if (!blockId) continue;

                    const stored = this.repository.getCardSchedule(blockId);
                    if (!stored) continue;

                    const schedules = CommentParser.parseMultiScheduleComment(stored) ?? [];
                    question.cards.forEach((card, i) => {
                        card.scheduleInfo = schedules[i] ?? null;
                    });

                    if (question.cards.some((card) => card.hasSchedule)) {
                        await notesStore.writeSchedule(question);
                    }
                }
            }

            const noteId = await srFile.getNoteId();
            if (noteId) {
                const storedNote = this.repository.getNoteSchedule(noteId);
                if (storedNote) {
                    const parsed = CommentParser.parseMultiScheduleComment(storedNote);
                    const noteSchedule = parsed.find(
                        (info): info is RepItemScheduleInfo => info !== null,
                    );
                    if (noteSchedule) {
                        await notesStore.writeNoteSchedule(srFile, noteSchedule);
                    }
                }
            }
        }

        await this.repository.clear();
    }

    /**
     * Removes the note-level schedule keys from a note's frontmatter, leaving `sr-id` intact.
     */
    private async stripNoteFrontmatterSchedule(srFile: ISRNoteTFile): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.plugin.app.fileManager.processFrontMatter(srFile.tfile, (frontmatter: any) => {
            delete frontmatter["sr-due"];
            delete frontmatter["sr-interval"];
            delete frontmatter["sr-ease"];
        });
    }

    /**
     * Runs `fn` with the given store/algorithm temporarily active, restoring the previous
     * instances afterwards (even on error).
     */
    private async withTemporaryStore(
        store: IDataStore,
        algorithm: NoteDataStoreAlgorithmOsr,
        fn: () => Promise<void>,
    ): Promise<void> {
        const prevStore = DataStore.instance;
        const prevAlgorithm = DataStoreAlgorithm.instance;
        DataStore.instance = store;
        DataStoreAlgorithm.instance = algorithm;
        try {
            await fn();
        } finally {
            DataStore.instance = prevStore;
            DataStoreAlgorithm.instance = prevAlgorithm;
        }
    }
}
