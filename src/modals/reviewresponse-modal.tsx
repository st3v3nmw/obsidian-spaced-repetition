// https://img.shields.io/github/v/release/chetachiezikeuzor/cMenu-Plugin
import { ButtonComponent, MarkdownView, Platform, TFile, setIcon } from "obsidian";
import { ReviewResponse, textInterval } from "src/scheduling";
import { SRSettings } from "src/settings";
import SRPlugin from "../main";

export class reviewNoteResponseModal {
    public plugin: SRPlugin;
    public settings: SRSettings;
    containerEl: HTMLElement;

    id = "reviewNoteResponseModalBar";
    buttons: HTMLButtonElement[];
    responseInterval: number[];
    showInterval = true;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        this.settings = plugin.data.settings;

        // this.display(show, responseInterval);
    }

    public algoDisplay(show = true, responseInterval?: number[]): void {
        const plugin = this.plugin;
        const settings: SRSettings = this.settings;

        if (!settings.reviewResponseFloatBar || !settings.autoNextNote) return;
        const reviewNoteResponseModalBar = document.getElementById(this.id);
        if (!show) {
            this.selfDestruct();
            return;
        } else if (reviewNoteResponseModalBar) {
            // update show text

            this.plugin.algorithm.srsOptions().forEach((opt, index) => {
                const btn = document.getElementById("sr-" + opt.toLowerCase() + "-btn");
                let text = opt;
                if (this.showInterval) {
                    text =
                        responseInterval == null
                            ? `${opt}`
                            : Platform.isMobile
                            ? textInterval(
                                  Number.parseFloat(responseInterval[index].toFixed(5)),
                                  true
                              )
                            : `${opt} - ${textInterval(
                                  Number.parseFloat(responseInterval[index].toFixed(5)),
                                  false
                              )}`;
                }
                btn.setText(text);
            });
            return;
        }
        const buttonClick = (s: string) => {
            const openFile: TFile | null = app.workspace.getActiveFile();
            if (openFile && openFile.extension === "md") {
                // const fid = plugin.store.getFileId(openFile.path);
                // plugin.store.reviewId(fid, s);
                plugin.saveReviewResponsebyAlgo(openFile, s);
            }
        };
        const options = this.plugin.algorithm.srsOptions();
        const optBtnCounts = options.length;
        let btnCols = 4;
        if (!Platform.isMobile && optBtnCounts > btnCols) {
            btnCols = optBtnCounts;
        }
        this.containerEl = createEl("div");
        this.containerEl.setAttribute("id", this.id);
        this.containerEl.addClass("ResponseFloatBarDefaultAesthetic");
        this.containerEl.setAttribute("style", `grid-template-columns: ${"1fr ".repeat(btnCols)}`);
        document.body
            .querySelector(".mod-vertical.mod-root")
            .insertAdjacentElement("afterbegin", this.containerEl);
        this.buttons = [];
        options.forEach((opt: string, index) => {
            const btn = document.createElement("button");
            btn.setAttribute("id", "sr-" + opt.toLowerCase() + "-btn");
            btn.setAttribute("class", "ResponseFloatBarCommandItem");
            // btn.setAttribute("aria-label", "Hotkey: " + (index + 1));
            // btn.setAttribute("style", `width: calc(95%/${buttonCounts});`);
            // setIcon(btn, item.icon);
            let text = opt;
            if (this.showInterval) {
                text =
                    responseInterval == null
                        ? `${opt}`
                        : Platform.isMobile
                        ? textInterval(Number.parseFloat(responseInterval[index].toFixed(5)), true)
                        : `${opt} - ${textInterval(
                              Number.parseFloat(responseInterval[index].toFixed(5)),
                              false
                          )}`;
            }
            btn.setText(text);
            btn.addEventListener("click", () => buttonClick(opt));
            this.buttons.push(btn);
            this.containerEl.appendChild(btn);
        });

        const showIntvlBtn = document.createElement("button");
        showIntvlBtn.setAttribute("id", "sr-showintvl-btn");
        showIntvlBtn.setAttribute("class", "ResponseFloatBarCommandItem");
        showIntvlBtn.setAttribute(
            "aria-label",
            "时间间隔显隐,\n建议：复习类不显示，渐进总结/增量写作显示"
        );
        // showIntvlBtn.setText("Show");
        setIcon(showIntvlBtn, "alarm-clock");
        showIntvlBtn.addEventListener("click", () => {
            if (this.showInterval) {
                this.showInterval = false;
                setIcon(showIntvlBtn, "alarm-clock-off");
            } else {
                this.showInterval = true;
                setIcon(showIntvlBtn, "alarm-clock");
            }
            this.algoDisplay(show, responseInterval);
        });
        this.buttons.push(showIntvlBtn);
        this.containerEl.appendChild(showIntvlBtn);

        const closeBtn = document.createElement("button");
        closeBtn.setAttribute("id", "sr-close-btn");
        closeBtn.setAttribute("class", "ResponseFloatBarCommandItem");
        closeBtn.setAttribute("aria-label", "关闭浮栏显示");
        // closeBtn.setAttribute("style", `width: calc(95%/${buttonCounts});`);
        // setIcon(closeBtn, "lucide-x");
        closeBtn.setText("X");
        closeBtn.addEventListener("click", () => {
            this.containerEl.style.visibility = "hidden";
            this.selfDestruct();
        });
        this.buttons.push(closeBtn);
        this.containerEl.appendChild(closeBtn);

        /* const bar = document.getElementById("reviewNoteResponseModalBar");
        const Markdown = app.workspace.getActiveViewOfType(MarkdownView);

        document.body.onkeydown = (e) => {
            if (
                bar &&
                bar.checkVisibility &&
                (Markdown.getMode() === "preview" ||
                    document.activeElement.hasClass("ResponseFloatBarCommandItem"))
            ) {
                const consume = () => {
                    e.preventDefault();
                    e.stopPropagation();
                };
                for (let i = 0; i < options.length; i++) {
                    const num = "Numpad" + i;
                    const dig = "Digit" + i;
                    if (e.code === num || e.code === dig) {
                        buttonClick(options[0]);
                        break;
                    }
                }
                consume();
            }
        };
 */
        this.containerEl.style.visibility = "visible"; // : "hidden"
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
            bar.containerEl.addClass("ResponseFloatBarDefaultAesthetic");
            document.body
                .querySelector(".mod-vertical.mod-root")
                .insertAdjacentElement("afterbegin", bar.containerEl);

            menuCommands.forEach((item) => {
                const btn = document.createElement("button");
                btn.setAttribute("id", "sr-" + item.name.toLowerCase() + "-btn");
                // btn.setAttribute("class", "ResponseFloatBarCommandItem");
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
                .setClass("ResponseFloatBarCommandItem")
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
