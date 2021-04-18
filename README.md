# Obsidian Spaced Repetition Plugin

Fight the forgetting curve & note aging by reviewing notes using [spaced repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/docs/Algorithm.md) on Obsidian.md

Spaced repetition? [Basics](https://ncase.me/remember/), [Detailed](https://www.gwern.net/Spaced-repetition).

Check the [roadmap](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/1) for upcoming features. Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues) if you have a feature request, a bug-report, or some feedback.

## Installation

You can easily install the plugin from Obsidian's community plugin section in the Obsidian app (Search `Spaced Repetition`).

### Manual Installation

Create an `obsidian-spaced-repetition` folder under `.obsidian/plugins` in your vault. Add the `main.js`, `manifest.json`, and the `styles.css` files from the [latest release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases) to the folder.

## Flashcards

Tag any notes that you'd like to put flashcards in as `#flashcards`. 

### Remnote single-line style

The prompt and the answer are separated by `::`.

```markdown
the prompt goes here::the answer goes here!
```

### Ruled style

The front and the back of the card are separated by `---`.

```markdown
Ruled card front
---
Backside of ruled card
```

These can also span over multiple lines as long as both sides "touch" the `---`:

```
This is a ruled flashcard
that can go on multiple lines
---
the answer
can also be
on multiple lines
```

### Reviewing

Once done creating cards, click on the crosshairs button on the left ribbon to generate IDs for the flashcards. These IDs are in the form:
```
<!--SR:1618771534552-->
```
They are wrapped in a HTML comment so that they aren't visible during notes preview.

Once the IDs are generated, the plugin with queue them and create a modal where you can start reviewing.

#### Faster Review

To review faster, use the following keyboard shortcuts:
- `Space/Enter` => Show answer
- `1` => Review as `Hard`
- `2` => Review as `Good`
- `3` => Review as `Easy`

## Notes

### "Philosophy"

- Notes should be atomic i.e. focus on a single concept.
- Notes should be highly linked.
- Reviews should start only after properly understanding a concept.
- Reviews should be [Feynman-technique](https://fs.blog/2021/02/feynman-learning-technique/)-esque.

### Getting started

Tag any notes that you'd like to review as `#review`. This default tag can be changed in the settings. (You can also use multiple tags)

### New Notes

All "new" notes are listed under `New` on the right pane (Review Queue). Like so:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/new_notes.png" />

### Reviewing

Open the file & review it. Once done, choose either the `Review: Easy`, `Review: Good`, or the `Review: Hard` option on the file menu (the three dots). The `Easy`, `Good`, or `Hard` depend on how well you comprehend the material being reviewed.

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/more_options.png" />

Alternatively, you can right click on the file and access the same options:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/file_context_menu.png" />

The note will then be scheduled appropriately:

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/scheduled.png" />

#### Faster Review

Commands to open a note for review, and making review responses are provided. You can create custom hotkeys for them in `Settings -> HotKeys`. This allows for much faster review.

#### Review Settings

Available settings are:
- Choosing whether to open a note at random or the most important note
- Choosing whether to open the next note automatically after reviewing another

### Scheduled notes

`Review: N due` on the status bar at the bottom of the screen shows how many notes one has to review today (Today's notes + overdue notes). Clicking on that opens one of the notes for review.

Alternatively, one can use the `Open a note for review` command.

### Review Queue

- Daily review entries are sorted by importance (PageRank)

## Notices

### Version 1.2.0 and lower

Reviewing files has changed from opt-out to the more reasonable opt-in scheme. This caters for people with hundreds of notes. Now you need to tag the notes that you'd like to review (use `#review` by default).
The `sr-review` YAML attribute is now obsolete and should be deleted from the YAML headers that it appears in (previously ignored notes).

### Version 1.1.1 and lower

Please fix any scheduled/ignored notes by changing the YAML attributes from:

1. `due` to `sr-due`
2. `interval` to `sr-interval`
3. `ease` to `sr-ease`
4. `review: false` to `sr-review: false`

This has been done to avoid attribute clashes with other plugins detailed [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/7).
