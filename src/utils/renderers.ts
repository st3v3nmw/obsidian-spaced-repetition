import { App, MarkdownRenderer, TFile } from "obsidian";

import { AUDIO_FORMATS, IMAGE_FORMATS, VIDEO_FORMATS } from "src/constants";
import SRPlugin from "src/main";
import { TextDirection } from "src/utils/strings";

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
                    // We get here if there is a transclusion link, such as "![[Test Embed]]"
                    // In version 1.12.4 and earlier we used the deprecated Obsidian MarkdownRenderer.renderMarkdown() and we
                    // needed to have our own method "renderTransclude()" that loaded the referenced file and rendered it.
                    // In version 1.12.5, we started using MarkdownRenderer.render() instead, which does this automatically.
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
}
