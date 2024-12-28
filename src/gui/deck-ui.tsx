// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { COLLAPSE_ICON } from "src/constants";
import { Deck } from "src/deck";
import {
    DeckStats,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/flashcard-review-sequencer";
import { FlashcardMode } from "src/gui/sr-modal";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import { TopicPath } from "src/topic-path";

export class DeckUI {
    public plugin: SRPlugin;
    public mode: FlashcardMode;
    public contentEl: HTMLElement;

    public view: HTMLDivElement;
    public header: HTMLDivElement;
    public title: HTMLDivElement;
    public stats: HTMLDivElement;
    public headerDivider: HTMLHRElement;
    public content: HTMLDivElement;

    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private startReviewOfDeck: (deck: Deck) => void;

    constructor(
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        view: HTMLDivElement,
        startReviewOfDeck: (deck: Deck) => void,
    ) {
        // Init properties
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.view = view;
        this.startReviewOfDeck = startReviewOfDeck;

        // Build ui
        this.init();
    }

    /**
     * Initializes all static elements in the DeckListView
     */
    init(): void {
        this.view.addClasses(["sr-deck-list", "sr-is-hidden"]);

        this.header = this.view.createDiv();
        this.header.addClass("sr-header");

        this.title = this.header.createDiv();
        this.title.addClass("sr-title");
        this.title.setText(t("DECKS"));

        this.stats = this.header.createDiv();
        this.stats.addClass("sr-header-stats-container");
        this._createHeaderStats();

        this.headerDivider = this.view.createEl("hr");

        this.content = this.view.createDiv();
        this.content.addClass("sr-content");
    }

    /**
     * Shows the DeckListView & rerenders dynamic elements
     */
    show(): void {
        this.mode = FlashcardMode.Deck;

        // Redraw in case the stats have changed
        this._createHeaderStats();

        this.content.empty();
        for (const deck of this.reviewSequencer.originalDeckTree.subdecks) {
            this._createTree(deck, this.content);
        }

        if (this.view.hasClass("sr-is-hidden")) {
            this.view.removeClass("sr-is-hidden");
        }
    }

    /**
     * Hides the DeckListView
     */
    hide() {
        if (!this.view.hasClass("sr-is-hidden")) {
            this.view.addClass("sr-is-hidden");
        }
    }

    /**
     * Closes the DeckListView
     */
    close() {
        this.hide();
    }

    // -> Header

    private _createHeaderStats() {
        const statistics: DeckStats = this.reviewSequencer.getDeckStats(TopicPath.emptyPath);
        this.stats.empty();

        this._createHeaderStatsContainer(t("DUE_CARDS"), statistics.dueCount, "sr-bg-green");
        this._createHeaderStatsContainer(t("NEW_CARDS"), statistics.newCount, "sr-bg-blue");
        this._createHeaderStatsContainer(t("TOTAL_CARDS"), statistics.totalCount, "sr-bg-red");
    }

    private _createHeaderStatsContainer(
        statsLable: string,
        statsNumber: number,
        statsClass: string,
    ): void {
        const statsContainer = this.stats.createDiv();
        statsContainer.ariaLabel = statsLable;
        statsContainer.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-header-stats-count",
            statsClass,
        ]);

        const lable = statsContainer.createDiv();
        lable.setText(statsLable + ":");

        const number = statsContainer.createDiv();
        number.setText(statsNumber.toString());
    }

    // -> Tree content

    private _createTree(deck: Deck, container: HTMLElement): void {
        const deckTree: HTMLElement = container.createDiv("tree-item sr-tree-item-container");
        const deckTreeSelf: HTMLElement = deckTree.createDiv(
            "tree-item-self tag-pane-tag is-clickable sr-tree-item-row",
        );

        const shouldBeInitiallyExpanded: boolean = this.settings.initiallyExpandAllSubdecksInTree;
        let collapsed = !shouldBeInitiallyExpanded;
        let collapseIconEl: HTMLElement | null = null;
        if (deck.subdecks.length > 0) {
            collapseIconEl = deckTreeSelf.createDiv("tree-item-icon collapse-icon");
            collapseIconEl.innerHTML = COLLAPSE_ICON;
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = collapsed
                ? "rotate(-90deg)"
                : "";
        }

        const deckTreeInner: HTMLElement = deckTreeSelf.createDiv("tree-item-inner");
        const deckTreeInnerText: HTMLElement = deckTreeInner.createDiv("tag-pane-tag-text");
        deckTreeInnerText.innerHTML += <span class="tag-pane-tag-self">{deck.deckName}</span>;

        const deckTreeOuter: HTMLDivElement = deckTreeSelf.createDiv();
        deckTreeOuter.addClasses(["tree-item-flair-outer", "sr-tree-stats-container"]);

        const deckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        this._createStats(deckStats, deckTreeOuter);

        const deckTreeChildren: HTMLElement = deckTree.createDiv("tree-item-children");
        deckTreeChildren.style.display = collapsed ? "none" : "block";
        if (deck.subdecks.length > 0) {
            collapseIconEl.addEventListener("click", (e) => {
                if (collapsed) {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
                    deckTreeChildren.style.display = "block";
                } else {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                        "rotate(-90deg)";
                    deckTreeChildren.style.display = "none";
                }

                // We stop the propagation of the event so that the click event for deckTreeSelf doesn't get called
                // if the user clicks on the collapse icon
                e.stopPropagation();
                collapsed = !collapsed;
            });
        }

        // Add the click handler to deckTreeSelf instead of deckTreeInner so that it activates
        // over the entire rectangle of the tree item, not just the text of the topic name
        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/709
        deckTreeSelf.addEventListener("click", () => {
            this.startReviewOfDeck(deck);
        });

        for (const subdeck of deck.subdecks) {
            this._createTree(subdeck, deckTreeChildren);
        }
    }

    private _createStats(statistics: DeckStats, statsWrapper: HTMLDivElement) {
        statsWrapper.empty();

        this._createStatsContainer(
            t("DUE_CARDS"),
            statistics.dueCount,
            "sr-bg-green",
            statsWrapper,
        );
        this._createStatsContainer(t("NEW_CARDS"), statistics.newCount, "sr-bg-blue", statsWrapper);
        this._createStatsContainer(
            t("TOTAL_CARDS"),
            statistics.totalCount,
            "sr-bg-red",
            statsWrapper,
        );
    }

    private _createStatsContainer(
        statsLable: string,
        statsNumber: number,
        statsClass: string,
        statsWrapper: HTMLDivElement,
    ): void {
        const statsContainer = statsWrapper.createDiv();

        statsContainer.ariaLabel = statsLable;

        statsContainer.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-tree-stats-count",
            statsClass,
        ]);

        statsContainer.setText(statsNumber.toString());
    }
}
