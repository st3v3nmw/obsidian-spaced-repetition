# Organizing into Decks

![flashcard-decks-1](https://github.com/user-attachments/assets/a207b0f6-b064-443c-9c55-540681b10891)

## Using Obsidian Tags

1. Specify flashcard tags in settings (`#flashcards` is the default).
2. Tag any notes that you'd like to put flashcards using said tags.

### Hierarchical Tags

Note that `#flashcards` will match nested tags like `#flashcards/subdeck/subdeck`.

### Multiple Tags Within a Single File

A single file can contain cards for multiple different decks.

This is possible because a tag pertains to all subsequent cards in a file until any subsequent tag.

For example:

```markdown
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB
Question4 (in deckB)::Answer4
Question5 (also in deckB)::Answer5

#flashcards/deckC
Question6 (in deckC)::Answer6
```

### A Single Card Within Multiple Decks

Usually the content of a card is only relevant to a single deck. However, sometimes content doesn't fall neatly into a single deck of the hierarchy.

In these cases, a card can be tagged as being part of multiple decks. The following card is specified as being in the three different decks listed.

```markdown
#flashcards/language/words #flashcards/trivia #flashcards/learned-from-tv
A group of cats is called a::clowder
```

Note that as shown in the above example, all tags must be placed on the same line, separated by spaces.

### Question Specific Tags

A tag that is present at the start of the first line of a card is "question specific", and applies only to that card.

For example:

```markdown
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB Question4 (in deckB)::Answer4

Question6 (in deckA)::Answer6
```

Here `Question6` will be part of `deckA` and not `deckB` as `deckB` is specific to `Question4` only.

---

## Using Folder Structure

The plugin will automatically search for folders that contain flashcards & use their paths to create decks & sub-decks

e.g. `Folder/sub-folder/sub-sub-folder` ⇔ `Deck/sub-deck/sub-sub-deck`.

This is an alternative to the tagging option and can be enabled in [settings](../user-options.md#tags-folders).
