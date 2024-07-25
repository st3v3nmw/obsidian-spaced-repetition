# Question & Answer Cards

!!! note

    Cards must be assigned to a deck, either using an Obsidian tag such as `#flashcard` or by using the
    folder structure within the vault. 

    See [Decks](decks.md) for further details.



## Single-line Basic

The prompt and the answer are separated by `::` (this can be configured in [settings](flashcard-settings.md#flashcard-separators)).

```markdown
the question goes on this side::answer goes here!
```

!!! note "Displayed when reviewed"

Side | Text
- | -
Front | the question goes on this side
Back | answer goes here!

---


## Single-line Bidirectional

Two cards are created from the single flashcard text. For example:

The two parts are separated by `:::` (this can be configured in [settings](flashcard-settings.md#flashcard-separators)).

```markdown
info 1:::info 2
```

!!! note "Card 1"

Side | Text
- | -
Front | info 1
Back | info 2

!!! note "Card 2"

Side | Text
- | -
Front | the question goes on this side
Back | info 2

Note: In the first review, the plugin will show non-reversed card and reversed card.
If [**Bury sibling cards until the next day?**](flashcard-settings.md#flashcard-review)). turn on, only non-reversed card will appear.

---


## Multi-line Basic

The front and the back of the card are separated by `?` (this can be configured in [settings](flashcard-settings.md#flashcard-separators)).

```markdown
Front of multiline
?
Backside of multiline card
```

These can also span over multiple lines as long as both sides "touch" the `?`:

```markdown
As per the definition
of "multiline" the prompt
can be on multiple lines
?
same goes for
the answer
```

---


## Multi-line Reversed

Creates two cards `side1??side2` & the reversed version `side2??side1`.

The front and the back of the card are separated by `??` (this can be configured in [settings](flashcard-settings.md#flashcard-separators)).

```markdown
Front of multiline
??
Backside of multiline card
```

These can also span over multiple lines as long as both sides "touch" the `??`:

```markdown
As per the definition
of "multiline" the prompt
can be on multiple lines
??
same goes for
the answer
```

Note: The behaviour is same as single line reversed.



