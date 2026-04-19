import { Question } from "src/card/questions/question";
import { Note } from "src/note/note";

export default class ContextSectionComponent {
    private contextSection: HTMLDivElement;

    constructor(parentEl: HTMLDivElement) {
        this.contextSection = parentEl.createDiv();
        this.contextSection.addClass("sr-context");
    }

    public updateCardContext(
        showContextInCards: boolean,
        currentQuestion: Question,
        currentNote: Note,
    ) {
        if (!showContextInCards) {
            this.contextSection.setText("");
            this.contextSection.addClass("sr-is-hidden");
            return;
        }

        if (this.contextSection.hasClass("sr-is-hidden")) {
            this.contextSection.removeClass("sr-is-hidden");
        }

        this.contextSection.setText(
            ` ${this._formatQuestionContextText(currentQuestion.questionContext, currentNote)}`,
        );
    }

    private _formatQuestionContextText(questionContext: string[], currentNote: Note): string {
        const separator: string = " > ";
        let result = currentNote.file.basename;
        questionContext.forEach((context) => {
            // Check for links trim [[ ]]
            if (context.startsWith("[[") && context.endsWith("]]")) {
                context = context.replace("[[", "").replace("]]", "");
                // Use replacement text if any
                if (context.contains("|")) {
                    context = context.split("|")[1];
                }
            }
            result += separator + context;
        });
        return result;
    }
}
