import eslint from "@eslint/js";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
            unicorn: eslintPluginUnicorn,
        },
        rules: {
            "linebreak-style": 0,
            quotes: ["warn", "double", "avoid-escape"],
            semi: ["error", "always"],
            camelcase: ["error"],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "unicorn/filename-case": [
                "error",
                {
                    case: "kebabCase",
                },
            ],
            "simple-import-sort/imports": [
                "error",
                {
                    groups: [["^"], ["^src"], ["^\\.", "^tests"]],
                },
            ],
        },
    },
    {
        files: ["src/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["./", "../"],
                            message: "Relative imports are not allowed in src/.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["tests/**"],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
);
