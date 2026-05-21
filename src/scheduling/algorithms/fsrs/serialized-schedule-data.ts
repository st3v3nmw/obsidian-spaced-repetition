import { State } from "ts-fsrs";

export interface ISerializedFSRSScheduleData {
    dueDate: string;
    interval: number;
    stability: number;
    difficulty: number;
    state: State;
    reps: number;
    lapses: number;
    learningSteps: number;
    lastReview: string;
}
