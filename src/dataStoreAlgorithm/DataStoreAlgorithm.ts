import { IDataStoreAlgorithm } from "./IDataStoreAlgorithm";

export class DataStoreAlgorithm {
    static instance: IDataStoreAlgorithm;

    public static getInstance(): IDataStoreAlgorithm {
        if (!DataStoreAlgorithm.instance) {
            throw Error("there is no DataStoreAlgorithm instance.");
        }
        return DataStoreAlgorithm.instance;
    }
}
