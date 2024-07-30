# Question & Answer Cards

!!! note

    Cards must be assigned to a deck, either using an Obsidian tag such as `#flashcard` or by using the
    folder structure within the vault. 

    See [Decks](decks.md) for further details.



## Single-line Basic

The prompt and the answer are separated by `::` (this can be configured in [settings]( ../user-options.md#flashcard-separators)).

```markdown
the question goes on this side::answer goes here!
```

!!! note "Displayed when reviewed"

    <div class="grid" markdown>

    !!! tip "Card Front"

        the question goes on this side

    !!! tip "Card Back"

        answer goes here!

    </div>

## Single-line Bidirectional

Two cards are created from the single flashcard text.

The two parts are separated by `:::` (this can be configured in [settings]( ../user-options.md#flashcard-separators)).

For example:

```markdown
info 1:::info 2
```

!!! note "Card 1"
    <div class="grid" markdown>

    !!! tip "Front"

        info 1

    !!! tip "Back"

        info 2

    </div>

!!! note "Card 2"
    <div class="grid" markdown>
    !!! tip "Front"

        info 2

    !!! tip "Back"

        info 1

    </div>

These two cards are considered sibling cards. See [sibling cards](flashcards-overview.md#sibling-cards) regarding the 
[Bury sibling cards until the next day](../user-options.md#flashcard-review) scheduling option.

---

## Multi-line Basic

The front and the back of the card are separated by `?` (this can be configured in [settings]( ../user-options.md#flashcard-separators)).

```markdown
As per the definition
of "multiline" the prompt
can be on multiple lines
?
same goes for
the answer
```

!!! note "Displayed when reviewed"
    <div class="grid" markdown>

    !!! tip "Card Front"

        As per the definition <br/>
        of "multiline" the prompt <br/>
        can be on multiple lines

    !!! tip "Card Back"

        same goes for <br/>
        the answer

    </div>


These can also span over multiple lines as long as both sides "touch" the `?`:



---


## Multi-line Bidirectional

Two cards are created from the single flashcard text.

The two parts are separated by `??` (this can be configured in [settings]( ../user-options.md#flashcard-separators)).

For example:

```markdown
info 1A
info 1B
info 1C
?? 
info 2A
info 2B
```

These can also span over multiple lines as long as both sides "touch" the `??`:

!!! note "Card 1"
    <div class="grid" markdown>

    !!! tip "Front"

        info 1A <br/>
        info 1B <br/>
        info 1C

    !!! tip "Back"

        info 2A <br/>
        info 2B

    </div>

!!! note "Card 2"
    <div class="grid" markdown>
    !!! tip "Front"

        info 2A <br/>
        info 2B

    !!! tip "Back"

        info 1A <br/>
        info 1B <br/>
        info 1C

    </div>

These two cards are considered sibling cards. See [sibling cards](flashcards-overview.md#sibling-cards) regarding the 
[Bury sibling cards until the next day]( ../user-options.md#flashcard-review) scheduling option.



