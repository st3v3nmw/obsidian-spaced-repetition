import { expect, test } from "@jest/globals";

import { CardType, Question } from "src/data/data-structures/card/questions/question";
import { Note } from "src/note/note";
import ContextSectionComponent from "src/ui/obsidian-ui-components/content-container/card-container/context-section/context-section";

jest.mock(
    "src/ui/obsidian-ui-components/content-container/card-container/context-section/context-section.css",
    () => ({}),
);

function createContextSection() {
    const parent = document.createElement("div");
    const header = parent.appendChild(document.createElement("div"));
    Object.assign(parent, { createDiv: () => header });
    Object.assign(header, {
        addClass: (name: string) => header.classList.add(name),
        hasClass: (name: string) => header.classList.contains(name),
        removeClass: (name: string) => header.classList.remove(name),
        setText: (text: string) => (header.textContent = text),
    });
    return { header, section: new ContextSectionComponent(parent) };
}

const patterns = ["{{[123;;]answer[;;hint]}}", "==[123;;]answer[;;hint]=="];
const note = { file: { basename: "Botany" } } as Note;

function makeQuestion(heading: string, questionType: CardType): Question {
    return { questionContext: ["Basics", heading], questionType } as Question;
}

test.each<[string, string, string]>([
    ["double braces", "{{petals}}", "[...]"],
    ["double equals", "==petals==", "[...]"],
    ["mixed clozes", "{{1;;petals;;hint}} and ==leaves==", "[...] and [...]"],
])("masks %s only on the cloze front", (_, deletion, placeholder) => {
    const { header, section } = createContextSection();
    const question = makeQuestion(`Flower ${deletion}`, CardType.Cloze);

    section.updateCardContext(true, question, note, patterns, false);
    expect(header.textContent).toBe(` Botany > Basics > Flower ${placeholder}`);

    section.updateCardContext(true, question, note, patterns, true);
    expect(header.textContent).toBe(` Botany > Basics > Flower ${deletion}`);
});

test("preserves the heading on ordinary cards", () => {
    const { header, section } = createContextSection();
    const question = makeQuestion("Flower ==1;;petals;;hint==", CardType.SingleLineBasic);

    section.updateCardContext(true, question, note, patterns, false);
    expect(header.textContent).toBe(" Botany > Basics > Flower ==1;;petals;;hint==");
});
