declare module "pagerank.js";

declare module "preact/src/jsx" {
    export namespace JSXInternal {
        type HTMLAttributes<_T> = Record<string, unknown>;
        type SignalLike<T> = { value: T };
    }
}

declare module "*.css" {
    const content: string;
    export default content;
}
