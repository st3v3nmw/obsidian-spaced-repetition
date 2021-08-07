import {
    Modal,
    App,
    MarkdownRenderer,
    Notice,
    Platform,
    TFile,
    MarkdownView,
    moment,
} from "obsidian";
import type SRPlugin from "src/main";
import {
    Card,
    CardType,
    schedule,
    textInterval,
    ReviewResponse,
} from "src/scheduling";
import { MULTI_SCHEDULING_EXTRACTOR, COLLAPSE_ICON } from "src/constants";
import { escapeRegexString, cyrb53 } from "src/utils";
import { t } from "src/lang/helpers";

export enum FlashcardModalMode {
    DecksList,
    Front,
    Back,
    Closed,
}

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
    public currentCardIdx: number;
    public currentDeck: Deck;
    public checkDeck: Deck;
    public mode: FlashcardModalMode;

    constructor(app: App, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;

        this.titleEl.setText(t("Decks"));

        if (Platform.isMobile) this.contentEl.style.display = "block";
        this.modalEl.style.height =
            this.plugin.data.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.width =
            this.plugin.data.settings.flashcardWidthPercentage + "%";

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");

        document.body.onkeypress = (e) => {
            if (this.mode !== FlashcardModalMode.DecksList) {
                if (
                    this.mode !== FlashcardModalMode.Closed &&
                    e.code === "KeyS"
                ) {
                    this.currentDeck.deleteFlashcardAtIndex(
                        this.currentCardIdx,
                        this.currentCard.isDue
                    );
                    if (this.currentCard.cardType === CardType.Cloze)
                        this.burySiblingCards(false);
                    this.currentDeck.nextCard(this);
                } else if (
                    this.mode === FlashcardModalMode.Front &&
                    (e.code === "Space" || e.code === "Enter")
                )
                    this.showAnswer();
                else if (this.mode === FlashcardModalMode.Back) {
                    if (e.code === "Numpad1" || e.code === "Digit1")
                        this.processReview(ReviewResponse.Hard);
                    else if (
                        e.code === "Numpad2" ||
                        e.code === "Digit2" ||
                        e.code === "Space"
                    )
                        this.processReview(ReviewResponse.Good);
                    else if (e.code === "Numpad3" || e.code === "Digit3")
                        this.processReview(ReviewResponse.Easy);
                    else if (e.code === "Numpad0" || e.code === "Digit0")
                        this.processReview(ReviewResponse.Reset);
                }
            }
        };
    }

    onOpen(): void {
        this.decksList();
    }

    onClose(): void {
        this.mode = FlashcardModalMode.Closed;
    }

    decksList(): void {
        this.mode = FlashcardModalMode.DecksList;
        this.titleEl.setText(t("Decks"));
        this.titleEl.innerHTML +=
            '<p style="margin:0px;line-height:12px;">' +
            '<span style="background-color:#4caf50;color:#ffffff;" aria-label="' +
            t("Due cards") +
            '" class="tag-pane-tag-count tree-item-flair">' +
            this.plugin.deckTree.dueFlashcardsCount +
            "</span>" +
            '<span style="background-color:#2196f3;" aria-label="' +
            t("New cards") +
            '" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
            this.plugin.deckTree.newFlashcardsCount +
            "</span>" +
            '<span style="background-color:#ff7043;" aria-label="' +
            t("Total cards") +
            '" class="tag-pane-tag-count tree-item-flair sr-deck-counts">' +
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
        this.fileLinkView.setText(t("Open file"));
        if (this.plugin.data.settings.showFileNameInFileLink)
            this.fileLinkView.setAttribute("aria-label", t("Open file"));
        this.fileLinkView.addEventListener("click", async (_) => {
            this.close();
            await this.plugin.app.workspace.activeLeaf.openFile(
                this.currentCard.note
            );
            let activeView: MarkdownView =
                this.app.workspace.getActiveViewOfType(MarkdownView)!;
            activeView.editor.setCursor({
                line: this.currentCard.lineNo,
                ch: 0,
            });
        });

        this.resetLinkView = this.contentEl.createDiv("sr-link");
        this.resetLinkView.setText(t("Reset card's progress"));
        this.resetLinkView.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Reset);
        });
        this.resetLinkView.style.float = "right";

        if (this.plugin.data.settings.showContextInCards) {
            this.contextView = this.contentEl.createDiv();
            this.contextView.setAttribute("id", "sr-context");
        }

        this.flashcardView = this.contentEl.createDiv("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");

        this.responseDiv = this.contentEl.createDiv("sr-response");

        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText(t("Hard"));
        this.hardBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);

        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText(t("Good"));
        this.goodBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);

        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText(t("Easy"));
        this.easyBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";

        this.answerBtn = this.contentEl.createDiv();
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText(t("Show Answer"));
        this.answerBtn.addEventListener("click", (_) => {
            this.showAnswer();
        });
    }

    showAnswer(): void {
        this.mode = FlashcardModalMode.Back;

        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";

        if (this.currentCard.isDue)
            this.resetLinkView.style.display = "inline-block";

        if (this.currentCard.cardType !== CardType.Cloze) {
            let hr: HTMLElement = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        } else this.flashcardView.innerHTML = "";

        this.renderMarkdownWrapper(this.currentCard.back, this.flashcardView);
    }

    async processReview(response: ReviewResponse): Promise<void> {
        let interval: number, ease: number, due: moment.Moment;

        this.currentDeck.deleteFlashcardAtIndex(
            this.currentCardIdx,
            this.currentCard.isDue
        );
        if (response !== ReviewResponse.Reset) {
            // scheduled card
            if (this.currentCard.isDue) {
                let schedObj: Record<string, number> = schedule(
                    response,
                    this.currentCard.interval!,
                    this.currentCard.ease!,
                    this.currentCard.delayBeforeReview!,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards
                );
                interval = schedObj.interval;
                ease = schedObj.ease;
            } else {
                let schedObj: Record<string, number> = schedule(
                    response,
                    1,
                    this.plugin.data.settings.baseEase,
                    0,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards
                );
                interval = schedObj.interval;
                ease = schedObj.ease;
            }

            due = moment(Date.now() + interval * 24 * 3600 * 1000);
        } else {
            this.currentCard.interval = 1.0;
            this.currentCard.ease = this.plugin.data.settings.baseEase;
            if (this.currentCard.isDue)
                this.currentDeck.dueFlashcards.push(this.currentCard);
            else this.currentDeck.newFlashcards.push(this.currentCard);
            due = moment(Date.now());
            new Notice(t("Card's progress has been reset."));
            this.currentDeck.nextCard(this);
            return;
        }

        let dueString: string = due.format("YYYY-MM-DD");

        let fileText: string = await this.app.vault.read(this.currentCard.note);
        let replacementRegex = new RegExp(
            escapeRegexString(this.currentCard.cardText),
            "gm"
        );

        let sep: string = this.plugin.data.settings.cardCommentOnSameLine
            ? " "
            : "\n";

        // check if we're adding scheduling information to the flashcard
        // for the first time
        if (this.currentCard.cardText.lastIndexOf("<!--SR:") === -1) {
            this.currentCard.cardText =
                this.currentCard.cardText +
                sep +
                `<!--SR:!${dueString},${interval},${ease}-->`;
        } else {
            let scheduling: RegExpMatchArray[] = [
                ...this.currentCard.cardText.matchAll(
                    MULTI_SCHEDULING_EXTRACTOR
                ),
            ];

            let currCardSched: string[] = [
                "0",
                dueString,
                interval.toString(),
                ease.toString(),
            ];
            if (this.currentCard.isDue)
                scheduling[this.currentCard.siblingIdx] = currCardSched;
            else scheduling.push(currCardSched);

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
            (_) => this.currentCard.cardText
        );
        for (let sibling of this.currentCard.siblings)
            sibling.cardText = this.currentCard.cardText;
        if (this.plugin.data.settings.burySiblingCards)
            this.burySiblingCards(true);

        await this.app.vault.modify(this.currentCard.note, fileText);
        this.currentDeck.nextCard(this);
    }

    async burySiblingCards(tillNextDay: boolean): Promise<void> {
        if (tillNextDay) {
            this.plugin.data.buryList.push(cyrb53(this.currentCard.cardText));
            await this.plugin.savePluginData();
        }

        for (let sibling of this.currentCard.siblings) {
            let dueIdx = this.currentDeck.dueFlashcards.indexOf(sibling);
            let newIdx = this.currentDeck.newFlashcards.indexOf(sibling);

            if (dueIdx !== -1)
                this.currentDeck.deleteFlashcardAtIndex(
                    dueIdx,
                    this.currentDeck.dueFlashcards[dueIdx].isDue
                );
            else if (newIdx !== -1)
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
    ): Promise<void> {
        MarkdownRenderer.renderMarkdown(
            markdownString,
            containerEl,
            this.currentCard.note.path,
            this.plugin
        );
        containerEl.findAll(".internal-embed").forEach((el) => {
            let src: string = el.getAttribute("src")!;
            let target: TFile | null | false =
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
                            img.setAttribute(
                                "width",
                                el.getAttribute("width")!
                            );
                        else img.setAttribute("width", "100%");
                        if (el.hasAttribute("alt"))
                            img.setAttribute("alt", el.getAttribute("alt")!);
                    }
                );
                el.addClasses(["image-embed", "is-loaded"]);
            }

            // file does not exist
            // display dead link
            if (target === null) el.innerText = src;
        });
    }
}

export class Deck {
    public deckName: string;
    public newFlashcards: Card[];
    public newFlashcardsCount: number = 0; // counts those in subdecks too
    public dueFlashcards: Card[];
    public dueFlashcardsCount: number = 0; // counts those in subdecks too
    public totalFlashcards: number = 0; // counts those in subdecks too
    public subdecks: Deck[];
    public parent: Deck | null;

    constructor(deckName: string, parent: Deck | null) {
        this.deckName = deckName;
        this.newFlashcards = [];
        this.newFlashcardsCount = 0;
        this.dueFlashcards = [];
        this.dueFlashcardsCount = 0;
        this.totalFlashcards = 0;
        this.subdecks = [];
        this.parent = parent;
    }

    createDeck(deckPath: string[]): void {
        if (deckPath.length === 0) return;

        let deckName: string = deckPath.shift()!;
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.createDeck(deckPath);
                return;
            }
        }

        let deck: Deck = new Deck(deckName, this);
        this.subdecks.push(deck);
        deck.createDeck(deckPath);
    }

    insertFlashcard(deckPath: string[], cardObj: Card): void {
        if (cardObj.isDue) this.dueFlashcardsCount++;
        else this.newFlashcardsCount++;
        this.totalFlashcards++;

        if (deckPath.length === 0) {
            if (cardObj.isDue) this.dueFlashcards.push(cardObj);
            else this.newFlashcards.push(cardObj);
            return;
        }

        let deckName: string = deckPath.shift()!;
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.insertFlashcard(deckPath, cardObj);
                return;
            }
        }
    }

    // count flashcards that have either been buried
    // or aren't due yet
    countFlashcard(deckPath: string[], n: number = 1): void {
        this.totalFlashcards += n;

        let deckName: string = deckPath.shift()!;
        for (let deck of this.subdecks) {
            if (deckName === deck.deckName) {
                deck.countFlashcard(deckPath, n);
                return;
            }
        }
    }

    deleteFlashcardAtIndex(index: number, cardIsDue: boolean): void {
        if (cardIsDue) this.dueFlashcards.splice(index, 1);
        else this.newFlashcards.splice(index, 1);

        let deck: Deck | null = this;
        while (deck !== null) {
            if (cardIsDue) deck.dueFlashcardsCount--;
            else deck.newFlashcardsCount--;
            deck = deck.parent;
        }
    }

    sortSubdecksList(): void {
        this.subdecks.sort((a, b) => {
            if (a.deckName < b.deckName) return -1;
            else if (a.deckName > b.deckName) return 1;
            return 0;
        });

        for (let deck of this.subdecks) deck.sortSubdecksList();
    }

    render(containerEl: HTMLElement, modal: FlashcardModal): void {
        let deckView: HTMLElement = containerEl.createDiv("tree-item");

        let deckViewSelf: HTMLElement = deckView.createDiv(
            "tree-item-self tag-pane-tag is-clickable"
        );
        let collapsed: boolean = true;
        let collapseIconEl: HTMLElement | null = null;
        if (this.subdecks.length > 0) {
            collapseIconEl = deckViewSelf.createDiv(
                "tree-item-icon collapse-icon"
            );
            collapseIconEl.innerHTML = COLLAPSE_ICON;
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                "rotate(-90deg)";
        }

        let deckViewInner: HTMLElement =
            deckViewSelf.createDiv("tree-item-inner");
        deckViewInner.addEventListener("click", (_) => {
            modal.currentDeck = this;
            modal.checkDeck = this.parent!;
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
        if (this.subdecks.length > 0) {
            collapseIconEl!.addEventListener("click", (_) => {
                if (collapsed) {
                    (
                        collapseIconEl!.childNodes[0] as HTMLElement
                    ).style.transform = "";
                    deckViewChildren.style.display = "block";
                } else {
                    (
                        collapseIconEl!.childNodes[0] as HTMLElement
                    ).style.transform = "rotate(-90deg)";
                    deckViewChildren.style.display = "none";
                }
                collapsed = !collapsed;
            });
        }
        for (let deck of this.subdecks) deck.render(deckViewChildren, modal);
    }

    nextCard(modal: FlashcardModal): void {
        if (this.newFlashcards.length + this.dueFlashcards.length === 0) {
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
            else this.parent!.nextCard(modal);
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
            if (modal.plugin.data.settings.randomizeCardOrder)
                modal.currentCardIdx = Math.floor(
                    Math.random() * this.dueFlashcards.length
                );
            else modal.currentCardIdx = 0;
            modal.currentCard = this.dueFlashcards[modal.currentCardIdx];
            modal.renderMarkdownWrapper(
                modal.currentCard.front,
                modal.flashcardView
            );

            let hardInterval: number = schedule(
                ReviewResponse.Hard,
                modal.currentCard.interval!,
                modal.currentCard.ease!,
                modal.currentCard.delayBeforeReview!,
                modal.plugin.data.settings
            ).interval;
            let goodInterval: number = schedule(
                ReviewResponse.Good,
                modal.currentCard.interval!,
                modal.currentCard.ease!,
                modal.currentCard.delayBeforeReview!,
                modal.plugin.data.settings
            ).interval;
            let easyInterval: number = schedule(
                ReviewResponse.Easy,
                modal.currentCard.interval!,
                modal.currentCard.ease!,
                modal.currentCard.delayBeforeReview!,
                modal.plugin.data.settings
            ).interval;

            if (Platform.isMobile) {
                modal.hardBtn.setText(textInterval(hardInterval, true));
                modal.goodBtn.setText(textInterval(goodInterval, true));
                modal.easyBtn.setText(textInterval(easyInterval, true));
            } else {
                modal.hardBtn.setText(
                    t("Hard") + " - " + textInterval(hardInterval, false)
                );
                modal.goodBtn.setText(
                    t("Good") + " - " + textInterval(goodInterval, false)
                );
                modal.easyBtn.setText(
                    t("Easy") + " - " + textInterval(easyInterval, false)
                );
            }
        } else if (this.newFlashcards.length > 0) {
            if (modal.plugin.data.settings.randomizeCardOrder)
                modal.currentCardIdx = Math.floor(
                    Math.random() * this.newFlashcards.length
                );
            else modal.currentCardIdx = 0;
            modal.currentCard = this.newFlashcards[modal.currentCardIdx];
            modal.renderMarkdownWrapper(
                modal.currentCard.front,
                modal.flashcardView
            );

            if (Platform.isMobile) {
                modal.hardBtn.setText("1.0d");
                modal.goodBtn.setText("2.5d");
                modal.easyBtn.setText("3.5d");
            } else {
                modal.hardBtn.setText(t("Hard") + " - 1.0 " + t("day"));
                modal.goodBtn.setText(t("Good") + " - 2.5 " + t("days"));
                modal.easyBtn.setText(t("Easy") + " - 3.5 " + t("days"));
            }
        }

        if (modal.plugin.data.settings.showContextInCards)
            modal.contextView.setText(modal.currentCard.context);
        if (modal.plugin.data.settings.showFileNameInFileLink)
            modal.fileLinkView.setText(modal.currentCard.note.basename);
    }
}
