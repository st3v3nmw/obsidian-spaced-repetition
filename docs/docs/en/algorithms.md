# Learning Algorithms

A learning algorithm is a formula that determines when a note or flashcard should next be reviewed.

| Algorithm                                           | Status      |
| --------------------------------------------------- | ----------- |
| [SM-2-OSR](#sm-2-osr)                               | Implemented |
| [FSRS](#fsrs)                                       | Implemented |
| [User Defined Intervals](#user-specified-intervals) | Planned     |

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
- The scheduling information is stored in the YAML front matter

---

## FSRS

The algorithm is detailed at:
[fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki/wiki)

Select `FSRS` as the flashcard algorithm in the settings. FSRS schedules flashcards only, whole-note review keeps using SM-2-OSR.
The scheduling uses [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) with its default parameters, your desired retention and the maximum interval.

Two versions of FSRS are in use side by side:

| Card                                        | FSRS version |
| ------------------------------------------- | ------------ |
| New card                                    | FSRS-7       |
| Card that you reset                         | FSRS-7       |
| SM-2 card, when you review it the next time | FSRS-7       |
| Card that is already scheduled with FSRS-6  | FSRS-6       |

A card doesn't move from FSRS-6 to FSRS-7. FSRS-7 keeps a second memory value per card (a fast memory trace next to the slow one),
which can only be calculated from the complete review history of the card. Moving the card would replace the memory
state it built up with FSRS-6 by a guess.
When you reset a card, its memory starts over, so it continues with FSRS-7. The usage history keeps all its earlier reviews.

An SM-2 card has no FSRS memory state at all, so its FSRS-7 state is estimated when you review it the next time:

- Its due date is taken as the moment the probability of recall drops to 90%. The SM-2 card keeps its due date.
- The fast stability is set to 80% of the slow stability, the ratio FSRS-7 uses for new cards.
- The slow stability is chosen so that FSRS-7 predicts 90% recall on the due date.
- The difficulty is derived from the SM-2 ease.

Your following reviews of the card correct this estimate.

FSRS-7 intervals are fractional days, so a card can become due at any time of the day.

The schedule is stored in the scheduling comment of each card:

- FSRS-6: `<!--SR:!fsrs,due,interval,stability,difficulty,state,reps,lapses,learningSteps,lastReview-->`
- FSRS-7: `<!--SR:!fsrs7,due,interval,stability,stabilityFast,difficulty,state,reps,lapses,learningSteps,lastReview-->`

---

## User Specified Intervals

This is the simplest "algorithm" possible. There are fixed intervals configured by the user for each of the possible review outcomes.

For example, `hard` might be configured for an interval of 1 day.

Implementation of this technique has not yet occurred. For progress see:
[ [FEAT] user defined "Easy, Good, Hard" values instead of or in addition to the algorithm defined one. #741 ](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/741)
