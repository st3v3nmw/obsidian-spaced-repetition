const RANDOM_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Generates a random id of the given length from the characters [0-9a-z] (~5.2 bits of entropy per character).
 *
 * @param {number} length - The number of characters.
 * @returns {string} - The id, e.g. "k2n8x0c4qz7m" for length 12.
 */
export function generateRandomId(length: number): string {
    if (!Number.isInteger(length) || length <= 0) {
        throw new Error(`generateRandomId: invalid length ${length}`);
    }

    const alphabetLength: number = RANDOM_ID_ALPHABET.length;
    // Rejection sampling keeps every character equally likely (256 isn't a multiple of 36)
    const maxUnbiasedByte: number = 256 - (256 % alphabetLength);

    let result: string = "";
    while (result.length < length) {
        const bytes: Uint8Array = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        for (const byte of bytes) {
            if (byte >= maxUnbiasedByte) continue;
            result += RANDOM_ID_ALPHABET[byte % alphabetLength];
            if (result.length === length) break;
        }
    }
    return result;
}
