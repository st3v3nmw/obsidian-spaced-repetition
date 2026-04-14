import { escapeHtml } from "src/escape-html";

describe("Escape", () => {
    test("Escape Letters", () => {
        expect(
            escapeHtml("The quick brown fox & the \"afraid\" rabbit jumps over the 'lazy' <dog>"),
        ).toBe(
            "The quick brown fox &amp; the &quot;afraid&quot; rabbit jumps over the &#039;lazy&#039; &lt;dog&gt;",
        );
    });
});
