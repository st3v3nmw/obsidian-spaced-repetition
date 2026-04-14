# 贡献

首先，感谢您想为 Spaced Repetition 插件做出贡献！

## 报告Bug & 功能请求

- 查看 [路线图](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/2/) 以了解即将推出的功能和修复。
- 如果您想请求新功能或报告Bug，请点击[这里](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/)。
- 前往[讨论区](https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/)参与问答互助、意见反馈和常规讨论。

## 翻译

在 Obsidian 社区的帮助下，插件已支持如下语言。😄

- Arabic / العربية
- Chinese (Simplified) / 简体中文
- Chinese (Traditional) / 繁體中文
- Czech / čeština
- French / français
- German / Deutsch
- Italian / Italiano
- Korean / 한국어
- Japanese / 日本語
- Polish / Polski
- Portuguese (Brazil) / Português do Brasil
- Spanish / Español
- Russian / русский
- Turkish / Türkçe

### 步骤

若要添加对您语言的支持，请按如下步骤操作：

1. Fork [代码仓库](https://github.com/st3v3nmw/obsidian-spaced-repetition)。
2. 将 `src/lang/locale/en.ts` 中的内容复制到 `src/lang/locale/` 目录下对应的文件 (例如：`fr.ts` 对应法语, `sw.ts` 对应斯瓦希里语)。 本地化代码应符合 [IETF 语言标签规范](https://en.wikipedia.org/wiki/IETF_language_tag)。
3. 进行翻译。
4. 提交Pull Request。

### 示例

样例`en.ts`文件:

```typescript
// English

export default {
    EASY: "Easy",
    SHOW_ANSWER: "Show Answer",
    DAYS_STR_IVL: "${interval} days",
    CHECK_ALGORITHM_WIKI:
        'For more information, check the <a href="${algoUrl}">algorithm implementation</a>.',
};
```

对应的`sw.ts`文件:

```typescript
// Swahili

export default {
    EASY: "Rahisi",
    SHOW_ANSWER: "Onyesha Jibu",
    DAYS_STR_IVL: "Siku ${interval}",
    CHECK_ALGORITHM_WIKI:
        'Kwa habari zaidi, angalia <a href="${algoUrl}">utekelezaji wa algorithm</a>.',
};
```

<sub><sup>最后一部分,呃...其实用了谷歌翻译。虽然我对斯瓦希里语有实际理解，但还不足以写计算机术语哈哈。</sup></sub>

请注意:

1. 只需翻译键名右侧的字符串（模板）。
2. 不要翻译 `${}` 里的内容。这个占位符用于代码变量替换。例如：如果 interval = 4，英语会显示`4 days`，斯瓦希里语则会是`Siku 4`。是不是很巧妙？

---

## 代码

### 常规更改

1. 修改代码。
2. 运行`pnpm dev`来查看变化和自动重构插件。
3. 您可以在 构建文件 和 Obsidian vault 间创建符号链接，如：

    ```bash
    # 从 Obsidian vault 移除现有插件文件
    rm ~/notes/.obsidian/plugins/obsidian-spaced-repetition/main.js ~/notes/.obsidian/plugins/obsidian-spaced-repetition/manifest.json ~/notes/.obsidian/plugins/obsidian-spaced-repetition/styles.css
    # 使用绝对路径
    ln -s /home/stephen/obsidian-spaced-repetition/build/main.js /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/manifest.json /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/styles.css /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ```

    - 此过程可搭配 [Hot Reload 插件](https://github.com/pjeby/hot-reload)。

4. 请记录“面向用户”的修改，如：新增功能，UI调整，等等。
5. 如果您的“业务逻辑”与 Obsidian APIs 充分解耦，请写一些单元测试。
    - 本项目使用 [jest](https://jestjs.io/), 测试文件存放在`tests/`目录。
    - `pnpm test`
6. 在推送您的修改前，请执行 linter：`pnpm lint`
    - 如果出现任何警告，请格式化代码: `pnpm format`
7. 提交 Pull Request。

### UI 修改

- 所有 UI 修改都应当在`src/ui/`目录内完成。

- 将修改放在正确的区域 (参考代码中的 "MARK:" 或 "#region" 注释)。

- 用 JSDoc 为你的函数和类编写文档。

- 您可以在开发者控制台中输入以下代码来切换桌面端和移动端视图。

    ```js
    this.app.emulateMobile(false); // 切换至桌面端视图

    this.app.emulateMobile(true); // 切换至移动端视图
    ```

- 在以下所有布局中测试您的 UI 修改:
    1. 桌面端
    2. 移动端竖屏模式
    3. 小尺寸移动设备
    4. 移动端横屏模式
    5. 平板横屏模式
    6. 平板竖屏模式
    7. 上述所有场景 + 启用标签视图
    8. 上述所有场景 + 禁用标签视图
    9. 上述所有场景 + 禁用标签视图 + 卡片不同长宽比

---

## 文档

文档由 Markdown 文件构成，并通过[MkDocs](https://www.mkdocs.org/) 转换为静态网页。
特别地，本项目采用 [MkDocs Material](https://squidfunk.github.io/mkdocs-material/getting-started/)。

这些文件存放于`docs/docs/`相应的语言文件夹内。例如，英文文档位于 `docs/docs/en/`目录下。

文档托管于[https://stephenmwangi.com/obsidian-spaced-repetition/](https://stephenmwangi.com/obsidian-spaced-repetition/)。

对于微小改动，您可以仅提交 Pull Request 来合并(针对 `main` 分支)。
这些修改将在新[发行版](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases)发布时生效。

对于大幅改动，您必须如下所述，检查文档外观。

### 本地查看文档

#### 初始化

1. 创建虚拟环境：`python3 -m venv venv`
2. 激活虚拟环境：`. venv/bin/activate`
3. 安装项目依赖：`pip install -r requirements.txt`

#### 查看

1. 激活虚拟环境: `. venv/bin/activate`
2. 部署文档网页: `mkdocs serve`
3. 打开[http://127.0.0.1:8000/obsidian-spaced-repetition/](http://127.0.0.1:8000/obsidian-spaced-repetition/)以在本地查看文档，您的任何修改都会立即在浏览器上反映。

### 翻译文档

1. 如果您的语言未出现在 `docs/docs/` 中，请为您的语言创建一个新文件夹。使用[这里](https://squidfunk.github.io/mkdocs-material/setup/changing-the-language/#site-language)提供的语言代码为文件夹命名。
2. 将 (1) 中的语言代码添加到 MkDocs 配置中(`mkdocs.yml` - `plugins.i18n.languages`)。
3. 将 `en` 目录下的英文文档复制到新文件夹中。
4. 翻译，再提交 Pull Request 。

---

## 维护

### 发行版

以 `v1.9.2` 为例:

1. 创建一个新分支: `git switch -c release-v1.9.2`
2. 在 `manifest.json` 和 `package.json` 中更新版本号(遵循[Semantic Versioning](https://semver.org/spec/v2.0.0.html))。
    - Semantic Versioning 速览：版本号格式为 `MAJOR.MINOR.PATCH`，增加:
        - `MAJOR`（主版本号），当进行不兼容的 API 更改
        - `MINOR`（次版本号），当添加向后兼容的新功能
        - `PATCH`（修订版本号），当进行向后兼容的 bug 修复
    - 如果新版本使用新的 Obsidian APIs，请更新`minAppVersion`和`versions.json`以反映这一点。
3. 运行 `pnpm changelog` 以更新 CHANGELOG。
4. 提交并推送您的修改:

    ```bash
    git add .
    git commit -m "chore: bump version to v1.9.2"
    git push --set-upstream origin release-v1.9.2
    ```

5. 提交合并到 `main` 分支的 Pull Request。
6. 在本地，切换到 `main` 分支并拉取修改： `git switch main && git pull`
7. 以版本号创建 git 标签： `git tag -a 1.9.2 -m "1.9.2"`
8. 推送标签: `git push --tags`. <br> 您已经完成了所有流程！ [这个 GitHub action](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/main/.github/workflows/release.yml) 会自动触发，创建一个发行版并发布，同时更新在线文档。
