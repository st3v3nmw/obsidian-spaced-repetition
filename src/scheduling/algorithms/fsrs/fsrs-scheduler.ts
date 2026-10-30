import { dateChrono, defineScheduler, State } from "ts-fsrs";
import {
    schedulerDesiredRetentionMiddleware,
    schedulerLearningStepsMiddleware,
    schedulerMaximumIntervalMiddleware,
    schedulerMonotonicIntervalMiddleware,
    schedulerScheduledDaysMiddleware,
    schedulerStatsMiddleware,
} from "ts-fsrs/middlewares";
import { FSRS6Model } from "ts-fsrs/models/fsrs-6";

const schedulerMiddlewares = [
    schedulerDesiredRetentionMiddleware,
    schedulerStatsMiddleware,
    schedulerScheduledDaysMiddleware,
    schedulerLearningStepsMiddleware,
    schedulerMaximumIntervalMiddleware,
    schedulerMonotonicIntervalMiddleware,
] as const;

export const fsrs6SchedulerDefinition = defineScheduler({
    model: FSRS6Model,
    chrono: dateChrono,
}).use(...schedulerMiddlewares);

export const fsrs6Schema = fsrs6SchedulerDefinition.schema;

export const scheduleStatus = {
    [State.New]: "new",
    [State.Learning]: "learning",
    [State.Review]: "review",
    [State.Relearning]: "learning",
} as const;

export type Fsrs6Scheduler = ReturnType<typeof fsrs6SchedulerDefinition.create>;
export type Fsrs6Config = Parameters<typeof fsrs6SchedulerDefinition.create>[0]["config"];
export type Fsrs6Card = ReturnType<Fsrs6Scheduler["newCard"]>;
