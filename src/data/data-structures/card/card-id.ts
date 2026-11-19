import { generateRandomId } from "src/utils/random-id";

// 12 characters of [0-9a-z] are ~62 bits of entropy, so collisions are practically impossible
const GENERATED_CARD_ID_LENGTH = 12;

// Ids are written by the plugin, but can also be edited by hand, so parsing accepts a slightly wider character set
// than the generator produces. The set must never contain "," "!" or "-->", as those delimit the SR comment.
const VALID_CARD_ID_REGEX = /^[A-Za-z0-9_]{1,64}$/;

export function isValidCardId(id: string): boolean {
    return VALID_CARD_ID_REGEX.test(id);
}

/**
 * Generates a new random card id, e.g. "k2n8x0c4qz7m".
 */
export function generateCardId(): string {
    return generateRandomId(GENERATED_CARD_ID_LENGTH);
}
