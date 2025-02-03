# Notes

!!! tip

    For guidelines on how to write and structure notes, see [Spaced Repetition Guides](resources.md#notes)

## Getting started

Tag any markdown files for review with the `note review` tag, which by default is `#review`.

The note will appear under `New` in the `Note Review Queue` in the right pane.

!!! note

    When you tag a note with `#review` the note doesn't immediately appear in the review queue.
    You will need to first click on the `Flashcard Review Icon` or the `Spaced Repetition Status Area` for the queue to update

## Note Review Queue

![note-review-queue](https://github.com/user-attachments/assets/c0e1d09c-610f-4775-b532-ab78369b117a)

!!! note ""

    1. The Note Review Queue <br/>
    2. The `Note Review Deck` for tag `#review` <br/>
    3. The new notes - i.e. those tagged with `#review` but have yet to be reviewed <br/>
    4. The notes scheduled for review on August 1 <br/>
    5. The notes scheduled for review on August 31 <br/>

### Displaying the Note Review Queue

By default, the Note Review Queue is displayed when the plugin starts. This can be changed with
the `Enable note review pane on startup` [setting](user-options.md#note-settings).

The Note Review Queue can also be shown by using the `Open Notes Review Queue in sidebar`
[command](plugin-commands.md).

## Reviewing

Open a file, read & review it. Once done, choose either the `Review: Easy`, `Review: Good`, or the `Review: Hard` option on the file menu (the three dots). Select `Easy`, `Good`, or `Hard` depend on how well you comprehend the material being reviewed.

![file-three-dots-menu](https://github.com/user-attachments/assets/5f37ab88-30f9-477d-b39c-eb86ba15abdb)

Alternatively, you can right click on the file within the note review queue, and access the same options:

![note-review-queue-context-menu](https://github.com/user-attachments/assets/d4affa19-5126-45f8-bf3c-0079d2a8a597)

The note will then be scheduled appropriately by the [learning algorithm](algorithms.md), and the markdown file updated:

![note-frontmatter](https://github.com/user-attachments/assets/b9744f50-c897-46ad-ab34-1bbc55796b57)

### Keyboard Shortcuts

The `Easy`, `Good`, and `Hard` review result can also be selected from the plugin's [command list](plugin-commands.md).

This is less practical than the methods described above, but does enable the definition of keyboard shortcuts.
You can create custom hotkeys for the review result in `Settings -> HotKeys`.

### Selecting a Note for Review

There are a few ways to open a note for review:

- Open a note via the standard Obsidian features
- Double click on a note title from the Note Review Queue
- Click on the `Spaced Repetition Status Area` in the status bar at the bottom of the screen
- Select the command [Open a note to review review](plugin-commands.md)

There are also the following relevant options:

- [Open a random note for review](user-options.md)
- [Open next note automatically after a review](user-options.md)

## Multiple Note Review Decks

By default, there is a single review deck called `#review`.

This default tag can be changed in the [settings](user-options.md#note-settings). Multiple review decks can also be specified.

## Spaced Repetition Status Area

`Review: N note(s)` on the status bar at the bottom of the screen shows how many notes one has to review today (Today's notes + overdue notes).

Clicking on that opens one of the notes for review.
