If you see this then you probably want to add a new data store.

In case you want to add one where the data is stored outside of the notes, then may want to have a look at the `WIP_DataStores.zip` file next to this README.

In there are files which already kind of implement that kind of data store, but it never really worked out.
Maybe you can use them as a starting point for your own data store. Also have a look at this PR for a more detailed infos on this: https://github.com/st3v3nmw/obsidian-spaced-repetition/pull/1471

In general we have agreed that this kind of data store should work as follows:

## Storing data

- In the vault in a customizable location (by default in "/Spaced Repetition"), as the obsidian sync service doesn't sync random files in the plugin folder by default and because it is hard to create/update files in the plugin folder on mobile
  The schedule data will be stored in a file named "schedule-data.sr.md" which is located in the "Spaced Repetition" folder
  The data is stored in json format, but still in a markdown file, so that the obsidian sync service syncs it by default

## Linking data

- Each reviewable card gets a block id like this ("sr-id" is used to make them easy to find)-> ^sr-id-[generated short uuid goes here]
- Each reviewable note gets a sr-id in the frontmatter like it is already sort of done
- Those ids link then to the schedule data files
