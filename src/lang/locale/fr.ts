// français

export default {
    // flashcard-modal.tsx
    DECKS: "Paquets",
    DUE_CARDS: "Cartes dues",
    NEW_CARDS: "Nouvelles cartes",
    TOTAL_CARDS: "Total de cartes",
    BACK: "Précédent",
    SKIP: "Sauter",
    EDIT_CARD: "Modifier la carte",
    RESET_CARD_PROGRESS: "Remettre à zéro le niveau de cette carte",
    HARD: "Difficile",
    GOOD: "Correct",
    EASY: "Facile",
    SHOW_ANSWER: "Montrer la réponse",
    CARD_PROGRESS_RESET: "Le niveau de la carte a été remis à zéro.",
    SAVE: "Sauvegarder",
    CANCEL: "Annuler",
    NO_INPUT: "Pas de contenu.",
    CURRENT_EASE_HELP_TEXT: "Facilité actuelle : ",
    CURRENT_INTERVAL_HELP_TEXT: "Intervalle actuel : ",
    CARD_GENERATED_FROM: "Généré depuis : ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Ouvrir une note à apprendre",
    REVIEW_CARDS: "Apprendre les flashcards",
    REVIEW_DIFFICULTY_FILE_MENU: "Apprentissage : ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Difficulté de la révision : ${difficulty}",
    CRAM_ALL_CARDS: "Choisir un deck à réviser",
    REVIEW_ALL_CARDS: "Apprendre les flashcards dans toutes les notes",
    REVIEW_CARDS_IN_NOTE: "Apprendre les flashcards dans cette note",
    CRAM_CARDS_IN_NOTE: "Réviser les flashcards dans cette note",
    VIEW_STATS: "Voir les statistiques",
    OPEN_REVIEW_QUEUE_VIEW:
        "Ouvrir la file d'attente des notes à apprendre dans la barre verticale",
    STATUS_BAR: "Apprentissage : ${dueNotesCount} note(s), ${dueFlashcardsCount} carte(s) dues",
    SYNC_TIME_TAKEN: "Synchronisé en ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "La note est dans un dossier ignoré (voir paramètres).",
    PLEASE_TAG_NOTE: "Ajoutez le bon tag à la note pour l'apprendre (dans les paramètres).",
    RESPONSE_RECEIVED: "Réponse enregistrée.",
    NO_DECK_EXISTS: "Pas de paquet sous le nom ${deckName}",
    ALL_CAUGHT_UP: "Bravo, vous êtes à jour !",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} jour(s)",
    MONTHS_STR_IVL: "${interval} mois(s)",
    YEARS_STR_IVL: "${interval} an(s)",
    DAYS_STR_IVL_MOBILE: "${interval}j",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}a",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition",
    GROUP_TAGS_FOLDERS: "Tags & Dossiers",
    GROUP_FLASHCARD_REVIEW: "Apprentissage des flashcards",
    GROUP_FLASHCARD_SEPARATORS: "Séparateurs de flashcards",
    GROUP_DATA_STORAGE: "Stockage des informations de planification",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contribuer",
    CHECK_WIKI: 'Pour plus d\'informations, visitez le <a href="${wikiUrl}">wiki</a>.',
    GITHUB_DISCUSSIONS:
        'Visitez les <a href="${discussionsUrl}">discussions</a> pour des questions-réponses, des retours ou une discussion généraliste.',
    GITHUB_ISSUES:
        'Créez un ticket <a href="${issuesUrl}">sur GitHub</a> si vous trouvez un bug ou voulez demander une fonctionnalité.',
    GITHUB_SOURCE_CODE:
        'Code source du projet disponible sur <a href="${githubProjectUrl}">GitHub</a>',
    CODE_CONTRIBUTION_INFO:
        'Information sur les <a href="${codeContributionUrl}">contributions au code</a>',
    TRANSLATION_CONTRIBUTION_INFO:
        'Informations sur la <a href="${translationContributionUrl}">traduction du plugin</a> dans votre langue',
    FOLDERS_TO_IGNORE: "Dossiers à ignorer",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Flashcards",
    FLASHCARD_EASY_LABEL: "Bouton Facile",
    FLASHCARD_GOOD_LABEL: "Bouton Correct",
    FLASHCARD_HARD_LABEL: "Bouton Difficile",
    FLASHCARD_EASY_DESC: "Changez le texte du bouton Facile",
    FLASHCARD_GOOD_DESC: "Changez le texte du bouton Correct",
    FLASHCARD_HARD_DESC: "Changez le texte du bouton Difficile",
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Tags des flashcards",
    FLASHCARD_TAGS_DESC:
        "Entrez les tags séparés par un espace ou une ligne i.e. #flashcards #paquet2 #paquet3.",
    CONVERT_FOLDERS_TO_DECKS: "Convertir les dossiers en paquets et sous-paquets ?",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "Ceci est une alternative aux tags de flashcards présentés ci-dessus.",
    INLINE_SCHEDULING_COMMENTS:
        "Sauvegarder le commentaire de planification dans la dernière ligne de la flashcard ?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Activer ceci empêche les commentaires HTML de casser la mise en page des listes.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Enterrer les cartes sœurs jusqu'au lendemain ?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Les cartes sœurs sont les cartes générées depuis le même texte, par exemple pour les textes à trous",
    SHOW_CARD_CONTEXT: "Montrer le contexte dans les cartes ?",
    SHOW_CARD_CONTEXT_DESC: "ex. Titre de la note > Titre 1 > Sous-titre > ... > Sous-titre",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Pourcentage de hauteur de la flashcard",
    CARD_MODAL_SIZE_PERCENT_DESC: "Devrait être 100% sur mobile ou en cas de grandes images",
    RESET_DEFAULT: "Réinitialiser les paramètres",
    CARD_MODAL_WIDTH_PERCENT: "Pourcentage de largeur de la flashcard",
    RANDOMIZE_CARD_ORDER: "Apprendre les cartes dans un ordre aléatoire ?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "Ordre d'affichage des cartes d'un paquet pendant les révisions",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Dans l'ordre du paquet (Nouvelles cartes d'abord)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL: "Dans l'ordre du paquet (Cartes dues d'abord)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Aléatoirement dans le paquet (Nouvelles cartes d'abord)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "Aléatoirement dans le paquet (Cartes dues d'abord)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Carte au hasard dans un paquet au hasard",
    REVIEW_DECK_ORDER: "Ordre d'affichage des paquets pendant les révisions",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Séquentiel (quand toutes les cartes du paquet précédent sont apprises)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Aléatoire (quand toutes les cartes du paquet précédent sont apprises)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Carte au hasard dans un paquet au hasard",
    DISABLE_CLOZE_CARDS: "Désactiver les textes à trous ?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Convertir ==soulignages== en trous ?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Ajouter/supprimer le <code>${defaultPattern}</code> de vos "Cloze Patterns"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Convertir **gras** en trous ?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Ajouter/supprimer le <code>${defaultPattern}</code> de vos "Cloze Patterns"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Convertir {{crochets}} en trous ?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Ajouter/supprimer le <code>${defaultPattern}</code> de vos "Cloze Patterns"',
    CLOZE_PATTERNS: "Cloze Patterns",
    CLOZE_PATTERNS_DESC:
        'Enter cloze patterns separated by newlines. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Séparateur pour flashcards en une ligne",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Après avoir changé ce réglage, vous devrez manuellement mettre à jour toutes vos flashcards.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Séparateur pour flashcards inversées en une ligne",
    MULTILINE_CARDS_SEPARATOR: "Séparateur pour flashcards en plusieurs lignes",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Séparateur pour flashcards inversées en plusieurs lignes",
    MULTILINE_CARDS_END_MARKER:
        "Caractères de fin de textes à trous ou de flashcards en plusieurs lignes",
    NOTES: "Notes",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Montrer le module d'apprentissage des notes au démarrage",
    TAGS_TO_REVIEW: "Tags à apprendre",
    TAGS_TO_REVIEW_DESC:
        "Entrez les tags séparés par un espace ou une ligne i.e. #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Ouvrir une note à apprendre au hasard",
    OPEN_RANDOM_NOTE_DESC:
        "Si vous désactivez cette option, les notes sont triées par importance (PageRank).",
    AUTO_NEXT_NOTE: "Ouvrir la prochaine note automatiquement après un apprentissage",
    MAX_N_DAYS_REVIEW_QUEUE: "Jours maximum affichés dans la barre de droite",
    MIN_ONE_DAY: "Le nombre de jours doit être au moins 1.",
    VALID_NUMBER_WARNING: "Entrez un nombre valide.",
    UI: "User Interface",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Enable the review options in the file menu (e.g. Review: Easy, Good, Hard)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "If you disable the review options in the file menu, you can review your notes using the plugin commands and, if you defined them, the associated command hotkeys.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Les dossiers de paquets devraient initialement tous être ouverts",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Désactivez pour réduire les paquets dans la même carte. Ce réglage est utile si vous avez des cartes qui appartiennent à beaucoup de paquets à la fois.",
    ALGORITHM: "Algorithme",
    CHECK_ALGORITHM_WIKI:
        "Pour en savoir plus, lisez l'<a href=\"${algoUrl}\">implémentation de l'algorithme</a>.",
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Facilité de base",
    BASE_EASE_DESC: "minimum = 130, recommandé = vers 250.",
    BASE_EASE_MIN_WARNING: "La facilité de base doit être supérieure à 130.",
    LAPSE_INTERVAL_CHANGE:
        "Changement d'intervalle quand vous indiquez qu'une flashcard/note a été difficile",
    LAPSE_INTERVAL_CHANGE_DESC: "nouvelIntervalle = ancienIntervalle * changementIntervalle / 100.",
    EASY_BONUS: "Bonus Facile",
    EASY_BONUS_DESC:
        "Le bonus Facile vous permet d'augmenter l'intervalle entre une réponse Correct et une réponse Facile sur une flashcard/note (minimum = 100%).",
    EASY_BONUS_MIN_WARNING: "Le bonus Facile doit être au moins 100.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Intervalle maximum (en jours)",
    MAX_INTERVAL_DESC:
        "Vous permet de mettre une limite maximale sur l'intervalle (par défaut, 100 ans).",
    MAX_INTERVAL_MIN_WARNING: "L'intervalle maximum doit être au moins 1 jour.",
    MAX_LINK_CONTRIB: "Contribution maximum des liens",
    MAX_LINK_CONTRIB_DESC:
        "Contribution maximum de la facilité pondérée des notes liées à la facilité initiale.",
    LOGGING: "Logging",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "Afficher les informations de débogage dans la console de développement",
    DISPLAY_PARSER_DEBUG_INFO:
        "Afficher les informations de débogage pour le parser dans la console de développement",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Cartes à apprendre",
    CLOSE: "Fermer",
    NEW: "Nouveau",
    YESTERDAY: "Hier",
    TODAY: "Aujourd'hui",
    TOMORROW: "Demain",

    // stats-modal.tsx
    STATS_TITLE: "Statistiques",
    MONTH: "Mois",
    QUARTER: "Trimestre",
    YEAR: "Année",
    LIFETIME: "Toujours",
    FORECAST: "Prévisions",
    FORECAST_DESC: "Le nombre de cartes dues dans le futur",
    SCHEDULED: "Planifié",
    DAYS: "Jours",
    NUMBER_OF_CARDS: "Nombre de cartes",
    REVIEWS_PER_DAY: "Moyenne : ${avg} apprentissages / jour",
    INTERVALS: "Intervalles",
    INTERVALS_DESC: "Durée avant de remontrer une carte",
    COUNT: "Total",
    INTERVALS_SUMMARY: "Intervalle moyen : ${avg}. Intervalle maximum: ${longest}",
    EASES: "Facilité",
    EASES_SUMMARY: "Facilité moyenne : ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Types de cartes",
    CARD_TYPES_DESC: "Ceci inclut les cartes enterrées, s'il y en a",
    CARD_TYPE_NEW: "Nouvelles",
    CARD_TYPE_YOUNG: "En cours d'apprentissage",
    CARD_TYPE_MATURE: "Matures",
    CARD_TYPES_SUMMARY: "Total de cartes : ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
