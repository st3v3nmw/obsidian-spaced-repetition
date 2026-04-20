import builtins from "builtin-modules";
import console from "console";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import process from "process";

const prod = process.argv[2] === "production";

const moveToRootPlugin = {
    name: "move-to-root",
    setup(build) {
        build.onEnd((_) => {
            const cssFile = path.join("build", "main.css");
            const targetFile = "styles.css";

            if (fs.existsSync(cssFile)) {
                let contents = fs.readFileSync(cssFile, "utf8");
                // Remove source map comment
                contents = contents.replace(/\/\*#\s*sourceMappingURL=.*?\*\/\s*$/s, "");
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
    external: ["obsidian", "electron", ...builtins],
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
    context.rebuild().catch(() => process.exit(1));
    context.dispose();
} else {
    context.watch().catch(() => process.exit(1));
}
