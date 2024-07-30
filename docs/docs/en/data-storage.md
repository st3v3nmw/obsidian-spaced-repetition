# Data Storage

## Scheduling Information

### Individual Markdown Files

This is the original method used for storing the scheduling information for cards and notes.

For cards this is stored in an HTML comment for that card. For example with the card:
```
The RCU and WCU limits for a single partition key value::3000 RCU, 1000 WCU
```

When the card is reviewed, an HTML comment will be added after the card's text, such as:
```
<!--SR:!2024-08-16,51,230-->
```

By default, the comment is stored on the line following the card text.
Alternatively, it can be stored on the same line by enabling the 
[Save scheduling comment on the same line as the flashcard's last line?](user-options.md#storage-of-scheduling-data) option.

Scheduling information for the note is kept at the beginning of the file, in YAML format within the frontmatter section.
For example:

![note-frontmatter](https://github.com/user-attachments/assets/b9744f50-c897-46ad-ab34-1bbc55796b57)

!!! note "Raw text format"
        ---
        sr-due: 2024-07-01
        sr-interval: 3
        sr-ease: 269
        ---

### Single Scheduling File

The scheduling information for all cards and notes is kept in a single dedicated file.

Implementation of this has not yet occurred. For progress see:

[[FEAT] Stop using YAML; Move plugin info and data to separate file #162](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/162)

---

## User Options

All user [options](user-options.md) are stored in `data.json` in the plugin folder.

---



## Card Postponement List

This records a list of cards reviewed today that have sibling cards that shouldn't be reviewed until tomorrow.

Cards are only added to this list if the [Bury sibling cards until the next day](user-options.md#flashcard-review) setting is turned on.

This information is also kept in the `data.json` file.

!!! note

    To minimise the space required for this, a copy of the card is not stored. Rather a small numeric hash code ("fingerprint") is kept.