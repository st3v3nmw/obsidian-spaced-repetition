import console from "console";
import esbuild from "esbuild";
import fs from "fs";
import { builtinModules } from "node:module";
import path from "path";
import prettier from "prettier";
import process from "process";

const prod = process.argv[2] === "production";

// The published plugin expects CSS at the repository root, not under build/.
// We also normalize the generated stylesheet through Prettier so CI does not
// fail on formatting differences introduced by the bundler output.
const moveToRootPlugin = {
    name: "move-to-root",
    setup(build) {
        build.onEnd(async (_) => {
            const cssFile = path.join("build", "main.css");
            const targetFile = "styles.css";

            if (fs.existsSync(cssFile)) {
                let contents = fs.readFileSync(cssFile, "utf8");
                // Remove source map comment
                contents = contents.replace(/\/\*#\s*sourceMappingURL=.*?\*\/\s*$/s, "");
                contents = await prettier.format(contents, { filepath: targetFile });
                fs.writeFileSync(targetFile, contents);
                fs.rmSync(cssFile);

                console.log(`✓ CSS bundled to ${targetFile}`);
            }
        });
    },
};

const context = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron", ...builtinModules],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: "inline",
    sourcesContent: !prod,
    treeShaking: true,
    outfile: "build/main.js",
    loader: {
        ".css": "css",
    },
    plugins: [moveToRootPlugin],
});

if (prod) {
    try {
        // Production mode must await rebuild/dispose so async post-processing of
        // styles.css has finished before the process exits.
        await context.rebuild();
    } catch {
        process.exit(1);
    } finally {
        await context.dispose();
    }
} else {
    context.watch().catch(() => process.exit(1));
}
