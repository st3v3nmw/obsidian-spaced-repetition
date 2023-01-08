# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project (sorta) adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Modal to edit flashcards ([@AB1908](https://github.com/AB1908))
-   Add per-deck cramming command ([@LennyPhoenix](https://github.com/LennyPhoenix))
-   Add flashcards menu

### Changed

-   Add note title to card context

## [1.9.4] - 2023-01-08

### Fixes

-   Minor UI fix on flashcards

## [1.9.3] - 2023-01-02

### Changed

-   Updated contribution guidelines

### Fixes

-   Minor UI fixes on stats and flashcards views

## [1.9.2] - 2023-01-02

### Changed

-   Update flashcards image formats
-   Move wiki to GitHub pages
-   Update docs
-   Make documentation translatable

### Fixed

-   Prevent regex from matching to last --- in file ([deliriouserror94](https://github.com/deliriouserror94))
-   Make flashcard text selectable

## [1.9.1] - 2022-12-12

### Fixed

-   Fix extra note review panes being added ([@AB1908](https://github.com/AB1908))

## [1.9.0] - 2022-12-12

### Added

-   Card backwards navigation ([@FelixGibson](https://github.com/FelixGibson))
-   Add curly brackets as option for cloze fields ([@lachlancollins](https://github.com/lachlancollins))
-   Added new setting to collapse/expand subdecks ([@MostlyArmless](https://github.com/MostlyArmless))
-   Set the flashcard's font size as user editor ([@edvardchen](https://github.com/edvardchen))
-   Make the note review pane optional ([@AB1908](https://github.com/AB1908))
-   Add Brazilian Portuguese Translation ([@Helaxious](https://github.com/Helaxious))
-   Add Traditional Chinese Translation ([@emisjerry](https://github.com/emisjerry))

## Changed

-   Update Simplified Chinese Translation ([@zyl-lizi](https://github.com/zyl-lizi))
-   Update dependencies
-   Revert to npm over yarn

### Fixed

-   Replace `crlf` to `lf` on card parse ([@jasonho1308](https://github.com/jasonho1308))
-   Fix card back button UI/UX

## [1.8.0] - 2022-07-24

### Added

-   Add "ogg" as supported audio file format ([@sabarrett](https://github.com/sabarrett))
-   Add customizable review buttons ([@AB1908](https://github.com/AB1908))
-   Add & automate running Prettier ([@olingern](https://github.com/olingern))
-   Add translation to Korean/한국어 ([@ksundong](https://github.com/ksundong))
-   Check that localization entries are consistent across all files

### Changed

-   Add yarn lockfile ([@olingern](https://github.com/olingern))
-   Update Simplified Chinese translations ([@11-check-it-out](https://github.com/11-check-it-out))

### Fixed

-   Fix side pane breakage with Obisidian v0.15.4 ([@AB1908](https://github.com/AB1908))
-   Handle code fences better ([@zcysxy](https://github.com/zcysxy))
-   Fixed mistakes in Russian translation ([@ytatichno](https://github.com/ytatichno))

## [1.7.2] - 2022-02-21

### Added

-   Add translation to Simplified Chinese/简体中文 ([@watergua](https://github.com/watergua))
-   Add translation to Czech/čeština ([@martinrakovec](https://github.com/martinrakovec))
-   Add translation to Russian/русский ([@ytatichno](https://github.com/ytatichno))

### Fixed

-   Fix textInterval calculations
-   Fix tag override

## [1.7.1] - 2022-01-02

### Fixed

-   Fix overriding tags when tags are used as separators for multiline cards
-   Use more accurate calculations when converting intervals to text

## [1.7.0] - 2022-01-01

### Added

-   Support for audio & video in flashcards ([@careilly](https://github.com/careilly))
-   Support note transclusion in flashcards ([@joelmeyerhamme](https://github.com/joelmeyerhamme))
-   Cramming flashcards ([@EthanHarv](https://github.com/EthanHarv))
-   Filter statistics by date range
-   Zoom on image on click ([@rgruenewald](https://github.com/rgruenewald))
-   Add translation to German/Deutsch ([@GollyTicker](https://github.com/GollyTicker))
-   Add translation to To Japanese/日本語 ([@yo-goto](https://github.com/yo-goto))

### Changed

-   Changing `interpolate` to an optional `arg` of `t` ([@LouisStAmour](https://github.com/LouisStAmour))

### Fixed

-   Fix YAMLParse bug in statistics
-   Fix first time random card selection
-   HTML comments from other plugins cause the creation of some cards to be left out ([@andrewcrook](https://github.com/andrewcrook))
-   Correct notes(s) to note(s) in en.ts lang file ([@Trikzon](https://github.com/Trikzon))
-   Change Eases x-axis from DAYS to EASES ([@asdia0](https://github.com/asdia0))
-   Fix collapsed/expanded states when redrawing the sidebar ([@erichalldev](https://github.com/erichalldev))

## [1.6.2] - 2021-08-30

### Added

-   Optional `**bolded text**` to clozes conversion
-   Statistics on intervals, eases, & card types
-   Command to review flashcards from one note only

### Changed

-   New Icon ([@TfTHacker](https://github.com/TfTHacker))
-   "Open File" link in flashcards review now opens the notes in the background for later edit ([@TfTHacker](https://github.com/TfTHacker))
-   Better calculation of initial ease for flashcards

### Fixed

-   Fix bug where notes in 'New' were not included in review queue (multiple review queues)
-   Roll back caching to fix stale cached data, & reduce overhead required to keep it up to date

## [1.6.1] - 2021-08-21

### Added

-   Multiple note review queues ([@erichalldev](https://github.com/erichalldev))
-   Ability to hide some folders from the plugin ([@aviskase](https://github.com/aviskase))
-   Add option to clear cache

### Fixed

-   Override saving on same line if flashcard ends with codeblock
-   Refresh stats before loading statistics modal

## [1.6.0] - 2021-08-08

### Added

-   Single-line reversed cards (`front::back` & `back:::front` cards are added)
-   Multi-line reversed cards (`front??back` & `back??front` cards are added)
-   Ability to ignore flashcards for a while by wrapping them in HTML comments
-   Caching of scheduling information (should drastically reduce processing time)

### Fixed

-   Blank lines in code blocks are now supported
-   Fixed saving of some settings options

## [1.5.8] - 2021-08-04

### Added

-   Customizable height & width of flashcard modal ([@rubbish](https://github.com/rubbish))
-   Multilingual support
-   Code quality improvements (refactors, types, stricter checks when building)
-   Burying all cards in a note after reviewing it

### Changed

-   Scroll to flashcard location after clicking "Open File" link

### Fixed

-   Remove folder expansion icon for decks without child decks
-   Parsing of cloze cards no longer requires a newline
-   Fix statistics modal (accumulate overdue cards, linearity)
-   Only have the SRS review context menu only on markdown files (not folders, PDFs, etc as before)

## [1.5.7] - 2021-06-20

### Added

-   Ability to randomize cards order
-   Per deck total number of cards

### Changed

-   Resize images to fit to modal size or to match the user specified size

### Fixed

-   Properly handle nonexistent images during rendering
-   Include card in only one deck (for those who use tags)

## [1.5.6] - 2021-06-13

### Fixed

-   Fix burying of new cards

## [1.5.5] - 2021-06-12

### Added

-   Adds a `View statistics` command to show a bar graph of the flashcard reviews due in the future

## [1.5.4] - 2021-06-11

### Fixed

-   Fix load scheduler bug

## [1.5.3] - 2021-06-10

### Added

-   Overall deck counts

### Changed

-   Not run more than one instance of the flashcards & notes sync functions

## [1.5.2] - 2021-06-07

### Changed

-   Burying works till the next day

### Fixed

-   Fix traversal of subdecks & their siblings
-   CSS fix for light themes
-   Show folders based on the presence of flashcards inside of them instead of files. #136

## [1.5.1] - 2021-06-06

### Fixed

-   Fix deck counts going into negatives when burying related cards

## [1.5.0] - 2021-06-06

### Added

-   Nested decks (using Obsidian’s hierarchical tags or folder structure)
-   Load balancing which helps maintain a consistent number of reviews from one day to another
-   Boosting cards that are recalled correctly after long periods of no study

### Fixed

-   Better support for images sourced directly from the web

## [1.4.9] - 2021-05-31

### Added

-   Use `Space` to review flashcards as `Good`

### Changed

-   Settings: split tags with newlines and spaces

### Fixed

-   Reviewing flashcard changes format of the text (removes one $ from $$)
-   Fix reset flashcard progress NaN bug

## [1.4.8] - 2021-05-21

### Fixed

-   Ignore codeblocks while creating flashcards

## [1.4.7] - 2021-05-21

### Added

-   Option to remove card context from flashcards view
-   Option to disable cloze cards

### Fixed

-   Properly rewrite image links after flashcard review
-   Fix review flashcards command

## [1.4.6] - 2021-05-16

### Fixed

-   Rewrite cards to file using the correct separator

## [1.4.5] - 2021-05-16

### Added

-   Support for images in flashcards (albeit in a hacky way)
-   Maximum interval option
-   Ability to change the inline & multiline flashcard separators to say `;;` or `!!`
-   Keyboard hotkey to review flashcards
-   Options to reset settings to their default values
-   Plugin waits for some time before attempting to validate and save a setting

### Changed

-   Limit on number of days to display on right panel
-   Use sliders for settings with a fixed range

## [1.4.4] - 2021-05-08

### Fixed

-   UI/UX fixes for Obsidian mobile

## [1.4.3] - 2021-05-08

### Added

-   Flashcard decks - Use tags to create decks for your flashcards

### Changed

-   Change date to the more standard YYYY-MM-DD format

### Fixed

-   Make the flashcard view scrollable for large flashcards
-   Fix problem with horizontal rules & YAML

## [1.4.2] - 2021-05-02

### Added

-   Provides a setting to remove review options from the file menu

## [1.4.1] - 2021-05-01

### Fixed

-   Fix broken link in settings

## [1.4.0] - 2021-05-01

### Added

-   Adds support for cloze deletion cards
-   Provides a way to reset a card's scheduling progress

### Changed

-   Changes dates to the more compact DD-MM-YYYY date format
-   Cleans up the settings interface

### Fixed

-   Makes the right sidebar detach properly on unload

## [1.3.2] - 2021-04-20

### Added

-   Adds support for tags in YAML #28
-   Provides a setting to have the scheduling-info-HTML-comment in the same line as a single-line card

## [1.3.1] - 2021-04-19

### Fixed

-   Allow for both kinds of review in the same file

## [1.3.0] - 2021-04-19

### Added

-   This release adds support for single-line basic and multi-line basic flashcards.

## [1.2.3] - 2021-04-15

### Added

-   This release adds a review state Good which acts as an in-between state (Easy, Good, Hard).

## [1.2.2] - 2021-04-14

### Added

-   This release provides commands for making review responses. You can create custom hotkeys for them in `Settings -> HotKeys`.

## [1.2.1] - 2021-04-14

### Changed

-   Reviewing files has changed from opt-out to the more reasonable opt-in scheme.

### Removed

-   The sr-review YAML attribute is now obsolete and should be deleted from the YAML headers that it appears in (previously ignored notes).

## [1.2.0] - 2021-04-13

### Added

-   Adds a mechanism to allow reviewing of notes with certain tags.

## [1.1.2] - 2021-04-13

### Changed

-   Fix to YAML namespace due to issue raised here: #7

## [1.1.1] - 2021-04-12

### Fixed

-   More fixes to make the plugin more compliant to Obsidian's API.
-   Fixed failing right pane redraw.

## [1.1.0] - 2021-04-11

### Added

-   Added file context menu

## [1.0.1] - 2021-04-11

### Fixed

-   Fixes to make the plugin more compliant to Obsidian's API.

## [1.0.0] - 2021-04-09

### Added

-   Reviewing notes
-   Scheduling notes
-   Ignoring some notes
-   Note importance calculation using PageRank (for initial ease calculation & review queues)
