# Concepts Review Obsidian plugin

- Notes should be atomic i.e. focus on a single concept
- SM2 Spaced Repetition Algorithm
    - Variant of Anki's
    - initial ease = DEFAULT_EASE * (1.0 - o_factor - i_factor) + o_factor * outgoing_links_avg_ease + i_factor * incoming_links_avg_ease
        - we have both incoming & outgoing links: o_factor = 0.4, i_factor = 0.2
          - constraint: 0 <= o_factor + i_factor <= 1.0
        - we only have outgoing links: o_factor = 0.6, i_factor = 0
        - we only have incoming links: o_factor = 0, i_factor = 0.6
        - we have neither: initial ease = (DEFAULT_EASE, default = 250)
        - all values are changeable in settings
    - For 8 or more days:
        - interval += random_choice({-fuzz, 0, +fuzz})
            - where fuzz = ceil(0.05 * interval)
            - and random_choice uses a uniform probability distribution
    - Scheduling information stored in YAML front matter

## TODO

- Right pane
  - Groups items by dates (collapsible)
  - Handle file renames and file open events
- Refactor code
- Help & documentation