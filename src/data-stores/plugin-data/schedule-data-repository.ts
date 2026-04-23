import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { PluginData, SerializedScheduleInfo } from "src/plugin-data";
import { DateUtil, formatDateYYYYMMDD } from "src/utils/dates";

export class ScheduleDataRepository {
    private pluginData: PluginData;
    private persist: () => Promise<void>;

    constructor(pluginData: PluginData, persist: () => Promise<void>) {
        this.pluginData = pluginData;
        this.persist = persist;
        this.ensureState();
    }

    private ensureState(): void {
        if (!this.pluginData.scheduleState) {
            this.pluginData.scheduleState = {
                version: 1,
                noteSchedules: {},
                cardSchedules: {},
            };
        }

        if (!this.pluginData.scheduleState.noteSchedules) {
            this.pluginData.scheduleState.noteSchedules = {};
        }

        if (!this.pluginData.scheduleState.cardSchedules) {
            this.pluginData.scheduleState.cardSchedules = {};
        }

        // Migrate keys from the old "notePath::questionHash" format to just "questionHash".
        // Only runs when legacy keys are present.
        this.migrateCardScheduleKeys();
    }

    private migrateCardScheduleKeys(): void {
        const legacyKeys = Object.keys(this.pluginData.scheduleState.cardSchedules).filter((k) =>
            k.includes("::"),
        );
        if (legacyKeys.length === 0) return;

        for (const key of legacyKeys) {
            const hash = key.slice(key.lastIndexOf("::") + 2);
            if (!(hash in this.pluginData.scheduleState.cardSchedules)) {
                this.pluginData.scheduleState.cardSchedules[hash] =
                    this.pluginData.scheduleState.cardSchedules[key];
            }
            delete this.pluginData.scheduleState.cardSchedules[key];
        }
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
        return this.pluginData.scheduleState.noteSchedules[notePath] !== undefined;
    }

    getNoteSchedule(notePath: string): RepItemScheduleInfo | null {
        this.ensureState();
        return ScheduleDataRepository.toSchedule(
            this.pluginData.scheduleState.noteSchedules[notePath],
        );
    }

    async setNoteSchedule(notePath: string, info: RepItemScheduleInfo): Promise<void> {
        this.ensureState();
        this.pluginData.scheduleState.noteSchedules[notePath] =
            ScheduleDataRepository.fromSchedule(info);
        await this.persist();
    }

    async deleteNoteSchedule(notePath: string): Promise<void> {
        this.ensureState();
        delete this.pluginData.scheduleState.noteSchedules[notePath];
        await this.persist();
    }

    hasCardSchedules(questionHash: string): boolean {
        this.ensureState();
        return this.pluginData.scheduleState.cardSchedules[questionHash] !== undefined;
    }

    getCardSchedules(questionHash: string): (RepItemScheduleInfo | null)[] {
        this.ensureState();
        const serialized = this.pluginData.scheduleState.cardSchedules[questionHash] || [];
        return serialized.map((item) => ScheduleDataRepository.toSchedule(item));
    }

    async setCardSchedules(
        questionHash: string,
        schedules: (RepItemScheduleInfo | null)[],
    ): Promise<void> {
        this.ensureState();
        this.pluginData.scheduleState.cardSchedules[questionHash] = schedules.map((item) =>
            ScheduleDataRepository.fromSchedule(item),
        );
        await this.persist();
    }

    async deleteCardSchedules(questionHash: string): Promise<void> {
        this.ensureState();
        delete this.pluginData.scheduleState.cardSchedules[questionHash];
        await this.persist();
    }

    async renameFile(oldPath: string, newPath: string): Promise<void> {
        this.ensureState();

        const noteEntry = this.pluginData.scheduleState.noteSchedules[oldPath];
        if (noteEntry !== undefined) {
            this.pluginData.scheduleState.noteSchedules[newPath] = noteEntry;
            delete this.pluginData.scheduleState.noteSchedules[oldPath];
            await this.persist();
        }
    }
}
