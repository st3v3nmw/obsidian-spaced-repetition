import { SecretStorage } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { HabiticaScorer } from "src/gamification/habitica/habitica-scorer";
import { SRSettings } from "src/settings";

describe("HabiticaScorer", () => {
    let scorer: HabiticaScorer;
    let mockSecretStorage: SecretStorage;
    let mockSettings: Partial<SRSettings>;

    beforeEach(() => {
        mockSecretStorage = {
            getSecret: jest.fn(),
            setSecret: jest.fn(),
            listSecrets: jest.fn().mockResolvedValue([]),
            getLastAccess: jest.fn().mockResolvedValue(null),
        };

        mockSettings = {
            enableHabiticaIntegration: true,
            habiticaUserId: "userId",
            habiticaApiToken: "apiToken",
            flashcardEasyTaskId: "id-task-easy",
            flashcardGoodTaskId: "id-task-good",
            flashcardHardTaskId: "id-task-hard",
        };

        scorer = new HabiticaScorer(mockSecretStorage as SecretStorage, mockSettings as SRSettings);
    });

    it("should not throw when scoring successfully", async () => {
        (mockSecretStorage?.getSecret as jest.Mock)
            .mockReturnValueOnce("user123")
            .mockReturnValueOnce("token123");

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: { delta: 10, hp: 50, exp: 100, gp: 200 },
            }),
        });

        await expect(scorer.score(ReviewResponse.Good)).resolves.not.toThrow();
    });

    it("should not throw when integration is disabled", async () => {
        mockSettings.enableHabiticaIntegration = false;
        scorer = new HabiticaScorer(mockSecretStorage as SecretStorage, mockSettings as SRSettings);

        await expect(scorer.score(ReviewResponse.Good)).resolves.not.toThrow();
    });

    it("should not throw when credentials are missing", async () => {
        (mockSecretStorage?.getSecret as jest.Mock)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null);

        await expect(scorer.score(ReviewResponse.Good)).resolves.not.toThrow();
    });

    it("should not throw when API returns error", async () => {
        (mockSecretStorage?.getSecret as jest.Mock)
            .mockReturnValueOnce("user123")
            .mockReturnValueOnce("token123");

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ success: false, message: "Bad request" }),
        });

        await expect(scorer.score(ReviewResponse.Good)).resolves.not.toThrow();
    });

    it("should not throw when fetch throws an error", async () => {
        (mockSecretStorage?.getSecret as jest.Mock)
            .mockReturnValueOnce("user123")
            .mockReturnValueOnce("token123");

        global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

        await expect(scorer.score(ReviewResponse.Good)).resolves.not.toThrow();
    });
});
