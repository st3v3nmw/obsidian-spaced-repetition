# Learning Algorithms

A learning algorithm is a formula that determines when a note or flashcard should next be reviewed.

| Algorithm                                           | Status                            |
| --------------------------------------------------- | --------------------------------- |
| [SM-2-OSR](#sm-2-osr)                               | Implemented (notes + flashcards)  |
| [FSRS](#fsrs)                                       | Implemented (flashcards / clozes) |
| [User Defined Intervals](#user-specified-intervals) | Planned                           |

## SM-2-OSR

- The `SM-2-OSR` algorithm is a variant of [Anki's algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html) which is based on the [SM-2 algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2).
- It supports ternary reviews i.e. a concept is either hard, good, or easy at the time of review.
- initial ease is weighted (using max_link_factor) depending on the average ease of linked notes, note importance, and the base ease.
- Anki also applies a small amount of random “fuzz” to prevent cards that were introduced at the same time and given the same ratings from sticking together and always coming up for review on the same day.
- The algorithm is essentially the same for both notes and flashcards - apart from the PageRanks

### Algorithm Details

!!! warning

    Note that this hasn't been updated in a while,
    please see the [code](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/main/src/scheduling/algorithms/osr/srs-algorithm-osr.ts).

- `if link_count > 0: initial_ease = (1 - link_contribution) * base_ease + link_contribution * average_ease` - `link_contribution = max_link_factor * min(1.0, log(link_count + 0.5) / log(64))` (cater for uncertainty)
    - The importance of the different concepts/notes is determined using the PageRank algorithm (not all notes are created equal xD)
        - On most occasions, the most fundamental concepts/notes have higher importance
- If the user reviews a concept/note as:
    - easy, the ease increases by `20` and the interval changes to `old_interval * new_ease / 100 * 1.3` (the 1.3 is the easy bonus)
    - good, the ease remains unchanged and the interval changes to `old_interval * old_ease / 100`
    - hard, the ease decreases by `20` and the interval changes to `old_interval * 0.5`
        - The `0.5` can be modified in settings
        - `minimum ease = 130`
    - For `8` or more days:
        - `interval += random_choice({-fuzz, 0, +fuzz})`
            - where `fuzz = ceil(0.05 * interval)`
            - [Anki docs](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html):
                > "[...] Anki also applies a small amount of random “fuzz” to prevent cards that were introduced at the same time and given the same ratings from sticking together and always coming up for review on the same day."
- Note scheduling information is stored in the YAML front matter
- Flashcard scheduling information is stored as an HTML comment after the card

---

## FSRS

- `FSRS` (Free Spaced Repetition Scheduler) can be selected for flashcards and clozes. Notes continue to be scheduled with `SM-2-OSR`.
- It is provided by the [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) library rather than reimplemented here.
- **Desired retention** (default `0.9`) is configurable, and the **maximum interval** is shared with `SM-2-OSR`.
- Short-term learning and relearning steps are enabled, so a card can fall due again within the same session. Due checks therefore use the current time rather than the start of the day.
- An existing `SM-2-OSR` flashcard schedule is converted on its first review under FSRS. Switching back rewrites the card to the `SM-2-OSR` format on its next review, which loses the FSRS-only state.

### Flashcard Comment Format

FSRS stores more fields than `SM-2-OSR`, so a scheduled card looks like:

```text
<!--SR:!fsrs,<due ISO>,<interval days>,<stability>,<difficulty>,<state>,<reps>,<lapses>,<learningSteps>,<lastReview ISO or ->-->
```

Note that stability comes **before** difficulty. Difficulty stays roughly within `1`–`10`, so a much larger number in the neighbouring slot is stability and not a corrupt difficulty.

A question with several cards (such as a reversed `:::` card) uses a placeholder for each sibling that hasn't been reviewed yet, which keeps the remaining schedules aligned with their cards:

```text
!fsrs,-,0,0,0,0,0,0,0,-
```

Older notes may still hold the `SM-2-OSR` placeholder date `2000-01-01` instead. Both forms are read as an unscheduled card.

The algorithm itself is detailed at [fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki/wiki).

---

## User Specified Intervals

This is the simplest "algorithm" possible. There are fixed intervals configured by the user for each of the possible review outcomes.

For example, `hard` might be configured for an interval of 1 day.

Implementation of this technique has not yet occurred. For progress see:
[ [FEAT] user defined "Easy, Good, Hard" values instead of or in addition to the algorithm defined one. #741 ](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/741)
