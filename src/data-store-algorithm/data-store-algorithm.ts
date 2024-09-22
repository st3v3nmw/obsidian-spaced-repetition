import { IDataStoreAlgorithm } from "src/data-store-algorithm/idata-store-algorithm";

export class DataStoreAlgorithm {
    static instance: IDataStoreAlgorithm;

    public static getInstance(): IDataStoreAlgorithm {
        if (!DataStoreAlgorithm.instance) {
            throw new Error("there is no DataStoreAlgorithm instance.");
        }
        return DataStoreAlgorithm.instance;
    }
}
