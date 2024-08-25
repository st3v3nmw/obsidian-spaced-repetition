# Including Blank Lines in Flashcards

By default, [Multi-line Basic](qanda-cards.md#multi-line-basic), [Multi-line Bidirectional](qanda-cards.md#multi-line-bidirectional) 
and [Cloze](basic-cloze-cards.md) type flashcards recognize a blank line as the end of the flashcard text.
This means that blank lines can not be included within the text.

If blank lines need to be included (e.g. on a card containing a markdown table), the
`Characters denoting the end of clozes and multiline flashcards` [setting](../user-options.md#flashcard-separators)
needs to be changed.

For example, it could be changed to `+++`.

## Including a Table in the Flashcard Answer

Sometimes it is desirable or necessary to include blank lines in the answer section of a
multiline basic type flashcard.

For example, a table in 

Obsidian requires a blank line before a table for it to be displayed correctly.
Without it, Obsidian displays it just as text and not correctly formatted.

![table-with-no-preceding-blank-line](https://github.com/user-attachments/assets/daed1309-3b38-4d14-bb42-b302efda96df)

And with a blank line after the `?` and before the table, it is displayed correctly.
However, by default a blank line signifies the end of the multiline card.

To include the blank line, the
`Characters denoting the end of clozes and multiline flashcards` [setting](../user-options.md#flashcard-separators)
needs to be changed. Then that character sequence added as a line after the end of the flashcard text. For example:


![table-with-preceding-blank-line+++](https://github.com/user-attachments/assets/ccf74695-f38a-4068-832f-ae2c1a3cab0b)

Now the card is displayed correctly during a review.

![table-with-preceding-blank-line-review](https://github.com/user-attachments/assets/3bff8d25-f91f-4bc0-b922-7471d6b60869)