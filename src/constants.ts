// To cater for both LF and CR-LF line ending styles, "\r?\n" is used to match the newline character sequence
// https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/776
export const SCHEDULING_INFO_REGEX =
    /^---\r?\n((?:.*\r?\n)*)sr-due: (.+)\r?\nsr-interval: (\d+)\r?\nsr-ease: (\d+)\r?\n((?:.*\r?\n)?)---/;
export const YAML_FRONT_MATTER_REGEX = /^---\r?\n((?:.*\r?\n)*?)---/;
export const NON_LETTER_SYMBOLS_REGEX = /[!-/:-@[-`{-~}\s]/g;

export const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
export const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),(\d+),(\d+)-->/gm;
export const OBSIDIAN_TAG_AT_STARTOFLINE_REGEX = /^#[^\s#]+/gi;

// https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note
// Block identifiers can only consist of letters, numbers, and dashes.
// RZ: 2024-01-01 Empirically determined that obsidian only recognizes a block identifier if the
// "^" is preceded by a space
export const OBSIDIAN_BLOCK_ID_ENDOFLINE_REGEX = / (\^[a-zA-Z0-9-]+)$/;

export const PREFERRED_DATE_FORMAT = "YYYY-MM-DD";
export const ALLOWED_DATE_FORMATS = [PREFERRED_DATE_FORMAT, "DD-MM-YYYY", "ddd MMM DD YYYY"];

export const IMAGE_FORMATS = [
    "jpg",
    "jpeg",
    "gif",
    "png",
    "svg",
    "webp",
    "apng",
    "avif",
    "jfif",
    "pjpeg",
    "pjp",
    "bmp",
];
export const AUDIO_FORMATS = ["mp3", "webm", "m4a", "wav", "ogg"];
export const VIDEO_FORMATS = ["mp4", "mkv", "avi", "mov"];

export const COLLAPSE_ICON =
    '<svg viewBox="0 0 100 100" width="8" height="8" class="svg-icon right-triangle"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>';

export const TICKS_PER_DAY = 24 * 3600 * 1000;

export const SR_HTML_COMMENT_BEGIN = "<!--SR:";
export const SR_HTML_COMMENT_END = "-->";
