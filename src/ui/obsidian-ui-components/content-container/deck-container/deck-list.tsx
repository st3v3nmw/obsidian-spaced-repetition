import "src/ui/obsidian-ui-components/content-container/deck-container/deck-list.css";

import { DeckStats, IFlashcardReviewSequencer } from "src/card/flashcard-review-sequencer";
import { COLLAPSE_ICON } from "src/constants";
import { Deck } from "src/deck/deck";
import { t } from "src/lang/helpers";
import { SRSettings } from "src/settings";

export default class DeckListComponent {
    private scrollWrapper: HTMLDivElement;
    private content: HTMLDivElement;
    private treeContainer: HTMLDivElement;

    private treeHeaderRow: HTMLDivElement;
    private treeHeaderRowSelf: HTMLDivElement;
    private treeHeaderRowInner: HTMLDivElement;
    private treeHeaderRowText: HTMLDivElement;
    private treeHeaderRowTextSpan: HTMLSpanElement;
    private treeHeaderRowNumbersWrapper: HTMLDivElement;

    private dueCardsText: HTMLDivElement;
    private newCardsText: HTMLDivElement;
    private reviewedCardsText: HTMLDivElement;
    private totalCardsText: HTMLDivElement;

    private startReviewOfDeck: (deck: Deck) => void;

    public constructor(parentEl: HTMLElement, startReviewOfDeck: (deck: Deck) => void) {
        this.startReviewOfDeck = startReviewOfDeck;
        // Prep main container
        this.scrollWrapper = parentEl.createDiv();
        this.scrollWrapper.addClass("sr-scroll-wrapper");

        this.content = this.scrollWrapper.createDiv();
        this.content.addClass("sr-content");

        // Prep header row
        this.treeHeaderRow = this.content.createDiv();
        this.treeHeaderRow.addClass("sr-tree-row");
        this.treeHeaderRow.addClass("sr-header-row");
        this.treeHeaderRow.addClass("tree-item");
        this.treeHeaderRow.addClass("sr-tree-item-container");

        this.treeHeaderRowSelf = this.treeHeaderRow.createDiv();
        this.treeHeaderRowSelf.addClass("tree-item-self");
        this.treeHeaderRowSelf.addClass("sr-tree-item-row");

        this.treeHeaderRowInner = this.treeHeaderRowSelf.createDiv("tree-item-inner");
        this.treeHeaderRowText = this.treeHeaderRowInner.createDiv("tag-pane-tag-text");
        this.treeHeaderRowTextSpan = this.treeHeaderRowText.createSpan("tag-pane-tag-self");
        this.treeHeaderRowTextSpan.addClass("sr-tree-row-text");
        this.treeHeaderRowTextSpan.setText("Title"); // TODO: i18n

        this.treeHeaderRowNumbersWrapper = this.treeHeaderRowSelf.createDiv();
        this.treeHeaderRowNumbersWrapper.addClasses([
            "tree-item-flair-outer",
            "sr-tree-stats-container",
        ]);
        this.treeHeaderRowNumbersWrapper.addClass("sr-tree-row-numbers-wrapper");
        this.treeHeaderRowNumbersWrapper.addClass("sr-tree-stats-container");

        this.dueCardsText = this.treeHeaderRowNumbersWrapper.createDiv();
        this.dueCardsText.addClass("sr-tree-numbers-text");
        this.dueCardsText.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-tree-stats-count",
            "sr-fg-green",
        ]);
        this.dueCardsText.setText(t("DUE"));

        this.newCardsText = this.treeHeaderRowNumbersWrapper.createDiv();
        this.newCardsText.addClass("sr-tree-numbers-text");
        this.newCardsText.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-tree-stats-count",
            "sr-fg-blue",
        ]);
        this.newCardsText.setText(t("NEW"));

        this.reviewedCardsText = this.treeHeaderRowNumbersWrapper.createDiv();
        this.reviewedCardsText.addClass("sr-tree-numbers-text");
        this.reviewedCardsText.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-tree-stats-count",
            "sr-fg-yellow",
        ]);
        this.reviewedCardsText.setText(t("SEEN"));

        this.totalCardsText = this.treeHeaderRowNumbersWrapper.createDiv();
        this.totalCardsText.addClass("sr-tree-numbers-text");
        this.totalCardsText.addClasses([
            "tag-pane-tag-count",
            "tree-item-flair",
            "sr-tree-stats-count",
            "sr-fg-red",
        ]);
        this.totalCardsText.setText(t("TOTAL"));

        // Prep tree container
        this.treeContainer = this.content.createDiv("sr-tree-container");
    }

    /**
     * Redraws the deck list.
     * @param startReviewOfDeck - Callback for starting the review of a deck.
     * @param settings - The settings object.
     * @param reviewSequencer - The review sequencer object.
     */
    redraw(reviewSequencer: IFlashcardReviewSequencer, settings: SRSettings) {
        this.treeContainer.empty();
        const originDeckStats = reviewSequencer.getDeckStats(
            reviewSequencer.originalDeckTree.getTopicPath(),
        );

        // Creates the "All Decks" row
        this._crateTreeRow(
            "All Decks",
            originDeckStats,
            0,
            this.treeContainer,
            false,
            reviewSequencer.originalDeckTree,
            this.startReviewOfDeck,
        );

        for (const subdeck of reviewSequencer.originalDeckTree.subdecks) {
            // Create the tree row for each deck
            this._createTree(
                subdeck,
                this.treeContainer,
                reviewSequencer,
                settings,
                this.startReviewOfDeck,
            );
        }
    }

    private _createTree(
        deck: Deck,
        parentEl: HTMLDivElement,
        reviewSequencer: IFlashcardReviewSequencer,
        settings: SRSettings,
        startReviewOfDeck: (deck: Deck) => void,
    ) {
        const deckStats = reviewSequencer.getDeckStats(deck.getTopicPath());

        // Create the tree row for the deck
        const treeRowChildren = this._crateTreeRow(
            deck.deckName,
            deckStats,
            deck.subdecks.length,
            parentEl,
            settings.initiallyExpandAllSubdecksInTree,
            deck,
            startReviewOfDeck,
        );

        for (const subdeck of deck.subdecks) {
            // Create the tree row for each subdeck
            this._createTree(
                subdeck,
                treeRowChildren,
                reviewSequencer,
                settings,
                startReviewOfDeck,
            );
        }
    }

    private _crateTreeRow(
        deckName: string,
        deckStats: DeckStats,
        numOfSubdecks: number,
        parentEl: HTMLDivElement,
        initiallyExpanded: boolean = false,
        deck: Deck | null = null,
        startReviewOfDeck: (deck: Deck) => void = () => {},
    ): HTMLDivElement {
        const disableInteraction = deck === null;
        const treeRow = parentEl.createDiv();
        treeRow.addClass("sr-tree-row");
        treeRow.addClass("tree-item");
        treeRow.addClass("sr-tree-item-container");

        const treeRowSelf = treeRow.createDiv();
        treeRowSelf.addClass("tree-item-self");
        if (!disableInteraction) {
            treeRowSelf.addClass("tag-pane-tag");
        }
        treeRowSelf.addClass("sr-tree-item-row");

        let collapsed = !initiallyExpanded;
        const collapseIconEl = treeRowSelf.createDiv("tree-item-icon collapse-icon");
        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed) collapseIconEl.addClass("is-collapsed");
        if (numOfSubdecks === 0) collapseIconEl.style.display = "none";

        const treeRowInner: HTMLElement = treeRowSelf.createDiv("tree-item-inner");
        const treeRowInnerText: HTMLElement = treeRowInner.createDiv("tag-pane-tag-text");
        const treeRowInnerTextSpan: HTMLElement = treeRowInnerText.createSpan("tag-pane-tag-self");
        treeRowInnerTextSpan.setText(deckName);

        const treeRowOuter: HTMLDivElement = treeRowSelf.createDiv();
        treeRowOuter.addClasses(["tree-item-flair-outer", "sr-tree-stats-container"]);

        const treeRowChildren: HTMLDivElement = treeRow.createDiv("tree-item-children");
        treeRowChildren.style.display = collapsed ? "none" : "block";

        if (disableInteraction || (deckStats.dueCount === 0 && deckStats.newCount === 0)) {
            if (!disableInteraction) {
                treeRowSelf.addClass("is-disabled");
            }
        } else {
            treeRowSelf.addClass("is-clickable");
            collapseIconEl.addEventListener("click", (e) => {
                if (collapsed) {
                    collapseIconEl.removeClass("is-collapsed");
                    treeRowChildren.style.display = "block";
                } else {
                    collapseIconEl.addClass("is-collapsed");
                    treeRowChildren.style.display = "none";
                }

                // We stop the propagation of the event so that the click event for treeRowSelf doesn't get called
                // if the user clicks on the collapse icon
                e.stopPropagation();
                collapsed = !collapsed;
            });
        }

        // Add the click handler to treeRowSelf instead of treeRowInner so that it activates
        // over the entire rectangle of the tree item, not just the text of the topic name
        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/709

        if (!disableInteraction) {
            treeRowSelf.addEventListener("click", () => {
                startReviewOfDeck(deck);
            });
        }

        this._createStatsInRow(treeRowOuter, deckStats);
        return treeRowChildren;
    }

    private _createStatsInRow(parentEl: HTMLDivElement, deckStats: DeckStats) {
        parentEl.empty();

        this._createStatsContainer(t("DUE_CARDS"), deckStats.dueCount, "sr-bg-green", parentEl);
        this._createStatsContainer(t("NEW_CARDS"), deckStats.newCount, "sr-bg-blue", parentEl);
        const reviewedCards: number =
            deckStats.totalCount - deckStats.newCount - deckStats.dueCount;
        this._createStatsContainer(t("SEEN_CARDS"), reviewedCards, "sr-bg-yellow", parentEl);
        this._createStatsContainer(t("TOTAL_CARDS"), deckStats.totalCount, "sr-bg-red", parentEl);
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
