# Contributing

## Bug Reports & Feature Requests

-   Check the [roadmap](https://github.com/st3v3nmw/obsidian-spaced-repetition/projects/2/) for upcoming features & fixes.
-   Raise an issue [here](https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/) if you have a feature request or a bug-report.
-   Visit the [discussions](https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/) section for Q&A help, feedback, and general discussion.

## Translating

### Steps

To help translate the plugin to another language:

1. Fork this repository,
2. Copy the entries from `src/lang/locale/en.ts` to the proper file in `locales` (i.e. `fr.ts` for French, or `sw.ts` for Swahili),
3. Translate
4. Then open a pull request.
5. & a thank you for your time, much appreciated!

### Translating

Sample `en.ts` file:

```typescript
// English

export default {
    EASY: "Easy",
    SHOW_ANSWER: "Show Answer",
    DAYS_STR_IVL: "${interval} days",
    CHECK_ALGORITHM_WIKI:
        'For more information, check the <a href="${algo_url}">algorithm implementation</a>.',
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
        'Kwa habari zaidi, angalia <a href="${algo_url}">utekelezaji wa algorithm</a>.',
};
```

<sub><sup>A part of that last one is uhh, Google translated, I have a working understanding of Swahili but not enough to write computerese lol.</sup></sub>

Please note that:

1. Only the strings(templates) on the right of the key should be translated.
2. Text inside `${}` isn't translated. This is used to replace variables in code. For instance, if interval = 4, it becomes `4 days` in English & `Siku 4` in Swahili. Quite nifty if you ask me.

## Code
