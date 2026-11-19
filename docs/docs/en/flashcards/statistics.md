## Statistics

The statistics section can be accessed in the `Statistics` section in the plugin's settings.

### Forecast

Stats on the number of cards due in the future.

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/main/docs/media/en/stats_forecast.png" />

### Intervals

Stats on delays until cards are shown again.

### Eases

Stats on card eases.

### Card Types

Stats on card types: New, Young, Mature (Have intervals more than 1 month).

## Usage history

The `Usage history` section in the plugin's settings (next to `Statistics`) shows how you use the plugin:

- the time you spent reviewing today, in the last 7 and 30 days, and in total,
- your current and longest streak of days with reviews,
- charts of the time spent and the reviews per day (reviews of new and known cards), the answers you gave, and the hours of the day you review at,
- a table of the last 14 days.

### How time is measured

The time spent is the time between your actions in a review session (showing a card, showing the answer, answering, skipping, ...). Breaks of more than 5 minutes between two actions count as 5 minutes, because you most likely left the review open and did something else.

### What is recorded

When `Record usage history` is on (the default), the plugin logs every action in review sessions with a timestamp, for example "card shown", "answer shown", "card reviewed as Good" (with the schedule before and after, and for FSRS cards the probability of recall that FSRS predicted right before the review), "card skipped", "card suspended", "action undone", and also note reviews. Undone actions are not counted in the statistics.

To tell cards apart in the history, each card gets a permanent id in its scheduling comment the first time it is shown in a review session:

```
<!--SR:!2021-08-20,13,290,id=k2n8x0c4qz7m-->
```

A card that was never reviewed gets a scheduling comment with only the id. Keep the id when you edit the card. If you copy a card together with its scheduling comment, remove the id from the copy, so that the two cards don't share their history.

The history is stored as [JSON Lines](https://jsonlines.org) files. Each device writes its own file per month (e.g. `events-2026-11-x7k2p9q1.jsonl`), so syncing the vault doesn't cause conflicts. The format is meant to be used by other tools and future scheduling algorithms too.

By default, the files are in the `history` folder of the plugin's folder (`.obsidian/plugins/obsidian-spaced-repetition/history`). To store them somewhere else, set `History folder` on the `Usage history` page to a folder path relative to the vault root, for example `Spaced Repetition/history`. Leave it empty to go back to the default. When you change the folder, the existing history files are moved to the new folder.

!!! tip

    A folder outside of `.obsidian` is synced like your notes, e.g. if your sync service skips the plugin folders.
    Obsidian only shows the `.jsonl` files in the file explorer if `Detect all file extensions` is on (`Settings > Files and links`).
