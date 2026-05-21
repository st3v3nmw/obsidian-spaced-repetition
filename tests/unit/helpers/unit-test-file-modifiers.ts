import { TFile, Vault } from "obsidian";

import { StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { IFolderDataFileModifier } from "src/data/data-store/folder-data-store/folder-data-file-modifier";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";

export class UnitTestFileModifier implements IFileModifier {
    migrateDataStore(_: StorageType): Promise<void> {
        throw new Error("Method not implemented.");
    }
    removeSchedulingInfoInNotes(_: Vault, __: TFile, ___: boolean, ____: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeTagsFromFile(_: Vault, __: TFile, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeTagsFromFrontmatter(_: Vault, __: TFile, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeSchedulingInfoInCards(_: Vault, __: TFile, ___: boolean, ____: string[]): Promise<void> {
        return Promise.resolve();
    }

    deleteAllSchedulingData(_: boolean, __: string[], ___: string[]): Promise<void> {
        return Promise.resolve();
    }

    deleteAllSchedulingDataInCards(_: boolean, __: string[]): Promise<void> {
        return Promise.resolve();
    }

    async deleteAllSchedulingDataInNotes(_: boolean, __: string[]): Promise<void> {
        return Promise.resolve();
    }

    deleteAllSchedulingDataOfCardsInNote(_: TFile, __: boolean, ___: string[]): Promise<void> {
        return Promise.resolve();
    }

    deleteNoteSchedulingDataInNote(_: TFile, __: boolean, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
}

export class UnitTestFolderDataFileModifier implements IFolderDataFileModifier {
    updateNoteSchedule(_: string, __: RepItemScheduleInfo): Promise<void> {
        return Promise.resolve();
    }
    deleteNoteSchedule(_: string): Promise<void> {
        return Promise.resolve();
    }
    readNoteSchedule(_: string): Promise<RepItemScheduleInfo | null> {
        return Promise.resolve(null);
    }
    updateCardSchedule(_: string, __: RepItemScheduleInfo[]): Promise<void> {
        return Promise.resolve();
    }
    deleteCardSchedule(_: string): Promise<void> {
        return Promise.resolve();
    }
    readCardSchedule(_: string): Promise<RepItemScheduleInfo[] | null> {
        return Promise.resolve(null);
    }
    ensureFolderStructure(): Promise<boolean> {
        return Promise.resolve(true);
    }
    migrateDataStore(_: StorageType): Promise<void> {
        return Promise.resolve();
    }
    removeSchedulingInfoInNotes(_: Vault, __: TFile, ___: boolean, ____: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeTagsFromFile(_: Vault, __: TFile, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeTagsFromFrontmatter(_: Vault, __: TFile, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
    removeSchedulingInfoInCards(_: Vault, __: TFile, ___: boolean, ____: string[]): Promise<void> {
        return Promise.resolve();
    }
    deleteAllSchedulingData(_: boolean, __: string[], ___: string[]): Promise<void> {
        return Promise.resolve();
    }
    deleteAllSchedulingDataInNotes(_: boolean, __: string[]): Promise<void> {
        return Promise.resolve();
    }
    deleteAllSchedulingDataInCards(_: boolean, __: string[]): Promise<void> {
        return Promise.resolve();
    }
    async deleteAllSchedulingDataOfCardsInNote(
        _: TFile,
        __: boolean,
        ___: string[],
    ): Promise<void> {
        return Promise.resolve();
    }
    deleteNoteSchedulingDataInNote(_: TFile, __: boolean, ___: string[]): Promise<void> {
        return Promise.resolve();
    }
}
