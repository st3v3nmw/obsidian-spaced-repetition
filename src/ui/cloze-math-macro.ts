import { finishRenderMath, loadMathJax, renderMath } from "obsidian";

/**
 * Makes `\cloze[seq]{answer}{hint}` render in ordinary Obsidian preview (Reading view + Live
 * Preview), with both `[seq]` and `{hint}` optional.
 *
 * `\cloze` is not a real LaTeX command, so MathJax errors on `$\cloze{g(x)}{h}$` unless we teach
 * it. A plain TeX macro cannot have an optional *trailing* argument (`$\cloze{a} + b$` would take
 * the `+` as the hint), so `\cloze` is registered as a MathJax command that reads `[seq]` if
 * present, then `{answer}`, then `{hint}` only if a brace group follows, and expands to the
 * answer. Reading a note therefore shows the full formula; the flashcard review path (see
 * math-cloze.ts) renders the occluded/answer forms itself. Obsidian's MathJax keeps the
 * registration for the whole session.
 *
 * If MathJax's parser classes are not available, a plain macro is defined instead: then
 * `\cloze{answer}{hint}` and `\cloze[seq]{answer}{hint}` still render, but the hint is required.
 *
 * Caveat: a note that is already open when the plugin loads keeps its earlier (macro-less) render
 * until its view is rebuilt (switch to another note and back, or reopen it). Notes opened
 * afterwards are fine.
 */
export async function registerClozeMathMacro(): Promise<void> {
    await loadMathJax();
    try {
        if (registerClozeCommand((window as unknown as { MathJax?: MathJaxLike }).MathJax)) return;
    } catch (e) {
        console.warn("SR: failed to register the \\cloze MathJax command", e);
    }
    try {
        // Fallback: three arguments, the first optional ([seq], default empty); expands to the
        // answer (#2). MathJax (unlike LaTeX) lets \newcommand redefine a macro, so a plugin
        // reload does not error.
        renderMath("\\newcommand{\\cloze}[3][]{#2}", false);
        await finishRenderMath();
    } catch (e) {
        console.warn("SR: failed to register \\cloze MathJax macro", e);
    }
}

// The parts of MathJax 3's TeX parser that the command needs
interface TexParserLike {
    string: string;
    i: number;
    GetBrackets(name: string, def: string): string;
    GetArgument(name: string): string;
    GetNext(): string;
}
interface ParseUtilLike {
    addArgs(parser: TexParserLike, s1: string, s2: string): string;
}
type CommandMapClass = new (
    name: string,
    json: Record<string, string>,
    functionMap: Record<string, (parser: TexParserLike, name: string) => void>,
) => unknown;
interface TexInputJaxLike {
    name: string;
    parseOptions?: {
        handlers?: {
            add(handlers: { macro: string[] }, fallbacks: object, priority: number): void;
        };
    };
}
export interface MathJaxLike {
    _?: {
        input?: {
            tex?: {
                SymbolMap?: { CommandMap?: CommandMapClass };
                TokenMap?: { CommandMap?: CommandMapClass };
                ParseUtil?: { default?: ParseUtilLike; ParseUtil?: ParseUtilLike };
            };
        };
    };
    startup?: { [K in typeof MATHJAX_DOCUMENT]?: { inputJax?: TexInputJaxLike[] } };
}

// MathJax's own `startup.document`, not the browser document; a string key, so the lint rule
// against `document` identifiers does not mistake one for the other
const MATHJAX_DOCUMENT = "document";

const MAP_NAME = "sr-cloze";
// Ahead of every other macro map, including a \cloze macro left by an earlier plugin version
const PRIORITY = -100;

/**
 * Register `\cloze` as a command in a running MathJax 3 (or 4) TeX input.
 *
 * @param mathJax - The global MathJax object
 * @returns True if the command was registered, false if the needed parser classes are missing
 */
export function registerClozeCommand(mathJax: MathJaxLike | undefined): boolean {
    const tex = mathJax?._?.input?.tex;
    const CommandMap = tex?.SymbolMap?.CommandMap ?? tex?.TokenMap?.CommandMap;
    const parseUtil = tex?.ParseUtil?.default ?? tex?.ParseUtil?.ParseUtil;
    const handlers = mathJax?.startup?.[MATHJAX_DOCUMENT]?.inputJax?.find(
        (jax) => jax.name === "TeX",
    )?.parseOptions?.handlers;
    if (!CommandMap || !parseUtil || !handlers) return false;

    new CommandMap(
        MAP_NAME,
        { cloze: "Cloze" },
        {
            Cloze: (parser, name) => {
                parser.GetBrackets(name, ""); // optional [seq]
                const answer = parser.GetArgument(name);
                if (parser.GetNext() === "{") parser.GetArgument(name); // optional {hint}
                // Expand to the answer, as a macro whose body is the answer would
                parser.string = parseUtil.addArgs(parser, answer, parser.string.slice(parser.i));
                parser.i = 0;
            },
        },
    );
    handlers.add({ macro: [MAP_NAME] }, {}, PRIORITY);
    return true;
}
