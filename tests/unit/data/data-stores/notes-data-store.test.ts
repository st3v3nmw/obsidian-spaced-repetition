import { StorageType } from "src/data/data-store/base/data-store";
import { IFileModifier } from "src/data/data-store/base/file-modifier";
import { NotesDataStore } from "src/data/data-store/notes-data-store/notes-data-store";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";

describe("migrateDataStore", () => {
    test("delegates to the file modifier with the previous storage type", async () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        const migrateDataStore = jest.fn().mockResolvedValue(undefined);
        const fileModifier = { migrateDataStore } as unknown as IFileModifier;
        const store = new NotesDataStore(settings, fileModifier);

        await store.migrateDataStore(StorageType.SR_MD);

        expect(migrateDataStore).toHaveBeenCalledWith(StorageType.SR_MD);
    });
});
