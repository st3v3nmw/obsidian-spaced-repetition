# Concepts Review Obsidian plugin

## Note Taking

- Notes should be atomic i.e. focus on a single concept.
- Outgoing links should point to concepts which the current note depends on or is highly related to (i.e. contrast, similarity, etc).
- Reviews should start only after properly understanding a concept.

## Spaced Repetition Algorithm

- Spaced repetition? [basics](https://ncase.me/remember/), [detailed](https://www.gwern.net/Spaced-repetition)
- The algorithm is a variant of [Anki's algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html) which is based on the [SM-2 algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2).
- It supports binary reviews i.e. a concept is either hard or easy at the time of review.
- initial ease is weighted depending on the average ease of outgoing links (o_factor), average ease of incoming links (i_factor), and the base ease.
  - The average ease of outgoing links contributes o_factor% to the initial ease
  - The average ease of incoming links contributes i_factor% to the initial ease
  - By default, o_factor = 50, i_factor = 25, and base ease = 250 (contributes 25% to the initial ease)
    - o_factor should be greater than i_factor
  - If we don't have either outgoing or incoming links, their respective weightings are allocated to the base ease
  - All values are changeable in settings
- If the user reviews a concept as:
  - easy, the ease increases by 20 and the interval changes to `old_interval * new_ease / 100`
  - hard, the ease decreases by 20 and the interval changes to `old_interval * 0.5`
    - The 0.5 can be modified in settings
    - Minimum ease = 130
  - For 8 or more days:
      - interval += random_choice({-fuzz, 0, +fuzz})
          - where fuzz = ceil(0.05 * interval)
          - Anki docs:
            > "[...] Anki also applies a small amount of random “fuzz” to prevent cards that were introduced at the same time and given the same ratings from sticking together and always coming up for review on the same day."
- Scheduling information stored in YAML front matter

## TODO

- Fix workflow
- Refactor code
- Help & documentation
- Dealing with large vaults for the 1st time
  - Distribute existing notes over N days for 1st time review