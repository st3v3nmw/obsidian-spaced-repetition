import { SecretStorage } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { IGamificationScorer } from "src/gamification/base/igamification-scorer";
import { SRSettings } from "src/settings";

export class HabiticaScorer implements IGamificationScorer {
    private secretStorage: SecretStorage;
    private settings: SRSettings;
    private taskMapping: Record<ReviewResponse, keyof SRSettings | null>;
    constructor(secretStorage: SecretStorage, settings: SRSettings) {
        this.secretStorage = secretStorage;
        this.settings = settings;
        this.taskMapping = {
            [ReviewResponse.Easy]: "flashcardEasyTaskId",
            [ReviewResponse.Good]: "flashcardGoodTaskId",
            [ReviewResponse.Hard]: "flashcardHardTaskId",
            [ReviewResponse.Reset]: null, // No task for reset response
        };
    }

    async score(response: ReviewResponse): Promise<void> {
        if (!this.settings.enableHabiticaIntegration) {
            // console.warn("HabiticaScorer: Integration disabled, skipping API call");
            return;
        }

        const userId = this.secretStorage.getSecret(this.settings.habiticaUserId);
        const apiToken = this.secretStorage.getSecret(this.settings.habiticaApiToken);

        if (!userId || !apiToken) {
            console.warn("HabiticaScorer: Missing Habitica credentials");
            return;
        }

        const taskSettingKey = this.taskMapping[response];
        if (!taskSettingKey) {
            console.warn("HabiticaScorer: No task mapped for reset response, skipping API call");
            return;
        }
        const taskId = this.settings[taskSettingKey];
        if (!taskId || typeof taskId !== "string") {
            console.warn("HabiticaScorer: No points for Reset response");
            return;
        }

        const url = `https://habitica.com/api/v3/tasks/${encodeURIComponent(taskId)}/score/up`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-user": userId,
                    "x-api-key": apiToken,
                    "x-client": `${userId}-obsidian-spaced-repetition`,
                },
            });

            const body = await response.json();

            if (!response.ok || body.success === false) {
                const message = body?.message || `HTTP ${response.status}`;
                const error = body?.error ? ` (${body.error})` : "";
                console.error(`Habitica API error${error}: ${message}`);
                return;
            }

            const delta = body?.data?.delta;
            const hp = body?.data?.hp;
            const exp = body?.data?.exp;
            const gp = body?.data?.gp;

            console.log("Task scored successfully.");
            if (typeof delta === "number") console.log(`delta: ${delta}`);
            if (typeof hp === "number") console.log(`hp: ${hp}`);
            if (typeof exp === "number") console.log(`exp: ${exp}`);
            if (typeof gp === "number") console.log(`gp: ${gp}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error retrieving Habitica tasks: ${message}`);
        }
    }
}
