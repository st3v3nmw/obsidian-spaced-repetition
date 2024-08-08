# Reviewing & Cramming

A key part of spaced repetition learning is being shown the front of cards to test whether or not you recall the information on the back. There are two similar functions that perform this – [reviewing](#reviewing) & [cramming](#cramming).

<div class="grid" markdown>
!!! tip "Reviewing"

    For the selected deck, you are only shown<br/>
    :material-circle-medium: new cards (i.e. ones that have never been reviewed before) as well as <br/>
    :material-circle-medium: due cards (those that the [algorithm](../algorithms.md) has decided it's time to review)

!!! tip "Cramming"

    You are shown every single card in the selected deck/note, even those that have recently been reviewed.

</div>

## Common Features of Reviewing & Cramming

### Deck Selection

Although you may want to review or cram all cards across all decks, you often may wish to do so on only a subset of decks.

![flashcard-decks-1](https://github.com/user-attachments/assets/a207b0f6-b064-443c-9c55-540681b10891)

!!! note "All subdecks included"

    For example, clicking on the `course` deck will also include all cards within the `aws`
    and `developer-associate` decks.

### Operation


![review-operation](https://github.com/user-attachments/assets/d8f438dc-f1f0-43c4-a752-a5eeb64346e4)

!!! note ""
    # | Name | Description
    - | - | -
    1 | Edit | Edit the flashcard text
    2 | Reset | Reset the review schedule information - the review interval is set to 1 day, and the ease is set to the default value
    3 | Info | Shows the scheduling information for the card
    4 | Skip | Skip the current card without reviewing
    
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
!!! tip "Context displayed"
    ![reviewing-context](https://github.com/user-attachments/assets/2ccfc23a-a106-4133-91ec-8bd0efd0e372)




!!! note
    Context is only shown if enabled in [UI Preferences](../user-options.md#ui-preferences)

### Keyboard shortcuts

To review faster, use the following keyboard shortcuts:

-   `Space/Enter` => Show answer
-   `0` => Reset card's progress (Sorta like `Again` in Anki)
-   `1` => Review as `Hard`
-   `2` => Review as `Good`
-   `3` => Review as `Easy`

---

## Reviewing

Once done creating cards, click on the flashcards button on the left ribbon to start reviewing the flashcards. After a card is reviewed, a HTML comment is added containing the next review day, the interval, and the card's ease.

```
<!--SR:!2021-08-20,13,290-->
```

Wrapping in a HTML comment makes the scheduling information not visible in the notes preview. For single-line cards, you can choose whether you want the HTML comment on the same line or on a separate line in the settings. Putting them on the same line prevents breaking of list structures in the preview or after auto-formatting.

Note that you can skip a card by simply pressing `S` (case doesn't matter).

!!! tip

    If you're experiencing issues with the size of the modal on mobile devices,
    go to [settings](../user-options.md#ui-preferences) and set the _Flashcard Height Percentage_ and _Flashcard Width Percentage_
    to 100% to maximize it.

---

## Cramming

You are shown every single card, even those that have recently been reviewed. 
By using the appropriate [command](../plugin-commands.md) have the choice of cramming cards:

Cards | Command
- | -
Within a single note | `Spaced Repetition: Cram flashcards in this note`
Within a deck (including all subdecks) |  `Spaced Repetition: Select a deck to cram note`

