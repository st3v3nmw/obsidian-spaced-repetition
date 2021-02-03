# Notes Review Obsidian plugin

- Notes should be atomic i.e. focus on a single concept
- SM2 Spaced Repetition Algorithm
    - Variant of Anki's
    - initial ease = 100 + o_factor * outgoing_links_avg_ease + i_factor * incoming_links_avg_ease
        - we have both incoming & outgoing links: o_factor = 0.4, i_factor = 0.2
        - we only have outgoing links: o_factor = 0.6, i_factor = 0
        - we only have incoming links: o_factor = 0, i_factor = 0.6
        - we have neither: initial ease = 250
    - For 8 or more days:
        - interval += random_choice({-fuzz, 0, +fuzz})
            - where fuzz = ceil(0.05 * interval)
            - and random_choice uses a uniform probability distribution
    - Scheduling information stored in YAML headers

## TODO

- Add settings for:
    - Initial ease calculation
        - constant
        - o_factor
        - i_factor
    - Initial interval
    - Minimum file length in # of lines
    - Lapses interval change (default = 50%)
- Add list of notes and their due dates on right panel
- Help & documentation