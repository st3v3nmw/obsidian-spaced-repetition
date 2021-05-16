// https://stackoverflow.com/a/6969486/12938797
export function escapeRegexString(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
