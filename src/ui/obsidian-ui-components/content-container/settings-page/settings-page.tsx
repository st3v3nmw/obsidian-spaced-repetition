import { ButtonComponent, setIcon } from "obsidian";

import SRPlugin from "src/main";
import {
    getPageIcon,
    getPageName,
    SettingsPageType,
} from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";

/**
 * Represents a settings page.
 *
 * @class SettingsPage
 */
export abstract class SettingsPage {
    protected pageContainerEl: HTMLElement;
    protected pageHeaderEl: HTMLElement;
    protected backButton: ButtonComponent;
    protected titleWrapperEl: HTMLElement;
    protected titleIconEl: HTMLElement;
    protected titleEl: HTMLElement;

    protected containerEl: HTMLElement;
    protected plugin: SRPlugin;
    protected pageType: SettingsPageType;
    protected applySettingsUpdate: (callback: () => unknown) => void;
    protected display: () => void; // Needed for some pages. TODO: Refactor this into some unified way.
    protected openPage: (pageType: SettingsPageType) => void;
    protected scrollListener: (scrollPosition: number) => void;

    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        this.plugin = plugin;
        this.pageType = pageType;
        this.display = display;
        this.applySettingsUpdate = applySettingsUpdate;
        this.openPage = openPage;
        this.scrollListener = scrollListener;

        this.pageContainerEl = pageContainerEl;
        this.pageContainerEl.addClass("sr-settings-page");
        this.pageContainerEl.addClass("sr-is-hidden");

        this.pageHeaderEl = this.pageContainerEl.createDiv();
        this.pageHeaderEl.addClass("sr-settings-page-header");
        this.pageHeaderEl.addEventListener("click", () => {
            this.backToMainPage();
        });
        if (pageType === "main-page") this.pageHeaderEl.addClass("sr-is-hidden");

        this.backButton = new ButtonComponent(this.pageHeaderEl);
        this.backButton.setClass("sr-settings-page-back-button");
        this.backButton.setClass("clickable-icon");
        this.backButton.setIcon("chevron-left");
        this.backButton.onClick(() => {
            this.backToMainPage();
        });

        this.titleWrapperEl = this.pageHeaderEl.createDiv();
        this.titleWrapperEl.addClass("sr-settings-page-title-wrapper");

        this.titleIconEl = this.titleWrapperEl.createDiv();
        this.titleIconEl.addClass("sr-settings-page-title-icon");
        setIcon(this.titleIconEl, getPageIcon(pageType));

        this.titleEl = this.titleWrapperEl.createDiv();
        this.titleEl.addClass("sr-settings-page-title");
        this.titleEl.insertAdjacentHTML("beforeend", getPageName(pageType));

        this.containerEl = this.pageContainerEl.createDiv();
        this.containerEl.addClass("sr-settings-page-content");
        this.containerEl.addEventListener("scroll", (_) => {
            this.scrollListener(this.containerEl.scrollTop);
        });
    }

    /**
     * Scrolls to the specified position.
     */
    public scrollTo(scrollPosition: number): void {
        this.containerEl.scrollTo({
            top: scrollPosition,
            behavior: "auto",
        });
    }

    /**
     * Gets the SettingsPage type.
     */
    public getPageType(): SettingsPageType {
        return this.pageType;
    }

    /**
     * Destroys the SettingsPage. Run any cleanup code here.
     */
    public destroy(): void {
        this.removeScrollListener();
    }

    /**
     * Removes the scroll listener from the SettingsPage.
     */
    public removeScrollListener(): void {
        this.containerEl.removeEventListener("scroll", (_) => {
            this.scrollListener(this.containerEl.scrollTop);
        });
    }

    /**
     * Adds the scroll listener to the SettingsPage.
     */
    public addScrollListener(): void {
        this.containerEl.addEventListener("scroll", (_) => {
            this.scrollListener(this.containerEl.scrollTop);
        });
    }

    /**
     * Renders the SettingsPage. Run any UI code here.
     */
    public render?(): void;

    /**
     * Shows the SettingsPage.
     */
    public show(): void {
        if (this.pageContainerEl.hasClass("sr-is-hidden")) {
            this.pageContainerEl.removeClass("sr-is-hidden");
            this.addScrollListener();
        }
    }

    /**
     * Hides the SettingsPage.
     */
    public hide(): void {
        if (!this.pageContainerEl.hasClass("sr-is-hidden")) {
            this.pageContainerEl.addClass("sr-is-hidden");
            this.removeScrollListener();
        }
    }

    /**
     * Backs to the main page.
     */
    protected backToMainPage(): void {
        this.openPage("main-page");
    }
}
