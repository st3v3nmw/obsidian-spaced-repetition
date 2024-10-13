# Including Blank Lines in Flashcards

By default, [Multi-line Basic](q-and-a-cards.md#multi-line-basic), [Multi-line Bidirectional](q-and-a-cards.md#multi-line-bidirectional)
and [Cloze](cloze-cards.md) type flashcards recognize a blank line as the end of the flashcard text.
This means that blank lines can not be included within the text.

If blank lines need to be included (e.g. on a card containing a markdown table), the
`Characters denoting the end of clozes and multiline flashcards` [setting](../user-options.md#flashcard-separators)
needs to be changed.

For example, it could be changed to `+++`.

!!! warning "Global Edit Required"

    Note that after changing this you have to manually edit any flashcards you already have.

## Including a Table in the Flashcard Answer

!!! note "Obsidian requires a blank line before a table for it to be displayed correctly."

    Without it, Obsidian displays it just as text and not correctly formatted.

    ![table-with-no-preceding-blank-line](https://github.com/user-attachments/assets/daed1309-3b38-4d14-bb42-b302efda96df)

    And with a blank line after the `?` and before the table, it is displays correctly.
    ![table-with-preceding-blank-line](https://github.com/user-attachments/assets/beef90b7-324e-4876-b10b-055a4d23d41f)

However, by default a blank line signifies the end of the multiline card.

To include the blank line, the
`Characters denoting the end of clozes and multiline flashcards` [setting](../user-options.md#flashcard-separators)
needs to be changed. Then that character sequence added as a line after the end of the flashcard text. For example:

![table-with-preceding-blank-line+++](https://github.com/user-attachments/assets/954fd7fc-6d5f-4315-b40e-2192664c3962)

Now the card is displayed correctly during a review.

![table-with-preceding-blank-line-review](https://github.com/user-attachments/assets/3bff8d25-f91f-4bc0-b922-7471d6b60869)

## Including Blank Lines in a Cloze Flashcard

With `Convert ==highlights== to clozes` enabled in [settings](../user-options.md#flashcard-separators)
and the `Characters denoting the end of clozes and multiline flashcards` set to `+++`,
we can have blank lines in a cloze flashcard. E.g.

![cloze-with-blank-lines](https://github.com/user-attachments/assets/f9d6f123-3378-41cb-9c93-2b061856c81d)

As there are 3 clozes defined, three separate cards will be generated for review.
One card, for example is:

![cloze-with-blank-lines-front1](https://github.com/user-attachments/assets/6b939d46-b93a-4a67-96d4-6985ccafb76e)

And after `Show Answer` is clicked, the following is displayed:

![cloze-with-blank-lines-answer](https://github.com/user-attachments/assets/225abd90-20a4-4e29-abb3-36beb61388d7)

## Limitation

### Blank Lines in Answer Side Only

Blank lines are only supported in the answer side of a multiline flashcard, and not in the question side.
