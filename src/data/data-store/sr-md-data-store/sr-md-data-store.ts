import { generate } from "short-uuid";

import {
    SR_CARD_BLOCK_ID_PREFIX,
    SR_HTML_COMMENT_BEGIN,
    SR_HTML_COMMENT_END,
} from "src/data/constants";
import { IDataStore, StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { RepItemStorageInfo } from "src/data/data-store/base/rep-item-storage-info";
import { NoteDataStoreAlgorithmOsr } from "src/data/data-store/notes-data-store/note-data-store-algorithm-osr";
import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { Question, QuestionText } from "src/data/data-structures/card/questions/question";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SRSettings } from "src/data/settings";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { CommentParser } from "src/utils/comment-parser";
import { MultiLineTextFinder } from "src/utils/strings";

// Strips any stray inline SR scheduling comment from note text. In SR_MD mode no comment
// should be written, but a note may still contain one (e.g. left over before migration).
const STRAY_SR_COMMENT_FINDER = /<!--SR:.+?-->/gm;

/**
 * Data store that keeps all scheduling data in a single external markdown file in the vault
 * (see {@link ScheduleDataFileRepository}), instead of inline `<!--SR:...-->` comments.
 *
 * - Cards are linked to their schedule by an Obsidian block id "^sr-id-<short-uuid>" written to
 *   the note; the schedule itself lives in the external file keyed by that block id.
 * - Notes are linked by their `sr-id` frontmatter value.
 *
 * The read path ({@link createSchedule}) is synchronous and served from the repository's
 * in-memory copy, which {@link preload} refreshes before each vault scan. Only writes touch disk.
 */
export class SrMdDataStore implements IDataStore {
    public readonly storageType = StorageType.SR_MD;
    public readonly fileModifier: IFileModifier;
    public isStructureInitialized: Promise<boolean>;

    private settings: SRSettings;
    private repository: ScheduleDataFileRepository;
    // Reused only to format a schedule into the inline string we persist in the external file.
    private scheduleFormatter: NoteDataStoreAlgorithmOsr;

    constructor(
        settings: SRSettings,
        fileModifier: IFileModifier,
        repository: ScheduleDataFileRepository,
    ) {
        this.settings = settings;
        this.fileModifier = fileModifier;
        this.repository = repository;
        this.scheduleFormatter = new NoteDataStoreAlgorithmOsr(settings);
        this.isStructureInitialized = this.repository.ensureStructure();
    }

    /**
     * Refreshes the in-memory copy of the schedule-data file before the vault is scanned, so the
     * synchronous {@link createSchedule} read path sees current data.
     */
    async preload(): Promise<void> {
        await this.repository.load();
    }

    async migrateDataStore(oldMode: StorageType): Promise<void> {
        await this.fileModifier.migrateDataStore(oldMode);
    }

    // --- note-level scheduling (stored in the external file, keyed by the note's sr-id) ---

    async readNoteSchedule(noteFile: ISRNoteTFile): Promise<RepItemScheduleInfo | null> {
        const noteId = await noteFile.getNoteId();
        if (!noteId) return null;

        const stored = this.repository.getNoteSchedule(noteId);
        if (!stored) return null;

        const parsed = CommentParser.parseMultiScheduleComment(stored);
        return parsed.find((info): info is RepItemScheduleInfo => info !== null) ?? null;
    }

    async writeNoteSchedule(noteFile: ISRNoteTFile, schedule: RepItemScheduleInfo): Promise<void> {
        const noteId = await noteFile.getOrCreateNoteId();
        await this.repository.setNoteSchedule(noteId, schedule.formatScheduleAsSRHtmlComment());
    }

    // --- card-level scheduling ---

    /**
     * Reads a card's schedule from the external file, keyed by the card's block id parsed from
     * the question text. Returns one entry per sibling card (a null entry means "new"), matching
     * the inline-notes store so card indexes stay aligned.
     */
    createSchedule(originalQuestionText: string, _: RepItemStorageInfo): RepItemScheduleInfo[] {
        const blockId = this.getBlockId(originalQuestionText);
        if (blockId === null) return [];

        const stored = this.repository.getCardSchedule(blockId);
        if (!stored) return [];

        return CommentParser.parseMultiScheduleComment(stored) ?? [];
    }

    /**
     * In SR_MD mode the note holds no schedule comment, only the block id (kept by the parser).
     * We still strip any stray `<!--SR:...-->` comment that might remain in the text.
     */
    removeScheduleInfo(questionText: string): string {
        return questionText.replace(STRAY_SR_COMMENT_FINDER, "");
    }

    async writeSchedule(question: Question): Promise<void> {
        const blockId = await this.ensureBlockId(question);
        const inner = this.formatCardSchedule(question);
        await this.repository.setCardSchedule(blockId, inner);
    }

    /**
     * Persists the question text to the note (e.g. to write a newly assigned block id).
     */
    async write(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();
        const newText: string = question.updateQuestionWithinNoteText(fileText, this.settings);
        await question.note.file.write(newText);
        question.hasChanged = false;
    }

    async delete(question: Question): Promise<void> {
        const blockId = this.getBlockId(question.questionText.original);

        const fileText: string = await question.note.file.read();
        const originalText: string = question.questionText.original;
        const newText = MultiLineTextFinder.findAndReplace(fileText, originalText, "");
        if (newText) {
            await question.note.file.write(newText);
        }

        if (blockId !== null) {
            await this.repository.deleteCardSchedule(blockId);
        }
    }

    // --- helpers ---

    /**
     * Ensures the question has an "^sr-id-..." block id, generating and writing one to the note
     * if needed, and returns it.
     */
    private async ensureBlockId(question: Question): Promise<string> {
        const existing = question.questionText.obsidianBlockId;
        if (existing) return existing;

        const newBlockId = `^${SR_CARD_BLOCK_ID_PREFIX}${generate()}`;
        question.questionText.obsidianBlockId = newBlockId;
        await this.write(question);
        // write() recreates questionText from the new note text; re-read to be safe.
        return question.questionText.obsidianBlockId || newBlockId;
    }

    /**
     * Builds the inline schedule string for all of a question's cards (the same content that the
     * notes store would put inside `<!--SR:...-->`), without the comment wrapper.
     */
    private formatCardSchedule(question: Question): string {
        const full = this.scheduleFormatter.questionFormatScheduleAsHtmlComment(question);
        return full.replace(SR_HTML_COMMENT_BEGIN, "").replace(SR_HTML_COMMENT_END, "");
    }

    private getBlockId(text: string): string | null {
        const [, blockId] = QuestionText.extractObsidianBlockId(text.trimEnd());
        return blockId ? blockId : null;
    }
}
