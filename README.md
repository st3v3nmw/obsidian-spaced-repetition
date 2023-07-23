This is a modified version of [obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) and merging [recall plugin](https://github.com/martin-jw/obsidian-recall) to use seperate json data file, and add some interesting features.

就是 SR 的时间排程信息可以单独保存，不修改原笔记文件内容，以及添加其他功能。

# Flashcard-Based and Note-Based Spaced Repetition Plugin

## Features

-   [@st3v3nmw's ReadMe](https://github.com/Newdea/obsidian-spaced-repetition#readme)
-   [中文使用手册](./docs/README_ZH.md)

-   merge [recall plugin](https://github.com/martin-jw/obsidian-recall) to use seperate file
    -   setting where to save schedule info by Data Location
        -   save on note file, just as used do.
        -   save on seperate tracked_files.json.
            -   it still have problems about saving cards shedule info, because when we change note content, the lineNumber and texthash will changes. I add a eventListener, but note work well in some cases. Is there any good idea?
    -   setting convert tracked note to decks
    -   switch Algorithm(only work on saving on seperate tracked_files.json.): Default, anki, [Fsrs](https://github.com/open-spaced-repetition/fsrs.js)
    -   file menu to tracknote/untracknote
-   show floatbar for reviewing response when reviewing note by click statusbar or review command or sidebar, and can set whether showing the interval or not;
-   Reviewing a Notes directly [#635];
-   when using fsrs, output `ob-revlog.csv`, to optimize the algorithm parameters using [optimizer](https://github.com/open-spaced-repetition/fsrs4remnote/blob/main/optimizer.ipynb) for better review;

## How to install the plugin

1. Download main.js, manifest.json, styles.css from the latest release (see [releases](https://github.com/open-spaced-repetition/obsidian-spaced-repetition-recall/releases/))
2. Create a new folder in `Vault-name/.obsidian/plugins` and put the downloaded files in there
3. Reload your plugins and enable the plugin

OR USE BRAT pulgin;

## Usage

Check the [docs](https://www.stephenmwangi.com/obsidian-spaced-repetition/) for more details.

## Thanks

Thank you to everyone who has created a plugin that inspired me and I took code from.

-   first, thanks to [@st3v3nmw's obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) and [@martin-jw recall plugin](https://github.com/martin-jw/obsidian-recall)
-   floatbar(thanks to [@chetachi's cMenu](https://github.com/chetachiezikeuzor/cMenu-Plugin))
-   [Fsrs Algorithm](https://github.com/open-spaced-repetition/fsrs.js)
