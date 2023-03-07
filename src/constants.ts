export const SCHEDULING_INFO_REGEX =
    /^---\n((?:.*\n)*)sr-due: (.+)\nsr-interval: ([\d\.]+)\nsr-ease: ([\d\.]+)\n((?:.*\n)?)---/;
export const YAML_FRONT_MATTER_REGEX = /^---\n((?:.*\n)*?)---/;

export const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),([\d\.]+),([\d\.]+)/gm;
export const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),([\d\.]+),([\d\.]+)-->/gm;

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
    '<svg viewBox="0 0 100 100" width="8" height="8" class="right-triangle"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>';
