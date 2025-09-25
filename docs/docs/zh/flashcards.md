# 卡片

## 新建卡片

[Piotr Wozniak的知识标准化二十守则](https://supermemo.guru/wiki/20_rules_of_knowledge_formulation) 是创建复习卡片时的良好入门指南。

### 单行基础卡片 (Remnote风格)

问题和答案以 `::` 分隔（可在设置中更改）。

```markdown
这是问题::这是答案
```

### 单行双向卡片

创建 `正:::反` 与其反向卡片 `反:::正`.

问题和答案以 `:::` 分隔（可在设置中更改）。

```markdown
这是问题:::这是答案
```

注意：初次复习时插件会同时展示正向和反向卡片。
如果打开 **将关联卡片隐藏至下一天？** 将仅展示正向卡片。

### 多行基础卡片

卡片的正反面以 `?` 分隔（可在设置中更改）。

```markdown
多行卡片的正面
?
多行卡片的反面
```

只要正反面字段都在 `?` 的作用域内，卡片内容可以跨越多行:

```markdown
顾名思义
多行卡片的内容
可以跨越多行
?
这也包括
卡片的反面
```

### 多行双向卡片

创建 `正??反` 与其反向卡片 `反??正`.

卡片的正反面以 `??` 分隔（可在设置中更改）。

```markdown
多行卡片的正面
??
多行卡片的反面
```

只要正反面字段都在 `??` 的作用域内，卡片内容可以跨越多行:

```markdown
顾名思义
多行卡片的内容
可以跨越多行
??
这也包括
卡片的反面
```

注意：其隐藏机制同单行双向卡片

### 填空卡片

你可以轻松使用 `==高亮==` ，`**加粗**` ，或 `{{花括号}}` 创建挖空卡片.

该特性可在设置中开关。

暂不支持 Anki 风格的 `{{c1:This text}} would {{c2:generate}} {{c1:2 cards}}` 挖空语法。该特性正在 [计划中](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/93/)。

## 卡组

![Screenshot from 2021-06-05 19-28-24](https://user-images.githubusercontent.com/43380836/120922211-78603400-c6d0-11eb-9d09-bdd5df1c9112.png)

卡组名称右边的绿色和蓝色数字分别表示到期卡片和新卡片数目。

### 使用 Obsidian 标签

1. 在设置中设定制卡标签 (默认为 `#flashcards`)。
2. 将您想要制卡的笔记打上该标签。

#### 标签层级

注意 `#flashcards` 可以匹配嵌套标签例如 `#flashcards/subdeck/subdeck`.

#### 单个文件包含多个标签

单一文件中可以包含不同卡组的多个卡片内容。

这是因为一个标签的作用域直到下一个标签出现才会结束。

例如：

```markdown
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB
Question4 (in deckB)::Answer4
Question5 (also in deckB)::Answer5

#flashcards/deckC
Question6 (in deckC)::Answer6
```

#### 多个卡组包含同一卡片

通常情况下一张卡片只会出现在一个卡组。然而某些时候，一张卡片无法被恰当地归入单一卡组的层级结构中。

这种情况下，卡片可以被标记为归属为多个卡组。比如下面这张卡片属于三个卡组。

```markdown
#flashcards/language/words #flashcards/trivia #flashcards/learned-from-tv
A group of cats is called a::clowder
```

注意，在上面的例子中所有标签必须位于一行并以空格隔开。

#### 作用于特定问答的卡片

位于卡片内容同一行开头处的标签是「仅限当前问答」的。

例如：

```markdown
#flashcards/deckA
Question1 (in deckA)::Answer1
Question2 (also in deckA)::Answer2
Question3 (also in deckA)::Answer3

#flashcards/deckB Question4 (in deckB)::Answer4

Question6 (in deckA)::Answer6
```

此处 `Question6` 将出现在 `deckA` 但不会出现于 `deckB` 因 `deckB` 是仅作用于 `Question4` 的标签。

### 使用目录结构

插件将自动遍历目录结构并依次创建卡组和子卡组，例如 `Folder/sub-folder/sub-sub-folder` ⇔ `Deck/sub-deck/sub-sub-deck`。

这是使用标签指定卡组的替代方案，可以在设置中打开。

## 复习

注意您可以按 `S` 跳过一张卡片（大小写不敏感）。

!!! 提示

    如果您在移动设备上遇到了悬浮框尺寸的问题，进入设置并将 _Flashcard Height Percentage_ 和 _Flashcard Width Percentage_
    设为 100% 以适应屏幕。

### 快速复习

你可以在快速复习中使用如下快捷键：

- `Space/Enter` => 显示答案
- `0` => 重置进度 (等价于 Anki 中的 `Again`)
- `1` => 标记为 `Hard`
- `2` 或 `Space` => 标记为 `Good`
- `3` => 标记为 `Easy`

### 上下文

如用于制卡的部分位于笔记标题之下，则卡片中会附加一个上下文标题。

例如：

```markdown
#flashcards

# Trivia

## Capitals

### Africa

Kenya::Nairobi

### North America

Canada::Ottawa
```

卡片 `Kenya::Nairobi` 将会被附上 `Trivia > Capitals > Africa` 作为上下文标题而卡片 `Canada::Ottawa` 将会被附上 `Trivia > Capitals > North America` 作为上下文标题。

### 删除卡片

要删除一个卡片，只需删除复习规划标签和卡片相关文本。

### 忽略卡片

你可以使用诸如 `<!--Card text <!--SR:2021-08-20,13,290--> -->` 的HTML标签来将其从复习队列中移除。你可以随时移除该标签。

## 集中复习

当前仅支持使用 集中复习此笔记中的卡片 命令。将复习所有卡组中来自该笔记的卡片。

## 数据统计

统计页面可以使用 `View Statistics` 命令打开。

### 预估

计算将要到期的卡片数量。

<img src="https://raw.githubusercontent.com/st3v3nmw/obsidian-spaced-repetition/master/docs/media/en/stats_forecast.png" />

### 复习间隔

统计卡片再次出现的时间间隔。

### 熟练度

统计卡片熟练度。

### 卡片类型

统计卡片类型：新卡片，较新卡片, 熟悉卡片（复习间隔超过一个月）。
