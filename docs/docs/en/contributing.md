# Contributing

First off, thanks for wanting to contribute to the Spaced Repetition plugin!

## Bug Reports & Feature Requests

- Check the [roadmap](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/2/) for upcoming features & fixes.
- Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/) if you have a feature request or a bug report.
- Visit the [discussions](https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/) section for Q&A help, feedback, and general discussion.

<br/>

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

const en: IBaseLocale = {
    EASY: "Easy",
    SHOW_ANSWER: "Show Answer",
    DAYS_STR_IVL: "${interval} days",
    CHECK_ALGORITHM_WIKI:
        'For more information, check the <a href="${algoUrl}">algorithm implementation</a>.',
};

export default en;
```

Equivalent `sw.ts` file:

```typescript
// Swahili

const sw: IBaseLocale = {
    ...en, // inherit translations from English, if any are missing
    // Override english translations here
    EASY: "Rahisi",
    SHOW_ANSWER: "Onyesha Jibu",
    DAYS_STR_IVL: "Siku ${interval}",
    CHECK_ALGORITHM_WIKI:
        'Kwa habari zaidi, angalia <a href="${algoUrl}">utekelezaji wa algorithm</a>.',
};

export default sw;
```

<sub><sup>A part of that last one is uhh, Google translated, I have a working understanding of Swahili but not enough to write computerese lol.</sup></sub>

Please note that:

1. Only the strings(templates) on the right of the key should be translated.
2. Text inside `${}` isn't translated. This is used to replace variables in code. For instance, if interval = 4, it becomes `4 days` in English & `Siku 4` in Swahili. Quite nifty if you ask me.

<br/>
<br/>
<br/>

## Code

### General changes

1. Make your changes.
2. Run `pnpm dev` to watch for changes & rebuild the plugin automatically.
3.
4. You could create symbolic links between the build files and the Obsidian vault, example:

    ```bash
    # remove existing files in the Obsidian vault
    rm ~/notes/.obsidian/plugins/obsidian-spaced-repetition/main.js ~/notes/.obsidian/plugins/obsidian-spaced-repetition/manifest.json ~/notes/.obsidian/plugins/obsidian-spaced-repetition/styles.css
    # use absolute paths
    ln -s /home/stephen/obsidian-spaced-repetition/build/main.js /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/manifest.json /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ln -s /home/stephen/obsidian-spaced-repetition/styles.css /home/stephen/notes/.obsidian/plugins/obsidian-spaced-repetition
    ```

    - This can be coupled with the [Hot Reload plugin](https://github.com/pjeby/hot-reload)

5. Document the "user-facing" changes e.g. new feature, UI change, etc.
6. If your "business logic" is properly decoupled from Obsidian APIs, write some unit tests.
    - This project uses [jest](https://jestjs.io/), tests are stored in `tests/`.
    - `pnpm test`
7. Before pushing your changes, run the linter: `pnpm lint`
    - Format the code in case any warnings are raised: `pnpm format`
8. Open the pull request.

### UI changes

- All UI changes should be made in the `src/ui/` folder.

- Enable the debug mode by setting `ENABLE_DEBUG_MODE` to `true` in `src/constants.ts`(Don't forget to revert it back to `false` after you're done).

- Put your changes under the right section (see "MARK:" or "#region" comments in the code).

- Document your functions & classes with JSDoc.

- One can switch between mobile view and desktop view by entering the following command in developer console:

    ```js
    this.app.emulateMobile(false); // to switch to desktop view

    this.app.emulateMobile(true); // to switch to mobile view

    this.app.emulateMobile(!this.app.isMobile); // to toggle between desktop and mobile view
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

### General tips for developers

Please use all capabilities of typescript & the obsidian api to make the code more readable & maintainable.

- use `const` instead of `let`
- use `let` instead of `var` (don't use `var` unless you have a **REALLY** good reason to)
- don't use null or undefined without declaring that the variable can be null/undefined (`| null` or `| undefined`), as it is a common source of bugs.
- always use `===` instead of `==` when comparing values
- always use `!==` instead of `!=` when comparing values
- Have a look at the [TypeScript cheatsheet](https://devhints.io/typescript) for more info.

- Have a look at the [Obsidian docs for developers](https://docs.obsidian.md/Home) to see how to use the Obsidian APIs.
- Make yourself a bit familiar with object-oriented programming, as it is how most of the code is structured.

Make the code testable, by using [Jest](https://jestjs.io/) for unit tests.

- You can use interfaces to decouple ui code/obsidian api code from the rest of the code. This way it gets easier to implement mock code for testing.
- Put css in a css file next to the ui component file, and import it in the ui component file to. This way it gets easier to find the relevant css for a specific ui component.

<br/>
<br/>
<br/>

## Documentation

The documentation consists of Markdown files which [MkDocs](https://www.mkdocs.org/) converts to static web pages.
Specifically, this project uses [MkDocs Material](https://squidfunk.github.io/mkdocs-material/getting-started/).

These files reside in `docs/docs/` in the respective language's folder. For instance, English docs are located in `docs/docs/en/`.

The docs are served on [https://stephenmwangi.com/obsidian-spaced-repetition/](https://stephenmwangi.com/obsidian-spaced-repetition/).

For small changes, you can simply open an pull request for merging (against the `main` branch).
The changes will be live once a new [release](https://github.com/st3v3nmw/obsidian-spaced-repetition/releases) is made.

For larger diffs, it's important that you check how your docs look like as explained below.

### Viewing Docs Locally

#### Initial Setup

1. Create a virtual environment: `python3 -m venv venv`
2. Activate it: `. venv/bin/activate` or `venv\Scripts\activate` if you are on Windows
3. Install the required dependencies: `pip install -r requirements.txt`

#### Viewing

1. Activate the virtual environment: `. venv/bin/activate` or `venv\Scripts\activate` if you are on Windows
2. Serve the docs: `mkdocs serve`
3. View your documentation locally on [http://127.0.0.1:8000/obsidian-spaced-repetition/](http://127.0.0.1:8000/obsidian-spaced-repetition/), any changes you make will reflect on the browser instantly.

### Translating Documentation

1. Create a folder for your language in `docs/docs/` if it doesn't exist. Use the language codes provided [here](https://squidfunk.github.io/mkdocs-material/setup/changing-the-language/#site-language).
2. Add the code from (1) to the MkDocs configuration (`mkdocs.yml` - `plugins.i18n.languages`).
3. Copy the files from the English (`en`) folder into the new folder.
4. Translate then open a pull request.

<br/>
<br/>
<br/>

## Maintenance

### Tips for maintainers

#### Use different branches for different releases

Being a maintainer will be far less stressful if you use 3 different branches for preparing a new release. Huge changes should merge into `next-major-version` branch, while small changes can be merged into `next-minor-version` branch. Bugs fixes & patches should be merged into `next-patch-version` branch.

Then once you want to release a new version you can create a PR from one of these branches into `main` branch. Then follow the steps in releasing a new version section.

That way you can easily and without rushing release a small patch/fix, while you are still preparing the next big version.

#### Only do minor/major releases once you updated the documentation

Please only do minor/major releases once you updated the documentation. It is very easy to disregard the documentation as developer, but it really important for any user to be able to understand how to use the plugin.

This is especially important for users who are not familiar with the plugin, or who are just starting to use it.

So always make sure to update the documentation page and the usage section in the readme before doing a release.

#### Mark issues & PRs where you think they should be implemented

Quite often, you will find that it will get a bit messy with so many open/active issues & PRs.
So in order to track which ones are important/relevant I would recommend to mark them with the `coming soon` lable, so that you can easily filter for those in the search bar.

#### Keep the roadmap up to date

The roadmap is a great way to keep track of what the status of any feature is. This is also quite nice for the users to see what's coming next.

### Releasing a new version

**The example is using `v1.9.2`, so insert your version instead:**

1. Create a new branch: `git switch -c release-v1.9.2`
2. Bump the plugin version in `manifest.json` and `package.json` (following [Semantic Versioning](https://semver.org/spec/v2.0.0.html)).
    - Semantic Versioning TL;DR, given a version number `MAJOR.MINOR.PATCH`, increment the:
        - `MAJOR` version when you make incompatible API changes
        - `MINOR` version when you add functionality in a backwards compatible manner
        - `PATCH` version when you make backwards compatible bug fixes
    - If the new version uses new Obsidian APIs, update `minAppVersion` and `versions.json` to reflect this.
3. Run `npm run changelog` to update the CHANGELOG.
4. Commit and push the changes:

    ```bash
    git add .
    git commit -m "chore: bump version to v1.9.2"
    git push --set-upstream origin release-v1.9.2
    ```

5. Open and merge the PR into `main`.
6. Locally, switch back to `main` and pull the changes: `git switch main && git pull`
7. Create a git tag with the version: `git tag -a 1.9.2 -m "1.9.2"`
8. Push the tag: `git push --tags`. <br> You're all set! [This GitHub action](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/main/.github/workflows/release.yml) should pick it up, create a release, publish it, and update the live documentation.
   n.
