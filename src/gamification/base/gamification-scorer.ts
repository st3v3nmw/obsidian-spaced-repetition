import { IGamificationScorer } from "src/gamification/base/igamification-scorer";

export class GamificationScorer {
    static instance: IGamificationScorer;

    public static getInstance(): IGamificationScorer {
        if (!GamificationScorer.instance) {
            throw new Error("there is no GamificationScorer instance.");
        }
        return GamificationScorer.instance;
    }
}
