// custom-types.d.ts

declare module "peggy.mjs" {
  export function parse(input: string): unknown;
  export class SyntaxError extends Error {
    message: string;
    expected: unknown[];
    found: unknown;
    location: unknown;
    name: string;
  }
  export const StartRules: string[];
}

