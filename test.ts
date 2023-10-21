/*
Source / Inspiration: https://github.com/ankitects/anki/blob/80d807e08a6d3148f973829c48fe633a760546c5/rslib/src/cloze.rs

The "BNF" for this.

<number>       ::= [0-9]+
<seperator>    ::= ::
<c_open>       ::= {{c<number>
<c_close>      ::= }}
<text>         ::= .*
<text_or_card> ::= <text> | <card>
<card_inner>   ::= <text> | <card> | <text_or_card>?<seperator><text_or_card>?
<card>         ::= <text>?<c_open><seperator><card_inner><seperator><c_close><text>?
*/

// The types of tokens.
enum TokenKind {
    Open = "C_OPEN",
    Close = "C_CLOSE",
    Seperator = "SEPERATOR",
    Text = "TEXT",
}

interface OpenToken {
    kind: TokenKind.Open;
    ordinal: number;
    i: number;
}
interface CloseToken {
    kind: TokenKind.Close;
    i: number;
}
interface SeperatorToken {
    kind: TokenKind.Seperator;
    i: number;
}
interface TextToken {
    kind: TokenKind.Text;
    text: string;
    i: number;
}

type Token = OpenToken | CloseToken | SeperatorToken | TextToken;

// Returns the "Anki tokens" of a given text, given an anchor.
// This does not return the TEXT token.
function anki_tokens(
    input: string,
    i: number,
): OpenToken | CloseToken | SeperatorToken | undefined {
    // The following statements are sorted high -> low `i`.
    // Avoids any similar statements being mixed with each other.

    // C_OPEN
    if (input.slice(i, i + 3) === "{{c") {
        i += 3;

        // Extract the number
        let num = "";
        while (input[i] !== ":") {
            num += input[i];
            i++;
        }

        // Attempt to parse the number
        let number = parseInt(num);
        if (isNaN(number)) return;

        // Return the object
        return {
            kind: TokenKind.Open,
            ordinal: number,
            i,
        } satisfies OpenToken;
    }
    // SEPERATOR
    else if (input.slice(i, i + 2) === "::") {
        return {
            kind: TokenKind.Seperator,
            i: i + 2,
        } satisfies SeperatorToken;
    }
    // C_CLOSE
    else if (input.slice(i, i + 2) === "}}") {
        return {
            kind: TokenKind.Close,
            i: i + 2,
        } satisfies CloseToken;
    }
}

// Fully gets the "Anki tokens" of a given text.
// This does return the TEXT token.
// NOTE: This function does not error and does not check for invalid syntax
function text_anki_tokens(input: string): Token[] {
    // Vars
    const tokens: Token[] = [];
    let i = 0;
    let buf_start;

    // Loop through the input
    while (i < input.length) {
        // Grab the token at position `i`
        const token = anki_tokens(input, i);
        if (!token) {
            // No token found, wait until the next token...
            if (buf_start === undefined) buf_start = i;
            i++;
            continue;
        }

        // Assume any "in between text" is TEXT
        if (buf_start !== undefined) {
            tokens.push({
                kind: TokenKind.Text,
                text: input.slice(buf_start, i),
                i,
            });

            // Reset for next
            buf_start = undefined;
        }

        // Add the token
        tokens.push(token);
        i = token.i;
    }

    // We still have some text left over
    if (buf_start !== undefined) {
        tokens.push({
            kind: TokenKind.Text,
            text: input.slice(buf_start),
            i: buf_start,
        });
    }

    // Return the tokens
    return tokens;
}

interface ExtractedCloze {
    kind: "cloze";
    ordinal: number;
    nodes: (TextToken | ExtractedCloze)[];
    hint?: string;
}

/// Parses the tokens into a tree of clozes and text.
function parse_anki_tokens(tokens: Token[]): (ExtractedCloze | string)[] {
    const open_clozes: ExtractedCloze[] = [];
    const output: (ExtractedCloze | string)[] = [];

    // Loop through the tokens
    for (let i = 0; i < tokens.length; i++) {
        // Make sure the token exists
        const token = tokens[i];
        if (!token) break;

        switch (token.kind) {
            // Open a cloze
            case TokenKind.Open:
                open_clozes.push({
                    kind: "cloze",
                    ordinal: token.ordinal,
                    nodes: [],
                });
                break;
            // Add text to the cloze
            case TokenKind.Text:
                const last_open_cloze = open_clozes[open_clozes.length - 1];

                if (!last_open_cloze) {
                    output.push(token.text);
                    break;
                }

                // Look ahead to see whether is a hint or not
                if (
                    tokens[i - 2].kind != TokenKind.Open &&
                    tokens[i - 1].kind == TokenKind.Seperator &&
                    tokens[i + 1].kind == TokenKind.Close
                ) {
                    last_open_cloze.hint = token.text;
                    break;
                }

                last_open_cloze.nodes.push(token);
                break;
            // Close a cloze
            case TokenKind.Close:
                const cloze = open_clozes.pop();
                if (!cloze) {
                    output.push("}}");
                    break;
                }
                const last_cloze = open_clozes[open_clozes.length - 1];

                if (last_cloze) {
                    last_cloze.nodes.push(cloze);
                } else {
                    output.push(cloze);
                }

                break;
            // Ignore
            case TokenKind.Seperator:
                break;
        }
    }

    return output;
}

// Reveal / hides a singular cloze ordinal
function reveal_cloze(
    cloze: ExtractedCloze,
    cloze_ord: number,
    show_question: boolean,
    data: { buf: string },
) {
    // We want to hide the cloze
    if (cloze.ordinal === cloze_ord && show_question) {
        data.buf += `[${cloze.hint || "..."}]`;
        return;
    }

    // Show all of the text inside the nodes
    for (const node of cloze.nodes) {
        if (node.kind == TokenKind.Text) {
            data.buf += node.text;
        } else if (node.kind === "cloze") {
            reveal_cloze(node, cloze_ord, show_question, data);
        }
    }
}

// Reveal / hides all cloze ordinals
function reveal_cloze_text(
    tokens: (ExtractedCloze | string)[],
    cloze_ord: number,
    question: boolean,
): string {
    let data = { buf: "" };

    for (const node of tokens) {
        if (typeof node === "string") {
            data.buf += node;
        } else {
            reveal_cloze(node, cloze_ord, question, data);
        }
    }

    return data.buf;
}

// Recursively loops to find all of the ordinals
function get_ordinals(tokens: (ExtractedCloze | string)[], ordinals: Set<number>) {
    for (const token of tokens) {
        if (typeof token === "string") continue;
        ordinals.add(token.ordinal);
        get_ordinals(token.nodes.filter((x) => x.kind == "cloze") as ExtractedCloze[], ordinals);
    }
}

interface Card {
    front: string;
    back: string;
}

// This can probably be done better.
function tokens_to_cards(tokens: (ExtractedCloze | string)[]): Card[] {
    // Grab each ordinal
    const ordinals = new Set<number>();
    get_ordinals(tokens, ordinals);

    // Create the cards
    const cards: Card[] = [];
    for (const ordinal of ordinals) {
        cards.push({
            front: reveal_cloze_text(tokens, ordinal, true),
            back: reveal_cloze_text(tokens, ordinal, false),
        });
    }

    return cards;
}

// Converts text to cards
const regex = /((?:.+\n)*(?:.*\{\{[^\{\}]*::[^\{\}]*\}\}.*)(?:\n(?:^.{1,3}$|^.{4}(?<!<!--).*))*)/gm;
function text_to_cards(text: string): { match: string; cards: Card[] }[] {
    const matches: { match: string; cards: Card[] }[] = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const match_str = match[0];
        const cards = tokens_to_cards(parse_anki_tokens(text_anki_tokens(match_str)));
        matches.push({ match: match_str, cards });
    }

    return matches;
}

// Testing
console.log(
    text_to_cards(
        "foo\n\nhello\nstuff {{c1::Canberra was {{c2::founded}} {{c2::hello}}::hint}} in 1913",
    ),
);
