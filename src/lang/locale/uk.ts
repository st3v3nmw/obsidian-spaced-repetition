// Українська 🇺🇦
// Переклад від: https://github.com/viktorkraen 👀
// Слава захисникам та захисницям України! | Glory to defenders of Ukraine! 🛡️💪

export default {
    // flashcard-modal.tsx
    DECKS: "Колоди",
    DUE_CARDS: "Картки до повторення",
    NEW_CARDS: "Нові картки",
    TOTAL_CARDS: "Всього карток",
    BACK: "Назад",
    SKIP: "Пропустити",
    EDIT_CARD: "Редагувати картку",
    RESET_CARD_PROGRESS: "Скинути прогрес картки",
    HARD: "Складно",
    GOOD: "Добре",
    EASY: "Легко",
    SHOW_ANSWER: "Показати відповідь",
    CARD_PROGRESS_RESET: "Прогрес картки скинуто",
    SAVE: "Зберегти",
    CANCEL: "Скасувати",
    NO_INPUT: "Не введено даних",
    CURRENT_EASE_HELP_TEXT: "Поточна легкість: ",
    CURRENT_INTERVAL_HELP_TEXT: "Поточний інтервал: ",
    CARD_GENERATED_FROM: "Згенеровано з: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Відкрити нотатку для повторення",
    REVIEW_CARDS: "Повторити картки",
    REVIEW_DIFFICULTY_FILE_MENU: "Повторення: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Повторити нотатку як ${difficulty}",
    CRAM_ALL_CARDS: "Вибрати колоду для інтенсивного повторення",
    REVIEW_ALL_CARDS: "Повторити картки з усіх нотаток",
    REVIEW_CARDS_IN_NOTE: "Повторити картки в цій нотатці",
    CRAM_CARDS_IN_NOTE: "Інтенсивно повторити картки в цій нотатці",
    VIEW_STATS: "Переглянути статистику",
    OPEN_REVIEW_QUEUE_VIEW: "Відкрити чергу повторення нотаток на бічній панелі",
    STATUS_BAR:
        "Повторення: ${dueNotesCount} нотат(ка/ок), ${dueFlashcardsCount} карт(ка/ок) до повторення",
    SYNC_TIME_TAKEN: "Синхронізація зайняла ${t}мс",
    NOTE_IN_IGNORED_FOLDER: "Нотатку збережено в ігнорованій теці (перевірте налаштування).",
    PLEASE_TAG_NOTE:
        "Будь ласка, додайте відповідні теги до нотатки для повторення (в налаштуваннях).",
    RESPONSE_RECEIVED: "Відповідь отримано.",
    NO_DECK_EXISTS: "Колоди ${deckName} не існує",
    ALL_CAUGHT_UP: "Ви все повторили :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} дн.",
    MONTHS_STR_IVL: "${interval} міс.",
    YEARS_STR_IVL: "${interval} р.",
    DAYS_STR_IVL_MOBILE: "${interval} дн.",
    MONTHS_STR_IVL_MOBILE: "${interval} міс.",
    YEARS_STR_IVL_MOBILE: "${interval} р.",

    // settings.ts
    SETTINGS_HEADER: "Інтервальне повторення",
    GROUP_TAGS_FOLDERS: "Теги та теки",
    GROUP_FLASHCARD_REVIEW: "Повторення карток",
    GROUP_FLASHCARD_SEPARATORS: "Роздільники карток",
    GROUP_DATA_STORAGE: "Зберігання даних планування",
    GROUP_DATA_STORAGE_DESC: "Оберіть, де зберігати дані планування",
    GROUP_FLASHCARDS_NOTES: "Картки та нотатки",
    GROUP_CONTRIBUTING: "Участь у розробці",
    CHECK_WIKI: 'Для отримання додаткової інформації перегляньте <a href="${wikiUrl}">вікі</a>.',
    GITHUB_DISCUSSIONS:
        'Відвідайте розділ <a href="${discussionsUrl}">обговорень</a> для запитань, відгуків та загальних дискусій.',
    GITHUB_ISSUES:
        'Створіть issue в репозиторії <a href="${issuesUrl}">тут</a>, якщо у вас є пропозиція щодо функціоналу або повідомлення про помилку.',
    GITHUB_SOURCE_CODE:
        'Вихідний код проєкту доступний на: <a href="${githubProjectUrl}">GitHub</a>.',
    CODE_CONTRIBUTION_INFO:
        '<a href="${codeContributionUrl}">Тут</a> описано, як зробити внесок у код плагіна.',
    TRANSLATION_CONTRIBUTION_INFO:
        '<a href="${translationContributionUrl}">Тут</a> описано, як перекласти плагін іншою мовою.',
    FOLDERS_TO_IGNORE: "Теки для ігнорування",
    FOLDERS_TO_IGNORE_DESC:
        "Введіть шляхи до тек або шаблони glob в окремих рядках, наприклад Templates/Scripts або **/*.excalidraw.md. Цей параметр спільний як для карток, так і для нотаток.",
    OBSIDIAN_INTEGRATION: "Інтеграція з Obsidian",
    FLASHCARDS: "Картки",
    FLASHCARD_EASY_LABEL: "Текст кнопки 'Легко'",
    FLASHCARD_GOOD_LABEL: "Текст кнопки 'Добре'",
    FLASHCARD_HARD_LABEL: "Текст кнопки 'Складно'",
    FLASHCARD_EASY_DESC: 'Налаштувати текст для кнопки "Легко"',
    FLASHCARD_GOOD_DESC: 'Налаштувати текст для кнопки "Добре"',
    FLASHCARD_HARD_DESC: 'Налаштувати текст для кнопки "Складно"',
    REVIEW_BUTTON_DELAY: "Затримка натискання кнопки (мс)",
    REVIEW_BUTTON_DELAY_DESC:
        "Додати затримку перед можливістю повторного натискання кнопок повторення.",
    FLASHCARD_TAGS: "Теги карток",
    FLASHCARD_TAGS_DESC:
        "Введіть теги, розділені пробілами або новими рядками, наприклад #flashcards #deck2 #deck3.",
    CONVERT_FOLDERS_TO_DECKS: "Конвертувати теки в колоди та підколоди",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Це альтернатива опції тегів карток вище.",
    INLINE_SCHEDULING_COMMENTS:
        "Зберігати коментар планування в тому ж рядку, що й останній рядок картки?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Увімкнення цього параметра зробить HTML-коментарі такими, що не порушують форматування списку.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Відкласти споріднені картки до наступного дня",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Споріднені картки - це картки, створені з одного й того ж тексту, наприклад, пропуски для заповнення",
    SHOW_CARD_CONTEXT: "Показувати контекст у картках",
    SHOW_CARD_CONTEXT_DESC: "тобто Заголовок > Розділ 1 > Підрозділ > ... > Підрозділ",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Показувати час наступного повторення на кнопках повторення",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Корисно знати, наскільки далеко в майбутнє відкладаються ваші картки.",
    CARD_MODAL_HEIGHT_PERCENT: "Відсоток висоти картки",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Має бути встановлено на 100% на мобільних пристроях або якщо у вас дуже великі зображення",
    RESET_DEFAULT: "Скинути до типових налаштувань",
    CARD_MODAL_WIDTH_PERCENT: "Відсоток ширини картки",
    RANDOMIZE_CARD_ORDER: "Випадковий порядок карток під час повторення?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Порядок відображення карток у колоді під час повторення",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Послідовно в межах колоди (Спочатку всі нові картки)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Послідовно в межах колоди (Спочатку всі заплановані картки)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Випадково в межах колоди (Спочатку всі нові картки)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM:
        "Випадково в межах колоди (Спочатку всі заплановані картки)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Випадкова картка з випадкової колоди",
    REVIEW_DECK_ORDER: "Порядок відображення колод під час повторення",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Послідовно (після перегляду всіх карток у попередній колоді)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Випадково (після перегляду всіх карток у попередній колоді)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Випадкова картка з випадкової колоди",
    DISABLE_CLOZE_CARDS: "Вимкнути картки з пропусками?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Конвертувати ==виділення== у пропуски",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Додати/видалити <code>${defaultPattern}</code> з ваших "Шаблонів пропусків"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Конвертувати **жирний текст** у пропуски",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Додати/видалити <code>${defaultPattern}</code> з ваших "Шаблонів пропусків"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Конвертувати {{фігурні дужки}} у пропуски",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Додати/видалити <code>${defaultPattern}</code> з ваших "Шаблонів пропусків"',
    CLOZE_PATTERNS: "Шаблони пропусків",
    CLOZE_PATTERNS_DESC:
        'Введіть шаблони пропусків, розділені новими рядками. Перегляньте <a href="${docsUrl}">вікі</a> для інструкцій.',
    INLINE_CARDS_SEPARATOR: "Роздільник для вбудованих карток",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Зверніть увагу, що після зміни цього параметра вам потрібно буде вручну відредагувати всі наявні картки.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Роздільник для вбудованих обернених карток",
    MULTILINE_CARDS_SEPARATOR: "Роздільник для багаторядкових карток",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Роздільник для багаторядкових обернених карток",
    MULTILINE_CARDS_END_MARKER: "Символи, що позначають кінець пропусків та багаторядкових карток",
    NOTES: "Нотатки",
    NOTE: "Нотатка",
    REVIEW_PANE_ON_STARTUP: "Увімкнути панель повторення нотаток при запуску",
    TAGS_TO_REVIEW: "Теги для повторення",
    TAGS_TO_REVIEW_DESC:
        "Введіть теги, розділені пробілами або новими рядками, наприклад #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Відкрити випадкову нотатку для повторення",
    OPEN_RANDOM_NOTE_DESC:
        "Коли ви вимкнете це, нотатки будуть впорядковані за важливістю (PageRank).",
    AUTO_NEXT_NOTE: "Автоматично відкривати наступну нотатку після повторення",
    MAX_N_DAYS_REVIEW_QUEUE:
        "Максимальна кількість днів для відображення на панелі повторення нотаток",
    MIN_ONE_DAY: "Кількість днів має бути не менше 1.",
    VALID_NUMBER_WARNING: "Будь ласка, введіть дійсне число.",
    UI: "Інтерфейс користувача",
    OPEN_IN_TAB: "Відкривати в новій вкладці",
    OPEN_IN_TAB_DESC: "Вимкніть це, щоб відкривати плагін у модальному вікні",
    SHOW_STATUS_BAR: "Показувати рядок стану",
    SHOW_STATUS_BAR_DESC:
        "Вимкніть це, щоб приховати статус повторення карток у рядку стану Obsidian",
    SHOW_RIBBON_ICON: "Показувати іконку на панелі інструментів",
    SHOW_RIBBON_ICON_DESC:
        "Вимкніть це, щоб приховати іконку плагіна з панелі інструментів Obsidian",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Увімкнути опції повторення в меню файлу (наприклад, Повторення: Легко, Добре, Складно)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Якщо ви вимкнете опції повторення в меню файлу, ви зможете повторювати свої нотатки за допомогою команд плагіна та, якщо ви їх визначили, пов'язаних гарячих клавіш.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Дерево колод має спочатку відображатися розгорнутим",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Вимкніть, щоб згорнути вкладені колоди в одній картці. Корисно, якщо у вас є картки, які належать до багатьох колод в одному файлі.",
    ALGORITHM: "Алгоритм",
    CHECK_ALGORITHM_WIKI:
        'Для отримання додаткової інформації перегляньте <a href="${algoUrl}">деталі алгоритму</a>.',
    SM2_OSR_VARIANT: "Варіант SM-2 від OSR",
    BASE_EASE: "Базова легкість",
    BASE_EASE_DESC: "мінімум = 130, бажано приблизно 250.",
    BASE_EASE_MIN_WARNING: "Базова легкість має бути не менше 130.",
    LAPSE_INTERVAL_CHANGE: "Зміна інтервалу при оцінці картки/нотатки як складної",
    LAPSE_INTERVAL_CHANGE_DESC: "новийІнтервал = старийІнтервал * зміна_інтервалу / 100.",
    EASY_BONUS: "Бонус за легкість",
    EASY_BONUS_DESC:
        "Бонус за легкість дозволяє встановити різницю в інтервалах між відповідями 'Добре' та 'Легко' для картки/нотатки (мінімум = 100%).",
    EASY_BONUS_MIN_WARNING: "Бонус за легкість має бути не менше 100.",
    LOAD_BALANCE: "Увімкнути балансування навантаження",
    LOAD_BALANCE_DESC: `Трохи коригує інтервал, щоб кількість повторень на день була більш рівномірною.
        Це схоже на розмиття в Anki, але замість випадкового вибору обирається день з найменшою кількістю повторень.
        Вимикається для малих інтервалів.`,
    MAX_INTERVAL: "Максимальний інтервал у днях",
    MAX_INTERVAL_DESC: "Дозволяє встановити верхню межу інтервалу (за замовчуванням = 100 років).",
    MAX_INTERVAL_MIN_WARNING: "Максимальний інтервал має бути не менше 1 дня.",
    MAX_LINK_CONTRIB: "Максимальний вплив посилань",
    MAX_LINK_CONTRIB_DESC:
        "Максимальний вплив зваженої легкості пов'язаних нотаток на початкову легкість.",
    LOGGING: "Журналювання",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "Показувати налагоджувальну інформацію планувальника в консолі розробника",
    DISPLAY_PARSER_DEBUG_INFO: "Показувати налагоджувальну інформацію парсера в консолі розробника",
    SCHEDULING: "Планування",
    EXPERIMENTAL: "Експериментальне",
    HELP: "Довідка",
    STORE_IN_NOTES: "У нотатках",

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
    FORECAST_DESC: "Кількість карток, які потрібно повторити в майбутньому",
    SCHEDULED: "Заплановано",
    DAYS: "Днів",
    NUMBER_OF_CARDS: "Кількість карток",
    REVIEWS_PER_DAY: "Середнє: ${avg} повторень/день",
    INTERVALS: "Інтервали",
    INTERVALS_DESC: "Затримки до наступного показу",
    COUNT: "Кількість",
    INTERVALS_SUMMARY: "Середній інтервал: ${avg}, Найдовший інтервал: ${longest}",
    EASES: "Легкість",
    EASES_SUMMARY: "Середня легкість: ${avgEase}",
    EASE: "Легкість",
    CARD_TYPES: "Типи карток",
    CARD_TYPES_DESC: "Включно з відкладеними картками, якщо такі є",
    CARD_TYPE_NEW: "Нові",
    CARD_TYPE_YOUNG: "Молоді",
    CARD_TYPE_MATURE: "Зрілі",
    CARD_TYPES_SUMMARY: "Всього карток: ${totalCardsCount}",
    SEARCH: "Пошук",
    PREVIOUS: "Попередня",
    NEXT: "Наступна",
};
