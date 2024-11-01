// język polski

export default {
    // flashcard-modal.tsx
    DECKS: "Talie",
    DUE_CARDS: "Fiszki z terminem",
    NEW_CARDS: "Nowe fiszki",
    TOTAL_CARDS: "Wszystkie karty",
    BACK: "Wstecz",
    SKIP: "Pomiń",
    EDIT_CARD: "Edytuj kartę",
    RESET_CARD_PROGRESS: "Zresetuj postęp karty",
    HARD: "Trudne",
    GOOD: "Średnio Trudne",
    EASY: "Łatwe",
    SHOW_ANSWER: "Pokaż odpowiedź",
    CARD_PROGRESS_RESET: "Postęp karty został zresetowany.",
    SAVE: "Zapisz",
    CANCEL: "Anuluj",
    NO_INPUT: "Nie wprowadzono wartości.",
    CURRENT_EASE_HELP_TEXT: "Aktualna łatwość: ",
    CURRENT_INTERVAL_HELP_TEXT: "Aktualny interwał: ",
    CARD_GENERATED_FROM: "Wygenerowano z: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Otwórz notatkę do przeglądu",
    REVIEW_CARDS: "Przeglądaj fiszki",
    REVIEW_DIFFICULTY_FILE_MENU: "Przeglądaj: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Przeglądaj notatkę jako ${difficulty}",
    CRAM_ALL_CARDS: "Wybierz talię do intensywnego uczenia",
    REVIEW_ALL_CARDS: "Przeglądaj fiszki ze wszystkich notatek",
    REVIEW_CARDS_IN_NOTE: "Przeglądaj fiszki w tej notatce",
    CRAM_CARDS_IN_NOTE: "Intensywne uczenie fiszek w tej notatce",
    VIEW_STATS: "Wyświetl statystyki",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR: "Przeglądaj: ${dueNotesCount} notatek, ${dueFlashcardsCount} fiszek z terminem",
    SYNC_TIME_TAKEN: "Synchronizacja zajęła ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "Notatka jest zapisana w folderze zignorowanym (sprawdź ustawienia).",
    PLEASE_TAG_NOTE: "Proszę odpowiednio otagować notatkę do przeglądu (w ustawieniach).",
    RESPONSE_RECEIVED: "Otrzymano odpowiedź.",
    NO_DECK_EXISTS: "Nie istnieje talia o nazwie ${deckName}",
    ALL_CAUGHT_UP: "Jesteś teraz na bieżąco :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} dni",
    MONTHS_STR_IVL: "${interval} miesięcy",
    YEARS_STR_IVL: "${interval} lata",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}r",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'Aby uzyskać więcej informacji, sprawdź <a href="${wikiUrl}">wiki</a>.',
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
    FOLDERS_TO_IGNORE: "Foldery do zignorowania",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Fiszki",
    FLASHCARD_EASY_LABEL: "Tekst przycisku Łatwe",
    FLASHCARD_GOOD_LABEL: "Tekst przycisku Średnio trudne",
    FLASHCARD_HARD_LABEL: "Tekst przycisku Trudne",
    FLASHCARD_EASY_DESC: 'Dostosuj etykietę dla przycisku "Łatwe"',
    FLASHCARD_GOOD_DESC: 'Dostosuj etykietę dla przycisku "Średnio trudne"',
    FLASHCARD_HARD_DESC: 'Dostosuj etykietę dla przycisku "Trudne"',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Tagi fiszek",
    FLASHCARD_TAGS_DESC:
        "Wprowadź tagi oddzielone spacją lub nowymi liniami, np. #fiszki #talia2 #talia3.",
    CONVERT_FOLDERS_TO_DECKS: "Czy konwertować foldery na talie i podtalie?",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Jest to alternatywa dla opcji tagów fiszek powyżej.",
    INLINE_SCHEDULING_COMMENTS:
        "Czy zachować komentarz harmonogramowania w tej samej linii co ostatnia linia fiszki?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Włączenie tej opcji sprawi, że komentarze HTML nie będą przerywać formatowania listy.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Czy ukrywać karty rodzeństwa do następnego dnia?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Rodzeństwo to karty wygenerowane z tego samego tekstu karty, np. usunięcia zamaskowane",
    SHOW_CARD_CONTEXT: "Czy pokazywać kontekst na kartach?",
    SHOW_CARD_CONTEXT_DESC: "np. Tytuł > Nagłówek 1 > Podnagłówek > ... > Podnagłówek",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Procentowa wysokość fiszki",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Powinno być ustawione na 100% na urządzeniach mobilnych lub gdy masz bardzo duże obrazy",
    RESET_DEFAULT: "Zresetuj do domyślnych",
    CARD_MODAL_WIDTH_PERCENT: "Procentowa szerokość fiszki",
    RANDOMIZE_CARD_ORDER: "Czy losować kolejność kart podczas przeglądu?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Kolejność kart w talii wyświetlana podczas przeglądania",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL:
        "Kolejno w ramach talii (Najpierw wszystkie nowe karty)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Kolejno w ramach talii (Najpierw wszystkie karty z terminem)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Losowo w ramach talii (Najpierw wszystkie nowe karty)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM:
        "Losowo w ramach talii (Najpierw wszystkie karty z terminem)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Losowa karta z losowej talii",
    REVIEW_DECK_ORDER: "Kolejność talii wyświetlana podczas przeglądania",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Kolejno (gdy wszystkie karty w poprzedniej talii przeglądnięte)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Losowo (gdy wszystkie karty w poprzedniej talii przeglądnięte)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Losowa karta z losowej talii",
    DISABLE_CLOZE_CARDS: "Wyłączyć karty zamaskowane?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Konwertować ==podświetlenia== na karty zamaskowane?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Dodaj/usuń <code>${defaultPattern}</code> z "Wzory kart zamaskowanych"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Konwertować pogrubiony tekst na karty zamaskowane?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Dodaj/usuń <code>${defaultPattern}</code> z "Wzory kart zamaskowanych"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Konwertować {{klamry}} na karty zamaskowane?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Dodaj/usuń <code>${defaultPattern}</code> z "Wzory kart zamaskowanych"',
    CLOZE_PATTERNS: "Wzory kart zamaskowanych",
    CLOZE_PATTERNS_DESC:
        'Wprowadź wzory kart zamaskowanych oddzielone nowymi liniami. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Separator dla kart zamaskowanych w linii",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Pamiętaj, że po zmianie tego musisz ręcznie edytować wszystkie karty zamaskowane, które już masz.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Separator dla kart zamaskowanych odwróconych w linii",
    MULTILINE_CARDS_SEPARATOR: "Separator dla kart zamaskowanych wieloliniowych",
    MULTILINE_REVERSED_CARDS_SEPARATOR:
        "Separator dla kart zamaskowanych odwróconych wieloliniowych",
    MULTILINE_CARDS_END_MARKER: "Caracteres que denotam o fim de clozes e flashcards multilineares",
    NOTES: "Notatki",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Włączyć panel przeglądu notatek przy starcie",
    TAGS_TO_REVIEW: "Tagi do przeglądu",
    TAGS_TO_REVIEW_DESC:
        "Wprowadź tagi oddzielone spacją lub nowymi liniami, np. #przegląd #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Otwórz losową notatkę do przeglądu",
    OPEN_RANDOM_NOTE_DESC:
        "Po wyłączeniu tej opcji notatki są uporządkowane według istotności (PageRank).",
    AUTO_NEXT_NOTE: "Automatycznie otwierać następną notatkę po przeglądzie",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Wyłączyć opcje przeglądu w menu pliku, tj. Przeglądaj: Łatwe Dobrze Trudne",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Jeśli wyłączysz opcje przeglądu w menu Plik, możesz przeglądać swoje notatki za pomocą poleceń wtyczki i, jeśli je zdefiniowałeś, przypisanych skrótów klawiszowych.",
    MAX_N_DAYS_REVIEW_QUEUE: "Maksymalna liczba dni do wyświetlenia w panelu prawym",
    MIN_ONE_DAY: "Liczba dni musi wynosić co najmniej 1.",
    VALID_NUMBER_WARNING: "Podaj prawidłową liczbę.",
    UI: "User Interface",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Podtalie powinny być początkowo wyświetlane rozszerzone",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Wyłącz to, aby zwinąć zagnieżdżone talie w tej samej karcie. Przydatne, jeśli karty należą do wielu talii w tym samym pliku.",
    ALGORITHM: "Algorytm",
    CHECK_ALGORITHM_WIKI:
        'Aby uzyskać więcej informacji, sprawdź <a href="${algoUrl}">implementację algorytmu</a>.',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Podstawowa łatwość",
    BASE_EASE_DESC: "minimum = 130, preferowana wartość to około 250.",
    BASE_EASE_MIN_WARNING: "Podstawowa łatwość musi wynosić co najmniej 130.",
    LAPSE_INTERVAL_CHANGE: "Zmiana interwału podczas przeglądania fiszki/notatki jako trudne",
    LAPSE_INTERVAL_CHANGE_DESC: "nowyInterwał = staryInterwał * zmianaInterwału / 100.",
    EASY_BONUS: "Bonus za łatwe",
    EASY_BONUS_DESC:
        "Bonus za łatwe pozwala ustawić różnicę w interwałach między odpowiedziami Średnio trudne i Łatwe na fiszce/notatce (minimum = 100%).",
    EASY_BONUS_MIN_WARNING: "Bonus za łatwe musi wynosić co najmniej 100.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Maksymalny interwał w dniach",
    MAX_INTERVAL_DESC: "Pozwala na ustawienie górnego limitu interwału (domyślnie = 100 lat).",
    MAX_INTERVAL_MIN_WARNING: "Maksymalny interwał musi wynosić co najmniej 1 dzień.",
    MAX_LINK_CONTRIB: "Maksymalny wkład łącza",
    MAX_LINK_CONTRIB_DESC:
        "Maksymalny wkład ważonej łatwości połączonych notatek do początkowej łatwości.",
    LOGGING: "Logowanie",
    DISPLAY_SCHEDULING_DEBUG_INFO: "Wyświetl informacje debugowania w konsoli deweloperskiej",
    DISPLAY_PARSER_DEBUG_INFO: "Show the parser's debugging information on the developer console",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Kolejka przeglądu notatek",
    CLOSE: "Zamknij",
    NEW: "Nowe",
    YESTERDAY: "Wczoraj",
    TODAY: "Dzisiaj",
    TOMORROW: "Jutro",

    // stats-modal.tsx
    STATS_TITLE: "Statystyki",
    MONTH: "Miesiąc",
    QUARTER: "Kwartał",
    YEAR: "Rok",
    LIFETIME: "Całe życie",
    FORECAST: "Prognoza",
    FORECAST_DESC: "Liczba kart z terminem w przyszłości",
    SCHEDULED: "Zaplanowane",
    DAYS: "Dni",
    NUMBER_OF_CARDS: "Liczba kart",
    REVIEWS_PER_DAY: "Średnio: ${avg} przeglądów/dzień",
    INTERVALS: "Interwały",
    INTERVALS_DESC: "Opóźnienia przed ponownym pokazaniem przeglądów",
    COUNT: "Liczba",
    INTERVALS_SUMMARY: "Średni interwał: ${avg}, Najdłuższy interwał: ${longest}",
    EASES: "Łatwości",
    EASES_SUMMARY: "Średnia łatwość: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Typy kart",
    CARD_TYPES_DESC: "Obejmuje także ukryte karty, jeśli takie są",
    CARD_TYPE_NEW: "Nowe",
    CARD_TYPE_YOUNG: "Młode",
    CARD_TYPE_MATURE: "Stare",
    CARD_TYPES_SUMMARY: "Łączna liczba kart: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
