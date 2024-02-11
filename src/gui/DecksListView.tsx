import { Platform } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import { COLLAPSE_ICON } from "src/constants";
import { t } from "src/lang/helpers";
import { Deck } from "../Deck";
import {
    DeckStats,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { FlashcardModalMode } from "./flashcard-modal";

export class DecksListView {
    public plugin: SRPlugin;
    public mode: FlashcardModalMode;
    public modalContentEl: HTMLElement;

    public view: HTMLDivElement;
    public header: HTMLDivElement;
    public title: HTMLDivElement;
    public stats: HTMLDivElement;
    public content: HTMLDivElement;

    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private startReviewOfDeck: (deck: Deck) => void;

    constructor(
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        contentEl: HTMLElement,
        startReviewOfDeck: (deck: Deck) => void,
    ) {
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.modalContentEl = contentEl;
        this.startReviewOfDeck = startReviewOfDeck;
        this.init();
    }

    /**
     * Initializes all elements in the DeckListView
     */
    init(): void {
        this.view = this.modalContentEl.createDiv();
        this.view.addClasses(["sr-deck-list", "sr-is-hidden"]);

        this.header = this.view.createDiv();
        this.header.addClass("sr-header");

        this.title = this.header.createDiv();
        this.title.addClass("sr-title");
        this.title.setText(t("DECKS"));

        this.stats = this.header.createDiv();
        this.stats.addClass("sr-header-stats-container");
        this._createHeaderStats();

        this.content = this.view.createDiv();
        this.content.addClass("sr-content");
    }

    /**
     * Shows the DeckListView
     */
    show(): void {
        this.mode = FlashcardModalMode.DecksList;

        // Redraw in case the stats have changed
        this._createHeaderStats();

        this.content.empty();

        for (const deck of this.reviewSequencer.originalDeckTree.subdecks) {
            this._renderDeck(deck, this.content);
        }

        this.view.removeClass("sr-is-hidden");
    }

    /**
     * Hides the DeckListView
     */
    hide() {
        this.view.addClass("sr-is-hidden");
    }

    private _createHeaderStats() {
        const statistics: DeckStats = this.reviewSequencer.getDeckStats(TopicPath.emptyPath);
        this.stats.empty();

        this._createHeaderStatsContainer(t("TOTAL_CARDS"), statistics.totalCount, "sr-bg-red");
        this._createHeaderStatsContainer(t("NEW_CARDS"), statistics.newCount, "sr-bg-blue");
        this._createHeaderStatsContainer(t("DUE_CARDS"), statistics.dueCount, "sr-bg-green");
    }

    private _createHeaderStatsContainer(statsLable: string, statsNumber: number, statsClass: string): void {
        const statsContainer = this.stats.createDiv();
        statsContainer.ariaLabel = statsLable;
        statsContainer.addClasses(["tag-pane-tag-count", "tree-item-flair", "sr-header-stats-count", statsClass]);

        const lable = statsContainer.createDiv();
        lable.setText(statsLable);
        const number = statsContainer.createDiv();
        number.setText(statsNumber.toString());
    }

    private _renderDeck(deck: Deck, containerEl: HTMLElement): void {
        const deckView: HTMLElement = containerEl.createDiv("tree-item");

        const deckViewSelf: HTMLElement = deckView.createDiv(
            "tree-item-self tag-pane-tag is-clickable",
        );
        const shouldBeInitiallyExpanded: boolean = this.settings.initiallyExpandAllSubdecksInTree;
        let collapsed = !shouldBeInitiallyExpanded;
        let collapseIconEl: HTMLElement | null = null;
        if (deck.subdecks.length > 0) {
            collapseIconEl = deckViewSelf.createDiv("tree-item-icon collapse-icon");
            collapseIconEl.innerHTML = COLLAPSE_ICON;
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = collapsed
                ? "rotate(-90deg)"
                : "";
        }

        const deckViewInner: HTMLElement = deckViewSelf.createDiv("tree-item-inner");
        const deckViewInnerText: HTMLElement = deckViewInner.createDiv("tag-pane-tag-text");
        deckViewInnerText.innerHTML += <span class="tag-pane-tag-self">{deck.deckName}</span>;
        const deckViewOuter: HTMLElement = deckViewSelf.createDiv("tree-item-flair-outer");
        const deckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        deckViewOuter.innerHTML += (
            <span>
                <span
                    style="background-color:#4caf50;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.dueCount.toString()}
                </span>
                <span
                    style="background-color:#2196f3;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.newCount.toString()}
                </span>
                <span
                    style="background-color:#ff7043;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.totalCount.toString()}
                </span>
            </span>
        );

        const deckViewChildren: HTMLElement = deckView.createDiv("tree-item-children");
        deckViewChildren.style.display = collapsed ? "none" : "block";
        if (deck.subdecks.length > 0) {
            collapseIconEl.addEventListener("click", (e) => {
                if (collapsed) {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
                    deckViewChildren.style.display = "block";
                } else {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                        "rotate(-90deg)";
                    deckViewChildren.style.display = "none";
                }

                // We stop the propagation of the event so that the click event for deckViewSelf doesn't get called
                // if the user clicks on the collapse icon
                e.stopPropagation();
                collapsed = !collapsed;
            });
        }

        // Add the click handler to deckViewSelf instead of deckViewInner so that it activates
        // over the entire rectangle of the tree item, not just the text of the topic name
        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/709
        deckViewSelf.addEventListener("click", () => {
            this.startReviewOfDeck(deck);
        });

        for (const subdeck of deck.subdecks) {
            this._renderDeck(subdeck, deckViewChildren);
        }
    }
}
