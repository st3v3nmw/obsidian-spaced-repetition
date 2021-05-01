# Flashcard-Based and Note-Based Spaced Repetition Plugin

Fight the forgetting curve & note aging by reviewing flashcards & notes using [spaced repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/docs/Algorithm.md) on Obsidian.md

Spaced repetition? [Basics](https://ncase.me/remember/), [Detailed](https://www.gwern.net/Spaced-repetition).

Check the [roadmap](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/1) for upcoming features. Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues) if you have a feature request, a bug-report, or some feedback.

## Quick links

1. [Guide on reviewing flashcards](https://github.com/st3v3nmw/obsidian-spaced-repetition#Flashcards)
2. [Guide on reviewing entire notes](https://github.com/st3v3nmw/obsidian-spaced-repetition#notes)

## Installation

You can easily install the plugin from Obsidian's community plugin section in the Obsidian app (Search `Spaced Repetition`).

### Manual Installation

Create an `obsidian-spaced-repetition` folder under `.obsidian/plugins` in your vault. Add the `main.js`, `manifest.json`, and the `styles.css` files from the [latest release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases) to the folder.

## Flashcards

https://user-images.githubusercontent.com/43380836/115256965-5d455f00-a138-11eb-988f-27ba29f328a0.mp4

(if the screencast video doesn't play, check it out on the project's README on GitHub)

Tag any notes that you'd like to put flashcards in as `#flashcards`. 

### Single-line (Remnote style)

The prompt and the answer are separated by `::`.

```markdown
the question goes on this side::answer goes here!
```

### Multi-line

The front and the back of the card are separated by `?`.

```markdown
Front of multiline
?
Backside of multiline card
```

These can also span over multiple lines as long as both sides "touch" the `?`:

```
As per the definition
of "multiline" the prompt
can be on multiple lines
?
same goes for
the answer
```

Note that multi-line flashcards should have a blank line after them.

### Reviewing

Once done creating cards, click on the crosshairs button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.

```
<!--SR:Thu Apr 22 2021,3,250-->
```

Wrapping in a HTML comment makes the scheduling information not visible in the notes preview. For single-line cards, you can choose whether you want the HTML comment on the same line or on a separate line in the settings. Putting them on the same line prevents breaking of list structures in the preview or after auto-formatting.

Note that you can skip a card by simply pressing `S` (case doesn't matter).

#### Faster Review

To review faster, use the following keyboard shortcuts:
- `Space/Enter` => Show answer
- `1` => Review as `Hard`
- `2` => Review as `Good`
- `3` => Review as `Easy`

### Context

If the parent note has heading(s), the flashcard will have a title containing the context.

Taking the following note:

```markdown
#flashcards

# Trivia

## Capitals

### Africa

Kenya::Nairobi

### North America

Canada::Ottawa
```

The flashcard for `Kenya::Nairobi` will have `Trivia > Capitals > Africa` as the context/title whereas the flashcard for `Canada::Ottawa` will have `Trivia > Capitals > North America` as the context/title.

### Open parent file

The `Open file` link in the review modal allows you to open the file that contains the flashcard being reviewed.

### Deleting cards

To delete a card, simply delete the scheduling information & the card text.

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

This has been done to avoid attribute clashes with other plugins as detailed [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/7).

<a href='https://ko-fi.com/M4M44DEN6' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi3.png?v=2' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
