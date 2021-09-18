// Deutsch

/*
Deck = Stapel
due = anstehend / fällig ?
Card = Karte
review = Wiederholung
interval = Intervall
Flashcard = Lernkarte / (Karte / Lernkartei)
ease = Einfachheit(-sfaktor)
reversed flashcards = beidseitige Lernkarten
*/

// Obsidian specific names (folder, note, tag, etc.) are consistent with the german Obsidian.md translation:
// https://github.com/obsidianmd/obsidian-translations/blob/master/de.json

export default {
    // flashcard-modal.ts
    DECKS: "Stapeln",
    DUE_CARDS: "Anstehende Karten",
    NEW_CARDS: "Neue Karten",
    TOTAL_CARDS: "Alle Karten",
    EDIT_LATER: "Später bearbeiten",
    RESET_CARD_PROGRESS: "Kartenfortschritt zurücksetzten",
    HARD: "Schwer",
    GOOD: "Gut",
    EASY: "Einfach",
    SHOW_ANSWER: "Zeige Antwort",
    CARD_PROGRESS_RESET: "Kartenfortschritt wurde zurückgesetzt.",

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
    NO_DECK_EXISTS: "Kein Stapel für ${deckName} gefunden.",
    ALL_CAUGHT_UP: "You're all caught up now :D.", // todo

    // scheduling.ts
    DAYS_STR_IVL: "${interval} Tag(e)", // todo
    MONTHS_STR_IVL: "${interval} Monat(e)", // todo
    YEARS_STR_IVL: "${interval} Jahr(e)", // todo

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition Plugin - Einstellungen",
    CHECK_WIKI: 'Weitere Informationen gibt es im <a href="${wiki_url}">Wiki (English)</a>.',
    FOLDERS_TO_IGNORE: "Ausgeschlossene Ordner", // todo
    FOLDERS_TO_IGNORE_DESC: "Mehrere Ordner mit Zeilenumbrüchen getrennt angeben. Bsp. OrdnerA OrdnerB/Unterordner",
    FLASHCARDS: "Lernkarten",
    FLASHCARD_TAGS: "Lernkarten Tags",
    FLASHCARD_TAGS_DESC:
            "Mehrere Tags mit Leerzeichen oder Zeilenumbrüchen getrennt angeben. Bsp. #lernkarte #stapel2 #stapel3.",
    CONVERT_FOLDERS_TO_DECKS: "Ordner in Stapeln und Substapeln umwandeln?",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Eine Alternative zur oberen \"Lernkarten Tags\" Option.",
    INLINE_SCHEDULING_COMMENTS:
            "Soll der Fortschritt in der gleichen Zeile gespeichert werden wie die letzte Zeile einer Lernkartei?",
    INLINE_SCHEDULING_COMMENTS_DESC:
            "Wenn aktiviert werden der HTML Kommentar die umgebende Liste nicht aufbrechen.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Bury sibling cards until the next day?", // todo
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
            "Siblings are cards generated from the same card text i.e. cloze deletions", // todo
    SHOW_CARD_CONTEXT: "Show context in cards?", // todo
    SHOW_CARD_CONTEXT_DESC: "i.e. Title > Heading 1 > Subheading > ... > Subheading", // todo
    CARD_MODAL_HEIGHT_PERCENT: "Flashcard Height Percentage", // todo
    CARD_MODAL_SIZE_PERCENT_DESC:
            "Should be set to 100% on mobile or if you have very large images", // todo
    RESET_DEFAULT: "Standardeinstellung wiederherstellen", // todo
    CARD_MODAL_WIDTH_PERCENT: "Flashcard Width Percentage", // todo
    FILENAME_OR_OPEN_FILE: "Show file name instead of 'Open file' in flashcard review?", // todo
    RANDOMIZE_CARD_ORDER: "Randomize card order during review?", // todo
    DISABLE_CLOZE_CARDS: "Cloze Karten deaktivieren?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "==Hervorgehobenen== Text in cloze Karten umwandeln?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "**Fettgedruckten** Text in cloze Karten umwandeln?",
    INLINE_CARDS_SEPARATOR: "Trennzeichen für einzeilige Lernkarten",
    FIX_SEPARATORS_MANUALLY_WARNING:
            "Wenn diese Einstellung geändert wird, dann müssen die entsprechenden Lernkarten manuell angepasst werden angepasst werden.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Trennzeichen für einzeilige beidseitige Lernkarten",
    MULTILINE_CARDS_SEPARATOR: "Trennzeichen für mehrzeilige Lernkarten",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Trennzeichen für mehrzeilige beidseitige Lernkarten",
    NOTES: "Notizen", // todo
    TAGS_TO_REVIEW: "Zu wiederholende Tags",
    TAGS_TO_REVIEW_DESC: "Mehrere Tags können mit Leerzeichen oder Zeilenumbrüchen getrennt angegeben werden. Bsp. #prüfen #tag1 #tag2.",
    OPEN_RANDOM_NOTE: "Zufällige Karten wiederholen",
    OPEN_RANDOM_NOTE_DESC: "Wenn dies deaktiviert wird, dann werden die Notizen nach Wichtigkeit wiederholt (PageRank).",
    AUTO_NEXT_NOTE: "Nach einer Wiederholung automatisch die nächste Karte öffnen",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
            "Disable review options in the file menu i.e. Review: Easy Good Hard", // todo
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
            "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.", // todo
    MAX_N_DAYS_REVIEW_QUEUE: "Maximum number of days to display on right panel", // todo
    MIN_ONE_DAY: "The number of days must be at least 1.", // todo
    VALID_NUMBER_WARNING: "Bitte eine gültige Zahl eingeben.", // todo
    ALGORITHM: "Algorithmus",
    CHECK_ALGORITHM_WIKI:
            'Weiterführende Informationen: <a href="${algo_url}">Implementierung des Algorithmus (English)</a>.',
    BASE_EASE: "Base ease", // todo
    BASE_EASE_DESC: "minimum = 130, preferrably approximately 250.", // todo
    BASE_EASE_MIN_WARNING: "The base ease must be at least 130.", // todo
    LAPSE_INTERVAL_CHANGE: "Anpassungsfaktor des Intervalls wenn eine Notiz / Karte 'Schwer' abgeschlossen wird", // todo
    LAPSE_INTERVAL_CHANGE_DESC: "neuesIntervall = altesIntervall * anpassungsfaktor / 100.", // todo
    EASY_BONUS: "Einfachheit-Bonus",
    EASY_BONUS_DESC:
            "Der Einfachheit-Bonus gibt an um welchen Faktor (in Prozent) das Intervall länger sein soll, wenn eine Notiz / Karte 'Einfach' statt 'Gut' abgeschlossen wird. Minimum ist 100%.",
    EASY_BONUS_MIN_WARNING: "Der Einfachheit-Bonus muss mindestens 100 sein.",
    MAX_INTERVAL: "Maximales Intervall",
    MAX_INTERVAL_DESC: "Das maximale Intervall (in Tagen) für Wiederholungen. Standard sind 100 Jahre.",
    MAX_INTERVAL_MIN_WARNING: "Das maximale Interall muss mindestens ein Tag sein.",
    MAX_LINK_CONTRIB: "Maximum link contribution", // todo
    MAX_LINK_CONTRIB_DESC:
            "Maximum contribution of the weighted ease of linked notes to the initial ease.", // todo
    LOGGING: "Logging",
    DISPLAY_DEBUG_INFO: "Informationen zum Debugging in der Entwicklerkonsole anzeigen?",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Notes Review Queue", // todo
    CLOSE: "Schliessen",
    NEW: "Neu",
    YESTERDAY: "Gestern",
    TODAY: "Heute",
    TOMORROW: "Morgen",

    // stats-modal.ts
    STATS_TITLE: "Statistiken",
    OBSIDIAN_CHARTS_REQUIRED: "Hinweis: Das Obsidian Charts plugin wird benötigt um die Statistiken anzuzeigen.",
    FORECAST: "Prognose",
    FORECAST_DESC: "Anzahl der künftig anstehenden Karten",
    SCHEDULED: "Anstehend",
    DAYS: "Tage",
    NUMBER_OF_CARDS: "Anzahl der Karten",
    REVIEWS_PER_DAY: "Durchschnitt: ${avg} Wiederholungen/Tag",
    INTERVALS: "Intervalle",
    INTERVALS_DESC: "Intervalle bis Wiederholungen anstehen",
    COUNT: "Anzahl",
    INTERVALS_SUMMARY: "Durchschnittliches Intervall: ${avg}, Längstes Intervall: ${longest}",
    EASES: "Einfachheiten",
    EASES_SUMMARY: "Durchschnittliche Einfachheit: ${avgEase}",
    CARD_TYPES: "Card Types", // todo
    CARD_TYPES_DESC: "This includes buried cards as well, if any", // todo
    CARD_TYPE_NEW: "New", // todo
    CARD_TYPE_YOUNG: "Young", // todo
    CARD_TYPE_MATURE: "Mature", // todo
    CARD_TYPES_SUMMARY: "Total cards: ${totalCardsCount}", // todo
};
