本插件是魔改自[obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) 和 [recall plugin](https://github.com/martin-jw/obsidian-recall)
就是 SR 的复习时间信息可以单独保存，不修改原笔记文件内容，以及添加其他功能。

# Flashcard-Based and Note-Based Spaced Repetition Plugin

## Features

-   [@st3v3nmw's ReadMe](https://github.com/Newdea/obsidian-spaced-repetition#readme)
- [english ReadMe](../README.md)

1. 复习时间信息可以保存在单独文件内，不修改原笔记文件内容；
2. 在复习笔记时可以显示悬浮栏（跟复习卡片时类似），方便选择记忆效果，且可显隐到下次重复的时间间隔；
3. 可以只转换复习笔记到卡片组，而不是全部库的笔记都转换;
4. 在有多个标签时，可不用选标签，直接打开笔记；
5. 算法可以切换：默认的Anki优化算法、Anki算法、[Fsrs算法](https://github.com/open-spaced-repetition/fsrs.js)；
6. 使用Fsrs 算法时，可输出重复日志文件 `ob_revlog.csv`，以使用[optimizer](https://github.com/open-spaced-repetition/fsrs4remnote/blob/main/optimizer.ipynb) 优化算法参数，达到更好的复习效果；
7. 其他待发现的小改动；

**注意**
没有使用过obsidian-spaced-repetition插件的可以直接用，正在使用obsidian-spaced-repetition插件的话，建议试用前先备份 :yum:


欢迎大家试用讨论

## 适用场景
1. 间隔重复复习；
2. 渐进式总结；
3. 增量写作；

Check the [docs](https://www.stephenmwangi.com/obsidian-spaced-repetition/) for more details.


## 下载
推荐BRAT直接添加github链接更方便些

github: https://github.com/open-spaced-repetition/obsidian-spaced-repetition-recall

或：

1. Download main.js, manifest.json, styles.css from the latest release (see [releases](https://github.com/open-spaced-repetition/obsidian-spaced-repetition-recall/releases/))
2. Create a new folder in `Vault-name/.obsidian/plugins` and put the downloaded files in there
3. Reload your plugins and enable the plugin


## Thanks

Thank you to everyone who has created a plugin that inspired me and I took code from.

-   first, thanks to [@st3v3nmw's obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) and [@martin-jw recall plugin](https://github.com/martin-jw/obsidian-recall)
-   floatbar(thanks to [@chetachi's cMenu](https://github.com/chetachiezikeuzor/cMenu-Plugin))
