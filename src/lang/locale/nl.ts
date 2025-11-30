// Nederlands

export default {
    // flashcard-modal.tsx
    DECKS: "Stapel",
    DUE_CARDS: "Te beoordelen kaarten",
    NEW_CARDS: "Nieuwe kaarten",
    TOTAL_CARDS: "Totaal aantal kaarten",
    BACK: "Terug",
    SKIP: "Overslaan",
    EDIT_CARD: "Kaart bewerken",
    RESET_CARD_PROGRESS: "Voortgang van kaart resetten",
    HARD: "Moeilijk",
    GOOD: "Goed",
    EASY: "Gemakkelijk",
    SHOW_ANSWER: "Toon antwoord",
    CARD_PROGRESS_RESET: "Voortgang van kaart is gereset.",
    SAVE: "Opslaan",
    CANCEL: "Annuleren",
    NO_INPUT: "Geen invoer opgegeven.",
    CURRENT_EASE_HELP_TEXT: "Huidige Moeilijkheid: ",
    CURRENT_INTERVAL_HELP_TEXT: "Huidige Interval: ",
    CARD_GENERATED_FROM: "Gegenereerd van: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Open een notitie voor beoordeling",
    REVIEW_CARDS: "Beoordeel flitskaarten",
    REVIEW_DIFFICULTY_FILE_MENU: "Beoordelen: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Beoordeel notitie als ${difficulty}",
    CRAM_ALL_CARDS: "Selecteer een stapel om te stampen",
    REVIEW_ALL_CARDS: "Beoordeel flitskaarten van alle notities",
    REVIEW_CARDS_IN_NOTE: "Beoordeel flitskaarten in deze notitie",
    CRAM_CARDS_IN_NOTE: "Stamp flitskaarten in deze notitie",
    VIEW_STATS: "Bekijk statistieken",
    OPEN_REVIEW_QUEUE_VIEW: "Open notities beoordelingswachtrij in zijbalk",
    STATUS_BAR:
        "Beoordeling: ${dueNotesCount} notitie(s), ${dueFlashcardsCount} kaart(en) te beoordelen",
    SYNC_TIME_TAKEN: "Synchronisatie duurde ${t}ms",
    NOTE_IN_IGNORED_FOLDER:
        "Notitie is opgeslagen in een genegeerde map (controleer instellingen).",
    PLEASE_TAG_NOTE: "Tag de notitie correct voor beoordeling (in instellingen).",
    RESPONSE_RECEIVED: "Reactie ontvangen.",
    NO_DECK_EXISTS: "Er bestaat geen stapel voor ${deckName}",
    ALL_CAUGHT_UP: "Je bent nu helemaal bij :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} dag(en)",
    MONTHS_STR_IVL: "${interval} maand(en)",
    YEARS_STR_IVL: "${interval} jaar",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}j",

    // settings.ts
    SETTINGS_HEADER: "Gespreide Herhaling",
    GROUP_TAGS_FOLDERS: "Tags & Mappen",
    GROUP_FLASHCARD_REVIEW: "Flitskaart Beoordeling",
    GROUP_FLASHCARD_SEPARATORS: "Flitskaart Scheidingstekens",
    GROUP_DATA_STORAGE: "Opslag van planningsgegevens",
    GROUP_DATA_STORAGE_DESC: "Kies waar de planningsgegevens worden opgeslagen",
    GROUP_FLASHCARDS_NOTES: "Flitskaarten & Notities",
    GROUP_CONTRIBUTING: "Bijdragen",
    CHECK_WIKI: 'Voor meer informatie, bekijk de <a href="${wikiUrl}">wiki</a>.',
    GITHUB_DISCUSSIONS:
        'Bezoek de <a href="${discussionsUrl}">discussies</a> sectie voor Q&A hulp, feedback, en algemene discussie.',
    GITHUB_ISSUES:
        'Meld een probleem <a href="${issuesUrl}">hier</a> als je een functieverzoek of een bugrapport hebt.',
    GITHUB_SOURCE_CODE:
        'De broncode van het project is beschikbaar op <a href="${githubProjectUrl}">GitHub</a>.',
    CODE_CONTRIBUTION_INFO:
        '<a href="${codeContributionUrl}">Hier</a> lees je hoe je code kunt bijdragen aan de plugin.',
    TRANSLATION_CONTRIBUTION_INFO:
        '<a href="${translationContributionUrl}">Hier</a> lees je hoe je de plugin in een andere taal kunt vertalen.',
    FOLDERS_TO_IGNORE: "Mappen om te negeren",
    FOLDERS_TO_IGNORE_DESC:
        "Voer mappaden of globpatronen in op aparte regels, bijvoorbeeld Templates/Scripts of **/*.excalidraw.md. Deze instelling is gemeenschappelijk voor zowel flitskaarten als notities.",
    OBSIDIAN_INTEGRATION: "Integratie in Obsidian",
    FLASHCARDS: "Flitskaarten",
    FLASHCARD_EASY_LABEL: "Gemakkelijk-knoptekst",
    FLASHCARD_GOOD_LABEL: "Goed-knoptekst",
    FLASHCARD_HARD_LABEL: "Moeilijk-knoptekst",
    FLASHCARD_EASY_DESC: 'Pas het label aan voor de "Gemakkelijk" knop',
    FLASHCARD_GOOD_DESC: 'Pas het label aan voor de "Goed" knop',
    FLASHCARD_HARD_DESC: 'Pas het label aan voor de "Moeilijk" knop',
    REVIEW_BUTTON_DELAY: "Vertraging knopindrukken (ms)",
    REVIEW_BUTTON_DELAY_DESC:
        "Voeg een vertraging toe aan de beoordelingsknoppen voordat ze opnieuw kunnen worden ingedrukt.",
    FLASHCARD_TAGS: "Flitskaarttags",
    FLASHCARD_TAGS_DESC:
        "Voer tags in, gescheiden door spaties of nieuwe regels, bijvoorbeeld #flitskaarten #stapel2 #stapel3.",
    CONVERT_FOLDERS_TO_DECKS: "Converteer mappen naar stapels en substapels",
    CONVERT_FOLDERS_TO_DECKS_DESC: "Dit is een alternatief voor de optie flitskaarttags hierboven.",
    INLINE_SCHEDULING_COMMENTS:
        "Planningsopmerking opslaan op dezelfde regel als de laatste regel van de flitskaart?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Als u dit inschakelt, wordt de opmaak van de lijst niet verbroken door de HTML-opmerkingen.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Begraaf de broer-/zuskaarten tot de volgende dag",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Broer-/zuskaarten zijn kaarten die zijn gegenereerd uit dezelfde kaarttekst, bijvoorbeeld cloze-deleties",
    SHOW_CARD_CONTEXT: "Toon context in kaarten",
    SHOW_CARD_CONTEXT_DESC: "Bijv. Titel > Kop 1 > Subkop > ... > Subkop",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Toon volgende herzieningstijd in de beoordelingsknoppen",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Handig om te weten hoe ver in de toekomst je kaarten worden uitgesteld.",
    CARD_MODAL_HEIGHT_PERCENT: "Flitskaart hoogtepercentage",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Moet worden ingesteld op 100% op mobiel of als je zeer grote afbeeldingen hebt",
    RESET_DEFAULT: "Reset naar standaard",
    CARD_MODAL_WIDTH_PERCENT: "Flitskaart breedtepercentage",
    RANDOMIZE_CARD_ORDER: "Flitskaartvolgorde willekeurig tijdens herziening?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Volgorde van kaarten in een stapel tijdens herziening",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL:
        "Opeenvolgend binnen een stapel (Alle nieuwe kaarten eerst)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL:
        "Opeenvolgend binnen een stapel (Alle kaarten die aan de beurt zijn eerst)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Willekeurig binnen een stapel (Alle nieuwe kaarten eerst)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM:
        "Willekeurig binnen een stapel (Alle kaarten die aan de beurt zijn eerst)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Willekeurige kaart uit willekeurige stapel",
    REVIEW_DECK_ORDER: "Volgorde waarin stapels worden weergegeven tijdens herziening",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Opeenvolgend (als alle kaarten in de vorige stapel zijn herzien)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Willekeurig (als alle kaarten in de vorige stapel zijn herzien)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Willekeurige kaart uit willekeurige stapel",
    DISABLE_CLOZE_CARDS: "Cloze-kaarten uitschakelen?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Converteer ==highlights== naar clozes",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Voeg de <code>${defaultPattern}</code> toe aan/verwijder deze uit uw "Cloze-patronen"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Converteer **vetgedrukte tekst** naar clozes",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Voeg de <code>${defaultPattern}</code> toe aan/verwijder deze uit uw "Cloze-patronen"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Converteer {{accolades}} naar clozes",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Voeg de <code>${defaultPattern}</code> toe aan/verwijder deze uit uw "Cloze-patronen"',
    CLOZE_PATTERNS: "Cloze-patronen",
    CLOZE_PATTERNS_DESC:
        'Voer cloze-patronen in, gescheiden door nieuwe regels. Raadpleeg de <a href="${docsUrl}">wiki</a> voor meer informatie.',
    INLINE_CARDS_SEPARATOR: "Scheidingsteken voor inline flitskaarten",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Houd er rekening mee dat u na het wijzigen hiervan handmatig alle flitskaarten die u al hebt, moet bewerken.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Scheidingsteken voor inline omgekeerde flitskaarten",
    MULTILINE_CARDS_SEPARATOR: "Scheidingsteken voor meerregelige flitskaarten",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Scheidingsteken voor meerregelige omgekeerde flitskaarten",
    MULTILINE_CARDS_END_MARKER:
        "Tekens die het einde van clozes en meerregelige flitskaarten aangeven",
    NOTES: "Notities",
    NOTE: "Notitie",
    REVIEW_PANE_ON_STARTUP: "Notitiebeoordelingsvenster inschakelen bij opstarten",
    TAGS_TO_REVIEW: "Tags om te beoordelen",
    TAGS_TO_REVIEW_DESC:
        "Voer tags in, gescheiden door spaties of nieuwe regels, bijv. #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Open een willekeurige notitie voor beoordeling",
    OPEN_RANDOM_NOTE_DESC:
        "Wanneer u dit uitschakelt, worden notities geordend op belangrijkheid (PageRank).",
    AUTO_NEXT_NOTE: "Open automatisch de volgende notitie na een beoordeling",
    MAX_N_DAYS_REVIEW_QUEUE:
        "Maximum aantal dagen om weer te geven in het notitiebeoordelingspaneel",
    MIN_ONE_DAY: "Het aantal dagen moet minimaal 1 zijn.",
    VALID_NUMBER_WARNING: "Geef een geldig getal op.",
    UI: "Gebruikersinterface",
    OPEN_IN_TAB: "Open in nieuw tabblad",
    OPEN_IN_TAB_DESC: "Schakel dit uit om de plugin in een modaal venster te openen",
    SHOW_STATUS_BAR: "Statusbalk weergeven",
    SHOW_STATUS_BAR_DESC:
        "Schakel dit uit om de beoordelingsstatus van de flitskaart te verbergen in de statusbalk van Obsidian",
    SHOW_RIBBON_ICON: "Pictogram weergeven in de lintbalk",
    SHOW_RIBBON_ICON_DESC:
        "Schakel dit uit om het pictogram van de plugin in de lintbalk van Obsidian te verbergen",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Schakel de beoordelingsopties in het bestandsmenu in (bijv. Beoordelen: Gemakkelijk, Goed, Moeilijk)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Schakel deze optie uit om uw notities te beoordelen met behulp van de plugin-opdrachten en, indien gedefinieerd, de bijbehorende sneltoetsen voor opdrachten.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Stapelstructuren: Vouw substapels aanvankelijk uit",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Schakel dit uit om geneste stapels in dezelfde kaart samen te vouwen. Handig als je kaarten hebt die tot meerdere stapels in hetzelfde bestand behoren.",
    ALGORITHM: "Algoritme",
    CHECK_ALGORITHM_WIKI:
        'Voor meer informatie, bekijk de <a href="${algoUrl}">algoritmedetails</a>.',
    SM2_OSR_VARIANT: "OSR's variant van SM-2",
    BASE_EASE: "Basisgemak",
    BASE_EASE_DESC: "minimum = 130, bij voorkeur ongeveer 250.",
    BASE_EASE_MIN_WARNING: "Het basisgemak moet minimaal 130 zijn.",
    LAPSE_INTERVAL_CHANGE:
        "Intervalwijziging wanneer u een flitskaart/notitie als moeilijk beoordeelt",
    LAPSE_INTERVAL_CHANGE_DESC: "nieuwInterval = oudInterval * intervalWijziging / 100.",
    EASY_BONUS: "Gemakkelijk Bonus",
    EASY_BONUS_DESC:
        "De Gemakkelijk Bonus stelt u in staat het verschil in intervallen in te stellen tussen het beantwoorden van Goed en Gemakkelijk op een flitskaart/notitie (minimum = 100%).",
    EASY_BONUS_MIN_WARNING: "De Gemakkelijk Bonus moet minimaal 100 zijn.",
    LOAD_BALANCE: "Schakel load balancer in",
    LOAD_BALANCE_DESC: `Het interval wordt iets aangepast, zodat het aantal beoordelingen per dag consistenter is.
        Het is vergelijkbaar met Anki's fuzz, maar in plaats van willekeurig te zijn, kiest het de dag met het minste aantal beoordelingen.
        Het is uitgeschakeld voor kleine intervallen.`,
    MAX_INTERVAL: "Maximum interval in dagen",
    MAX_INTERVAL_DESC:
        "Hiermee kunt u een bovengrens voor het interval instellen (standaard = 100 jaar).",
    MAX_INTERVAL_MIN_WARNING: "Het maximale interval moet minimaal 1 dag zijn.",
    MAX_LINK_CONTRIB: "Maximale linkbijdrage",
    MAX_LINK_CONTRIB_DESC:
        "Maximale bijdrage van de gewogen gemak van gekoppelde notities aan het initiële gemak.",
    LOGGING: "Loggen",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "Toon de foutopsporingsinformatie van de planner op de ontwikkelaarsconsole",
    DISPLAY_PARSER_DEBUG_INFO:
        "Toon de foutopsporingsinformatie van de parser op de ontwikkelaarsconsole",
    SCHEDULING: "Plannen",
    EXPERIMENTAL: "Experimenteel",
    HELP: "Help",
    STORE_IN_NOTES: "In de notities",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Notities beoordelingswachtrij",
    CLOSE: "Sluiten",
    NEW: "Nieuw",
    YESTERDAY: "Gisteren",
    TODAY: "Vandaag",
    TOMORROW: "Morgen",

    // stats-modal.tsx
    STATS_TITLE: "Statistieken",
    MONTH: "Maand",
    QUARTER: "Kwartaal",
    YEAR: "Jaar",
    LIFETIME: "Levensduur",
    FORECAST: "Voorspelling",
    FORECAST_DESC: "Het aantal kaarten dat in de toekomst aan de beurt is",
    SCHEDULED: "Gepland",
    DAYS: "Dagen",
    NUMBER_OF_CARDS: "Aantal kaarten",
    REVIEWS_PER_DAY: "Gemiddeld: ${avg} beoordelingen/dag",
    INTERVALS: "Intervallen",
    INTERVALS_DESC: "Vertragingen totdat beoordelingen opnieuw worden weergegeven",
    COUNT: "Aantal",
    INTERVALS_SUMMARY: "Gemiddeld interval: ${avg}, Langste interval: ${longest}",
    EASES: "Gemakken",
    EASES_SUMMARY: "Gemiddeld gemak: ${avgEase}",
    EASE: "Gemak",
    CARD_TYPES: "Kaarttypen",
    CARD_TYPES_DESC: "Dit omvat ook begraven kaarten, indien aanwezig",
    CARD_TYPE_NEW: "Nieuw",
    CARD_TYPE_YOUNG: "Jong",
    CARD_TYPE_MATURE: "Volwassen",
    CARD_TYPES_SUMMARY: "Totaal aantal kaarten: ${totalCardsCount}",
    SEARCH: "Zoeken",
    PREVIOUS: "Vorige",
    NEXT: "Volgende",
};
