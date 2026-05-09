import { IDataStoreAlgorithm } from "src/data/data-store-algorithm/base/idata-store-algorithm";

/**
 * DataStoreAlgorithm is a singleton that provides the algorithm for how scheduling data is stored and read.
 * It is used by DataStore to read and write scheduling data, and by NoteFileLoader to read scheduling data when loading notes.
 * The specific implementation of the algorithm is determined by the DataStoreAlgorithm instance that is set at runtime.
 */
export class DataStoreAlgorithm {
    static instance: IDataStoreAlgorithm;

    public static getInstance(): IDataStoreAlgorithm {
        if (!DataStoreAlgorithm.instance) {
            throw new Error("there is no DataStoreAlgorithm instance.");
        }
        return DataStoreAlgorithm.instance;
    }
}
