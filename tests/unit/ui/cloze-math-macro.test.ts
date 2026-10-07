import { MathJaxLike, registerClozeCommand } from "src/ui/cloze-math-macro";

// A minimal stand-in for MathJax 3's TeX parser, enough to run the registered command
class FakeParser {
    string: string;
    i: number;
    constructor(s: string, i: number) {
        this.string = s;
        this.i = i;
    }
    private skip() {
        while (/\s/.test(this.string[this.i] ?? "")) this.i++;
    }
    GetNext(): string {
        this.skip();
        return this.string[this.i] ?? "";
    }
    GetBrackets(_name: string, def: string): string {
        if (this.GetNext() !== "[") return def;
        const close = this.string.indexOf("]", this.i);
        const v = this.string.slice(this.i + 1, close);
        this.i = close + 1;
        return v;
    }
    GetArgument(_name: string): string {
        this.skip();
        let depth = 0;
        for (let j = this.i; j < this.string.length; j++) {
            if (this.string[j] === "{") depth++;
            else if (this.string[j] === "}" && --depth === 0) {
                const v = this.string.slice(this.i + 1, j);
                this.i = j + 1;
                return v;
            }
        }
        throw new Error("unclosed");
    }
}

function fakeMathJax() {
    const maps: Record<string, Record<string, (p: FakeParser, name: string) => void>> = {};
    const added: unknown[] = [];
    const CommandMap = function (
        name: string,
        json: Record<string, string>,
        fns: Record<string, (p: FakeParser, name: string) => void>,
    ) {
        maps[name] = Object.fromEntries(Object.entries(json).map(([cmd, fn]) => [cmd, fns[fn]]));
    };
    const mathJax = {
        _: {
            input: {
                tex: {
                    SymbolMap: { CommandMap },
                    ParseUtil: {
                        default: { addArgs: (_p: unknown, a: string, b: string) => a + b },
                    },
                },
            },
        },
        startup: {
            document: {
                inputJax: [
                    {
                        name: "TeX",
                        parseOptions: { handlers: { add: (...a: unknown[]) => added.push(a) } },
                    },
                ],
            },
        },
    } as unknown as MathJaxLike;
    // Expand `\cloze` at the start of `rest` the way MathJax would: run the command on it
    const expand = (rest: string) => {
        const p = new FakeParser(rest, "\\cloze".length);
        maps["sr-cloze"].cloze(p, "\\cloze");
        return p.string.slice(p.i);
    };
    return { mathJax, added, expand };
}

describe("registerClozeCommand", () => {
    test("registers the command ahead of other macro maps", () => {
        const { mathJax, added } = fakeMathJax();
        expect(registerClozeCommand(mathJax)).toBe(true);
        expect(added).toEqual([[{ macro: ["sr-cloze"] }, {}, -100]]);
    });

    test.each([
        ["\\cloze{a}{h} + b", "a + b"],
        ["\\cloze{a} + b", "a + b"],
        ["\\cloze[2]{a} + b", "a + b"],
        ["\\cloze[hsa]{a}{h}^2", "a^2"],
        ["\\cloze{a} {h}^2", "a^2"],
    ])("%s expands to %s", (input, expected) => {
        const { mathJax, expand } = fakeMathJax();
        registerClozeCommand(mathJax);
        // Spaces are insignificant in math mode (MathJax skips them when peeking for the hint)
        expect(expand(input).replace(/\s/g, "")).toBe(expected.replace(/\s/g, ""));
    });

    test("reports failure when MathJax's parser classes are missing", () => {
        expect(registerClozeCommand(undefined)).toBe(false);
        expect(registerClozeCommand({})).toBe(false);
        expect(registerClozeCommand({ _: { input: { tex: {} } } })).toBe(false);
    });
});
