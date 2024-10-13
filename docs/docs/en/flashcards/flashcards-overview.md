# Flashcard Introduction

Flashcards are defined within standard Obsidian markdown files.

A markdown file containing flashcards must identify the [deck](decks.md) (or decks) into which the flashcards are placed.
However, the file does not need to be tagged as a [note](../notes.md) for it to have flashcards defined.

Two types of flashcards are supported:

<div class="grid" markdown>

!!! note "Question & Answer"

    [Question & Answer](q-and-a-cards.md) flashcards are ones where the flashcard text contains both the question text and answer text.

    <hr class="thin">
    ![flashcard-qanda-example](https://github.com/user-attachments/assets/65639d80-b249-4b16-ae40-c2af011c6aab)

!!! note "Cloze"

    [Cloze](cloze-cards.md) flashcards are ones where the flashcard text identifies parts of the text (e.g. a word or phrase) that is hidden
    when the front of the card is shown. <br/>
    The hidden text is known as a `cloze deletion`.
    <hr class="thin">
    ![flashcard-cloze-example](https://github.com/user-attachments/assets/9fb12f2e-9b81-45d9-9097-7f1e3d97ae5a)

</div>

!!! tip

    For guidelines on how to write and structure flashcards, see [Spaced Repetition Guides](../resources.md#flashcards)

---

## Flashcard Text, Flashcards and Cards

!!! note

    For simplicity `flashcard text` is sometimes written just as `flashcard`

The `flashcard text` is text that defines the type and content of a card (or a set of related, `sibling` cards).

### Single flashcard, multiple cards

For some flashcard types, the flashcard text defines a single card. For other flashcard types, multiple
cards are defined.

| Flashcard Type                                                          | Cards Defined                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Single-line Basic](q-and-a-cards.md#single-line-basic)                 | flashcard defines the front and back of a single card.                                        |
| [Single-line Bidirectional](q-and-a-cards.md#single-line-bidirectional) | flashcard defines two cards.                                                                  |
| [Multi-line Basic](q-and-a-cards.md#multi-line-basic)                   | flashcard defines the front and back of a single card.                                        |
| [Multi-line Bidirectional](q-and-a-cards.md#multi-line-bidirectional)   | flashcard defines two cards.                                                                  |
| [Cloze](cloze-cards.md)                                                 | flashcard defines multiple cards, the number of cards based on the number of cloze deletions. |

### Sibling Cards

If there are multiple cards defined by a single flashcard, those cards are known as `sibling` cards.

A special scheduling option is available for the review of sibling cards. If the [Bury sibling cards until the next day](../user-options.md#flashcard-review) setting is turned on,
only one sibling card is available for review on a single day.

### Including Blank Lines within Multiline and Cloze Flashcards

By default, the end of a multiline flashcard is denoted by a blank line at the end of the flashcard text.
This means that blank lines can not be included within the text.

See [Cards with Blank Lines](cards-with-blank-lines.md) if blank lines need to be included.

---

## RTL Support

There are two ways that the plugin can be used with RTL languages, such as Arabic, Hebrew, Persian (Farsi).

If all cards are in a RTL language, then simply enable the global Obsidian option `Editor → Right-to-left (RTL)`.

If all cards within a single note have the same LTR/RTL direction, then frontmatter can be used to specify the text direction. For example:

```
---
direction: rtl
---
```

This is the same way text direction is specified to the `RTL Support` plugin.

Note that there is no current support for cards with different text directions within the same note.

---

## Card Maintenance

### Deleting cards

To delete a card, simply delete the scheduling information & the card text.

### Ignoring cards

You can wrap flashcards in HTML comments e.g. `<!--Card text <!--SR:2021-08-20,13,290--> -->` to prevent it from showing up in your review queues. You can always remove the wrapping comment later.
