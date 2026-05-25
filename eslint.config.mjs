import eslint from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    // TODO: Remove the conversion to warnings once we have a proper code base
    {
        rules: {
            "no-var": "error",
            "prefer-const": "error",
            "prefer-rest-params": "warn",
            "prefer-spread": "warn",
            "@typescript-eslint/await-thenable": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-array-constructor": "warn",
            "@typescript-eslint/no-array-delete": "warn",
            "@typescript-eslint/no-base-to-string": "warn",
            "@typescript-eslint/no-duplicate-enum-values": "warn",
            "@typescript-eslint/no-duplicate-type-constituents": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-extra-non-null-assertion": "warn",
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-for-in-array": "warn",
            "no-implied-eval": "error",
            "@typescript-eslint/no-implied-eval": "warn",
            "@typescript-eslint/no-misused-new": "warn",
            "@typescript-eslint/no-misused-promises": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
            "@typescript-eslint/no-redundant-type-constituents": "warn",
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/no-this-alias": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "@typescript-eslint/no-unnecessary-type-constraint": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unsafe-declaration-merging": "warn",
            "@typescript-eslint/no-unsafe-enum-comparison": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-return": "warn",
            "@typescript-eslint/no-unsafe-unary-minus": "warn",
            "no-unused-expressions": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-wrapper-object-types": "warn",
            "@typescript-eslint/only-throw-error": "warn",
            "@typescript-eslint/prefer-as-const": "warn",
            "@typescript-eslint/prefer-namespace-keyword": "warn",
            "@typescript-eslint/prefer-promise-reject-errors": "warn",
            "@typescript-eslint/require-await": "warn",
            "@typescript-eslint/restrict-plus-operands": "warn",
            "@typescript-eslint/restrict-template-expressions": "warn",
            "@typescript-eslint/triple-slash-reference": "warn",
            "@typescript-eslint/unbound-method": "warn",
        },
    },
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
            "no-restricted-syntax": [
                "error",
                {
                    selector: "CallExpression[callee.property.name=/^insertAdjacent/]",
                    message:
                        "insertAdjacent methods are not allowed. Use alternative DOM manipulation methods instead.",
                },
                {
                    selector: 'AssignmentExpression[left.property.name="innerHTML"]',
                    message:
                        "innerHTML assignment is not allowed. Use alternative DOM manipulation methods instead.",
                },
                {
                    selector: 'NewExpression[callee.name="Function"]',
                    message:
                        "new Function() is not allowed due to security risks. Use alternative approaches instead.",
                },
                {
                    selector: 'Identifier[name="document"]',
                    message: "Use activeDocument instead of document.",
                },
                {
                    selector: 'AssignmentExpression[left.object.property.name="style"]',
                    message:
                        "Avoid setting styles directly via element.style. Use CSS classes for better theming and maintainability. Use the setCssProps function if the CSS properties need to change dynamically.",
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
