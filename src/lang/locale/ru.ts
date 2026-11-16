// Перевод на русский язык

// @ytatichno Сафронов Максим
// https://github.com/ytatichno

// Микко Ведру
// https://github.com/mikkovedru

// Калашников Иван
// https://github.com/Steindvart
import { IBaseLocale } from "src/lang/base-locale";
import en from "src/lang/locale/en";

const ru: IBaseLocale = {
    ...en,
    language: "ru",
    languageName: "Русский",
    // flashcard-modal.tsx
    CRAM_MODE: "Режим зубрёжки",
    REVIEW_MODE: "Режим изучения",
    DECKS: "Колоды",
    DUE_CARDS: "Повторяемые карточки",
    DUE: "К повторению",
    NEW_CARDS: "Новые карточки",
    SEEN_CARDS: "Просмотренные карточки",
    SEEN: "Просмотрено",
    TOTAL_CARDS: "Всего карточек",
    TOTAL: "Всего",
    BACK: "Назад",
    SKIP: "Пропустить",
    EDIT_CARD: "Редактировать карточку",
    RESET_CARD_PROGRESS: "Сбросить прогресс карточки",
    HARD: "Сложно",
    GOOD: "Нормально",
    EASY: "Легко",
    SHOW_ANSWER: "Показать ответ",
    CARD_PROGRESS_RESET: "Сбросить прогресс изучения карточки",
    SAVE: "Сохранить",
    CANCEL: "Отмена",
    NO_INPUT: "Пустой ввод.",
    CURRENT_EASE_HELP_TEXT: "Текущий прогресс: ",
    CURRENT_INTERVAL_HELP_TEXT: "Текущий интервал: ",
    CARD_GENERATED_FROM: "Сгенерированно из: ${notePath}",
    JUMP_TO: "Перейти к карточке",
    JUMP_TO_AND_CLOSE: "Закрыть и перейти к карточке",
    OPEN_IN_BACKGROUND: "Открыть карточку в фоне",
    VIEW_CARD_INFO: "View Card Info",
    DELETE_CARD: "Удалить карточку",
    DELETE_CARD_CONFIRMATION:
        "Это действие нельзя отменить, и оно может нежелательно изменить ваши заметки. Вы уверены, что хотите удалить эту карточку?",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Открыть заметку для изучения",
    REVIEW_CARDS: "Изучать карточки",
    REVIEW_DIFFICULTY_FILE_MENU: "Изучение: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Изучать заметку как ${difficulty}",
    REVIEW_CARD_DIFFICULTY_CMD: "Изучать карточку как ${difficulty}",
    CRAM_ALL_CARDS: "Зубрить все карточки в этой колоде",
    REVIEW_ALL_CARDS: "Изучать все карточки во всех заметках",
    REVIEW_CARDS_IN_NOTE: "Изучать карточки в этой заметке",
    CRAM_CARDS_IN_NOTE: "Зубрить карточки в этой заметке",
    VIEW_STATS: "Посмотреть статистику",
    OPEN_REVIEW_QUEUE_VIEW: "Открыть очередь повторения заметок на боковой панели",
    STATUS_BAR: "Повторить: ${dueNotesCount} заметок, ${dueFlashcardsCount} карточек",
    SYNC_TIME_TAKEN: "Синхронизация заняла ${t}мс",
    NOTE_IN_IGNORED_FOLDER: "Заметка сохранена в игнорируемую папку (см. настройки).",
    PLEASE_TAG_NOTE: "Для изучения, пожалуйста, правильно пометьте заметку тегом (см. настройки).",
    RESPONSE_RECEIVED: "Ответ получен.",
    NO_DECK_EXISTS: "Не существует уровня ${deckName}",
    ALL_CAUGHT_UP: "Молодец! Ты справился и дошел до конца! :D",
    REVIEW_REMINDER_NOTICE:
        "Карточки готовы к повторению. Вернитесь в Obsidian, чтобы продолжить обучение.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} дней",
    MONTHS_STR_IVL: "${interval} месяцев",
    YEARS_STR_IVL: "${interval} годов",
    DAYS_STR_IVL_MOBILE: "${interval}д.",
    MONTHS_STR_IVL_MOBILE: "${interval}м.",
    YEARS_STR_IVL_MOBILE: "${interval}г.",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    PLUGIN_DATA_STORE_INFO:
        "Данные планирования хранятся в markdown-файлах внутри вашего хранилища (в настроенной папке раздела «Данные планирования»). Расписания заметок определяются по уникальному идентификатору (sr-id), добавленному в свойства каждой заметки, поэтому они сохраняются при переименованиях и перемещениях как внутри Obsidian, так и за его пределами. Расписания карточек привязаны к хешу текста карточки: изменение лицевой стороны карточки сбрасывает её расписание.",
    MIGRATE_TO_PLUGIN_DATA: "Перенести данные планирования в данные плагина?",
    CONFIRM_MIGRATE_TO_PLUGIN_DATA:
        "Все комментарии <!--SR:...--> и поля свойств sr-* будут перемещены в markdown-файлы расписаний в хранилище, а в свойства каждой заметки будет добавлено поле sr-id как стабильный идентификатор. В больших хранилищах это может занять некоторое время. Не редактируйте заметки, пока перенос не завершится.",
    MIGRATING_TO_PLUGIN_DATA: "Перенос данных планирования в данные плагина...",
    MIGRATE_TO_NOTES: "Перенести данные планирования обратно в заметки?",
    CONFIRM_MIGRATE_TO_NOTES:
        "Все данные планирования будут записаны обратно в виде комментариев <!--SR:...--> и полей свойств sr-*. В больших хранилищах это может занять некоторое время. Не редактируйте заметки, пока перенос не завершится.",
    MIGRATING_TO_NOTES: "Перенос данных планирования в заметки...",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'Для дополнительной информации посетите: <a href="${wikiUrl}">wiki</a>.',
    GITHUB_DISCUSSIONS:
        'Visit the <a href="${discussionsUrl}">discussions</a> section for Q&A help, feedback, and general discussion.',
    GITHUB_ISSUES:
        'Raise an issue <a href="${issuesUrl}">here</a> if you have a feature request or a bug report.',
    GITHUB_SOURCE_CODE:
        'The project\'s source code is available on <a href="${githubProjectUrl}">GitHub</a>.',
    CODE_CONTRIBUTION_INFO:
        '<a href="${codeContributionUrl}">Here\'s</a> how to contribute code to the plugin.',
    TRANSLATION_CONTRIBUTION_INFO:
        '<a href="${translationContributionUrl}">Here\'s</a> how to translate the plugin to another language.',
    FOLDERS_TO_IGNORE: "Игнорируемые папки",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Карточки",
    FLASHCARD_EASY_LABEL: 'Текст кнопки "Легко"',
    FLASHCARD_GOOD_LABEL: 'Текст кнопки "Нормально"',
    FLASHCARD_HARD_LABEL: 'Текст кнопки "Сложно"',
    FLASHCARD_AGAIN_LABEL: 'Текст кнопки "Снова"',
    FLASHCARD_EASY_DESC: 'Настроить ярлык для кнопки "Легко"',
    FLASHCARD_GOOD_DESC: 'Настроить ярлык для кнопки "Нормально"',
    FLASHCARD_HARD_DESC: 'Настроить ярлык для кнопки "Сложно"',
    FLASHCARD_AGAIN_DESC: 'Настроить ярлык для кнопки "Снова"',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Теги карточек",
    FLASHCARD_TAGS_DESC:
        "Укажите теги разделенные Enter-ом или пробелом, например: #flashcards #deck2 #deck3.",
    FLASHCARD_TAGS_TO_IGNORE: "Игнорируемые теги",
    FLASHCARD_TAGS_TO_IGNORE_DESC:
        "Введите теги, разделённые пробелами или переводами строк. Заметки, содержащие любой из этих тегов, будут исключены из изучения карточек.",
    CONVERT_FOLDERS_TO_DECKS: "Конвертировать папки в уровни и подуровни?",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Это альтернатива описанному выше варианту тегов флэш-карт",
    INLINE_SCHEDULING_COMMENTS: "Сохранять комментарий планирования на последней строке карточки?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Включение этой настройки сделает так, что HTML комментарии не будут ломать форматирование списка.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Прятать родственные карточки до следующего дня?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Родственные карточки - те, которые образованы из одного текста, пример: карточки с пропусками ([...])",
    SHOW_CARD_CONTEXT: "Показывать контекст (уровень) в карточках (во время повторения)?",
    SHOW_CARD_CONTEXT_DESC: "пример: Title > Heading 1 > Subheading > ... > Subheading",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    SHOW_DELETE_BUTTON: "Показывать кнопку удаления",
    SHOW_DELETE_BUTTON_DESC: "Добавляет кнопку удаления в интерфейс изучения карточек.",
    CARD_MODAL_HEIGHT_PERCENT: "Высота карточки в процентах",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Если пользуетесь мобильным телефоном, выставьте 100%. Иначе у вас будут огромные изображения",
    RESET_DEFAULT: "Настройки по-умолчанию",
    CARD_MODAL_WIDTH_PERCENT: "Ширина карточки в процентах",
    RANDOMIZE_CARD_ORDER: "Случайный порядок карт во время изучения?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Порядок отображения карт колоды во время изучения",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL:
        "Последовательно внутри колоды (сначала все новые карты)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Последовательно внутри колоды (сначала все повторяемые карты)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Случайно внутри колоды (сначала все новые карты)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "Случайно внутри колоды (сначала все повторяемые карты)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Случайная карта из случайной колоды",
    REVIEW_DECK_ORDER: "Порядок отображения колод во время изучения",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Последовательно  (после изучения всех карт из предыдущей колоды)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Случайно (после изучения всех карт из предыдущей колоды)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Случайная карта из случайной колоды",
    REVIEW_REMINDERS: "Напоминания о повторении",
    REVIEW_REMINDERS_DESC:
        "Периодически проверяет наличие новых карточек или карточек к повторению и напоминает, когда их пора изучить.",
    REVIEW_REMINDER_CHECK_ON_STARTUP: "Проверять сразу при запуске",
    REVIEW_REMINDER_CHECK_ON_STARTUP_DESC:
        "Выполняет одну проверку, когда раскладка Obsidian при запуске готова, не дожидаясь первого интервала.",
    REVIEW_REMINDER_INTERVAL: "Интервал напоминаний (в минутах)",
    REVIEW_REMINDER_INTERVAL_DESC:
        "Проверка каждые N минут. Минимум 1 минута, максимум 1440 минут.",
    REVIEW_REMINDER_INTERVAL_MIN_WARNING: "Интервал напоминаний должен быть числом от 1 до 1440.",
    REVIEW_REMINDER_MESSAGE: "Текст напоминания",
    REVIEW_REMINDER_MESSAGE_DESC:
        "Необязательный текст, отображаемый в напоминании. Оставьте пустым, чтобы использовать текст по умолчанию.",
    REVIEW_REMINDER_AUTO_OPEN: "Автоматически открывать изучение",
    REVIEW_REMINDER_AUTO_OPEN_DESC:
        "Если включено, напоминания сразу открывают текущий сеанс изучения карточек.",
    REVIEW_REMINDER_SHOW_NOTICE: "Показывать уведомление при напоминании",
    REVIEW_REMINDER_SHOW_NOTICE_DESC:
        "Показывает временное уведомление, когда срабатывает напоминание о повторении.",
    REVIEW_REMINDER_PLAY_SOUND: "Воспроизводить звук при напоминании",
    REVIEW_REMINDER_PLAY_SOUND_DESC:
        "Воспроизводит короткий звуковой сигнал, когда срабатывает напоминание о повторении.",
    REVIEW_REMINDER_BOUNCE_DOCK: "Подпрыгивать иконке в доке при напоминании",
    REVIEW_REMINDER_BOUNCE_DOCK_DESC:
        "На компьютере иконка в доке подпрыгивает, когда срабатывает напоминание о повторении.",
    DISABLE_CLOZE_CARDS: "Выключить карты с пропусками (пример: [...])?",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS: "Convert cloze patterns to input fields",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC:
        "Replace cloze patterns with input fields when reviewing cloze cards.",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Конвертировать ==выделенный текст== в пропуски (пример: [...])?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Добавить/удалить <code>${defaultPattern}</code> в ваши "Шаблоны пропусков"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Конвертировать **жирный текст** в пропуски (пример: [...])?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Добавить/удалить <code>${defaultPattern}</code> в ваши "Шаблоны пропусков"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES:
        "Конвертировать {{фигурные скобки}} в пропуски (пример: [...])?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Добавить/удалить <code>${defaultPattern}</code> в ваши "Шаблоны пропусков"',
    CLOZE_PATTERNS: "Шаблоны пропусков",
    CLOZE_PATTERNS_DESC:
        'Введите шаблоны пропусков, разделенные переводами строк. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Разделитель для внутристрочных карточек",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Внимание! После изменения этого вам придётся вручную редактировать уже существующие карточки",
    INLINE_REVERSED_CARDS_SEPARATOR: "Разделитель для обратных внутристрочных карточек",
    MULTILINE_CARDS_SEPARATOR: "Разделитель для многострочных карточек",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Разделитель для обратных многострочных карточек",
    MULTILINE_CARDS_END_MARKER: "Символы, обозначающие конец клозов и многострочных карточек",
    NOTES: "Заметки",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Включить панель изучения карточек при запуске программы",
    TAGS_TO_REVIEW: "Теги для изучения",
    TAGS_TO_REVIEW_DESC:
        "Введите теги, разделенные Enter-ами или пробелами, например: #review #tag2 #tag3.",
    NOTE_TAGS_TO_IGNORE: "Игнорируемые теги",
    NOTE_TAGS_TO_IGNORE_DESC:
        "Введите теги, разделённые пробелами или переводами строк. Заметки, содержащие любой из этих тегов, будут исключены из изучения заметок.",
    OPEN_RANDOM_NOTE: "Открыть случайную заметку для изучения",
    OPEN_RANDOM_NOTE_DESC: "Если выключить, то заметки будут отсортированы по важности (PageRank).",
    AUTO_NEXT_NOTE: "После изучения автоматически открывать следующую заметку",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Включите параметры обзора в меню Файл (т.е.: Изучение: Легко, Нормально, Сложно)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Если вы отключите параметры обзора в меню Файл, вы сможете просматривать свои заметки с помощью команд плагина и, если вы их задали, соответствующих горячих клавиш.",
    MAX_N_DAYS_REVIEW_QUEUE: "Наибольшее количество дней для отображение на панели справа",
    MIN_ONE_DAY: "Количество дней не меньше 1.",
    VALID_NUMBER_WARNING: "Пожалуйста, введите подходящее число.",
    UI: "User Interface",
    OPEN_IN_TAB: "Open in new tab",
    OPEN_IN_TAB_DESC: "Turn this off to open the plugin in a modal window",
    STATUS_BAR_SETTINGS: "Строка состояния",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_CARD_STATUS_BAR_ITEM: "Показывать элемент карточки в строке состояния",
    SHOW_CARD_STATUS_BAR_ITEM_DESC:
        "Выключите, чтобы скрыть статус изучения карточки в строке состояния Obsidian",
    SHOW_NOTE_STATUS_BAR_ITEM: "Показывать элемент заметки в строке состояния",
    SHOW_NOTE_STATUS_BAR_ITEM_DESC:
        "Выключите, чтобы скрыть статус изучения заметки в строке состояния Obsidian",
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM: "Показывать в строке состояния доступность обновления",
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM_DESC:
        "Выключите, чтобы скрыть элемент о доступном обновлении и прекратить запрос номера последней версии",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Деревья колод должны изначально отображаться как развернутые",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Отключите этот параметр, чтобы свернуть вложенные колоды на одной карточке. Полезно, если у вас есть карты, которые принадлежат многим колодам в одном файле.",
    ALGORITHM: "Алгоритм",
    CHECK_ALGORITHM_WIKI:
        'За дополнительной информацией обращайтесь к <a href="${algoUrl}">реализация алгоритма</a>.',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    SWITCH_TO_FSRS_ALGORITHM: "Переключить алгоритм карточек на FSRS?",
    CONFIRM_FSRS_ALGORITHM_SWITCH:
        "Переключение на FSRS может привести к непредвиденной потере данных, так как алгоритм ещё недостаточно протестирован! Переключение меняет формат данных планирования карточек во время изучения. Это значит, что перезаписанным в формате FSRS карточкам потребуется гораздо больше параметров, а значит, более длинный и заметный комментарий с данными планирования. Для комментариев планирования по возможности поддерживается обратная совместимость, на случай если вы захотите вернуться к OSR: данные планирования будут перезаписаны в формат OSR, как только вы изучите карточку с включённым OSR.",
    BASE_EASE: "Базовая Лёгкость",
    BASE_EASE_DESC: "минимум = 130, предпочтительно около 250.",
    BASE_EASE_MIN_WARNING: "Лёгкость должна быть минимум 130.",
    LAPSE_INTERVAL_CHANGE:
        'Изменение интервала при выборе "Сложно" во время изучения карточки/заметки',
    LAPSE_INTERVAL_CHANGE_DESC: "новыйПромежуток = старыйПромежуток * изменениеПромежутка / 100.",
    EASY_BONUS: "Легко: бонус",
    EASY_BONUS_DESC:
        "Бонус за Легко позволяет вам установить разницу в промежутках между ответами Хорошо и Легко на карточке/заметке (мин. = 100%).",
    EASY_BONUS_MIN_WARNING: 'Бонус за "Легко" должен быть не меньше 100.',
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Максимальный интервал повторения в днях",
    MAX_INTERVAL_DESC:
        "Позволяет вам устанавливать верхнюю границу на интервал повторения (по умолчанию = 100 лет).",
    MAX_INTERVAL_MIN_WARNING: "Максимальный интервал должен быть не меньше 1.",
    MAX_LINK_CONTRIB: "Максимальный вклад связи (ссылки)",
    MAX_LINK_CONTRIB_DESC:
        'Максимальный вклад среднего значения "Лёгкости" связанных заметок в начальную "Лёгкость".',
    LOGGING: "Журналирование",
    DISPLAY_SCHEDULING_DEBUG_INFO: "Отображать отладочную информацию в консоли разработчика",
    DISPLAY_PARSER_DEBUG_INFO: "Show the parser's debugging information on the developer console",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",
    DELETE_SCHEDULING_DATA_ALL: "Delete Scheduling Data",
    DELETE_SCHEDULING_DATA_ALL_DESC: "Delete scheduling data from all notes and flashcards.",
    DELETE: "Delete",
    CONFIRM_SCHEDULING_DATA_ALL_DELETION:
        "Are you sure you want to delete all scheduling data from your notes and flashcards? This action cannot be undone.",
    CONFIRM: "Confirm",
    SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS: "Scheduling data deletion in progress...",
    SCHEDULING_DATA_HAS_BEEN_DELETED:
        "Scheduling data has been deleted from all notes and flashcards.",
    USE_CUSTOM_HOTKEYS: "Использовать свои сочетания клавиш",
    USE_CUSTOM_HOTKEYS_DESC:
        "Включает свои сочетания клавиш для команд изучения карточек. После включения стандартные сочетания работать не будут. Свои сочетания можно использовать только с включённой опцией «Открывать в новой вкладке».",

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
    QUARTER: "Квартал",
    YEAR: "Год",
    LIFETIME: "Всё время",
    FORECAST: "Прогноз",
    FORECAST_DESC: "Количество карточек предстоящих для повторения",
    SCHEDULED: "Запланировано",
    DAYS: "Дни",
    NUMBER_OF_CARDS: "Количество карточек",
    REVIEWS_PER_DAY: "Среднее количество: ${avg} повторений в день",
    INTERVALS: "Интервалы",
    INTERVALS_DESC: "Промежутки времени до следующего показа карточек во время повторения",
    COUNT: "Количество",
    INTERVALS_SUMMARY: "Средний промежуток: ${avg}, Самый длинный промежуток: ${longest}",
    EASES: "Прогресс изучения",
    EASES_SUMMARY: "Среднее значение прогресса: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Типы карточек",
    CARD_TYPES_DESC: "Включая спрятанные карточки, если такие существуют.",
    CARD_TYPE_NEW: "Новых",
    CARD_TYPE_YOUNG: "Повторяемых",
    CARD_TYPE_MATURE: "Изученных",
    CARD_TYPES_SUMMARY: "Всего карточек: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
    // settings.ts
    SETTINGS_TAB_HEADING: "Settings",
    MAIN_SETTINGS_PAGE: "MAIN_SETTINGS",

    // NoteReviewQueue.ts
    NOTE_REVIEW_QUEUE_HINT: "Click on the 3 dots next to the note to open the review menu.",
    NOTE_REVIEW_QUEUE_EMPTY_HINT:
        "Заметок для повторения нет. Чтобы добавить заметки, поставьте тег «review» в одной из своих заметок.",

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
    DELETE_SCHEDULING_DATA_IN_NOTES: "Удалить данные планирования в заметках",
    DELETE_SCHEDULING_DATA_IN_NOTES_DESC: "Удалить данные планирования из всех заметок.",
    DELETE_SCHEDULING_DATA_IN_CARDS: "Удалить данные планирования в карточках",
    DELETE_SCHEDULING_DATA_IN_CARDS_DESC: "Удалить данные планирования из всех карточек.",
    CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION:
        "Вы уверены, что хотите удалить все данные планирования из заметок? Это действие нельзя отменить.",
    CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION:
        "Вы уверены, что хотите удалить все данные планирования из карточек? Это действие нельзя отменить.",
    SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS: "Удаление данных планирования...",
    SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS: "Удаление данных планирования...",
    // Settings > main-page
    INFO: "Info",
    // Card responses
    AGAIN: "Again",
    // Settings > info
    CHECK_ROADMAP: 'Check out the <a href="${roadMapUrl}">roadmap</a> for upcoming features.',
    CHECK_DEV_NEWS:
        'Check out the <a href="${devNewsUrl}">dev news</a> for the latest development news.',
    OPEN_MENU: "Открыть меню",
    DELETE_NOTE_SCHEDULING_DATA_IN_NOTE: "Удалить данные планирования этой заметки",
    CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION:
        "Вы уверены, что хотите удалить данные планирования этой заметки?",
    NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS: "Удаление данных планирования заметки...",
    DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE: "Удалить данные планирования карточек в заметке",
    CONFIRM_SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION:
        "Вы уверены, что хотите удалить данные планирования карточек в заметке?",
    SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION_IN_PROGRESS:
        "Удаление данных планирования карточек в заметке...",
    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA: "Удалять теги при удалении данных планирования",
    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA_DESC: "Удалять теги при удалении данных планирования",
    ENABLE_FILE_MENU_DELETE_BUTTON: "Включить кнопку удаления в меню файла",
    ENABLE_FILE_MENU_DELETE_BUTTON_DESC:
        "Включает кнопку удаления данных планирования в меню файла",
    DATA_PAGE_NAME: "Данные",
    GROUP_RESET_SETTINGS: "Сброс настроек",
    GROUP_RESET_SETTINGS_DESC: "Сбросить все настройки до значений по умолчанию",
    RESET_SETTINGS: "Сбросить настройки",
    CONFIRM_RESET_SETTINGS:
        "Вы уверены, что хотите сбросить все настройки до значений по умолчанию?",
    RESET_SETTINGS_CONFIRMATION: "Сброс всех настроек до значений по умолчанию...",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE: "Формат даты в очереди повторения заметок",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE_DESC:
        'Формат даты в очереди повторения заметок (подробности см. в документации по <a href="${docsUrl}">moment.js</a>). Обновляется только после повторного открытия очереди повторения заметок.',
    MIGRATE_TO_FOLDER: "Перенести в папку",
    CONFIRM_MIGRATE_TO_FOLDER: "Вы уверены, что хотите перейти на хранение в папке?",
    MIGRATING_TO_FOLDER: "Перенос в папку...",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS:
        "Использовать выносные блоки для комментариев планирования",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS_DESC:
        "По умолчанию использовать выносной блок метаданных sr для комментариев планирования вместо обычных комментариев. Комментарии планирования будут скрыты в выносном блоке, который в редакторе выглядит как пустая строка.",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_BUTTON: "Перенести",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_DESC:
        "При переносе комментарии планирования будут помещены в выносной блок метаданных sr. Этот блок предназначен для того, чтобы скрыть комментарии планирования.",
    CONFIRM_MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT:
        "Перенос изменит все ваши карточки. Сначала сделайте резервную копию — на случай, если вы захотите отменить перенос позже или если из-за ошибки карточки будут повреждены. Вы уверены, что хотите перенести комментарии планирования в выносные блоки метаданных sr?",
    MIGRATING_SCHEDULING_COMMENTS_TO_CALLOUT:
        "Перенос комментариев планирования в выносные блоки метаданных sr...",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT:
        "Перенести комментарии планирования в выносной блок метаданных sr",
    DEFAULT_LOCALE_NAME: "- По умолчанию в Obsidian -",
    LANGUAGE_SETTINGS: "Настройки языка",
    LANGUAGE_SETTINGS_DESC:
        "Выберите язык интерфейса плагина. Изменения полностью вступят в силу только после перезапуска Obsidian.",
    DEBUG_LOG: "Журнал отладки",
    COPY: "Копировать",
    NO_DECKS_TO_REVIEW:
        "Нет колод с карточками для повторения. Убедитесь, что вы создали карточки: добавьте тег «flashcards» в заметку и затем добавьте в неё карточки (подробности на странице плагина). Если вы всё это сделали, а колод здесь по-прежнему нет, то, скорее всего, это ошибка в плагине. Известна ошибка, возникающая, когда карточки изучают очень быстро: система даёт сбой, и колоды не отображаются. Попробуйте открыть список колод ещё раз через несколько секунд.",
};

export default ru;
