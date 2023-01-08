// Deutsch

// Obsidian specific names (folder, note, tag, etc.) are consistent with the german translation:
// https://github.com/obsidianmd/obsidian-translations/blob/master/de.json

export default {
    // flashcard-modal.tsx
    DECKS: "Stapel",
    DUE_CARDS: "Anstehende Karten",
    NEW_CARDS: "Neue Karten",
    TOTAL_CARDS: "Alle Karten",
    BACK: "Back",
    EDIT_CARD: "Edit Card",
    RESET_CARD_PROGRESS: "Kartenfortschritt zurücksetzten",
    HARD: "Schwer",
    GOOD: "Gut",
    EASY: "Einfach",
    SHOW_ANSWER: "Zeige Antwort",
    CARD_PROGRESS_RESET: "Kartenfortschritt wurde zurückgesetzt.",
    SAVE: "Save",
    CANCEL: "Cancel",
    NO_INPUT: "No input provided.",
    CURRENT_EASE_HELP_TEXT: "Current Ease: ",
    CURRENT_INTERVAL_HELP_TEXT: "Current Interval: ",
    CARD_GENERATED_FROM: "Generated from: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Notiz zur Wiederholung öffnen",
    REVIEW_CARDS: "Lernkarten wiederholen",
    REVIEW_EASY_FILE_MENU: "Notiz abschliessen als: Einfach",
    REVIEW_GOOD_FILE_MENU: "Notiz abschliessen als: Gut",
    REVIEW_HARD_FILE_MENU: "Notiz abschliessen als: Schwer",
    REVIEW_NOTE_EASY_CMD: "Notiz abschliessen als: Einfach",
    REVIEW_NOTE_GOOD_CMD: "Notiz abschliessen als: Gut",
    REVIEW_NOTE_HARD_CMD: "Notiz abschliessen als: Schwer",
    REVIEW_ALL_CARDS: "Alle Lernkarten wiederholen",
    CRAM_ALL_CARDS: "Select a deck to cram",
    REVIEW_CARDS_IN_NOTE: "Lernkarten in dieser Notiz wiederholen",
    CRAM_CARDS_IN_NOTE: "Lernkarten in dieser Notiz pauken.",
    VIEW_STATS: "Statistiken anzeigen",
    STATUS_BAR:
        "Wiederholung: ${dueNotesCount} Notiz(en), ${dueFlashcardsCount} Karte(n) anstehend",
    SYNC_TIME_TAKEN: "Sync dauerte ${t}ms",
    NOTE_IN_IGNORED_FOLDER:
        "Notiz befindet sich in einem ausgeschlossenen Ordner (siehe Einstellungen).",
    PLEASE_TAG_NOTE:
        "Bitte die Notiz für Wiederholungen entsprechend taggen (siehe Einstellungen).",
    RESPONSE_RECEIVED: "Antwort erhalten.",
    NO_DECK_EXISTS: "Kein Stapel für ${deckName} gefunden.",
    ALL_CAUGHT_UP: "Yuhu! Alles geschafft! :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} Tag(e)",
    MONTHS_STR_IVL: "${interval} Monat(e)",
    YEARS_STR_IVL: "${interval} Jahr(e)",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}y",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition Plugin - Einstellungen",
    CHECK_WIKI: 'Weitere Informationen gibt es im <a href="${wiki_url}">Wiki</a> (english).',
    FOLDERS_TO_IGNORE: "Ausgeschlossene Ordner",
    FOLDERS_TO_IGNORE_DESC:
        "Mehrere Ordner mit Zeilenumbrüchen getrennt angeben. Bsp. OrdnerA[Zeilenumbruch]OrdnerB/Unterordner",
    FLASHCARDS: "Lernkarten",
    FLASHCARD_EASY_LABEL: "Easy Button Text",
    FLASHCARD_GOOD_LABEL: "Good Button Text",
    FLASHCARD_HARD_LABEL: "Hard Button Text",
    FLASHCARD_EASY_DESC: 'Customize the label for the "Easy" Button',
    FLASHCARD_GOOD_DESC: 'Customize the label for the "Good" Button',
    FLASHCARD_HARD_DESC: 'Customize the label for the "Hard" Button',
    FLASHCARD_TAGS: "Lernkarten Tags",
    FLASHCARD_TAGS_DESC:
        "Mehrere Tags mit Leerzeichen oder Zeilenumbrüchen getrennt angeben. Bsp. #karte #stapel2 #stapel3.",
    CONVERT_FOLDERS_TO_DECKS: "Ordner in Stapel und Substapel umwandeln?",
    CONVERT_FOLDERS_TO_DECKS_DESC: 'Eine Alternative zur oberen "Lernkarten Tags" Option.',
    INLINE_SCHEDULING_COMMENTS:
        "Den Fortschritt in der gleichen Zeile wie die letzte Zeile einer Lernkartei speichern?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Wenn aktiviert, wird der HTML Kommentar die umgebende Liste nicht aufbrechen.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Verwandte Karten auf den nächsten Tag verlegen?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Verwandte Karten sind aus der gleichen Karte generiert worden (z.B. Lückentextkarten oder beidseitige Karten).",
    SHOW_CARD_CONTEXT: "Kontext in den Karten anzeigen?",
    SHOW_CARD_CONTEXT_DESC: "Bsp. Titel > Überschrift 1 > Sektion > ... > Untersektion",
    CARD_MODAL_HEIGHT_PERCENT: "Höhe der Lernkartei in Prozent",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Auf kleinen Bildschirmen (z.B. Smartphones) oder bei sehr grossen Bildern sollte dieser Wert auf 100% gesetzt werden.",
    RESET_DEFAULT: "Standardeinstellung wiederherstellen",
    CARD_MODAL_WIDTH_PERCENT: "Breite einer Lernkarte in Prozent",
    RANDOMIZE_CARD_ORDER: "Während der Wiederhoung die Reihenfolge zufällig mischen?",
    DISABLE_CLOZE_CARDS: "Lückentextkarten (cloze deletions) deaktivieren?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "==Hervorgehobenen== Text in Lückentextkarten umwandeln?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "**Fettgedruckten** Text in Lückentextkarten umwandeln?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES:
        "{{Geschweifte Klammern}} Text in Lückentextkarten umwandeln?",
    INLINE_CARDS_SEPARATOR: "Trennzeichen für einzeilige Lernkarten",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Wenn diese Einstellung geändert wird, dann müssen die entsprechenden Lernkarten manuell angepasst werden.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Trennzeichen für einzeilige beidseitige Lernkarten",
    MULTILINE_CARDS_SEPARATOR: "Trennzeichen für mehrzeilige Lernkarten",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Trennzeichen für mehrzeilige beidseitige Lernkarten",
    NOTES: "Notizen",
    REVIEW_PANE_ON_STARTUP: "Enable note review pane on startup",
    TAGS_TO_REVIEW: "Zu wiederholende Tags",
    TAGS_TO_REVIEW_DESC:
        "Mehrere Tags können mit Leerzeichen oder Zeilenumbrüchen getrennt angegeben werden. Bsp. #karte #tag1 #tag2.",
    OPEN_RANDOM_NOTE: "Zufällige Karten wiederholen",
    OPEN_RANDOM_NOTE_DESC:
        "Wenn dies deaktiviert wird, dann werden die Notizen nach Wichtigkeit wiederholt (PageRank).",
    AUTO_NEXT_NOTE: "Nach einer Wiederholung automatisch die nächste Karte öffnen",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "Optionen zur Wiederholung im Menü einer Datei deaktivieren. Bsp. Wiederholen: Einfach Gut Schwer",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Nach dem Deaktivieren können die Tastenkürzel zur Wiederholung verwendet werden. Obsidian muss nach einer Änderung neu geladen weren.",
    MAX_N_DAYS_REVIEW_QUEUE:
        "Maximale Anzahl anstehender Notizen, die im rechten Fensterbereich angezeigt werden",
    MIN_ONE_DAY: "Anzahl der Tage muss mindestens 1 sein.",
    VALID_NUMBER_WARNING: "Bitte eine gültige Zahl eingeben.",
    UI_PREFERENCES: "Einstellungen der Benutzeroberfläche",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Deckbäume sollten anfänglich erweitert angezeigt werden",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Deaktivieren Sie dies, um verschachtelte Decks in derselben Karte zu reduzieren. Nützlich, wenn Sie Karten haben, die zu vielen Decks in derselben Datei gehören.",
    ALGORITHM: "Algorithmus",
    CHECK_ALGORITHM_WIKI:
        'Weiterführende Informationen: <a href="${algo_url}">Implementierung des Algorithmus</a> (english).',
    BASE_EASE: "Basis der Einfachheit",
    BASE_EASE_DESC: "Minimum ist 130. Empfohlen wird ca. 250.",
    BASE_EASE_MIN_WARNING: "Basis der Einfachheit muss mindestens 130 sein.",
    LAPSE_INTERVAL_CHANGE:
        "Anpassungsfaktor des Intervalls wenn eine Notiz / Karte 'Schwer' abgeschlossen wird",
    LAPSE_INTERVAL_CHANGE_DESC: "neuesIntervall = altesIntervall * anpassungsfaktor / 100.",
    EASY_BONUS: "Einfachheit-Bonus",
    EASY_BONUS_DESC:
        "Der Einfachheit-Bonus gibt an um welchen Faktor (in Prozent) das Intervall länger sein soll, wenn eine Notiz / Karte 'Einfach' statt 'Gut' abgeschlossen wird. Minimum ist 100%.",
    EASY_BONUS_MIN_WARNING: "Der Einfachheit-Bonus muss mindestens 100 sein.",
    MAX_INTERVAL: "Maximales Intervall",
    MAX_INTERVAL_DESC:
        "Das maximale Intervall (in Tagen) für Wiederholungen. Standard sind 100 Jahre.",
    MAX_INTERVAL_MIN_WARNING: "Das maximale Interall muss mindestens ein Tag sein.",
    MAX_LINK_CONTRIB: "Maximaler Einfluss von Links",
    MAX_LINK_CONTRIB_DESC:
        "Maximaler Einfluss der Einfachheiten verlinkter Notizen zur gewichteten initialen Einfachheit einer neuen Lernkarte.",
    LOGGING: "Logging",
    DISPLAY_DEBUG_INFO: "Informationen zum Debugging in der Entwicklerkonsole anzeigen?",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Anstehende Notizen zur Wiederholung",
    CLOSE: "Schliessen",
    NEW: "Neu",
    YESTERDAY: "Gestern",
    TODAY: "Heute",
    TOMORROW: "Morgen",

    // stats-modal.tsx
    STATS_TITLE: "Statistiken",
    MONTH: "Month",
    QUARTER: "Quarter",
    YEAR: "Year",
    LIFETIME: "Lifetime",
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
    EASES: "Einfachheit",
    EASES_SUMMARY: "Durchschnittliche Einfachheit: ${avgEase}",
    CARD_TYPES: "Kategorisierung",
    CARD_TYPES_DESC: "Verlegte Karten eingeschlossen",
    CARD_TYPE_NEW: "Neu",
    CARD_TYPE_YOUNG: "Jung",
    CARD_TYPE_MATURE: "Ausgereift",
    CARD_TYPES_SUMMARY: "Insgesamt ${totalCardsCount} Karten",
};
