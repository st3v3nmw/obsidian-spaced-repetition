import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { ScheduleDataMarkdownStorage } from "src/data-stores/plugin-data/schedule-data-markdown-storage";
import { PluginData, SerializedScheduleInfo } from "src/plugin-data";
import { DateUtil, formatDateYYYYMMDD } from "src/utils/dates";

export class ScheduleDataRepository {
    private pluginData: PluginData;
    private persist: () => Promise<void>;
    private storage: ScheduleDataMarkdownStorage | null;
    private scheduleState: PluginData["scheduleState"];

    constructor(
        pluginData: PluginData,
        persist: () => Promise<void>,
        storage: ScheduleDataMarkdownStorage | null = null,
    ) {
        this.pluginData = pluginData;
        this.persist = persist;
        this.storage = storage;
        this.scheduleState = this.pluginData.scheduleState;
        this.ensureState();
    }

    async initialize(): Promise<void> {
        this.ensureState();

        if (!this.storage) {
            this.scheduleState = this.pluginData.scheduleState;
            return;
        }

        const legacyState = this.pluginData.scheduleState;
        const fileState = await this.storage.load();

        this.scheduleState = fileState;
        this.ensureState();

        const hasFileData = this.hasStateData(this.scheduleState);
        const hasLegacyData = this.hasStateData(legacyState);
        if (!hasFileData && hasLegacyData) {
            this.scheduleState = legacyState;
            this.ensureState();
        }

        // In markdown-file mode we keep plugin data clear to avoid duplicating schedule payloads.
        this.pluginData.scheduleState = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {},
        };
        await this.persist();

        await this.persistCurrentState();
    }

    private hasStateData(state: PluginData["scheduleState"]): boolean {
        return (
            Object.keys(state?.noteSchedules || {}).length > 0 ||
            Object.keys(state?.cardSchedules || {}).length > 0
        );
    }

    private ensureState(): void {
        if (!this.scheduleState) {
            this.scheduleState = {
                version: 1,
                noteSchedules: {},
                cardSchedules: {},
            };
        }

        if (!this.scheduleState.noteSchedules) {
            this.scheduleState.noteSchedules = {};
        }

        if (!this.scheduleState.cardSchedules) {
            this.scheduleState.cardSchedules = {};
        }

        if (!this.storage) {
            this.pluginData.scheduleState = this.scheduleState;
        }

        // Migrate keys from the old "notePath::questionHash" format to just "questionHash".
        // Only runs when legacy keys are present.
        this.migrateCardScheduleKeys();
    }

    private migrateCardScheduleKeys(): void {
        const legacyKeys = Object.keys(this.scheduleState.cardSchedules).filter((k) =>
            k.includes("::"),
        );
        if (legacyKeys.length === 0) return;

        for (const key of legacyKeys) {
            const hash = key.slice(key.lastIndexOf("::") + 2);
            if (!(hash in this.scheduleState.cardSchedules)) {
                this.scheduleState.cardSchedules[hash] = this.scheduleState.cardSchedules[key];
            }
            delete this.scheduleState.cardSchedules[key];
        }
    }

    async persistCurrentState(): Promise<void> {
        this.ensureState();

        if (this.storage) {
            await this.storage.save(this.scheduleState);
            return;
        }

        this.pluginData.scheduleState = this.scheduleState;
        await this.persist();
    }

    private static toSchedule(info: SerializedScheduleInfo | null): RepItemScheduleInfo | null {
        if (!info?.dueDate) {
            return null;
        }

        return new RepItemScheduleInfoOsr(
            DateUtil.dateStrToMoment(info.dueDate),
            info.interval,
            info.ease,
        );
    }

    private static fromSchedule(info: RepItemScheduleInfo | null): SerializedScheduleInfo | null {
        if (!info) {
            return null;
        }

        const schedule = info as RepItemScheduleInfoOsr;
        return {
            dueDate: formatDateYYYYMMDD(schedule.dueDate),
            interval: schedule.interval,
            ease: schedule.latestEase,
        };
    }

    hasNoteSchedule(notePath: string): boolean {
        this.ensureState();
        return this.scheduleState.noteSchedules[notePath] !== undefined;
    }

    getNoteSchedule(notePath: string): RepItemScheduleInfo | null {
        this.ensureState();
        return ScheduleDataRepository.toSchedule(this.scheduleState.noteSchedules[notePath]);
    }

    async setNoteSchedule(notePath: string, info: RepItemScheduleInfo): Promise<void> {
        this.ensureState();
        this.scheduleState.noteSchedules[notePath] = ScheduleDataRepository.fromSchedule(info);
        await this.persistCurrentState();
    }

    async deleteNoteSchedule(notePath: string): Promise<void> {
        this.ensureState();
        delete this.scheduleState.noteSchedules[notePath];
        await this.persistCurrentState();
    }

    hasCardSchedules(questionHash: string): boolean {
        this.ensureState();
        return this.scheduleState.cardSchedules[questionHash] !== undefined;
    }

    getCardSchedules(questionHash: string): (RepItemScheduleInfo | null)[] {
        this.ensureState();
        const serialized = this.scheduleState.cardSchedules[questionHash] || [];
        return serialized.map((item) => ScheduleDataRepository.toSchedule(item));
    }

    async setCardSchedules(
        questionHash: string,
        schedules: (RepItemScheduleInfo | null)[],
    ): Promise<void> {
        this.ensureState();
        this.scheduleState.cardSchedules[questionHash] = schedules.map((item) =>
            ScheduleDataRepository.fromSchedule(item),
        );
        await this.persistCurrentState();
    }

    async deleteCardSchedules(questionHash: string): Promise<void> {
        this.ensureState();
        delete this.scheduleState.cardSchedules[questionHash];
        await this.persistCurrentState();
    }

    clearState(): void {
        this.scheduleState = {
            version: 1,
            noteSchedules: {},
            cardSchedules: {},
        };
    }

    async clearStateAndPersist(): Promise<void> {
        this.clearState();
        await this.persistCurrentState();
    }

    async renameFile(oldPath: string, newPath: string): Promise<void> {
        this.ensureState();

        const noteEntry = this.scheduleState.noteSchedules[oldPath];
        if (noteEntry !== undefined) {
            this.scheduleState.noteSchedules[newPath] = noteEntry;
            delete this.scheduleState.noteSchedules[oldPath];
            await this.persistCurrentState();
        }
    }
}
