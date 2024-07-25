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

The flashcard for `Kenya::Nairobi` will have `Trivia > Capitals > Africa` as the context/title whereas the flashcard for `Canada::Ottawa` will have `Trivia > Capitals > North America` as the context/title.

## Deleting cards

To delete a card, simply delete the scheduling information & the card text.

## Ignoring cards

You can wrap flashcards in HTML comments e.g. `<!--Card text <!--SR:2021-08-20,13,290--> -->` to prevent it from showing up in your review queues. You can always remove the wrapping comment later.

## Cramming

Currently, the only supported method is "cramming" all cards in a note using the Cram flashcards in this note command. Will work on a per-deck across-all-notes method.

