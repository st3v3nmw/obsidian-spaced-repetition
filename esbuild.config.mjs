import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import postCssPlugin from "esbuild-plugin-postcss2";
import { writeFile } from "fs/promises";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron", ...builtins],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: "inline",
    sourcesContent: !prod,
    treeShaking: true,
    outfile: "build/main.js",
});

if (prod) {
    context.rebuild().catch(() => process.exit(1));
    context.dispose();
} else {
    context.watch().catch(() => process.exit(1));
}

// Separate processing for CSS output
const cssContext = await esbuild.context({
    entryPoints: ["src/ui/styles.css"],
    bundle: true,
    outfile: "styles.css",
    plugins: [postCssPlugin.default()],
});

if (prod) {
    cssContext.rebuild().catch(() => process.exit(1));
    cssContext.dispose();
} else {
    cssContext.watch().catch(() => process.exit(1));
}
