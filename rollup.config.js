import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

import config from "./config";

export default {
    input: "src/main.ts",
    output: {
        dir: "./build/",
        sourcemap: "inline",
        format: "cjs",
        exports: "default",
    },
    external: ["obsidian"],
    plugins: [
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
        copy({
            targets: [
                {
                    src: ["manifest.json", "styles.css", "./build/main.js"],
                    dest: config["vault-path"],
                },
                // {
                //     src: "styles.css",
                //     dest: config['vault-path'],
                // },
                // {
                //     src: "main.js",
                //     dest: config['vault-path'],
                // },
            ],
        }),
    ],
};
