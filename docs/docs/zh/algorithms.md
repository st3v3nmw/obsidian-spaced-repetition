# 学习算法

学习算法使用公式决定何时复习一个笔记或记忆闪卡。

| 算法                                        | 开发情况 |
| ------------------------------------------- | -------- |
| [SM-2-OSR](#sm-2-osr)                       | 已实现   |
| [FSRS](#fsrs)                               | 计划中   |
| [用户自定义间隔](#user-specified-intervals) | 计划中   |

## SM-2-OSR

- `SM-2-OSR` 是 [Anki](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html) 所采用的基于 [SM-2 算法](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)的变种。
- 使用三档打分制（记得/简单/较难）
- 初始熟练度会根据关联笔记的平均熟练度、当前笔记的重要性和基础熟练度加权计算（使用 最大外链因子）
- Anki 还会加入少量的随机“扰动”，以防止同时创建且评级相同的卡片复习周期相同，导致总在同一天被复习。
- 除 PageRanks 之外，笔记和卡片复习均采用相同算法。

### 算法细节

!!! warning "警告"

    该条目长时间未更新, 请注意参见 [源代码](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/src/algorithms/osr/srs-algorithm-osr.ts)

- 当存在外链时: 初始熟练度 = (1 - 链接加权) _ 基础熟练度 + 链接加权 _ 外链平均熟练度
- 链接加权 = 最大外链因子 \* min(1.0, log(外链数目 + 0.5) / log(64)) (以自适应不同情况)
    - 不同概念/笔记的优先级由 PageRank 算法设定（笔记之间存在轻重缓急）
        - 大多数情况下基础概念/笔记具有更高优先级
- 当用户对某个概念/笔记的自评为：
    - 简单, 熟练度增加 20 复习间隔更新为 原复习间隔 _ 更新后熟练度 / 100 _ 1.3 (1.3 是简单奖励)
    - 记得, 熟练度不变，复习间隔更新为 原复习间隔 \* old_ease / 100
    - 困难, 熟练度降低 20，复习间隔更新为 原复习间隔 \* 0.5
        - 0.5 可在设置中更改
        - 最小熟练度 = 130
    - 当复习间隔不小于 8 天时
        - 间隔 += 随机取值({-扰动, 0, +扰动})
            - 设定 扰动 = 向上取整(0.05 \* 间隔)
            - Anki 文档: > "[...] Anki 还会加入少量的随机扰动，以防止同时出现且评级相同的卡片获得相同的复习周期，导致其它们是在同一天被复习。"
- 复习计划信息将被存储于笔记的YAML front matter。

---

## FSRS

算法详情参见：[fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki/wiki)

本插件目前尚未集成该算法，进展参见：
[ [FEAT] sm-2 is outdated, can you please replace it with the fsrs algorithm? #748 ](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/748)

---

## 用户自定义间隔

这可能是最简单的“算法”了：允许用户为复习结果设置固定间隔天数。

例如：`较难` --> 1天

本插件目前尚未集成该算法，进展参见：
[ [FEAT] user defined "Easy, Good, Hard" values instead of or in addition to the algorithm defined one. #741 ](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/741)
