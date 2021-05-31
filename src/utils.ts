// https://stackoverflow.com/a/6969486/12938797
export function escapeRegexString(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// https://stackoverflow.com/questions/38866071/javascript-replace-method-dollar-signs
export function fixDollarSigns(text: string): string {
    return text.split("$$").join("$$$");
}
