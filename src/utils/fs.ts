import { minimatch } from "minimatch";

export function isSupportedFileType(path: string): boolean {
    return path.split(".").pop().toLowerCase() === "md";
}

// This checks if the given path matches the given pattern
// We match based on:
//  1. The `path` starts with `pattern`
//  2. The `path` matches the glob `pattern`
export function pathMatchesPattern(path: string, pattern: string) {
    return path.startsWith(pattern) || minimatch(path, pattern);
}
