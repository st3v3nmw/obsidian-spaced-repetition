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

export interface Tab {
    title: string;
    icon: string;
    content_generator: (container_element: HTMLElement) => Promise<void>;
}

export interface TabStructure {
    header: HTMLElement;
    active_tab_id: string;
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
    container_element: HTMLElement,
    tabs: Tabs,
    activateTabId: string,
): TabStructure {
    const tab_header = container_element.createEl("div", { attr: { class: "sr-tab-header" } });
    const tab_content_containers: TabContentContainers = {};
    const tab_buttons: TabButtons = {};
    const tab_structure: TabStructure = {
        header: tab_header,
        active_tab_id: Object.keys(tabs)[0] as string, // Indicate that the first tab is active. This does not affect what tab is active in practise, it just reports the active tab.
        buttons: tab_buttons,
        contentContainers: tab_content_containers,
        contentGeneratorPromises: {},
    };
    let first_button: HTMLElement | undefined;
    for (const tab_id in tabs) {
        const tab = tabs[tab_id];

        // Create button
        const button = tab_header.createEl("button", {
            attr: {
                class: "sr-tab-header-button",
                activateTab: "sr-tab-" + tab_id,
            },
        });
        button.onclick = function (event: MouseEvent) {
            const tab_button = this as HTMLElement; // Use 'this' instead of event.target because this way we'll always get a button element, not an element inside the  button (i.e. an icon).

            // Hide all tab contents and get the max dimensions
            let max_width = 0;
            let max_height = 0;
            const tab_header = tab_button.parentElement;
            if (null === tab_header) {
                throw new Error("Tab header is missing. Did not get a parent from tab button.");
            }
            const container_element = tab_header.parentElement;
            if (null === container_element) {
                throw new Error(
                    "Container element is missing. Did not get a parent from tab header.",
                );
            }
            const tab_contents = container_element.findAll("div.sr-tab-content"); // Do not get all tab contents that exist, because there might be multiple tab systems open at the same time.
            const is_main_settings_modal = container_element.hasClass("vertical-tab-content");
            for (const index in tab_contents) {
                const tab_content = tab_contents[index];

                // Get the maximum tab dimensions so that all tabs can have the same dimensions.
                // But don't do it if this is the main settings modal
                if (!is_main_settings_modal) {
                    tab_content.addClass("sr-tab-active"); // Need to make the tab visible temporarily in order to get the dimensions.
                    if (tab_content.offsetHeight > max_height) {
                        max_height = tab_content.offsetHeight;
                    }
                    if (tab_content.offsetWidth > max_width) {
                        max_width = tab_content.offsetWidth;
                    }
                }

                // Finally hide the tab
                tab_content.removeClass("sr-tab-active");
            }

            // Remove active status from all buttons
            const adjacent_tab_buttons = tab_header.findAll(".sr-tab-header-button"); // Do not get all tab buttons that exist, because there might be multiple tab systems open at the same time.
            for (const index in adjacent_tab_buttons) {
                const tab_button = adjacent_tab_buttons[index];
                tab_button.removeClass("sr-tab-active");
            }

            // Activate the clicked tab
            tab_button.addClass("sr-tab-active");
            const activateTabAttribute: Attr | null =
                tab_button.attributes.getNamedItem("activateTab");
            if (null === activateTabAttribute) {
                throw new Error("Tab button has no 'activateTab' HTML attribute! Murr!");
            }
            const activate_tab_id = activateTabAttribute.value;
            const tab_content: HTMLElement | null = document.getElementById(activate_tab_id);
            if (null === tab_content) {
                throw new Error(
                    "No tab content was found with activate_tab_id '" +
                        activate_tab_id +
                        "'! Hmph!",
                );
            }
            tab_content.addClass("sr-tab-active");

            // Mark the clicked tab as active in TabStructure (just to report which tab is currently active)
            tab_structure.active_tab_id = activate_tab_id.replace(/^sr-tab-/, ""); // Remove "sr-tab" prefix.

            // Focus an element (if a focusable element is present)
            tab_content.find(".sr-focus-element-on-tab-opening")?.focus(); // ? = If not found, do nothing.

            // Apply the max dimensions to this tab
            // But don't do it if this is the main settings modal
            if (!is_main_settings_modal) {
                tab_content.style.width = max_width + "px";
                tab_content.style.height = max_height + "px";
            }

            // Do nothing else (I don't know if this is needed or not)
            event.preventDefault();
        };
        if (tab.icon) setIcon(button, tab.icon);

        button.insertAdjacentText("beforeend", " " + tab.title);
        tab_buttons[tab_id] = button;

        // Create content container
        tab_content_containers[tab_id] = container_element.createEl("div", {
            attr: { class: "sr-tab-content", id: "sr-tab-" + tab_id },
        });

        // Generate content
        tab_structure.contentGeneratorPromises[tab_id] = tab.content_generator(
            tab_content_containers[tab_id],
        );

        // Memorize the first tab's button
        if (undefined === first_button) {
            first_button = button;
        }
    }

    // Open a tab.
    tab_buttons[activateTabId].click();

    // Return the TabStructure
    return tab_structure;
}
