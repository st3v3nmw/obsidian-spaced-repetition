// Italiano

export default {
    // flashcard-modal.tsx
    DECKS: "Mazzi",
    DUE_CARDS: "Schede da fare",
    NEW_CARDS: "Schede nuove",
    TOTAL_CARDS: "Schede totali",
    BACK: "Indietro",
    SKIP: "Salta",
    EDIT_CARD: "Modifica scheda",
    RESET_CARD_PROGRESS: "Ripristina i progressi della scheda",
    HARD: "Difficile",
    GOOD: "Buono",
    EASY: "Facile",
    SHOW_ANSWER: "Mostra risposta",
    CARD_PROGRESS_RESET: "I progressi della scheda sono stati ripristinati",
    SAVE: "Salva",
    CANCEL: "Cancella",
    NO_INPUT: "Non è stato provvisto alcun input",
    CURRENT_EASE_HELP_TEXT: "Difficoltà attuale: ",
    CURRENT_INTERVAL_HELP_TEXT: "Intervallo attuale: ",
    CARD_GENERATED_FROM: "Generato da: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Apri una nota per rivisita",
    REVIEW_CARDS: "Rivisita schede",
    REVIEW_DIFFICULTY_FILE_MENU: "Rivisita: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Revisita note come ${difficulty}",
    CRAM_ALL_CARDS: "Seleziona un mazzo da memorizzare",
    REVIEW_ALL_CARDS: "Seleziona schede da rivedere",
    REVIEW_CARDS_IN_NOTE: "Rivedi schede in questa nota",
    CRAM_CARDS_IN_NOTE: "Memorizza schede in questa nota",
    VIEW_STATS: "Vedi statistiche",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR: "Da rivedere: ${dueNotesCount} scheda/e, ${dueFlashcardsCount} schede in ritardo",
    SYNC_TIME_TAKEN: "Sincronizzato in ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "La nota è salvata in una cartella ignorata (rivedi le impostazioni).",
    PLEASE_TAG_NOTE:
        "Per favore etichetta la nota appropriatamente per la revisione (nelle impostazioni).",
    RESPONSE_RECEIVED: "Risposta ricevuta.",
    NO_DECK_EXISTS: "Non esistono mazzi per ${deckName}",
    ALL_CAUGHT_UP: "Sei al passo! :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} giorno/i",
    MONTHS_STR_IVL: "${interval} mese/i",
    YEARS_STR_IVL: "${interval} anno/i",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}y",

    // settings.ts
    SETTINGS_HEADER: "Plugin per ripetizione spaziata",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'Per maggiori informazioni, rivolgersi alla <a href="${wikiUrl}">wiki</a>.',
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
    FOLDERS_TO_IGNORE: "Cartelle da ignorare",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Schede",
    FLASHCARD_EASY_LABEL: "Testo del bottone facile",
    FLASHCARD_GOOD_LABEL: "Testo del bottone buono",
    FLASHCARD_HARD_LABEL: "Testo del bottone difficile",
    FLASHCARD_EASY_DESC: 'Personalizza il testo per il pulsante "Facile"',
    FLASHCARD_GOOD_DESC: 'Personalizza il testo per il pulsante "Buono"',
    FLASHCARD_HARD_DESC: 'Personalizza il testo per il pulsante "Difficile"',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Etichette delle schede",
    FLASHCARD_TAGS_DESC:
        "Inserire etichette separate da spazi o a capi, per esempio #flashcards #deck2 #deck3.",
    CONVERT_FOLDERS_TO_DECKS: "Trasformare cartelle in mazzi e sotto-mazzi?",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "Questa è un'alternativa all'opzione delle etichette delle schede sopra.",
    INLINE_SCHEDULING_COMMENTS:
        "Salvare il commento per l'orario sulla stessa linea dell'ultimna linea della scheda?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Attivando quest'impostazione farò sì che i commento HTML non rompino la formattazione delle liste.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Sotterrare schede sorelle fino al giorno dopo?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Le schede sorelle sono schede generate dallo stesso testo della scheda, per esempio i.e. cloze deletions",
    SHOW_CARD_CONTEXT: "Mostrare contesto nelle schede?",
    SHOW_CARD_CONTEXT_DESC:
        "per esempio, Titolo > Intestazione 1 > Sottotitolo 1 > ... > Sottotitolo",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Percentuale altezza schede",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Dovrebbe essere 100% se sei su telefono o se hai immagini molto grandi",
    RESET_DEFAULT: "Reimposta alle impostazioni iniziali",
    CARD_MODAL_WIDTH_PERCENT: "Percentuale di larghezza delle schede",
    RANDOMIZE_CARD_ORDER: "Rendere casuale l'ordine delle schede durante la revisione?",
    REVIEW_CARD_ORDER_WITHIN_DECK:
        "L'ordine in cui le schede saranno visualizzate all'interno del mazzo",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Sequenzialmente dentro il mazzo (prima schede nuove)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Sequenzialmente dentro il mazzo (prima schede in ritardo)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "A caso dentro il mazzo (prima schede nuove)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "A caso dentro il mazzo (prima schede in ritardo)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Scheda a caso da mazzo a caso",
    REVIEW_DECK_ORDER: "L'ordine in cui i mazzi vengono mostrati durante la revisione",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Sequenzialmente (quando le schede nel mazzo precedente saranno state riviste)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "A caso (quando le schede nel mazzo precedente saranno state riviste)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Scheda a caso da mazzo a caso",
    DISABLE_CLOZE_CARDS: "Disabilita schede con spazi da riempire?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Convertire ==testo evidenziato== in spazi da riempire?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Aggiungi/rimuovi <code>${defaultPattern}</code> dai tuoi "Modelli per spazi da riempire"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Convertire **testo in grassetto** in spazi da riempire",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Aggiungi/rimuovi <code>${defaultPattern}</code> dai tuoi "Modelli per spazi da riempire"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Convertire {{parentesi graffe}} in spazi da riempire?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Aggiungi/rimuovi <code>${defaultPattern}</code> dai tuoi "Modelli per spazi da riempire"',
    CLOZE_PATTERNS: "Modelli di spazi da riempire",
    CLOZE_PATTERNS_DESC:
        'Inserisci i modelli di spazi da riempire separati da a capo. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Separatore per schede sulla stessa riga",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Si avvisa che dopo aver cambiato questo dovrai manualmente modificare le schede che hai già.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Separatore per schede all'incontrario sulla stessa riga",
    MULTILINE_CARDS_SEPARATOR: "Separatore per schede su più righe",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Separatore per schede all'incontrario su più righe",
    MULTILINE_CARDS_END_MARKER:
        "Caratteri che denotano la fine di carte con spazi da riempiere e carte multilinea",
    NOTES: "Note",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Abilita il pannello di revisione note all'avvio",
    TAGS_TO_REVIEW: "Etichette da rivedere",
    TAGS_TO_REVIEW_DESC:
        "Inserisci le etichette separate da spazi o a capi, tipo #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Apri una nota a caso per revisione",
    OPEN_RANDOM_NOTE_DESC:
        "Quando lo disabiliti, le note saranno ordinate per importanza (PageRank).",
    AUTO_NEXT_NOTE: "Apri la prossima nota automaticamente dopo la revisione",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Abilita le opzioni di revisione nel menu File (es.: Rivisita: Facile, Buono, Difficile)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Se disabiliti le opzioni di revisione nel menu File, puoi rivedere le tue note utilizzando i comandi del plugin e, se li hai definiti, le scorciatoie da tastiera associate.",
    MAX_N_DAYS_REVIEW_QUEUE: "Numero di giorni massimi da visualizzare nel pannello di destra",
    MIN_ONE_DAY: "Il numero di giorni deve essere almeno 1.",
    VALID_NUMBER_WARNING: "Per favore, mettere un numero valido.",
    UI: "User Interface",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Alberti di mazzi dovrebbero essere inizialmente visualizzate come espansi",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Disabilitami per collassare mazzi annidati nella stessa scheda. Utile se hai schede che appartengono a più mazzi nello stesso file.",
    ALGORITHM: "Algoritmo",
    CHECK_ALGORITHM_WIKI:
        "Per maggiori informazioni, visita <a href='${algoUrl}'>l'implementazione dell'algoritmo</a>.",
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Difficoltà base",
    BASE_EASE_DESC: "mino = 130, preferibilmente circa 250.",
    BASE_EASE_MIN_WARNING: "La difficoltà base deve essere di almeno 130.",
    LAPSE_INTERVAL_CHANGE: "L'intervallo cambierà segnando una scheda / nota come difficile",
    LAPSE_INTERVAL_CHANGE_DESC: "Intervallo nuovo = intervallo vecchio * cambio intervallo / 100.",
    EASY_BONUS: "Bonus facilità",
    EASY_BONUS_DESC:
        "Il bonus facilità ti permette di impostare le differenze negli intervalli tra il rispondere Buono e Facile su una scheda o nota (minimo 100%).",
    EASY_BONUS_MIN_WARNING: "Il bonus facilità deve essere di almeno 100.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Intervallo massimo in giorni",
    MAX_INTERVAL_DESC:
        "Ti permette di mettere un limite massimo all'intervallo (default 100 anni).",
    MAX_INTERVAL_MIN_WARNING: "L'intervallo massimo deve essere di almeno 1 giorno.",
    MAX_LINK_CONTRIB: "Contributo massimo delle note collegate",
    MAX_LINK_CONTRIB_DESC:
        "Contributo massimo della difficoltà pasata delle note collegate alla difficoltà iniziale.",
    LOGGING: "Registrando",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "Visualizza informazione di debug sulla console per sviluppatori",
    DISPLAY_PARSER_DEBUG_INFO:
        "Visualizza informazione di debug riguardanti il parser sulla console per sviluppatori",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Coda di note da rivedere",
    CLOSE: "Chiusi",
    NEW: "Nuovo/a",
    YESTERDAY: "Ieri",
    TODAY: "Oggi",
    TOMORROW: "Domani",

    // stats-modal.tsx
    STATS_TITLE: "Statistiche",
    MONTH: "Mese",
    QUARTER: "Trimestre",
    YEAR: "Anno",
    LIFETIME: "Per tutta la vita",
    FORECAST: "Previsione",
    FORECAST_DESC: "Il numero di schede che saranno in ritardo in futuro",
    SCHEDULED: "Programmate",
    DAYS: "Giorni",
    NUMBER_OF_CARDS: "Numero di schede",
    REVIEWS_PER_DAY: "Media: ${avg} revisioni/giorno",
    INTERVALS: "Intervalli",
    INTERVALS_DESC: "Ritardi finché le revisioni saranno visualizzate di nuovo",
    COUNT: "Conta",
    INTERVALS_SUMMARY: "Intervallo medio: ${avg}, Intervallo massimo: ${longest}",
    EASES: "Difficoltà",
    EASES_SUMMARY: "Difficoltà media: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Tipi di schede",
    CARD_TYPES_DESC: "Include eventuali schede sepolte",
    CARD_TYPE_NEW: "Nuove",
    CARD_TYPE_YOUNG: "Giovani",
    CARD_TYPE_MATURE: "Mature",
    CARD_TYPES_SUMMARY: "Schede tottali: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
