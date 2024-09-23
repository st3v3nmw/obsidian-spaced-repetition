import { ISrsAlgorithm } from "src/algorithms/base/isrs-algorithm";

export class SrsAlgorithm {
    static instance: ISrsAlgorithm;

    public static getInstance(): ISrsAlgorithm {
        if (!SrsAlgorithm.instance) {
            throw new Error("there is no SrsAlgorithm instance.");
        }
        return SrsAlgorithm.instance;
    }
}
