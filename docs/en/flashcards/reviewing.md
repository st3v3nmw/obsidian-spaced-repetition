# Reviewing & Cramming

A key part of spaced repetition learning is being shown the front of cards to test whether or not you recall the information on the back. There are two similar functions that perform this – [reviewing](#reviewing) & [cramming](#cramming).

<div class="grid" markdown>
!!! tip "Reviewing"

    For the selected deck, you are only shown<br/>
    :material-circle-medium: new cards (i.e. ones that have never been reviewed before) as well as <br/>
    :material-circle-medium: due cards (those that the [algorithm](../algorithms.md) has decided it's time to review)

!!! tip "Cramming"

    You are shown every single card in the selected deck, even those that have recently been reviewed.

</div>

## Common Features of Reviewing & Cramming

### Deck Selection

Although you may want to review or cram all cards across all decks, you often may wish to do so on only a subset of decks.

![flashcard-decks-1](https://github.com/user-attachments/assets/e17d6384-73fd-4e8f-bbda-a0fcf4972ebd)

!!! note "All subdecks included"

    For example, clicking on the `course` deck will also include all cards within the `aws`
    and `developer-associate` decks.

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

Flashcard | Context/Title
- | -
`Kenya::Nairobi` | `Trivia > Capitals > Africa`
`Canada::Ottawa` | `Trivia > Capitals > North America`

This would be displayed as:

![reviewing-context](https://github.com/user-attachments/assets/3ca63e07-94b5-450a-972e-a1ffaddff00d)

!!! note
    Context is only shown if enabled in [UI Preferences](../plugin-settings.md#ui-preferences)


## Reviewing

Once done creating cards, click on the flashcards button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.

```
<!--SR:!2021-08-20,13,290-->
```

Wrapping in a HTML comment makes the scheduling information not visible in the notes preview. For single-line cards, you can choose whether you want the HTML comment on the same line or on a separate line in the settings. Putting them on the same line prevents breaking of list structures in the preview or after auto-formatting.

Note that you can skip a card by simply pressing `S` (case doesn't matter).

!!! tip

    If you're experiencing issues with the size of the modal on mobile devices,
    go to [settings](../plugin-settings.md#ui-preferences) and set the _Flashcard Height Percentage_ and _Flashcard Width Percentage_
    to 100% to maximize it.

### Faster Review

To review faster, use the following keyboard shortcuts:

-   `Space/Enter` => Show answer
-   `0` => Reset card's progress (Sorta like `Again` in Anki)
-   `1` => Review as `Hard`
-   `2` or `Space` => Review as `Good`
-   `3` => Review as `Easy`


## Cramming