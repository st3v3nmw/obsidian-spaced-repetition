// Ukrainian

// https://github.com/kratiuk

// Слава захисникам та захисницям України! 🇺🇦
import { IBaseLocale } from "src/lang/base-locale";
import en from "src/lang/locale/en";

const uk: IBaseLocale = {
    ...en,
    // flashcard-modal.tsx
    DECKS: "Колоди карток",
    DUE_CARDS: "Картки до повторення",
    NEW_CARDS: "Нові картки",
    TOTAL_CARDS: "Усього карток",
    BACK: "Назад",
    SKIP: "Пропустити",
    EDIT_CARD: "Редагувати картку",
    RESET_CARD_PROGRESS: "Скинути прогрес картки",
    HARD: "Важко",
    GOOD: "Добре",
    EASY: "Легко",
    SHOW_ANSWER: "Показати відповідь",
    CARD_PROGRESS_RESET: "Прогрес картки скинуто.",
    SAVE: "Зберегти",
    CANCEL: "Скасувати",
    NO_INPUT: "Дані не введено.",
    CURRENT_EASE_HELP_TEXT: "Поточний коефіцієнт легкості: ",
    CURRENT_INTERVAL_HELP_TEXT: "Поточний інтервал: ",
    CARD_GENERATED_FROM: "Створено з: ${notePath}",
    VIEW_CARD_INFO: "View Card Info",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Відкрити нотатку для повторення",
    REVIEW_CARDS: "Повторити картки",
    REVIEW_DIFFICULTY_FILE_MENU: "Повторити: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Повторити нотатку як ${difficulty}",
    CRAM_ALL_CARDS: "Вибрати колоду для інтенсивного повторення",
    REVIEW_ALL_CARDS: "Повторити картки з усіх нотаток",
    REVIEW_CARDS_IN_NOTE: "Повторити картки в цій нотатці",
    CRAM_CARDS_IN_NOTE: "Повторити картки цієї нотатки",
    VIEW_STATS: "Переглянути статистику",
    OPEN_REVIEW_QUEUE_VIEW: "Відкрити чергу повторення карток у бічній панелі",
    STATUS_BAR: "Повторення: нотаток — ${dueNotesCount}, карток — ${dueFlashcardsCount}",
    SYNC_TIME_TAKEN: "Синхронізація: ${t} мс",
    NOTE_IN_IGNORED_FOLDER: "Нотатку збережено в проігнорованій теці (перевірте налаштування).",
    PLEASE_TAG_NOTE:
        "Будь ласка, позначте нотатку відповідними тегами для повторення (у налаштуваннях).",
    RESPONSE_RECEIVED: "Відповідь отримано.",
    NO_DECK_EXISTS: "Колоди «${deckName}» не існує",
    ALL_CAUGHT_UP: "Чудово! Усі картки повторено :D",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} дн.",
    MONTHS_STR_IVL: "${interval} міс.",
    YEARS_STR_IVL: "${interval} р.",
    DAYS_STR_IVL_MOBILE: "${interval}д",
    MONTHS_STR_IVL_MOBILE: "${interval}м",
    YEARS_STR_IVL_MOBILE: "${interval}р",

    // settings.ts
    SETTINGS_HEADER: "Плагін Spaced Repetition для Obsidian",
    GROUP_TAGS_FOLDERS: "Теги та теки",
    GROUP_FLASHCARD_REVIEW: "Повторення карток",
    GROUP_FLASHCARD_SEPARATORS: "Роздільники карток",
    GROUP_DATA_STORAGE: "Зберігання даних планування",
    GROUP_DATA_STORAGE_DESC: "Оберіть, де зберігати дані планування",
    GROUP_FLASHCARDS_NOTES: "Картки та нотатки",
    GROUP_CONTRIBUTING: "Внесок у проєкт",
    CHECK_WIKI: 'Для докладнішої інформації перегляньте <a href="${wikiUrl}">wiki</a>.',
    GITHUB_DISCUSSIONS:
        'Відвідайте розділ <a href="${discussionsUrl}">discussions</a> для запитань і відповідей, відгуків та загального обговорення.',
    GITHUB_ISSUES:
        'Створіть звернення <a href="${issuesUrl}">тут</a>, якщо маєте запит на функцію або повідомлення про помилку.',
    GITHUB_SOURCE_CODE:
        'Вихідний код проєкту доступний на <a href="${githubProjectUrl}">GitHub</a>.',
    CODE_CONTRIBUTION_INFO:
        '<a href="${codeContributionUrl}">Ось</a> як зробити внесок у код плагіна.',
    TRANSLATION_CONTRIBUTION_INFO:
        '<a href="${translationContributionUrl}">Ось</a> як перекласти плагін на іншу мову.',
    FOLDERS_TO_IGNORE: "Теки для ігнорування",
    FOLDERS_TO_IGNORE_DESC:
        "Введіть шляхи тек або glob-шаблони в окремих рядках, напр. Templates/Scripts або **/*.excalidraw.md. Це налаштування спільне для карток і нотаток.",
    OBSIDIAN_INTEGRATION: "Інтеграція з Obsidian",
    FLASHCARDS: "Картки",
    FLASHCARD_EASY_LABEL: "Текст кнопки «Легко»",
    FLASHCARD_GOOD_LABEL: "Текст кнопки «Добре»",
    FLASHCARD_HARD_LABEL: "Текст кнопки «Важко»",
    FLASHCARD_EASY_DESC: "Налаштуйте підпис для кнопки «Легко»",
    FLASHCARD_GOOD_DESC: "Налаштуйте підпис для кнопки «Добре»",
    FLASHCARD_HARD_DESC: "Налаштуйте підпис для кнопки «Важко»",
    REVIEW_BUTTON_DELAY: "Затримка натискання кнопки (мс)",
    REVIEW_BUTTON_DELAY_DESC:
        "Додайте затримку до кнопок повторення, перш ніж їх можна буде натиснути знову.",
    FLASHCARD_TAGS: "Теги карток",
    FLASHCARD_TAGS_DESC:
        "Введіть теги, розділені пробілами або новими рядками (напр. #flashcards #deck2 #deck3).",
    CONVERT_FOLDERS_TO_DECKS: "Перетворювати теки на колоди",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Це альтернативний варіант до тегів карток вище.",
    ALWAYS_INCLUDE_FRONTMATTER_TAGS: "Always include tags from frontmatter",
    ALWAYS_INCLUDE_FRONTMATTER_TAGS_DESC: "Always add cards to decks defined by frontmatter tags.",
    INLINE_SCHEDULING_COMMENTS:
        "Зберігати коментар планування в тому ж рядку, що й останній рядок картки?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Увімкнення цього параметра не дасть HTML-коментарям ламати форматування списків.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Відкладати споріднені картки до наступного дня",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Споріднені — це картки, створені з одного й того самого тексту, напр. cloze-вилучення",
    SHOW_CARD_CONTEXT: "Показувати контекст у картках",
    SHOW_CARD_CONTEXT_DESC: "напр. Назва > Заголовок 1 > Підзаголовок > ... > Підзаголовок",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Показувати час до наступного повторення на кнопках",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Корисно знати, наскільки далеко в майбутнє відсуваються ваші картки.",
    CARD_MODAL_HEIGHT_PERCENT: "Відсоток висоти картки",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Для мобільних або якщо маєте дуже великі зображення, встановіть 100%",
    RESET_DEFAULT: "Скинути до типових",
    CARD_MODAL_WIDTH_PERCENT: "Відсоток ширини картки",
    RANDOMIZE_CARD_ORDER: "Перемішувати порядок карток під час повторення?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Порядок карток у колоді",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Послідовно в межах колоди (спочатку всі нові картки)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Послідовно в межах колоди (спочатку всі до повторення)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Випадково в межах колоди (спочатку всі нові картки)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "Випадково в межах колоди (спочатку всі до повторення)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Випадкова картка з випадкової колоди",
    REVIEW_DECK_ORDER: "Порядок відображення колод під час повторення",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Послідовно (після завершення повторення всіх карток у попередній колоді)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Випадково (після завершення повторення всіх карток у попередній колоді)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Випадкова картка з випадкової колоди",
    DISABLE_CLOZE_CARDS: "Вимкнути cloze-картки?",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS: "Convert cloze patterns to input fields",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC:
        "Replace cloze patterns with input fields when reviewing cloze cards.",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Перетворювати ==виділення== на cloze",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        "Додайте/видаліть <code>${defaultPattern}</code> у ваших cloze-шаблонах",
    CONVERT_BOLD_TEXT_TO_CLOZES: "Перетворювати **жирний текст** на cloze",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        "Додайте/видаліть <code>${defaultPattern}</code> у ваших cloze-шаблонах",
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Перетворювати {{фігурні дужки}} на cloze",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        "Додайте/видаліть <code>${defaultPattern}</code> у ваших cloze-шаблонах",
    CLOZE_PATTERNS: "Cloze-шаблони",
    CLOZE_PATTERNS_DESC:
        'Введіть cloze-шаблони, розділені новими рядками. Перегляньте <a href="${docsUrl}">wiki</a> для довідки.',
    INLINE_CARDS_SEPARATOR: "Роздільник для рядкових карток",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Після зміни цього параметра потрібно вручну відредагувати всі наявні картки.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Роздільник для рядкових двобічних карток",
    MULTILINE_CARDS_SEPARATOR: "Роздільник для багаторядкових карток",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Роздільник для багаторядкових двобічних карток",
    MULTILINE_CARDS_END_MARKER: "Символи, що позначають кінець cloze та багаторядкових карток",
    NOTES: "Нотатки",
    NOTE: "Нотатка",
    REVIEW_PANE_ON_STARTUP: "Увімкнути панель повторення нотаток під час запуску",
    TAGS_TO_REVIEW: "Теги для повторення",
    TAGS_TO_REVIEW_DESC:
        "Введіть теги, розділені пробілами або новими рядками, напр. #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Відкрити випадкову нотатку для повторення",
    OPEN_RANDOM_NOTE_DESC: "Коли вимкнено, нотатки впорядковуються за важливістю (PageRank).",
    AUTO_NEXT_NOTE: "Автоматично відкривати наступну нотатку після повторення",
    MAX_N_DAYS_REVIEW_QUEUE: "Максимальна кількість днів у панелі повторення нотаток",
    MIN_ONE_DAY: "Кількість днів має бути щонайменше 1.",
    VALID_NUMBER_WARNING: "Будь ласка, введіть коректне число.",
    UI: "Інтерфейс",
    OPEN_IN_TAB: "Відкрити в новій вкладці",
    OPEN_IN_TAB_DESC: "Вимкніть, щоб відкривати плагін у модальному вікні",
    SHOW_STATUS_BAR: "Показувати рядок стану",
    SHOW_STATUS_BAR_DESC: "Вимкніть, щоб приховати стан повторення карток у рядку стану Obsidian",
    SHOW_RIBBON_ICON: "Показувати іконку на стрічці",
    SHOW_RIBBON_ICON_DESC: "Вимкніть, щоб приховати іконку плагіна зі стрічки Obsidian",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Увімкнути параметри повторення в меню файлу (напр. Повторити: Легко, Добре, Важко)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Якщо вимкнути параметри повторення в меню файлу, ви зможете повторювати нотатки за допомогою команд плагіна та, якщо налаштовані, відповідних гарячих клавіш.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Дерево колод спочатку має бути розгорнутим",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Вимкніть, щоб згорнути вкладені колоди в тій самій картці. Корисно, якщо ваші картки належать до багатьох колод в одному файлі.",
    ALGORITHM: "Алгоритм",
    CHECK_ALGORITHM_WIKI:
        'Для докладнішої інформації перегляньте <a href="${algoUrl}">деталі алгоритму</a>.',
    SM2_OSR_VARIANT: "Варіант SM-2 від OSR",
    BASE_EASE: "Базова легкість",
    BASE_EASE_DESC: "мінімум = 130, бажано приблизно 250.",
    BASE_EASE_MIN_WARNING: "Базова легкість має бути щонайменше 130.",
    LAPSE_INTERVAL_CHANGE: "Зміна інтервалу при відповіді «Важко» для картки/нотатки",
    LAPSE_INTERVAL_CHANGE_DESC: "новий інтервал = старий інтервал × зміна інтервалу / 100.",
    EASY_BONUS: "Бонус «Легко»",
    EASY_BONUS_DESC:
        "Бонус «Легко» дає змогу задати різницю інтервалів між відповідями «Добре» і «Легко» для картки/нотатки (мінімум = 100%).",
    EASY_BONUS_MIN_WARNING: "Бонус «Легко» має бути щонайменше 100.",
    LOAD_BALANCE: "Увімкнути балансування навантаження",
    LOAD_BALANCE_DESC: `Незначно коригує інтервал, щоб кількість повторень на день була більш рівномірною.
        Це як fuzz в Anki, але замість випадковості обирається день з найменшою кількістю повторень.
        Для коротких інтервалів вимкнено.`,
    MAX_INTERVAL: "Максимальний інтервал у днях",
    MAX_INTERVAL_DESC: "Дозволяє встановити верхню межу інтервалу (типово = 100 років).",
    MAX_INTERVAL_MIN_WARNING: "Максимальний інтервал має бути щонайменше 1 день.",
    MAX_LINK_CONTRIB: "Максимальний внесок посилань",
    MAX_LINK_CONTRIB_DESC:
        "Максимальний внесок зваженої легкості пов'язаних нотаток у початкову легкість.",
    LOGGING: "Журналювання",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "Показувати налагоджувальну інформацію планувальника в консолі розробника",
    DISPLAY_PARSER_DEBUG_INFO: "Показувати налагоджувальну інформацію парсера в консолі розробника",
    SCHEDULING: "Планування",
    EXPERIMENTAL: "Експериментальне",
    HELP: "Довідка",
    STORE_IN_NOTES: "У нотатках",
    DELETE_SCHEDULING_DATA_ALL: "Delete Scheduling Data",
    DELETE_SCHEDULING_DATA_ALL_DESC: "Delete scheduling data from all notes and flashcards.",
    DELETE: "Delete",
    CONFIRM_SCHEDULING_DATA_ALL_DELETION:
        "Are you sure you want to delete all scheduling data from your notes and flashcards? This action cannot be undone.",
    CONFIRM: "Confirm",
    SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS: "Scheduling data deletion in progress...",
    SCHEDULING_DATA_HAS_BEEN_DELETED:
        "Scheduling data has been deleted from all notes and flashcards.",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Черга повторення нотаток",
    CLOSE: "Закрити",
    NEW: "Нові",
    YESTERDAY: "Вчора",
    TODAY: "Сьогодні",
    TOMORROW: "Завтра",

    // stats-modal.tsx
    STATS_TITLE: "Статистика",
    MONTH: "Місяць",
    QUARTER: "Квартал",
    YEAR: "Рік",
    LIFETIME: "За весь час",
    FORECAST: "Прогноз",
    FORECAST_DESC: "Кількість карток, що будуть до повторення в майбутньому",
    SCHEDULED: "Заплановано",
    DAYS: "Дні",
    NUMBER_OF_CARDS: "Кількість карток",
    REVIEWS_PER_DAY: "Середнє: ${avg} повторень/день",
    INTERVALS: "Інтервали",
    INTERVALS_DESC: "Затримки, після яких повторення показуються знову",
    COUNT: "Кількість",
    INTERVALS_SUMMARY: "Середній інтервал: ${avg}, найдовший інтервал: ${longest}",
    EASES: "Коефіцієнти легкості",
    EASES_SUMMARY: "Середній коефіцієнт легкості: ${avgEase}",
    EASE: "Легкість",
    CARD_TYPES: "Типи карток",
    CARD_TYPES_DESC: "Включає також відкладені картки, якщо є",
    CARD_TYPE_NEW: "Нові",
    CARD_TYPE_YOUNG: "Молоді",
    CARD_TYPE_MATURE: "Зрілі",
    CARD_TYPES_SUMMARY: "Усього карток: ${totalCardsCount}",
    SEARCH: "Пошук",
    PREVIOUS: "Попередній",
    NEXT: "Наступний",
    // settings.ts
    SETTINGS_TAB_HEADING: "Settings",
    MAIN_SETTINGS_PAGE: "MAIN_SETTINGS",

    // NoteReviewQueue.ts
    NOTE_REVIEW_QUEUE_HINT: "Click on the 3 dots next to the note to open the review menu.",

    // StatusBarManager.ts
    OPEN_DECK_FOR_REVIEW: "Open deck for review",
    UPDATE_AVAILABLE: "Update available",

    // Statistics
    PERIOD_TITLE: "Period",
    PERIOD_DESC: "Period of time to display in the charts",

    // Card controls reset button
    DELETE_SCHEDULING_DATA_OF_CURRENT_CARD: "Delete card scheduling data?",
    CONFIRM_SCHEDULING_DATA_DELETION_OF_CURRENT_CARD:
        "Are you sure you want to delete the scheduling data from your current card? This action cannot be undone.",
    SCHEDULING_DATA_DELETION_IN_PROGRESS_OF_CURRENT_CARD: "Deleting the cards scheduling data...",

    // Settings > Scheduling
    START_OF_DAY: "Start of day",
    START_OF_DAY_DESC: "The time at which the day begins (Format: HH:MM:SS, Default: 00:00:00)",
    INVALID_START_OF_DAY_WARNING: "Invalid format for start of day",
    // Settings > main-page
    INFO: "Info",
    // Card responses
    AGAIN: "Again",
    // Settings > info
    CHECK_ROADMAP: 'Check out the <a href="${roadMapUrl}">roadmap</a> for upcoming features.',
    CHECK_DEV_NEWS:
        'Check out the <a href="${devNewsUrl}">dev news</a> for the latest development news.',
};

export default uk;
