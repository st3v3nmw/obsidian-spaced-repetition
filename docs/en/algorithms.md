---
comments: true
---

# Algorithms

## SM-2

!!! warning

    Note that this hasn't been updated in a while,
    please see the [code](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/src/scheduling.ts).

(It's the same as that used for flashcards - apart from the PageRanks)

-   The algorithm is a variant of [Anki's algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html) which is based on the [SM-2 algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2).
-   It supports ternary reviews i.e. a concept is either hard, good, or easy at the time of review.
-   initial ease is weighted (using max_link_factor) depending on the average ease of linked notes, note importance, and the base ease.
    -   `if link_count > 0: initial_ease = (1 - link_contribution) * base_ease + link_contribution * average_ease`
        -   `link_contribution = max_link_factor * min(1.0, log(link_count + 0.5) / log(64))` (cater for uncertainty)
    -   The importance of the different concepts/notes is determined using the PageRank algorithm (not all notes are created equal xD)
        -   On most occasions, the most fundamental concepts/notes have higher importance
-   If the user reviews a concept/note as:
    -   easy, the ease increases by `20` and the interval changes to `old_interval * new_ease / 100 * 1.3` (the 1.3 is the easy bonus)
    -   good, the ease remains unchanged and the interval changes to `old_interval * old_ease / 100`
    -   hard, the ease decreases by `20` and the interval changes to `old_interval * 0.5`
        -   The `0.5` can be modified in settings
        -   `minimum ease = 130`
    -   For `8` or more days:
        -   `interval += random_choice({-fuzz, 0, +fuzz})`
            -   where `fuzz = ceil(0.05 * interval)`
            -   [Anki docs](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html):
                > "[...] Anki also applies a small amount of random “fuzz” to prevent cards that were introduced at the same time and given the same ratings from sticking together and always coming up for review on the same day."
-   The scheduling information is stored in the YAML front matter
