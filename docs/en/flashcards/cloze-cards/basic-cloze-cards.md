# Basic Cloze Cards

With [Single & Multiline Cards](../flashcard-syntax.md) the text of both the front and back of each card is specified.

With `cloze` cards a single text is specified, together with an identification of which parts of the text should be obscured.

The front of the card is displayed as the text with (one or more) `cloze deletions` obscured.

## Cloze Deletions

A part of the card text is identified as a cloze deletion by surrounding it with the `cloze delimiter`.

### Single Cloze Deletion
By default, the cloze delimiter is `==`, and a simple cloze card would be:
```
The first female prime minister of Australia was ==Julia Gillard==
```

!!! note "Front of card"
    The first female prime minister of Australia was [...]

And
!!! note "Back of card"
    The first female prime minister of Australia was Julia Gillard

### Multiple Cloze Deletions
If the card text identifies multiple parts as cloze deletions, then multiple cards will be shown for review, each one occluding one deletion, while leaving the other deletions visible.

For instance, the following note:
```
The first female ==prime minister== of Australia was ==Julia Gillard==
```

!!! note "Front of card 1"
    The first female [...] of Australia was Julia Gillard

!!! note "Front of card 2"
    The first female prime minister of Australia was [...]

!!! note "Back of both cards"
    The first female prime minister of Australia was Julia Gillard


## Cloze Delimiter

The cloze delimiter can be modified in settings, e.g. to `**`, or curly braces `{{text in curly braces}}`.


## Cloze Hints

Hints can be included for any of the cloze deletions, using the `^[text of hint]` syntax. For example:

```
Kaleida, funded to the tune of ==$40 million==^[USD]
by Apple Computer and IBM in ==1991==^[year]
```

!!! note "Front of card 1"
    Kaleida, funded to the tune of [USD] by Apple Computer and IBM in 1991
!!! note "Front of card 2"
    Kaleida, funded to the tune of $40 million by Apple Computer and IBM in [year]


## Deletion Groups

In the above examples, each card shown for review has one cloze deletion shown and all the others obscured.

`Deletion groups` allow this to be tailored by specifying a `group number` for each cloze deletion.

For example:
```
This is ==in group 1==[^1], this ==in group 2==[^2] 
and this also ==in group 1==[^1]
```

!!! note "Front of card 1"
    This is  [...], this in group 2 and this also [...]
!!! note "Front of card 2"
    This is in group 1, this  [...] and this also in group 1
!!! note "Back of both cards"
    This is in group 1, this in group 2 and this also in group 1

!!! warning
    When using deletion groups, every cloze deletion must include the group number

## Anki style

!!! warning "Fix documentation"
    Anki style `{{c1:This text}} would {{c2:generate}} {{c1:2 cards}}` cloze deletions are not currently supported. This feature is being tracked [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/93/).