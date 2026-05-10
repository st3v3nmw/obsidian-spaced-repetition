import { ISRAlgorithm } from "src/scheduling/algorithms/base/isr-algorithm";

/**
 * Represents a scheduling algorithm.
 *
 * @class SRAlgorithm
 * @property {ISRAlgorithm} instance - The instance of the scheduling algorithm.
 */
export class SRAlgorithm {
    static instance: ISRAlgorithm;

    public static getInstance(): ISRAlgorithm {
        if (!SRAlgorithm.instance) {
            throw new Error("there is no SrsAlgorithm instance.");
        }
        return SRAlgorithm.instance;
    }
}
