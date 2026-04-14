import { QuestionTypeClozeInputFormatter } from "src/card/questions/question-type";

describe("Questions Type", () => {
    test("Cloze input formatting", () => {
        const formatter = new QuestionTypeClozeInputFormatter();

        expect(formatter.asking("Berlin", "City in germany")).toBe(
            '<span style=\'color:#2196f3\'><input class="cloze-input" type="text" size="6" />[City in germany]</span>',
        );

        expect(formatter.asking()).toBe(
            '<span style=\'color:#2196f3\'><input class="cloze-input" type="text" size="1" /></span>',
        );

        expect(formatter.showingAnswer("Berlin", "City in germany")).toBe(
            "<span class=\"cloze-answer\" style='color:#2196f3'>Berlin</span>",
        );

        expect(formatter.hiding("Berlin", "City in germany")).toBe(
            "<span style='color:var(--code-comment)'>[City in germany]</span>",
        );

        expect(formatter.hiding("Berlin", undefined)).toBe(
            "<span style='color:var(--code-comment)'>[...]</span>",
        );
    });
});
