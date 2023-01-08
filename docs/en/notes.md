---
comments: true
---

# Notes

-   Notes should be atomic i.e. focus on a single concept.
-   Notes should be highly linked.
-   Reviews should start only after properly understanding a concept.
-   Reviews should be [Feynman-technique](https://fs.blog/2021/02/feynman-learning-technique/)-esque.

## Getting started

Tag any notes that you'd like to review as `#review`. This default tag can be changed in the settings. (You can also use multiple tags)

## New Notes

All "new" notes are listed under `New` on the right pane (Review Queue). Like so:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/new_notes.png" />

## Reviewing

Open the file & review it. Once done, choose either the `Review: Easy`, `Review: Good`, or the `Review: Hard` option on the file menu (the three dots). The `Easy`, `Good`, or `Hard` depend on how well you comprehend the material being reviewed.

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/more_options.png" />

Alternatively, you can right click on the file and access the same options:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/file_context_menu.png" />

The note will then be scheduled appropriately:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/scheduled.png" />

### Faster Review

Commands to open a note for review, and making review responses are provided. You can create custom hotkeys for them in `Settings -> HotKeys`. This allows for much faster review.

### Review Settings

Available settings are:

-   Choosing whether to open a note at random or the most important note
-   Choosing whether to open the next note automatically after reviewing another

## Scheduled notes

`Review: N due` on the status bar at the bottom of the screen shows how many notes one has to review today (Today's notes + overdue notes). Clicking on that opens one of the notes for review.

Alternatively, one can use the `Open a note for review` command.

## Review Queue

-   Daily review entries are sorted by importance (PageRank)

## Incremental Writing

This was introduced [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/15) by `@aviskase`.

Here are the YouTube videos:

-   English: [Obsidian: inbox review with spaced repetition](https://youtu.be/zG5r7QIY_TM)
-   Russian / русский: [Yuliya Bagriy - Разгребатель инбокса заметок как у Andy Matuschak в Obsidian](https://www.youtube.com/watch?v=CF6SSHB74cs)

### Brief summary

Andy Matuschak uses [spaced repetition system for working on writing inbox](https://notes.andymatuschak.org/z7iCjRziX6V6unNWL81yc2dJicpRw2Cpp9MfQ).

In short, there are four possible actions (where `x < y`):

-   skip note (increase interval for `x`) == mark as `good`
-   work on it, mark as fruitful work (decrease interval) == mark as `hard`
-   work on it, mark as unfruitful work (increase interval for `y`) == mark as `easy`
-   convert to evergreen note (stop using the space-repetition prompts)
