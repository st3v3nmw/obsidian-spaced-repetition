import { TFile, Vault } from "obsidian";

import { StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";

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
