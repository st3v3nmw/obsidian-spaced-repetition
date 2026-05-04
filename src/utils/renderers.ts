import { App, MarkdownRenderChild, MarkdownRenderer } from "obsidian";

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
        if (textDirection === TextDirection.Rtl) {
            el = containerEl.createDiv();
            el.setAttribute("dir", "rtl");
        } else el = containerEl;

        const renderChild = new MarkdownRenderChild(el);
        this.plugin.addChild(renderChild);
        await MarkdownRenderer.render(this.app, markdownString, el, this.notePath, renderChild);

        el.findAll(".internal-link").forEach((el: HTMLElement) => {
            (el as HTMLAnchorElement).addEventListener("click", (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const href = el.getAttr("href") || el.getAttr("data-href");

                if (href) {
                    this.app.workspace.openLinkText(href, this.notePath, true);
                    return true;
                }
                return false;
            });

            (el as HTMLAnchorElement).addEventListener("mouseover", (ev: Event) => {
                const href = el.getAttr("href") || el.getAttr("data-href");
                if (href) {
                    this.app.workspace.trigger("hover-link", {
                        event: ev,
                        source: "preview",
                        hoverParent: this.plugin,
                        targetEl: el,
                        linktext: href,
                    });
                    return true;
                }
                return false;
            });
        });
    }
}
