# 笔记

!!! tip "提示"

    关于如何编写和组织笔记的指南，请参见 [Spaced Repetition Guides](resources.md#notes)

## 开始使用

为需复习的 Markdown 笔记添加 `note review` 标签（默认值是`#review`）

该笔记会出现在右侧边栏 `笔记复习序列` 的 `#review` 标签下。

!!! note "注意"

    添加 `#review` 标签的笔记不会立即出现在笔记复习序列中。<br>
    您需要点击 `复习卡片按钮` 或 `Spaced Repitition 状态栏` 以更新队列。

## 笔记复习序列

![笔记复习序列](https://github.com/user-attachments/assets/c0e1d09c-610f-4775-b532-ab78369b117a)

!!! note "注意"

    1. 笔记复习序列 <br/>
    2. `#review`标签下的卡组预览 <br/>
    3. 新笔记，即新增`#review`标签但尚未复习的笔记 <br/>
    4. 计划于 8 月 1 日复习的笔记 <br/>
    5. 计划于 8 月 31 日复习的笔记 <br/>

### 显示笔记复习序列

默认情况下，插件启动时会自动显示笔记复习序列（可在[设置](user-options.md#note-settings)中修改 `启动时开启复习笔记窗格`）

您也可以运行 `Open Notes Review Queue in sidebar`
[快捷指令](plugin-commands.md) 以显示复习序列。

## 复习

打开笔记，阅读并复习。完成后，根据您对笔记的理解程度，在菜单（三点图标）中选择 “复习：简单”，“复习：记得” 或 “复习：较难”。

![三点菜单](https://github.com/user-attachments/assets/5f37ab88-30f9-477d-b39c-eb86ba15abdb)

也可在 笔记复习序列 中右键笔记调出相同选项。

![笔记复习序列](https://github.com/user-attachments/assets/d4affa19-5126-45f8-bf3c-0079d2a8a597)

随后，笔记会根据 [学习算法](algorithms.md) 自动安排复习计划，并更新状态:

![笔记头部标签](https://github.com/user-attachments/assets/b9744f50-c897-46ad-ab34-1bbc55796b57)

### 快捷键

您可以通过 [快捷指令](plugin-commands.md) 选择 `记得`，`简单`和`较难`。

虽然这不如上述方法便捷，但您可在`设置 -> 快捷键`中为其自定义快捷键。

### 选择笔记以复习

您可以通过如下方式选择笔记以复习:

- 使用 Obsidian 标准功能打开笔记
- 在 笔记复习序列 中双击笔记
- 点击窗口右下角的 `Spaced Repetition 状态栏`
- 快捷指令 [打开一个笔记开始复习](plugin-commands.md)

相关选项还包括:

- [随机打开一个笔记复习](user-options.md)
- [复习后自动打开下一个笔记](user-options.md)

## 多个复习卡组

默认使用标签为 `#review` 的唯一卡组。

您可在 [设置](user-options.md#note-settings) 中修改默认标签，并添加更多复习卡组。

## Spaced Repetition 状态栏

窗口右下角状态栏的 `复习：N 笔记` 显示今日需复习的笔记数量(今日笔记+逾期笔记)。

点击 状态栏 可打开一个笔记开始复习。
