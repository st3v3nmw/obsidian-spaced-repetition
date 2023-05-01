// Перевод на русский язык

// @ytatichno Сафронов Максим
// https://github.com/ytatichno

// Микко Ведру
// https://github.com/mikkovedru

export default {
    // flashcard-modal.tsx
    DECKS: "Колоды",
    DUE_CARDS: "Предстоящие карточки",
    NEW_CARDS: "Новые карточки",
    TOTAL_CARDS: "Всего карточек",
    BACK: "Назад",
    SKIP: "Пропустить",
    EDIT_CARD: "Редактировать карточку",
    RESET_CARD_PROGRESS: "Сбросить прогресс карточки",
    HARD: "Сложно",
    GOOD: "Нормально",
    EASY: "Легко",
    SHOW_ANSWER: "Показать ответ",
    CARD_PROGRESS_RESET: "Сбросить прогресс изучение карточки",
    SAVE: "Сохранить",
    CANCEL: "Отмена",
    NO_INPUT: "Пустой ввод.",
    CURRENT_EASE_HELP_TEXT: "Текущая Легкость: ",
    CURRENT_INTERVAL_HELP_TEXT: "Текущий интервал: ",
    CARD_GENERATED_FROM: "Сгенерированно из: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Открыть заметку для повторения",
    REVIEW_CARDS: "Повторить карточки",
    REVIEW_EASY_FILE_MENU: "Повторение: Легко",
    REVIEW_GOOD_FILE_MENU: "Повторение: Нормально",
    REVIEW_HARD_FILE_MENU: "Повторение: Сложно",
    REVIEW_NOTE_EASY_CMD: "Повторять заметку как Лёгкую",
    REVIEW_NOTE_GOOD_CMD: "Повторять заметку как Нормальную",
    REVIEW_NOTE_HARD_CMD: "Повторять заметку как Сложную",
    CRAM_ALL_CARDS: "Зубрить все карточки в этой колоде",
    REVIEW_ALL_CARDS: "Повторить все карточки во всех заметках",
    REVIEW_CARDS_IN_NOTE: "Повторить карточки в этой заметке",
    CRAM_CARDS_IN_NOTE: "Зубрить карточки в этой заметке",
    VIEW_STATS: "Посмотреть статистику",
    STATUS_BAR:
        "Повторить: ${dueNotesCount} заметок(-ки), ${dueFlashcardsCount} карточек(-ки) предстоит",
    SYNC_TIME_TAKEN: "Синхронизация заняла ${t}мс",
    NOTE_IN_IGNORED_FOLDER: "Заметка сохранена в игнорируемую папку (см. настройки).",
    PLEASE_TAG_NOTE: "Пожалуйста пометьте заметку как надо для повторения (см. настройки).",
    RESPONSE_RECEIVED: "Ответ получен.",
    NO_DECK_EXISTS: "Не существует уровня ${deckName}",
    ALL_CAUGHT_UP: "Молодец! Ты справился и дошел до конца! :D",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} дней",
    MONTHS_STR_IVL: "${interval} месяцов",
    YEARS_STR_IVL: "${interval} года (лет)",
    DAYS_STR_IVL_MOBILE: "${interval}д.",
    MONTHS_STR_IVL_MOBILE: "${interval}м.",
    YEARS_STR_IVL_MOBILE: "${interval}г.",

    // settings.ts
    SETTINGS_HEADER: "Плагин Spaced Repetition - Настройки",
    CHECK_WIKI: 'Для доп. инфы, смотри <a href="${wiki_url}">wiki</a>.',
    FOLDERS_TO_IGNORE: "Игнорируемые папки",
    FOLDERS_TO_IGNORE_DESC:
        "Ведите пути папок, каждая на своей строке, например: Templates Meta/Scripts",
    FLASHCARDS: "Карточки",
    FLASHCARD_EASY_LABEL: "Текст кнопки Легко",
    FLASHCARD_GOOD_LABEL: "Текст кнопки Нормально",
    FLASHCARD_HARD_LABEL: "Текст кнопки Сложно",
    FLASHCARD_EASY_DESC: 'Настроить ярлык для кнопки "Легко"',
    FLASHCARD_GOOD_DESC: 'Настроить ярлык для кнопки "Нормально"',
    FLASHCARD_HARD_DESC: 'Настроить ярлык для кнопки "Сложно"',
    FLASHCARD_TAGS: "Тэги карточек",
    FLASHCARD_TAGS_DESC:
        "Ведите тэги разделенные Enter-ом или пробелом, например: #flashcards #deck2 #deck3.",
    CONVERT_FOLDERS_TO_DECKS: "Конвертировать папки в уровни и подуровни?",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Это альтернатива тэгам карточек, настройка сверху.",
    INLINE_SCHEDULING_COMMENTS: "Сохранять комментарий планирования на последней строке карточки?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Включение этой настройки сделает так, что HTML комментарии не будут ломать форматирование списка.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Прятать родственные карточки до след. дня?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Родственные карточки - те, которые образованы из одного текста, пример: карточки с пропусками ([...])",
    SHOW_CARD_CONTEXT: "Показывать контекст(уровень) в карточках(во время повторения)?",
    SHOW_CARD_CONTEXT_DESC: "пример: Title > Heading 1 > Subheading > ... > Subheading",
    CARD_MODAL_HEIGHT_PERCENT: "Высота карточки впроцентах",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Если пользуетесь мобильным телефоном, выставьте 100% или у вас будут огромные изображения",
    RESET_DEFAULT: "Настройки по умолчанию",
    CARD_MODAL_WIDTH_PERCENT: "Ширина карточки в процентах",
    RANDOMIZE_CARD_ORDER: "Случайный порядок карточек во время повторения?",
    DISABLE_CLOZE_CARDS: "Выключить карты с пропусками (пример: [...])?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Конвертировать ==выделенный текст== в пропуски (пример: [...])?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "Конвертировать **жирный текст** в пропуски (пример: [...])?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES:
        "Конвертировать {{фигурные скобки}} в пропуски (пример: [...])?",
    INLINE_CARDS_SEPARATOR: "Разделитель для внутристрочных карточек",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Внимание! После изменения этого вам придётся вручную редактировать уже существующие карточки",
    INLINE_REVERSED_CARDS_SEPARATOR: "Разделитель для обратных внутристрочных карточек",
    MULTILINE_CARDS_SEPARATOR: "Разделитель для многострочных карточек",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Разделитель для обратных многострочных карточек",
    NOTES: "Заметки",
    REVIEW_PANE_ON_STARTUP: "Включить панель повторения при запуске программы",
    TAGS_TO_REVIEW: "Тэги для повторения",
    TAGS_TO_REVIEW_DESC:
        "Введите тэги, разделенные Enter-ами или пробелами, например: #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Открыть случайную заметку для повторения",
    OPEN_RANDOM_NOTE_DESC: "Если выключить, то заметки будут следовать по важности (PageRank).",
    AUTO_NEXT_NOTE: "После повторения автоматически открывать следующую заметку",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "Выключить выбор сложности повторения в меню файла, т.е.: Повторение: Легко Нормально Сложно",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "После выключения вы сможете повторять при помощи хоткеев. Перезагрузите Obsidian после изменения этого.",
    MAX_N_DAYS_REVIEW_QUEUE: "Наибольшее количество дней для отображение на панели справа",
    MIN_ONE_DAY: "Количество дней не меньше 1.",
    VALID_NUMBER_WARNING: "Пожалуйста введите подходящее число.",
    UI_PREFERENCES: "Пользовательский интерфейс Настройки",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Деревья колод должны изначально отображаться как развернутые",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Отключите этот параметр, чтобы свернуть вложенные колоды на одной карточке. Полезно, если у вас есть карты, которые принадлежат многим колодам в одном файле.",
    ALGORITHM: "Алгоритм",
    CHECK_ALGORITHM_WIKI:
        'За дополнительной информацией обращайтесь к <a href="${algo_url}">реализация алгоритма</a>.',
    BASE_EASE: "Базовая Лёгкость",
    BASE_EASE_DESC: "минимум = 130, предпочтительно около 250.",
    BASE_EASE_MIN_WARNING: "Лёгкость должна быть минимум 130.",
    LAPSE_INTERVAL_CHANGE:
        "Изменение промежутка когда вы отвечаете Сложно во время повторения карточки/заметки",
    LAPSE_INTERVAL_CHANGE_DESC: "новыйПромежуток = старыйПромежуток * изменениеПромежутка / 100.",
    EASY_BONUS: "Легко: бонус",
    EASY_BONUS_DESC:
        "Бонус за Легко позволяет вам установить разницу в промежутках между ответами Хорошо и Легко на карточке/заметке (мин. = 100%).",
    EASY_BONUS_MIN_WARNING: "Бонус за Легко должен быть не меньше 100.",
    MAX_INTERVAL: "Maximum interval in days",
    MAX_INTERVAL_DESC:
        "Позволяет вам устанавливать верхнюю границу на промежуток (по умолчанию = 100 лет).",
    MAX_INTERVAL_MIN_WARNING: "Максимальный промежуток должен быть не меньше 1.",
    MAX_LINK_CONTRIB: "Максимальный вклад связи (ссылки)",
    MAX_LINK_CONTRIB_DESC:
        "Максимальный вклад взвешенной Лёгкости связанных заметок в начальную Лёгкость.",
    LOGGING: "Ведение лога",
    DISPLAY_DEBUG_INFO:
        "Отображать отладочную информацию в консоле разработчика (developer console)?",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Очередь заметок на повторение",
    CLOSE: "Закрыть",
    NEW: "Новые",
    YESTERDAY: "Вчерашние",
    TODAY: "Сегодняшние",
    TOMORROW: "Завтрашние",

    // stats-modal.tsx
    STATS_TITLE: "Статистика",
    MONTH: "Месяц",
    QUARTER: "Четверть",
    YEAR: "Год",
    LIFETIME: "Всё время",
    FORECAST: "Прогноз",
    FORECAST_DESC: "Количество карточек предстоящих в будущем",
    SCHEDULED: "Запланировано",
    DAYS: "Дней",
    NUMBER_OF_CARDS: "Количество карточек",
    REVIEWS_PER_DAY: "Среднее количество: ${avg} повторений в день", //!!!
    INTERVALS: "Интервалы",
    INTERVALS_DESC: "Промежутки времени до следующего показа карточек во время повторения",
    COUNT: "Количество",
    INTERVALS_SUMMARY: "Средний промежуток: ${avg}, Самый длинный промежуток: ${longest}",
    EASES: "Лёгкость (параметр в алгоритме, который влияет на приоритет и время показа карточек) \n (от англ. ease, см. настройки алгоритма)",
    EASES_SUMMARY: "Среднее количество Лёгкости: ${avgEase}",
    CARD_TYPES: "Типы карточек",
    CARD_TYPES_DESC: "Включая спрятанные карточки, если такие существуют.",
    CARD_TYPE_NEW: "Новых",
    CARD_TYPE_YOUNG: "Молодых",
    CARD_TYPE_MATURE: "Взрослых",
    CARD_TYPES_SUMMARY: "Всего карточек: ${totalCardsCount}",
};
