// English

export default {
    // flashcard-modal.tsx
    DECKS: "Decks",
    DUE_CARDS: "Due Cards",
    NEW_CARDS: "New Cards",
    TOTAL_CARDS: "Total Cards",
    BACK: "Back",
    SKIP: "Skip",
    EDIT_CARD: "Edit Card",
    RESET_CARD_PROGRESS: "Reset card's progress",
    HARD: "Hard",
    GOOD: "Good",
    EASY: "Easy",
    SHOW_ANSWER: "Show Answer",
    CARD_PROGRESS_RESET: "Card's progress has been reset.",
    SAVE: "Save",
    CANCEL: "Cancel",
    NO_INPUT: "No input provided.",
    CURRENT_EASE_HELP_TEXT: "Current Ease: ",
    CURRENT_INTERVAL_HELP_TEXT: "Current Interval: ",
    CARD_GENERATED_FROM: "Generated from: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Open a note for review",
    REVIEW_CARDS: "Review flashcards",
    REVIEW_DIFFICULTY_FILE_MENU: "Review: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Review note as ${difficulty}",
    CRAM_ALL_CARDS: "Select a deck to cram",
    REVIEW_ALL_CARDS: "Review flashcards from all notes",
    REVIEW_CARDS_IN_NOTE: "Review flashcards in this note",
    CRAM_CARDS_IN_NOTE: "Cram flashcards in this note",
    VIEW_STATS: "View statistics",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR: "Review: ${dueNotesCount} note(s), ${dueFlashcardsCount} card(s) due",
    SYNC_TIME_TAKEN: "Sync took ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "Note is saved under ignored folder (check settings).",
    PLEASE_TAG_NOTE: "Please tag the note appropriately for reviewing (in settings).",
    RESPONSE_RECEIVED: "Response received.",
    NO_DECK_EXISTS: "No deck exists for ${deckName}",
    ALL_CAUGHT_UP: "You're all caught up now :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} day(s)",
    MONTHS_STR_IVL: "${interval} month(s)",
    YEARS_STR_IVL: "${interval} year(s)",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}y",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition - Settings",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'For more information, check the <a href="${wiki_url}">wiki</a>.',
    GITHUB_DISCUSSIONS:
        'Visit the <a href="${discussions_url}">discussions</a> section for Q&A help, feedback, and general discussion.',
    GITHUB_ISSUES:
        'Raise an issue <a href="${issues_url}">here</a> if you have a feature request or a bug-report.',
    GITHUB_SOURCE_CODE:
        'Project source code available on <a href="${github_project_url}">GitHub</a>',
    CODE_CONTRIBUTION_INFO:
        'Information on <a href="${code_contribution_url}">code contributions</a>',
    TRANSLATION_CONTRIBUTION_INFO:
        'Information on <a href="${translation_contribution_url}">translating the plugin</a> to your language',
    PROJECT_CONTRIBUTIONS:
        'Raise an issue <a href="${issues_url}">here</a> if you have a feature request or a bug-report',
    FOLDERS_TO_IGNORE: "Folders to ignore",
    FOLDERS_TO_IGNORE_DESC: `Enter folder paths separated by newlines e.g. Templates Meta/Scripts.
Note that this setting is common to both Flashcards and Notes.`,
    FLASHCARDS: "Flashcards",
    FLASHCARD_EASY_LABEL: "Easy Button Text",
    FLASHCARD_GOOD_LABEL: "Good Button Text",
    FLASHCARD_HARD_LABEL: "Hard Button Text",
    FLASHCARD_EASY_DESC: 'Customize the label for the "Easy" Button',
    FLASHCARD_GOOD_DESC: 'Customize the label for the "Good" Button',
    FLASHCARD_HARD_DESC: 'Customize the label for the "Hard" Button',
    FLASHCARD_TAGS: "Flashcard tags",
    FLASHCARD_TAGS_DESC:
        "Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3.",
    CONVERT_FOLDERS_TO_DECKS: "Convert folders to decks and subdecks?",
    CONVERT_FOLDERS_TO_DECKS_DESC: "This is an alternative to the Flashcard tags option above.",
    INLINE_SCHEDULING_COMMENTS:
        "Save scheduling comment on the same line as the flashcard's last line?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Turning this on will make the HTML comments not break list formatting.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Bury sibling cards until the next day?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Siblings are cards generated from the same card text i.e. cloze deletions",
    SHOW_CARD_CONTEXT: "Show context in cards?",
    SHOW_CARD_CONTEXT_DESC: "i.e. Title > Heading 1 > Subheading > ... > Subheading",
    CARD_MODAL_HEIGHT_PERCENT: "Flashcard Height Percentage",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Should be set to 100% on mobile or if you have very large images",
    RESET_DEFAULT: "Reset to default",
    CARD_MODAL_WIDTH_PERCENT: "Flashcard Width Percentage",
    RANDOMIZE_CARD_ORDER: "Randomize card order during review?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Order cards in a deck are displayed during review",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Sequentially within a deck (All new cards first)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL: "Sequentially within a deck (All due cards first)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Randomly within a deck (All new cards first)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "Randomly within a deck (All due cards first)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Random card from random deck",
    REVIEW_DECK_ORDER: "Order decks are displayed during review",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Sequentially (once all cards in previous deck reviewed)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Randomly (once all cards in previous deck reviewed)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Random card from random deck",
    DISABLE_CLOZE_CARDS: "Disable cloze cards?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Convert ==hightlights== to clozes?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "Convert **bolded text** to clozes?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Convert {{curly brackets}} to clozes?",
    INLINE_CARDS_SEPARATOR: "Separator for inline flashcards",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Note that after changing this you have to manually edit any flashcards you already have.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Separator for inline reversed flashcards",
    MULTILINE_CARDS_SEPARATOR: "Separator for multiline flashcards",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Separator for multiline reversed flashcards",
    MULTILINE_CARDS_END_MARKER: "Characters denoting the end of clozes and multiline flashcards",
    NOTES: "Notes",
    REVIEW_PANE_ON_STARTUP: "Enable note review pane on startup",
    TAGS_TO_REVIEW: "Tags to review",
    TAGS_TO_REVIEW_DESC: "Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Open a random note for review",
    OPEN_RANDOM_NOTE_DESC: "When you turn this off, notes are ordered by importance (PageRank).",
    AUTO_NEXT_NOTE: "Open next note automatically after a review",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "Disable review options in the file menu i.e. Review: Easy Good Hard",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.",
    MAX_N_DAYS_REVIEW_QUEUE: "Maximum number of days to display on right panel",
    MIN_ONE_DAY: "The number of days must be at least 1.",
    VALID_NUMBER_WARNING: "Please provide a valid number.",
    UI_PREFERENCES: "UI Preferences",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Deck trees should be initially displayed as expanded",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Turn this off to collapse nested decks in the same card. Useful if you have cards which belong to many decks in the same file.",
    ALGORITHM: "Algorithm",
    CHECK_ALGORITHM_WIKI:
        'For more information, check the <a href="${algo_url}">algorithm implementation</a>.',
    BASE_EASE: "Base ease",
    BASE_EASE_DESC: "minimum = 130, preferrably approximately 250.",
    BASE_EASE_MIN_WARNING: "The base ease must be at least 130.",
    LAPSE_INTERVAL_CHANGE: "Interval change when you review a flashcard/note as hard",
    LAPSE_INTERVAL_CHANGE_DESC: "newInterval = oldInterval * intervalChange / 100.",
    EASY_BONUS: "Easy Bonus",
    EASY_BONUS_DESC:
        "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%).",
    EASY_BONUS_MIN_WARNING: "The easy bonus must be at least 100.",
    MAX_INTERVAL: "Maximum interval in days",
    MAX_INTERVAL_DESC: "Allows you to place an upper limit on the interval (default = 100 years).",
    MAX_INTERVAL_MIN_WARNING: "The maximum interval must be at least 1 day.",
    MAX_LINK_CONTRIB: "Maximum link contribution",
    MAX_LINK_CONTRIB_DESC:
        "Maximum contribution of the weighted ease of linked notes to the initial ease.",
    LOGGING: "Logging",
    DISPLAY_DEBUG_INFO: "Display debugging information on the developer console?",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Notes Review Queue",
    CLOSE: "Close",
    NEW: "New",
    YESTERDAY: "Yesterday",
    TODAY: "Today",
    TOMORROW: "Tomorrow",

    // stats-modal.tsx
    STATS_TITLE: "Statistics",
    MONTH: "Month",
    QUARTER: "Quarter",
    YEAR: "Year",
    LIFETIME: "Lifetime",
    FORECAST: "Forecast",
    FORECAST_DESC: "The number of cards due in the future",
    SCHEDULED: "Scheduled",
    DAYS: "Days",
    NUMBER_OF_CARDS: "Number of cards",
    REVIEWS_PER_DAY: "Average: ${avg} reviews/day",
    INTERVALS: "Intervals",
    INTERVALS_DESC: "Delays until reviews are shown again",
    COUNT: "Count",
    INTERVALS_SUMMARY: "Average interval: ${avg}, Longest interval: ${longest}",
    EASES: "Eases",
    EASES_SUMMARY: "Average ease: ${avgEase}",
    CARD_TYPES: "Card Types",
    CARD_TYPES_DESC: "This includes buried cards as well, if any",
    CARD_TYPE_NEW: "New",
    CARD_TYPE_YOUNG: "Young",
    CARD_TYPE_MATURE: "Mature",
    CARD_TYPES_SUMMARY: "Total cards: ${totalCardsCount}",
};
