# Reviewing & Cramming

## Reviewing

Once done creating cards, click on the flashcards button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.

```
<!--SR:!2021-08-20,13,290-->
```

Wrapping in a HTML comment makes the scheduling information not visible in the notes preview. For single-line cards, you can choose whether you want the HTML comment on the same line or on a separate line in the settings. Putting them on the same line prevents breaking of list structures in the preview or after auto-formatting.

Note that you can skip a card by simply pressing `S` (case doesn't matter).

!!! tip

    If you're experiencing issues with the size of the modal on mobile devices,
    go to settings and set the _Flashcard Height Percentage_ and _Flashcard Width Percentage_
    to 100% to maximize it.

### Faster Review

To review faster, use the following keyboard shortcuts:

-   `Space/Enter` => Show answer
-   `0` => Reset card's progress (Sorta like `Again` in Anki)
-   `1` => Review as `Hard`
-   `2` or `Space` => Review as `Good`
-   `3` => Review as `Easy`

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

!!! note
    Context is only shown if enabled in [UI Preferences](../plugin-settings.md#ui-preferences)
