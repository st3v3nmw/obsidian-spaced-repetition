interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string | null;
    clozePatterns: string[];
    useAtomicClozes: boolean;
}

export default ParserOptions;