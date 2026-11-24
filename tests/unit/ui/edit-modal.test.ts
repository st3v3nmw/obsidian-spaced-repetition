import { App } from "obsidian";

import { Question } from "src/data/data-structures/card/questions/question";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { FlashcardEditModal } from "src/ui/obsidian-ui-components/modals/edit-modal";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../helpers/unit-test-setup";
import { createTestNoteQuestionParser } from "../sample-items";

// Cards whose question or answer contains the "?" separator, tables, LaTeX and lists
const noteText: string = `#flashcards

When plugged in, bad chargers spark 80% of the time. What's the probability that a sparking charger is bad?
?
**Prior odds:** $\\text{bad} : \\text{good} = 3 : 97$
**Probability:** $\\frac{48}{48 + 97} \\approx 33\\%$
<!--SR:!2026-10-27,0,250-->

---

What is the sensitivity of a test?
?
The true positive rate: $P(\\text{positive} \\mid \\text{sick})$<br>
|          | Test positive | Test negative |
| -------- | ------------- | ------------- |
| **Sick** | **TP**        | **FN**        |
$$\\text{Sensitivity} = \\frac{TP}{TP + FN}$$

---

Set up and solve:
- The test is negative, what's the probability of being pregnant nevertheless?
?
1. Posterior: is it "pregnant"?
2. Prior: pregnant : not pregnant $= 30 : 70$.

---

Is $P(E \\mid H) = P(H \\mid E)$?::No, it's conditioned the other way round?

---

The odds form of Bayes' rule has these parts:
* ==prior odds==
* ==likelihood ratio==
`;

async function parseQuestions(): Promise<Question[]> {
    const parser = createTestNoteQuestionParser(DEFAULT_SETTINGS);
    return parser.createQuestionList(
        new UnitTestSRFile(noteText),
        TextDirection.Ltr,
        TopicPath.emptyPath,
        true,
    );
}

function openModal(question: Question): { modal: FlashcardEditModal; result: Promise<string> } {
    const modal = new FlashcardEditModal(
        {} as App,
        DEFAULT_SETTINGS,
        question.cards[0],
        question.questionText.actualQuestion,
        TextDirection.Ltr,
    );
    return { modal, result: modal.waitForClose };
}

function clickSave(modal: FlashcardEditModal): void {
    modal.contentEl.querySelector<HTMLButtonElement>(".sr-save-button").click();
}

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("FlashcardEditModal", () => {
    test("Splits front and back only at the card separator", async () => {
        const questions = await parseQuestions();
        const { modal } = openModal(questions[0]);

        expect(modal.textAreaFront.value).toEqual(
            "When plugged in, bad chargers spark 80% of the time. What's the probability that a sparking charger is bad?",
        );
        expect(modal.textAreaBack.value).toEqual(
            "**Prior odds:** $\\text{bad} : \\text{good} = 3 : 97$\n**Probability:** $\\frac{48}{48 + 97} \\approx 33\\%$",
        );
    });

    test("Saving without changes returns the original text for every card type", async () => {
        const questions = await parseQuestions();
        expect(questions.length).toEqual(5);

        for (const question of questions) {
            const { modal, result } = openModal(question);
            clickSave(modal);
            await expect(result).resolves.toEqual(question.questionText.actualQuestion);
        }
    });

    test("Saving an edited answer keeps question, tables and formulas intact", async () => {
        const questions = await parseQuestions();
        const { modal, result } = openModal(questions[1]);

        modal.textAreaBack.value = modal.textAreaBack.value.replace(
            "true positive",
            "TRUE POSITIVE",
        );
        clickSave(modal);

        await expect(result).resolves.toEqual(
            questions[1].questionText.actualQuestion.replace("true positive", "TRUE POSITIVE"),
        );
    });

    test("Cancel rejects without changes", async () => {
        const questions = await parseQuestions();
        const { modal, result } = openModal(questions[0]);

        modal.contentEl.querySelector<HTMLButtonElement>(".sr-cancel-button").click();
        await expect(result).rejects.toBeDefined();
    });
});
