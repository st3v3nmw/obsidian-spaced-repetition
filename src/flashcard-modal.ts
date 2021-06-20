import {
    Modal,
    App,
    MarkdownRenderer,
    Notice,
    Platform,
    TFile,
} from "obsidian";
import type SRPlugin from "./main";
import {
    Card,
    CardType,
    FlashcardModalMode,
    ReviewResponse,
    Deck,
} from "./types";
import { schedule, textInterval } from "./sched";
import { CLOZE_SCHEDULING_EXTRACTOR, COLLAPSE_ICON } from "./constants";
import { getSetting } from "./settings";
import { escapeRegexString, fixDollarSigns, cyrb53 } from "./utils";

export class FlashcardModal extends Modal {
    public plugin: SRPlugin;
    public answerBtn: HTMLElement;
    public flashcardView: HTMLElement;
    public hardBtn: HTMLElement;
    public goodBtn: HTMLElement;
    public easyBtn: HTMLElement;
    public responseDiv: HTMLElement;
    public fileLinkView: HTMLElement;
    public resetLinkView: HTMLElement;
    public contextView: HTMLElement;
    public currentCard: Card;
    public currentDeck: Deck;
    public checkDeck: Deck;
    public mode: FlashcardModalMode;

    constructor(app: App, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;

        this.titleEl.setText("Decks");

        if (Platform.isMobile) {
            this.modalEl.style.height = "100%";
            this.modalEl.style.width = "100%";
            this.contentEl.style.display = "block";
        } else {
            if (getSetting("largeScreenMode", this.plugin.data.settings)) {
                this.modalEl.style.height = "100%";
                this.modalEl.style.width = "100%";
            } else {
                this.modalEl.style.height = "80%";
                this.modalEl.style.width = "40%";
            }
        }

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");

        document.body.onkeypress = (e) => {
            if (this.mode != FlashcardModalMode.DecksList) {
                if (
                    this.mode != FlashcardModalMode.Closed &&
                    e.code == "KeyS"
                ) {
                    this.currentDeck.deleteFlashcardAtIndex(
                        0,
                        this.currentCard.isDue
                    );
                    if (this.currentCard.cardType == CardType.Cloze)
                        this.buryRelatedCards(false);
                    this.currentDeck.nextCard(this);
                } else if (
                    this.mode == FlashcardModalMode.Front &&
                    (e.code == "Space" || e.code == "Enter")
                )
                    this.showAnswer();
                else if (this.mode == FlashcardModalMode.Back) {
                    if (e.code == "Numpad1" || e.code == "Digit1")
                        this.processReview(ReviewResponse.Hard);
                    else if (
                        e.code == "Numpad2" ||
                        e.code == "Digit2" ||
                        e.code == "Space"
                    )
                        this.processReview(ReviewResponse.Good);
                    else if (e.code == "Numpad3" || e.code == "Digit3")
                        this.processReview(ReviewResponse.Easy);
                    else if (e.code == "Numpad0" || e.code == "Digit0")
                        this.processReview(ReviewResponse.Reset);
                }
            }
        };
    }

    onOpen() {
        this.decksList();
    }

    onClose() {
        this.mode = FlashcardModalMode.Closed;
    }

    decksList() {
        this.mode = FlashcardModalMode.DecksList;
        this.titleEl.setText("Decks");
        this.titleEl.innerHTML +=
            '<p style="margin:0px;line-height:12px;">' +
            '<span style="background-color:#4caf50;color:#ffffff;" aria-label="Due cards" class="tag-pane-tag-count tree-item-flair">' +
            this.plugin.deckTree.dueFlashcardsCount +
            "</span>" +
            '<span style="background-color:#2196f3;" aria-label="New cards" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
            this.plugin.deckTree.newFlashcardsCount +
            "</span>" +
            '<span style="background-color:#ff7043;" aria-label="Total cards" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
            this.plugin.deckTree.totalFlashcards +
            "</span>" +
            "</p>";
        this.contentEl.innerHTML = "";
        this.contentEl.setAttribute("id", "sr-flashcard-view");

        for (let deck of this.plugin.deckTree.subdecks)
            deck.render(this.contentEl, this);
    }

    setupCardsView() {
        this.contentEl.innerHTML = "";

        this.fileLinkView = this.contentEl.createDiv("sr-link");
        this.fileLinkView.setText("Open file");
        if (getSetting("showFileNameInFileLink", this.plugin.data.settings))
            this.fileLinkView.setAttribute("aria-label", "Open file");
        this.fileLinkView.addEventListener("click", (_) => {
            this.close();
            this.plugin.app.workspace.activeLeaf.openFile(
                this.currentCard.note
            );
        });

        this.resetLinkView = this.contentEl.createDiv("sr-link");
        this.resetLinkView.setText("Reset card's progress");
        this.resetLinkView.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Reset);
        });
        this.resetLinkView.style.float = "right";

        if (getSetting("showContextInCards", this.plugin.data.settings)) {
            this.contextView = this.contentEl.createDiv();
            this.contextView.setAttribute("id", "sr-context");
        }

        this.flashcardView = this.contentEl.createDiv("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");

        this.responseDiv = this.contentEl.createDiv("sr-response");

        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText("Hard");
        this.hardBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);

        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText("Good");
        this.goodBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);

        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText("Easy");
        this.easyBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";

        this.answerBtn = this.contentEl.createDiv();
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText("Show Answer");
        this.answerBtn.addEventListener("click", (_) => {
            this.showAnswer();
        });
    }

    showAnswer() {
        this.mode = FlashcardModalMode.Back;

        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";

        if (this.currentCard.isDue)
            this.resetLinkView.style.display = "inline-block";

        if (this.currentCard.cardType != CardType.Cloze) {
            let hr: HTMLElement = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        } else this.flashcardView.innerHTML = "";

        this.renderMarkdownWrapper(this.currentCard.back, this.flashcardView);
    }

    async processReview(response: ReviewResponse) {
        let interval, ease, due;

        this.currentDeck.deleteFlashcardAtIndex(0, this.currentCard.isDue);
        if (response != ReviewResponse.Reset) {
            // scheduled card
            if (this.currentCard.isDue) {
                let schedObj = schedule(
                    response,
                    this.currentCard.interval,
                    this.currentCard.ease,
                    this.currentCard.delayBeforeReview,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards
                );
                interval = schedObj.interval;
                ease = schedObj.ease;
            } else {
                let schedObj = schedule(
                    response,
                    1,
                    getSetting("baseEase", this.plugin.data.settings),
                    0,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards
                );
                interval = schedObj.interval;
                ease = schedObj.ease;
            }

            due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        } else {
            this.currentCard.interval = 1.0;
            this.currentCard.ease = this.plugin.data.settings.baseEase;
            if (this.currentCard.isDue)
                this.currentDeck.dueFlashcards.push(this.currentCard);
            else this.currentDeck.newFlashcards.push(this.currentCard);
            due = window.moment(Date.now());
            new Notice("Card's progress has been reset");
            this.currentDeck.nextCard(this);
            return;
        }

        let dueString: string = due.format("YYYY-MM-DD");

        let fileText: string = await this.app.vault.read(this.currentCard.note);
        let replacementRegex = new RegExp(
            escapeRegexString(this.currentCard.cardText),
            "gm"
        );

        let sep: string = getSetting(
            "cardCommentOnSameLine",
            this.plugin.data.settings
        )
            ? " "
            : "\n";

        if (this.currentCard.cardType == CardType.Cloze) {
            let schedIdx: number =
                this.currentCard.cardText.lastIndexOf("<!--SR:");
            if (schedIdx == -1) {
                // first time adding scheduling information to flashcard
                this.currentCard.cardText = `${this.currentCard.cardText}${sep}<!--SR:!${dueString},${interval},${ease}-->`;
            } else {
                let scheduling: RegExpMatchArray[] = [
                    ...this.currentCard.cardText.matchAll(
                        CLOZE_SCHEDULING_EXTRACTOR
                    ),
                ];

                let deletionSched: string[] = [
                    "0",
                    dueString,
                    `${interval}`,
                    `${ease}`,
                ];
                if (this.currentCard.isDue)
                    scheduling[this.currentCard.subCardIdx] = deletionSched;
                else scheduling.push(deletionSched);

                this.currentCard.cardText = this.currentCard.cardText.replace(
                    /<!--SR:.+-->/gm,
                    ""
                );
                this.currentCard.cardText += "<!--SR:";
                for (let i = 0; i < scheduling.length; i++)
                    this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                this.currentCard.cardText += "-->";
            }

            fileText = fileText.replace(
                replacementRegex,
                fixDollarSigns(this.currentCard.cardText)
            );
            for (let relatedCard of this.currentCard.relatedCards)
                relatedCard.cardText = this.currentCard.cardText;
            if (this.plugin.data.settings.buryRelatedCards)
                this.buryRelatedCards(true);
        } else {
            if (this.currentCard.cardType == CardType.SingleLineBasic) {
                fileText = fileText.replace(
                    replacementRegex,
                    `${fixDollarSigns(this.currentCard.front)}${getSetting(
                        "singlelineCardSeparator",
                        this.plugin.data.settings
                    )}${fixDollarSigns(
                        this.currentCard.back
                    )}${sep}<!--SR:${dueString},${interval},${ease}-->`
                );
            } else {
                fileText = fileText.replace(
                    replacementRegex,
                    `${fixDollarSigns(this.currentCard.front)}\n${getSetting(
                        "multilineCardSeparator",
                        this.plugin.data.settings
                    )}\n${fixDollarSigns(
                        this.currentCard.back
                    )}${sep}<!--SR:${dueString},${interval},${ease}-->`
                );
            }
        }

        await this.app.vault.modify(this.currentCard.note, fileText);
        this.currentDeck.nextCard(this);
    }

    async buryRelatedCards(tillNextDay: boolean) {
        if (tillNextDay) {
            this.plugin.data.buryList.push(cyrb53(this.currentCard.cardText));
            await this.plugin.savePluginData();
        }

        for (let relatedCard of this.currentCard.relatedCards) {
            let dueIdx = this.currentDeck.dueFlashcards.indexOf(relatedCard);
            let newIdx = this.currentDeck.newFlashcards.indexOf(relatedCard);

            if (dueIdx != -1)
                this.currentDeck.deleteFlashcardAtIndex(
                    dueIdx,
                    this.currentDeck.dueFlashcards[dueIdx].isDue
                );
            else if (newIdx != -1)
                this.currentDeck.deleteFlashcardAtIndex(
                    newIdx,
                    this.currentDeck.newFlashcards[newIdx].isDue
                );
        }
    }

    // slightly modified version of the renderMarkdown function in
    // https://github.com/mgmeyers/obsidian-kanban/blob/main/src/KanbanView.tsx
    async renderMarkdownWrapper(
        markdownString: string,
        containerEl: HTMLElement
    ) {
        MarkdownRenderer.renderMarkdown(
            markdownString,
            containerEl,
            this.currentCard.note.path,
            null
        );
        containerEl.findAll(".internal-embed").forEach((el) => {
            const src = el.getAttribute("src");
            const target =
                typeof src === "string" &&
                this.plugin.app.metadataCache.getFirstLinkpathDest(
                    src,
                    this.currentCard.note.path
                );
            if (target instanceof TFile && target.extension !== "md") {
                el.innerText = "";
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
                        else
                            img.setAttribute("width", "100%");
                        if (el.hasAttribute("alt"))
                            img.setAttribute("alt", el.getAttribute("alt"));
                    }
                );
                el.addClasses(["image-embed", "is-loaded"]);
            }

            // file does not exist
            // display dead link
            if (target == null) el.innerText = src;
        });
    }
}

Deck.prototype.render = function (
    containerEl: HTMLElement,
    modal: FlashcardModal
): void {
    let deckView: HTMLElement = containerEl.createDiv("tree-item");

    let deckViewSelf: HTMLElement = deckView.createDiv(
        "tree-item-self tag-pane-tag is-clickable"
    );
    let collapsed: boolean = true;
    let collapseIconEl: HTMLElement = deckViewSelf.createDiv(
        "tree-item-icon collapse-icon"
    );
    collapseIconEl.innerHTML = COLLAPSE_ICON;
    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
        "rotate(-90deg)";

    let deckViewInner: HTMLElement = deckViewSelf.createDiv("tree-item-inner");
    deckViewInner.addEventListener("click", (_) => {
        modal.currentDeck = this;
        modal.checkDeck = this.parent;
        modal.setupCardsView();
        this.nextCard(modal);
    });
    let deckViewInnerText: HTMLElement =
        deckViewInner.createDiv("tag-pane-tag-text");
    deckViewInnerText.innerHTML += `<span class="tag-pane-tag-self">${this.deckName}</span>`;
    let deckViewOuter: HTMLElement = deckViewSelf.createDiv(
        "tree-item-flair-outer"
    );
    deckViewOuter.innerHTML +=
        '<span style="background-color:#4caf50;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
        this.dueFlashcardsCount +
        "</span>" +
        '<span style="background-color:#2196f3;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
        this.newFlashcardsCount +
        "</span>" +
        '<span style="background-color:#ff7043;" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
        this.totalFlashcards +
        "</span>";

    let deckViewChildren: HTMLElement =
        deckView.createDiv("tree-item-children");
    deckViewChildren.style.display = "none";
    collapseIconEl.addEventListener("click", (_) => {
        if (collapsed) {
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
            deckViewChildren.style.display = "block";
        } else {
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                "rotate(-90deg)";
            deckViewChildren.style.display = "none";
        }
        collapsed = !collapsed;
    });
    for (let deck of this.subdecks) deck.render(deckViewChildren, modal);
};

Deck.prototype.nextCard = function (modal: FlashcardModal): void {
    if (this.newFlashcards.length + this.dueFlashcards.length == 0) {
        if (this.dueFlashcardsCount + this.newFlashcardsCount > 0) {
            for (let deck of this.subdecks) {
                if (deck.dueFlashcardsCount + deck.newFlashcardsCount > 0) {
                    modal.currentDeck = deck;
                    deck.nextCard(modal);
                    return;
                }
            }
        }

        if (this.parent == modal.checkDeck) modal.decksList();
        else this.parent.nextCard(modal);
        return;
    }

    modal.responseDiv.style.display = "none";
    modal.resetLinkView.style.display = "none";
    modal.titleEl.setText(
        `${this.deckName} - ${
            this.dueFlashcardsCount + this.newFlashcardsCount
        }`
    );

    modal.answerBtn.style.display = "initial";
    modal.flashcardView.innerHTML = "";
    modal.mode = FlashcardModalMode.Front;

    if (this.dueFlashcards.length > 0) {
        modal.currentCard = this.dueFlashcards[0];
        modal.renderMarkdownWrapper(
            modal.currentCard.front,
            modal.flashcardView
        );

        let hardInterval: number = schedule(
            ReviewResponse.Hard,
            modal.currentCard.interval,
            modal.currentCard.ease,
            modal.currentCard.delayBeforeReview,
            modal.plugin.data.settings
        ).interval;
        let goodInterval: number = schedule(
            ReviewResponse.Good,
            modal.currentCard.interval,
            modal.currentCard.ease,
            modal.currentCard.delayBeforeReview,
            modal.plugin.data.settings
        ).interval;
        let easyInterval: number = schedule(
            ReviewResponse.Easy,
            modal.currentCard.interval,
            modal.currentCard.ease,
            modal.currentCard.delayBeforeReview,
            modal.plugin.data.settings
        ).interval;

        if (Platform.isMobile) {
            modal.hardBtn.setText(textInterval(hardInterval, true));
            modal.goodBtn.setText(textInterval(goodInterval, true));
            modal.easyBtn.setText(textInterval(easyInterval, true));
        } else {
            modal.hardBtn.setText(
                `Hard - ${textInterval(hardInterval, false)}`
            );
            modal.goodBtn.setText(
                `Good - ${textInterval(goodInterval, false)}`
            );
            modal.easyBtn.setText(
                `Easy - ${textInterval(easyInterval, false)}`
            );
        }
    } else if (this.newFlashcards.length > 0) {
        modal.currentCard = this.newFlashcards[0];
        modal.renderMarkdownWrapper(
            modal.currentCard.front,
            modal.flashcardView
        );

        if (Platform.isMobile) {
            modal.hardBtn.setText("1.0d");
            modal.goodBtn.setText("2.5d");
            modal.easyBtn.setText("3.5d");
        } else {
            modal.hardBtn.setText("Hard - 1.0 day");
            modal.goodBtn.setText("Good - 2.5 days");
            modal.easyBtn.setText("Easy - 3.5 days");
        }
    }

    if (getSetting("showContextInCards", modal.plugin.data.settings))
        modal.contextView.setText(modal.currentCard.context);
    if (getSetting("showFileNameInFileLink", modal.plugin.data.settings))
        modal.fileLinkView.setText(modal.currentCard.note.basename);
};
