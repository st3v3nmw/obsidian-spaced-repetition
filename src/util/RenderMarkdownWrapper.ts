import { App, MarkdownRenderer, TFile } from "obsidian";
import {
    AUDIO_FORMATS,
    IMAGE_FORMATS,
    VIDEO_FORMATS,
    NON_LETTER_SYMBOLS_REGEX,
} from "../constants";
import SRPlugin from "../main";
import { TextDirection } from "./TextDirection";

export class RenderMarkdownWrapper {
    private app: App;
    private notePath: string;
    private plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin, notePath: string) {
        this.app = app;
        this.notePath = notePath;
        this.plugin = plugin;
    }

    // slightly modified version of the renderMarkdown function in
    // https://github.com/mgmeyers/obsidian-kanban/blob/main/src/KanbanView.tsx
    async renderMarkdownWrapper(
        markdownString: string,
        containerEl: HTMLElement,
        textDirection: TextDirection,
        recursiveDepth = 0,
    ): Promise<void> {
        if (recursiveDepth > 4) return;

        let el: HTMLElement;
        if (textDirection == TextDirection.Rtl) {
            el = containerEl.createDiv();
            el.setAttribute("dir", "rtl");
        } else el = containerEl;
        MarkdownRenderer.render(this.app, markdownString, el, this.notePath, this.plugin);

        el.findAll(".internal-embed").forEach((el) => {
            const link = this.parseLink(el.getAttribute("src"));

            // file does not exist, display dead link
            if (!link.target) {
                el.innerText = link.text;
            } else if (link.target instanceof TFile) {
                if (link.target.extension !== "md") {
                    this.embedMediaFile(el, link.target);
                } else {
                    el.innerText = "";
                    this.renderTransclude(el, link, recursiveDepth);
                }
            }
        });
    }

    private parseLink(src: string) {
        const linkComponentsRegex =
            /^(?<file>[^#^]+)?(?:#(?!\^)(?<heading>.+)|#\^(?<blockId>.+)|#)?$/;
        const matched = typeof src === "string" && src.match(linkComponentsRegex);
        const file = matched.groups.file || this.notePath;
        const target = this.plugin.app.metadataCache.getFirstLinkpathDest(file, this.notePath);
        return {
            text: matched[0],
            file: matched.groups.file,
            heading: matched.groups.heading,
            blockId: matched.groups.blockId,
            target: target,
        };
    }

    private embedMediaFile(el: HTMLElement, target: TFile) {
        el.innerText = "";
        if (IMAGE_FORMATS.includes(target.extension)) {
            el.createEl(
                "img",
                {
                    attr: {
                        src: this.plugin.app.vault.getResourcePath(target),
                    },
                },
                (img) => {
                    if (el.hasAttribute("width"))
                        img.setAttribute("width", el.getAttribute("width"));
                    else img.setAttribute("width", "100%");
                    if (el.hasAttribute("alt")) img.setAttribute("alt", el.getAttribute("alt"));
                    el.addEventListener(
                        "click",
                        (ev) =>
                            ((ev.target as HTMLElement).style.minWidth =
                                (ev.target as HTMLElement).style.minWidth === "100%"
                                    ? null
                                    : "100%"),
                    );
                },
            );
            el.addClasses(["image-embed", "is-loaded"]);
        } else if (
            AUDIO_FORMATS.includes(target.extension) ||
            VIDEO_FORMATS.includes(target.extension)
        ) {
            el.createEl(
                AUDIO_FORMATS.includes(target.extension) ? "audio" : "video",
                {
                    attr: {
                        controls: "",
                        src: this.plugin.app.vault.getResourcePath(target),
                    },
                },
                (audio) => {
                    if (el.hasAttribute("alt")) audio.setAttribute("alt", el.getAttribute("alt"));
                },
            );
            el.addClasses(["media-embed", "is-loaded"]);
        } else {
            el.innerText = target.path;
        }
    }

    private async renderTransclude(
        el: HTMLElement,
        link: {
            text: string;
            file: string;
            heading: string;
            blockId: string;
            target: TFile;
        },
        recursiveDepth: number,
    ) {
        const cache = this.app.metadataCache.getCache(link.target.path);
        const text = await this.app.vault.cachedRead(link.target);
        let blockText;
        if (link.heading) {
            const clean = (s: string) => s.replace(NON_LETTER_SYMBOLS_REGEX, "");
            const headingIndex = cache.headings?.findIndex(
                (h) => clean(h.heading) === clean(link.heading),
            );
            const heading = cache.headings[headingIndex];

            const startAt = heading.position.start.offset;
            const endAt =
                cache.headings.slice(headingIndex + 1).find((h) => h.level <= heading.level)
                    ?.position?.start?.offset || text.length;

            blockText = text.substring(startAt, endAt);
        } else if (link.blockId) {
            const block = cache.blocks[link.blockId];
            const startAt = block.position.start.offset;
            const endAt = block.position.end.offset;
            blockText = text.substring(startAt, endAt);
        } else {
            blockText = text;
        }

        // We are operating here within the parent container.
        // It already has the rtl div if necessary.
        // We don't need another rtl div, so we can set direction to Unspecified
        this.renderMarkdownWrapper(blockText, el, TextDirection.Unspecified, recursiveDepth + 1);
    }
}
