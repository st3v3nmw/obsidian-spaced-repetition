import { DataStore } from "src/data/data-store/base/data-store";
import { Card } from "src/data/data-structures/card/card";
import { generateCardId } from "src/data/data-structures/card/card-id";

/**
 * Returns the card's id. A card without an id gets a new one, which is written to the card's scheduling comment
 * right away, so that every id that shows up in the usage history can be found in the vault.
 *
 * @param {Card} card - The card.
 * @returns {Promise<string>} - The card's id.
 */
export async function ensureCardId(card: Card): Promise<string> {
    if (card.id !== null) return card.id;

    await assertQuestionTextUnchangedInNote(card);
    card.id = generateCardId();
    await DataStore.getInstance().writeSchedule(card.question);
    return card.id;
}

/**
 * Throws if the card's question text (as loaded) can't be found in its note anymore. Writing the question would
 * silently do nothing in that case.
 *
 * @param {Card} card - The card.
 */
export async function assertQuestionTextUnchangedInNote(card: Card): Promise<void> {
    const question = card.question;
    const noteText: string = await question.note.file.read();
    if (!noteText.includes(question.questionText.original)) {
        throw new Error(
            `The text of a card in "${question.note.filePath}" changed in the note since it was loaded. Reopen the review to reload it.`,
        );
    }
}
