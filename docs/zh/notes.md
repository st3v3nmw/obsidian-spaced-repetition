# 笔记

-   笔记应当具有原子性：说清楚**一个**概念；
-   笔记之间应当高度关联；
-   先理解，后复习；
-   善用 [费曼学习法](https://fs.blog/2021/02/feynman-learning-technique/)

## 开始使用

为需要复习的笔记添加 `#review` 标签。你可以在插件设置中修改此默认标签（也可以使用多个标签）

## 新笔记

新笔记将展示在右栏的 `新` （复习序列）中，如图：

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/new_notes.png" />

## 复习

打开笔记即可复习。在菜单中选择 `复习: 简单`，`复习: 记得` 或 `复习: 较难`。 选择 `简单`，`记得` 还是 `较难` 取决于你对复习材料的理解程度。

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/more_options.png" />

在文件上右击可以调出相同选项：

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/file_context_menu.png" />

笔记将被添加到复习队列中：

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/assets/scheduled.png" />

### 快速复习

我们提供快速进入复习模式的命令。你可以在 `设置 -> 快捷键` 中定制快捷键。这可以使您直接开始复习。

### 复习设置

可供定制的选项包括：

-   随机打开笔记或按照优先级排序
-   在复习完成后是否自动打开下一个笔记

## 复习计划

位于状态栏底部的 `复习: N 卡片已到期` 显示您今天需要复习的卡片数目（今日卡片 + 逾期卡片）。点击可打开一张卡片开始复习。

您也可以使用 `打开一个笔记开始复习` 命令。

## 复习序列

-   每日复习条目将按照优先级排序 (PageRank)

## 渐进式写作

阅读 `@aviskase` 的 [介绍](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/15)

视频资源：

-   英文： [Obsidian: inbox review with spaced repetition](https://youtu.be/zG5r7QIY_TM)
-   俄文： [Yuliya Bagriy - Разгребатель инбокса заметок как у Andy Matuschak в Obsidian](https://www.youtube.com/watch?v=CF6SSHB74cs)

### 概要

Andy Matuschak 在 [写作素材库中引入间隔重复系统](https://notes.andymatuschak.org/z7iCjRziX6V6unNWL81yc2dJicpRw2Cpp9MfQ).

简而言之，可以进行四种操作 (此处 `x < y`):

-   跳过笔记 (增加 `x` 天的复习间隔) == 标记为 `记得`
-   已阅，觉得有用 (降低复习间隔) == 标记为 `较难`
-   已阅，觉得没用 (增加 `y` 天的复习间隔) == 标记为 `简单`
-   转换为 evergreen 笔记 （中止使用间隔重复系统）
