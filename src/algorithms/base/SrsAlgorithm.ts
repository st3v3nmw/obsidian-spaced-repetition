import { ISrsAlgorithm } from "./ISrsAlgorithm";

export class SrsAlgorithm {
    static instance: ISrsAlgorithm;

    public static getInstance(): ISrsAlgorithm {
        if (!SrsAlgorithm.instance) {
            throw Error("there is no SrsAlgorithm instance.");
        }
        return SrsAlgorithm.instance;
    }
}
