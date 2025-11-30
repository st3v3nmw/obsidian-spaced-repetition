# Contributing

First off, thanks for wanting to contribute to the Spaced Repetition plugin!

## Bug Reports & Feature Requests

- Check the [roadmap](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/2/) for upcoming features & fixes.
- Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/) if you have a feature request or a bug report.
- Visit the [discussions](https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/) section for Q&A help, feedback, and general discussion.

## Translating

The plugin has been translated into the following languages by the Obsidian community 😄.

- Arabic / العربية
- Chinese (Simplified) / 简体中文
- Chinese (Traditional) / 繁體中文
- Czech / čeština
- Dutch / Nederlands
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

### Steps

To help translate the plugin to your language:

1. Fork the [repository](https://github.com/st3v3nmw/obsidian-spaced-repetition).
2. Copy the entries from `src/lang/locale/en.ts` to the proper file in `src/lang/locale/` (i.e. `fr.ts` for French, or `sw.ts` for Swahili). The locale codes are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag).
3. Translate,
4. Then open a pull request,

### Example

Sample `en.ts` file:

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

Equivalent `sw.ts` file:

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

<sub><sup>A part of that last one is uhh, Google translated, I have a working understanding of Swahili but not enough to write computerese lol.</sup></sub>

Please note that:

1. Only the strings(templates) on the right of the key should be translated.
2. Text inside `${}` isn't translated. This is used to replace variables in code. For instance, if interval = 4, it becomes `4 days` in English & `Siku 4` in Swahili. Quite nifty if you ask me.

---

## Code

### General changes

1. Make your changes.
2. Run `pnpm dev` to watch for changes & rebuild the plugin automatically.
3. You could create symbolic links between the build files and the Obsidian vault, example:

    ```bash
    # remove existing files in the Obsidian vault
    rm ~/notes/.obsidian/plugins/obsidian-spaced-repetition/main.js ~/notes/.obsidian/plugins/obsidian-spaced-repetition/manifest.json ~/notes/.obsidian/plugins/obsidian-spaced-repetition/styles.css
    # use absolute paths
    ln -s /home/stephen/obsidian-spaced-repetition/build/main.js /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/manifest.json /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/styles.css /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ```

    - This can be coupled with the [Hot Reload plugin](https://github.com/pjeby/hot-reload)

4. Document the "user-facing" changes e.g. new feature, UI change, etc.
5. If your "business logic" is properly decoupled from Obsidian APIs, write some unit tests.
    - This project uses [jest](https://jestjs.io/), tests are stored in `tests/`.
    - `pnpm test`
6. Before pushing your changes, run the linter: `pnpm lint`
    - Format the code in case any warnings are raised: `pnpm format`
7. Open the pull request.

### UI changes

- All UI changes should be made in the `src/gui/` folder.

- Put your changes under the right section (see "MARK:" or "#region" comments in the code).

- Document your functions & classes with JSDoc.

- One can switch between mobile view and desktop view by entering the following command in developer console:

    ```js
    this.app.emulateMobile(false); // to switch to desktop view

    this.app.emulateMobile(true); // to switch to mobile view
    ```

- Test your changes in all arrangements that the ui can be in:
    1. Desktop
    2. Mobile portrait mode
    3. Small sized mobile device
    4. Mobile landscape mode
    5. Tablet landscape mode
    6. Tablet portrait mode
    7. All the above, but with tab view option enabled
    8. All the above, but with tab view option disabled
    9. All the above, but with tab view option disabled and different flashcard height/width percentages

---

## Documentation

The documentation consists of Markdown files which [MkDocs](https://www.mkdocs.org/) converts to static web pages.
Specifically, this project uses [MkDocs Material](https://squidfunk.github.io/mkdocs-material/getting-started/).

These files reside in `docs/docs/` in the respective language's folder. For instance, English docs are located in `docs/docs/en/`.

The docs are served on [https://www.stephenmwangi.com/obsidian-spaced-repetition/](https://www.stephenmwangi.com/obsidian-spaced-repetition/).

For small changes, you can simply open an pull request for merging (against the `master` branch).
The changes will be live once a new [release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases) is made.

For larger diffs, it's important that you check how your docs look like as explained below.

### Viewing Docs Locally

#### Initial Setup

1. Create a virtual environment: `python3 -m venv venv`
2. Activate it: `. venv/bin/activate`
3. Install the required dependencies: `pip install -r requirements.txt`

#### Viewing

1. Activate the virtual environment: `. venv/bin/activate`
2. Serve the docs: `mkdocs serve`
3. View your documentation locally on [http://127.0.0.1:8000/obsidian-spaced-repetition/](http://127.0.0.1:8000/obsidian-spaced-repetition/), any changes you make will reflect on the browser instantly.

### Translating Documentation

1. Create a folder for your language in `docs/docs/` if it doesn't exist. Use the language codes provided [here](https://squidfunk.github.io/mkdocs-material/setup/changing-the-language/#site-language).
2. Add the code from (1) to the MkDocs configuration (`mkdocs.yml` - `plugins.i18n.languages`).
3. Copy the files from the English (`en`) folder into the new folder.
4. Translate then open a pull request.

---

## Maintenance

### Releases

Example using `v1.9.2`:

1. Create a new branch: `git switch -c release-v1.9.2`
2. Bump the plugin version in `manifest.json` and `package.json` (following [Semantic Versioning](https://semver.org/spec/v2.0.0.html)).
    - Semantic Versioning TL;DR, given a version number `MAJOR.MINOR.PATCH`, increment the:
        - `MAJOR` version when you make incompatible API changes
        - `MINOR` version when you add functionality in a backwards compatible manner
        - `PATCH` version when you make backwards compatible bug fixes
    - If the new version uses new Obsidian APIs, update `minAppVersion` and `versions.json` to reflect this.
3. Run `pnpm changelog` to update the CHANGELOG.
4. Commit and push the changes:

    ```bash
    git add .
    git commit -m "chore: bump version to v1.9.2"
    git push --set-upstream origin release-v1.9.2
    ```

5. Open and merge the PR into `master`.
6. Locally, switch back to `master` and pull the changes: `git switch master && git pull`
7. Create a git tag with the version: `git tag -a 1.9.2 -m "1.9.2"`
8. Push the tag: `git push --tags`. <br> You're all set! [This GitHub action](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/.github/workflows/release.yml) should pick it up, create a release, publish it, and update the live documentation.
