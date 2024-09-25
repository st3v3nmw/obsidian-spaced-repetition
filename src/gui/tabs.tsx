/*
 * 'Shell commands' plugin for Obsidian.
 * Copyright (C) 2021 - 2023 Jarkko Linnanvirta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.0 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact the author (Jarkko Linnanvirta): https://github.com/Taitava/
 */
import { setIcon } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

export interface Tab {
    title: string;
    icon: string;
    contentGenerator: (containerElement: HTMLElement) => Promise<void>;
}

export interface TabStructure {
    header: HTMLElement;
    activeTabId: string;
    buttons: {
        [key: string]: HTMLElement;
    };
    contentContainers: {
        [key: string]: HTMLElement;
    };
    contentGeneratorPromises: {
        [key: string]: Promise<void>;
    };
}

export interface Tabs {
    [key: string]: Tab;
}

interface TabContentContainers {
    [key: string]: HTMLElement;
}

interface TabButtons {
    [key: string]: HTMLElement;
}

export function createTabs(
    containerElement: HTMLElement,
    tabs: Tabs,
    activateTabId: string,
): TabStructure {
    const tabHeader = containerElement.createEl("div", {
        attr: { class: "sr-tab-header" },
    });
    const tabContentContainers: TabContentContainers = {};
    const tabButtons: TabButtons = {};
    const tabStructure: TabStructure = {
        header: tabHeader,
        // Indicate that the first tab is active.
        // This does not affect what tab is active in practice, it just reports the active tab.
        activeTabId: Object.keys(tabs)[0] as string,
        buttons: tabButtons,
        contentContainers: tabContentContainers,
        contentGeneratorPromises: {},
    };
    let firstButton: HTMLElement | undefined;
    for (const tabId in tabs) {
        const tab = tabs[tabId];

        // Create button
        const button = tabHeader.createEl("button", {
            attr: {
                class: "sr-tab-header-button",
                activateTab: "sr-tab-" + tabId,
            },
        });
        button.onclick = function (event: MouseEvent) {
            // Use 'this' instead of event.target because this way we'll always get a button element,
            //  not an element inside the  button (i.e. an icon).
            const tabButton = this as HTMLElement;

            // Hide all tab contents and get the max dimensions
            let maxWidth = 0;
            let maxHeight = 0;
            const tabHeader = tabButton.parentElement;
            if (null === tabHeader) {
                throw new Error("Tab header is missing. Did not get a parent from tab button.");
            }
            const containerElement = tabHeader.parentElement;
            if (null === containerElement) {
                throw new Error(
                    "Container element is missing. Did not get a parent from tab header.",
                );
            }

            // Do not get all tab contents that exist,
            //  because there might be multiple tab systems open at the same time.
            const tabContents = containerElement.findAll("div.sr-tab-content");
            const isMainSettingsModal = containerElement.hasClass("vertical-tab-content");
            for (const index in tabContents) {
                const tabContent = tabContents[index];

                // Get the maximum tab dimensions so that all tabs can have the same dimensions.
                // But don't do it if this is the main settings modal
                if (!isMainSettingsModal) {
                    // Need to make the tab visible temporarily in order to get the dimensions.
                    tabContent.addClass("sr-tab-active");
                    if (tabContent.offsetHeight > maxHeight) {
                        maxHeight = tabContent.offsetHeight;
                    }
                    if (tabContent.offsetWidth > maxWidth) {
                        maxWidth = tabContent.offsetWidth;
                    }
                }

                // Finally hide the tab
                tabContent.removeClass("sr-tab-active");
            }

            // Remove active status from all buttons
            // Do not get all tab buttons that exist,
            //  because there might be multiple tab systems open at the same time.
            const adjacentTabButtons = tabHeader.findAll(".sr-tab-header-button");
            for (const index in adjacentTabButtons) {
                const tabButton = adjacentTabButtons[index];
                tabButton.removeClass("sr-tab-active");
            }

            // Activate the clicked tab
            tabButton.addClass("sr-tab-active");
            const activateTabAttribute: Attr | null =
                tabButton.attributes.getNamedItem("activateTab");
            if (null === activateTabAttribute) {
                throw new Error("Tab button has no 'activateTab' HTML attribute! Murr!");
            }
            const activateTabId = activateTabAttribute.value;
            const tabContent: HTMLElement | null = document.getElementById(activateTabId);
            if (null === tabContent) {
                throw new Error(
                    "No tab content was found with activate_tab_id '" + activateTabId + "'! Hmph!",
                );
            }
            tabContent.addClass("sr-tab-active");

            // Mark the clicked tab as active in TabStructure (just to report which tab is currently active)
            // Remove "sr-tab" prefix.
            tabStructure.activeTabId = activateTabId.replace(/^sr-tab-/, "");

            // Focus an element (if a focusable element is present)
            // ? = If not found, do nothing.
            tabContent.find(".sr-focus-element-on-tab-opening")?.focus();

            // Apply the max dimensions to this tab
            // But don't do it if this is the main settings modal
            if (!isMainSettingsModal) {
                tabContent.style.width = maxWidth + "px";
                tabContent.style.height = maxHeight + "px";
            }

            // Do nothing else (I don't know if this is needed or not)
            event.preventDefault();
        };
        if (tab.icon) setIcon(button, tab.icon);

        button.insertAdjacentHTML("beforeend", <span style="padding-left: 5px;">{tab.title}</span>);
        tabButtons[tabId] = button;

        // Create content container
        tabContentContainers[tabId] = containerElement.createEl("div", {
            attr: { class: "sr-tab-content", id: "sr-tab-" + tabId },
        });

        // Generate content
        tabStructure.contentGeneratorPromises[tabId] = tab.contentGenerator(
            tabContentContainers[tabId],
        );

        // Memorize the first tab's button
        if (undefined === firstButton) {
            firstButton = button;
        }
    }

    // Open a tab.
    tabButtons[activateTabId].click();

    // Return the TabStructure
    return tabStructure;
}
