# 数据存储

## 复习计划信息

### 独立Markdown文件

这是存储卡片和笔记的 复习计划信息 的默认方法。

对于卡片，信息存储在对应的 HTML 注释中。例如，对于卡片：

```
The RCU and WCU limits for a single partition key value::3000 RCU, 1000 WCU
```

复习后，会自动添加HTML注释：

```
<!--SR:!2024-08-16,51,230-->
```

默认情况下，注释会生成在卡片文本的下一行。<br>
您可以启用 [将计划重复时间保存在最后一行的同一行？](user-options.md#storage-of-scheduling-data)以在文本的同行生成注释。

笔记的复习计划信息存储在文件开头的 YAML frontmatter 中，例如：

![note-frontmatter](https://github.com/user-attachments/assets/b9744f50-c897-46ad-ab34-1bbc55796b57)

!!! note "纯文本格式"

    ---
    sr-due: 2024-07-01
    sr-interval: 3
    sr-ease: 269
    ---

### 集中计划文件

所有卡片和笔记的 复习计划信息 存储在统一专用文件中。

本插件目前尚未集成该方法，进展参见：

[[FEAT] Stop using YAML; Move plugin info and data to separate file #162](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/162)

---

## 个性化设置

所有用户 [设置选项](user-options.md) 存储在插件目录的 `data.json` 文件中。

---

## 卡片暂存列表

当某张卡片当天被复习过后，其 关联卡片 直至次日才会出现。

仅当 [将关联卡片隐藏至下一天？](user-options.md#flashcard-review) 选项启用时生效。

该信息同样存储在 `data.json` 文件。

!!! note "注意"

    为节省存储空间，卡片完整内容将不被存储，仅保留简短的数字哈希值（"fingerprint"）
