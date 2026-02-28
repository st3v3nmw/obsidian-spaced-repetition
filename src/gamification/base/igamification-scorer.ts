import { ReviewResponse } from "src/algorithms/base/repetition-item";

export interface IGamificationScorer {
    score(response: ReviewResponse): Promise<void>;
}
