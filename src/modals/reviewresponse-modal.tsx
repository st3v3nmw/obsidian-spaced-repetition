// https://img.shields.io/github/v/release/chetachiezikeuzor/cMenu-Plugin
import { ButtonComponent, MarkdownView, Platform, TFile } from "obsidian";
import { ReviewResponse, textInterval } from "src/scheduling";
import { SRSettings } from "src/settings";
import SRPlugin from "../main";

export class reviewNoteResponseModal {
    public plugin: SRPlugin;
    public settings: SRSettings;
    containerEl: HTMLElement;

    id = "reviewNoteResponseModalBar";
    buttons: ButtonComponent[];
    responseInterval: number[];

    constructor(plugin: SRPlugin, show = true, responseInterval?: number[]) {
        this.plugin = plugin;
        this.settings = plugin.data.settings;

        // this.display(show, responseInterval);
    }

    public display(show = true, responseInterval?: number[]): void {
        const settings: SRSettings = this.settings;
        if (!settings.reviewResponseFloatBar || !settings.autoNextNote) return;
        const menuCommands = [
            {
                id: "obsidian-spaced-repetition:srs-note-review-hard",
                name: "Hard",
                response: ReviewResponse.Hard,
                text:
                    responseInterval == null
                        ? `${settings.flashcardHardText}`
                        : Platform.isMobile
                        ? textInterval(responseInterval[1], true)
                        : `${settings.flashcardHardText} - ${textInterval(
                              responseInterval[1],
                              false
                          )}`,
                icon: "bold-glyph",
            },
            {
                id: "obsidian-spaced-repetition:srs-note-review-good",
                name: "Good",
                response: ReviewResponse.Good,
                text:
                    responseInterval == null
                        ? `${settings.flashcardGoodText}`
                        : Platform.isMobile
                        ? textInterval(responseInterval[2], true)
                        : `${settings.flashcardGoodText} - ${textInterval(
                              responseInterval[2],
                              false
                          )}`,
                icon: "remix-GobletLine",
            },
            {
                id: "obsidian-spaced-repetition:srs-note-review-easy",
                name: "Easy",
                response: ReviewResponse.Easy,
                text:
                    responseInterval == null
                        ? `${settings.flashcardEasyText}`
                        : Platform.isMobile
                        ? textInterval(responseInterval[3], true)
                        : `${settings.flashcardEasyText} - ${textInterval(
                              responseInterval[3],
                              false
                          )}`,
                icon: "remix-EmotionHappyLine",
            },
        ];

        function createMenu(bar: reviewNoteResponseModal) {
            bar.containerEl = createEl("div");
            if (bar.containerEl) {
                bar.containerEl.setAttribute(
                    "style",
                    `grid-template-columns: ${"1fr ".repeat(menuCommands.length + 1)}`
                );
                /* //left: ${0}%; bottom: ${
                4.25
            }em;  */
            }
            bar.containerEl.setAttribute("id", bar.id);
            bar.containerEl.addClass("cMenuDefaultAesthetic");
            document.body
                .querySelector(".mod-vertical.mod-root")
                .insertAdjacentElement("afterbegin", bar.containerEl);

            menuCommands.forEach((item) => {
                const btn = document.createElement("button");
                btn.setAttribute("id", "sr-" + item.name.toLowerCase() + "-btn");
                // btn.setAttribute("class", "cMenuCommandItem");
                btn.setAttribute("aria-label", item.name);
                // setIcon(btn, item.icon);
                btn.setText(item.text);
                btn.addEventListener("click", () => {
                    const openFile: TFile | null = app.workspace.getActiveFile();
                    if (openFile && openFile.extension === "md") {
                        bar.plugin.saveReviewResponse(openFile, item.response);
                    }
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    // app.commands.executeCommandById(item.id);
                });
                bar.containerEl.appendChild(btn);
            });

            const button = new ButtonComponent(bar.containerEl);
            button
                .setIcon("lucide-x")
                .setClass("cMenuCommandItem")
                // .setButtonText("x")
                .setTooltip("关闭浮栏显示")
                .onClick(() => {
                    bar.containerEl.style.visibility = "hidden";
                    bar.selfDestruct();
                });

            bar.containerEl.style.visibility = "visible"; // : "hidden"
            console.log("menu:\n", bar.containerEl);

            //after review
            const timmer = setInterval(() => {
                const reviewNoteResponseModalBar = document.getElementById(
                    "reviewNoteResponseModalBar"
                );
                const Markdown = app.workspace.getActiveViewOfType(MarkdownView);
                if (reviewNoteResponseModalBar) {
                    if (!Markdown || !show) {
                        reviewNoteResponseModalBar.style.visibility = "hidden";
                        bar.selfDestruct();
                        clearInterval(timmer);
                    }
                }
                // console.debug("markdownView? ", Markdown);
            }, 10000);
        }
        if (show) {
            // update show text
            const reviewNoteResponseModalBar = document.getElementById(this.id);
            if (reviewNoteResponseModalBar) {
                if (responseInterval != null) {
                    menuCommands.forEach((item) => {
                        const btn = document.getElementById(
                            "sr-" + item.name.toLowerCase() + "-btn"
                        );
                        btn.setText(item.text);
                    });
                } else {
                    menuCommands.forEach((item) => {
                        const btn = document.getElementById(
                            "sr-" + item.name.toLowerCase() + "-btn"
                        );
                        btn.setText(item.name);
                    });
                }

                return;
            } else {
                createMenu(this);
            }
        } else {
            this.selfDestruct();
        }
    }

    public isDisplay() {
        return document.getElementById(this.id) != null;
        // return this.containerEl.style.visibility === "visible";
    }

    selfDestruct() {
        const reviewNoteResponseModalBar = document.getElementById("reviewNoteResponseModalBar");
        if (reviewNoteResponseModalBar) {
            reviewNoteResponseModalBar.style.visibility = "hidden";
            if (reviewNoteResponseModalBar.firstChild) {
                reviewNoteResponseModalBar.removeChild(reviewNoteResponseModalBar.firstChild);
            }
            reviewNoteResponseModalBar.remove();
        }
    }
}
