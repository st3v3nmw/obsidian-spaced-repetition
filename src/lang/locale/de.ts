// Deutsch

export default {
    // flashcard-modal.ts
    DECKS: "Decks", // todo
    DUE_CARDS: "Due Cards", // todo
    NEW_CARDS: "New Cards", // todo
    TOTAL_CARDS: "Total Cards", // todo
    EDIT_LATER: "Edit Later", // todo
    RESET_CARD_PROGRESS: "Reset card's progress", // todo
    HARD: "Hard", // todo
    GOOD: "Good", // todo
    EASY: "Easy", // todo
    SHOW_ANSWER: "Show Answer", // todo
    CARD_PROGRESS_RESET: "Card's progress has been reset.", // todo

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Open a note for review", // todo
    REVIEW_CARDS: "Review flashcards", // todo
    REVIEW_EASY_FILE_MENU: "Review: Easy", // todo
    REVIEW_GOOD_FILE_MENU: "Review: Good", // todo
    REVIEW_HARD_FILE_MENU: "Review: Hard", // todo
    REVIEW_NOTE_EASY_CMD: "Review note as easy", // todo
    REVIEW_NOTE_GOOD_CMD: "Review note as good", // todo
    REVIEW_NOTE_HARD_CMD: "Review note as hard", // todo
    REVIEW_CARDS_IN_NOTE: "Review flashcards in this note", // todo
    CRAM_CARDS_IN_NOTE: "Cram flashcards in this note.", // todo
    REVIEW_ALL_CARDS: "Review flashcards from all notes", // todo
    VIEW_STATS: "View statistics", // todo
    STATUS_BAR: "Review: ${dueNotesCount} notes(s), ${dueFlashcardsCount} card(s) due", // todo
    SYNC_TIME_TAKEN: "Sync took ${t}ms", // todo
    NOTE_IN_IGNORED_FOLDER: "Note is saved under ignored folder (check settings).", // todo
    PLEASE_TAG_NOTE: "Please tag the note appropriately for reviewing (in settings).", // todo
    RESPONSE_RECEIVED: "Response received.", // todo
    NO_DECK_EXISTS: "No deck exists for ${deckName}", // todo
    ALL_CAUGHT_UP: "You're all caught up now :D.", // todo

    // scheduling.ts
    DAYS_STR_IVL: "${interval} day(s)", // todo
    MONTHS_STR_IVL: "${interval} month(s)", // todo
    YEARS_STR_IVL: "${interval} year(s)", // todo

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition Plugin - Settings", // todo
    CHECK_WIKI: 'For more information, check the <a href="${wiki_url}">wiki</a>.',
    FOLDERS_TO_IGNORE: "Folders to ignore", // todo
    FOLDERS_TO_IGNORE_DESC: "Enter folder paths separated by newlines i.e. Templates Meta/Scripts", // todo
    FLASHCARDS: "Flashcards", // todo
    FLASHCARD_TAGS: "Flashcard tags", // todo
    FLASHCARD_TAGS_DESC:
            "Enter tags separated by spaces or newlines i.e. #flashcards #deck2 #deck3.", // todo
    CONVERT_FOLDERS_TO_DECKS: "Convert folders to decks and subdecks?", // todo
    CONVERT_FOLDERS_TO_DECKS_DESC: "This is an alternative to the Flashcard tags option above.", // todo
    INLINE_SCHEDULING_COMMENTS:
            "Save scheduling comment on the same line as the flashcard's last line?", // todo
    INLINE_SCHEDULING_COMMENTS_DESC:
            "Turning this on will make the HTML comments not break list formatting.", // todo
    BURY_SIBLINGS_TILL_NEXT_DAY: "Bury sibling cards until the next day?", // todo
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
            "Siblings are cards generated from the same card text i.e. cloze deletions", // todo
    SHOW_CARD_CONTEXT: "Show context in cards?", // todo
    SHOW_CARD_CONTEXT_DESC: "i.e. Title > Heading 1 > Subheading > ... > Subheading", // todo
    CARD_MODAL_HEIGHT_PERCENT: "Flashcard Height Percentage", // todo
    CARD_MODAL_SIZE_PERCENT_DESC:
            "Should be set to 100% on mobile or if you have very large images", // todo
    RESET_DEFAULT: "Reset to default", // todo
    CARD_MODAL_WIDTH_PERCENT: "Flashcard Width Percentage", // todo
    FILENAME_OR_OPEN_FILE: "Show file name instead of 'Open file' in flashcard review?", // todo
    RANDOMIZE_CARD_ORDER: "Randomize card order during review?", // todo
    DISABLE_CLOZE_CARDS: "Disable cloze cards?", // todo
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Convert ==hightlights== to clozes?", // todo
    CONVERT_BOLD_TEXT_TO_CLOZES: "Convert **bolded text** to clozes?", // todo
    INLINE_CARDS_SEPARATOR: "Separator for inline flashcards", // todo
    FIX_SEPARATORS_MANUALLY_WARNING:
            "Note that after changing this you have to manually edit any flashcards you already have.", // todo
    INLINE_REVERSED_CARDS_SEPARATOR: "Separator for inline reversed flashcards", // todo
    MULTILINE_CARDS_SEPARATOR: "Separator for multiline flashcards", // todo
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Separator for multiline reversed flashcards", // todo
    NOTES: "Notes", // todo
    TAGS_TO_REVIEW: "Tags to review", // todo
    TAGS_TO_REVIEW_DESC: "Enter tags separated by spaces or newlines i.e. #review #tag2 #tag3.", // todo
    OPEN_RANDOM_NOTE: "Open a random note for review", // todo
    OPEN_RANDOM_NOTE_DESC: "When you turn this off, notes are ordered by importance (PageRank).", // todo
    AUTO_NEXT_NOTE: "Open next note automatically after a review", // todo
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
            "Disable review options in the file menu i.e. Review: Easy Good Hard", // todo
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
            "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.", // todo
    MAX_N_DAYS_REVIEW_QUEUE: "Maximum number of days to display on right panel", // todo
    MIN_ONE_DAY: "The number of days must be at least 1.", // todo
    VALID_NUMBER_WARNING: "Please provide a valid number.", // todo
    ALGORITHM: "Algorithm", // todo
    CHECK_ALGORITHM_WIKI:
            'For more information, check the <a href="${algo_url}">algorithm implementation</a>.',
    BASE_EASE: "Base ease", // todo
    BASE_EASE_DESC: "minimum = 130, preferrably approximately 250.", // todo
    BASE_EASE_MIN_WARNING: "The base ease must be at least 130.", // todo
    LAPSE_INTERVAL_CHANGE: "Interval change when you review a flashcard/note as hard", // todo
    LAPSE_INTERVAL_CHANGE_DESC: "newInterval = oldInterval * intervalChange / 100.", // todo
    EASY_BONUS: "Easy Bonus", // todo
    EASY_BONUS_DESC:
            "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%).", // todo
    EASY_BONUS_MIN_WARNING: "The easy bonus must be at least 100.", // todo
    MAX_INTERVAL: "Maximum Interval", // todo
    MAX_INTERVAL_DESC: "Allows you to place an upper limit on the interval (default = 100 years).", // todo
    MAX_INTERVAL_MIN_WARNING: "The maximum interval must be at least 1 day.", // todo
    MAX_LINK_CONTRIB: "Maximum link contribution", // todo
    MAX_LINK_CONTRIB_DESC:
            "Maximum contribution of the weighted ease of linked notes to the initial ease.", // todo
    LOGGING: "Logging", // todo
    DISPLAY_DEBUG_INFO: "Display debugging information on the developer console?", // todo

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Notes Review Queue", // todo
    CLOSE: "Close", // todo
    NEW: "New", // todo
    YESTERDAY: "Yesterday", // todo
    TODAY: "Today", // todo
    TOMORROW: "Tomorrow", // todo

    // stats-modal.ts
    STATS_TITLE: "Statistics", // todo
    OBSIDIAN_CHARTS_REQUIRED: "Note that this requires the Obsidian Charts plugin to work", // todo
    FORECAST: "Forecast", // todo
    FORECAST_DESC: "The number of cards due in the future", // todo
    SCHEDULED: "Scheduled", // todo
    DAYS: "Days", // todo
    NUMBER_OF_CARDS: "Number of cards", // todo
    REVIEWS_PER_DAY: "Average: ${avg} reviews/day", // todo
    INTERVALS: "Intervals", // todo
    INTERVALS_DESC: "Delays until reviews are shown again", // todo
    COUNT: "Count", // todo
    INTERVALS_SUMMARY: "Average interval: ${avg}, Longest interval: ${longest}", // todo
    EASES: "Eases", // todo
    EASES_SUMMARY: "Average ease: ${avgEase}", // todo
    CARD_TYPES: "Card Types", // todo
    CARD_TYPES_DESC: "This includes buried cards as well, if any", // todo
    CARD_TYPES_SUMMARY: "Total cards: ${totalCardsCount}", // todo
};
