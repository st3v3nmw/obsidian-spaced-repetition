// Spanish - Español.

export default {
    // flashcard-modal.tsx
    DECKS: "Mazos",
    DUE_CARDS: "Tarjetas Vencidas",
    NEW_CARDS: "Tarjetas Nuevas",
    TOTAL_CARDS: "Tarjetas Totales",
    BACK: "Atrás",
    SKIP: "Saltar",
    EDIT_CARD: "Editar Tarjeta",
    RESET_CARD_PROGRESS: "Reiniciar progreso de la tarjeta",
    HARD: "Difícil",
    GOOD: "Bien",
    EASY: "Fácil",
    SHOW_ANSWER: "Mostrar Respuesta",
    CARD_PROGRESS_RESET: "El progreso de la tarjeta se ha reiniciado.",
    SAVE: "Guardar",
    CANCEL: "Cancelar",
    NO_INPUT: "Se ha proveído entrada.",
    CURRENT_EASE_HELP_TEXT: "Facilidad Actual: ",
    CURRENT_INTERVAL_HELP_TEXT: "Intervalo Actual: ",
    CARD_GENERATED_FROM: "Generado Desde: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Abrir nota para revisión",
    REVIEW_CARDS: "Revisar Tarjetas",
    REVIEW_DIFFICULTY_FILE_MENU: "Revisar: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Revisar nota como ${difficulty}",
    CRAM_ALL_CARDS: "Selecciona un mazo a memorizar",
    REVIEW_ALL_CARDS: "Revisar tarjetas de todas las notas",
    REVIEW_CARDS_IN_NOTE: "Revisar tarjetas en esta nota",
    CRAM_CARDS_IN_NOTE: "Memorizar tarjetas en esta nota",
    VIEW_STATS: "Ver estadísticas",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR: "Revisar: ${dueNotesCount} nota(s), ${dueFlashcardsCount} tarjetas vencidas",
    SYNC_TIME_TAKEN: "La sincronización tomó ${t} milisegundos",
    NOTE_IN_IGNORED_FOLDER: "La nota está guardada en un directorio ignorado (revisa los ajustes).",
    PLEASE_TAG_NOTE: "Por favor etiquete apropiadamente la nota para revisión (en los ajustes).",
    RESPONSE_RECEIVED: "Respuesta Recibida",
    NO_DECK_EXISTS: "No existen mazos para: ${deckName}",
    ALL_CAUGHT_UP: "¡Estás al día! 😃",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} día(s)",
    MONTHS_STR_IVL: "${interval} mes(es)",
    YEARS_STR_IVL: "${interval} año(s)",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}a",

    // settings.ts
    SETTINGS_HEADER: "Extensión de Repetición Espaciada",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'Para más información revisa la <a href="${wikiUrl}">wiki</a>.',
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
    FOLDERS_TO_IGNORE: "Directorios a ignorar",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Tarjetas de Memorización",
    FLASHCARD_EASY_LABEL: "Texto del botón: Fácil",
    FLASHCARD_GOOD_LABEL: "Texto del botón: Bien",
    FLASHCARD_HARD_LABEL: "Texto del botón: Difícil",
    FLASHCARD_EASY_DESC: "Personalize la etiqueta para el botón: Fácil",
    FLASHCARD_GOOD_DESC: "Personalize la etiqueta para el botón: Bien",
    FLASHCARD_HARD_DESC: "Personalize la etiqueta para el botón: Difícil",
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Etiquetas de las Tarjetas de Memorización",
    FLASHCARD_TAGS_DESC:
        "Escriba las etiquetas separadas por espacios o saltos de línea, por ejemplo, #memorizar #mazo2 #mazo3",
    CONVERT_FOLDERS_TO_DECKS: "¿Convertir directorios a mazos y submazos?",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "Esta es una opción alternativa a las etiquetas de las Tarjetas de Memorización.",
    INLINE_SCHEDULING_COMMENTS:
        "¿Guardar el comentario para programación de las tarjetas en la última línea?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Activar esto hará que los comentarios HTML no rompan el formato de las listas.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "¿Enterrar tarjetas hermanas hasta el siguiente día?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Los hermanos son tarjetas generadas del mismo texto de la tarjeta, por ejemplo, deletreos de huecos (cloze deletions en inglés)",
    SHOW_CARD_CONTEXT: "¿Mostrar contexto en las tarjetas?",
    SHOW_CARD_CONTEXT_DESC: "Por Ejemplo: Título > Cabecera > Sub-Cabecera > ... > Sub-Cabecera",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Porcentaje de la altura de las tarjetas de memoria",
    CARD_MODAL_SIZE_PERCENT_DESC: "Debería ser establecido en 100% si tienes imágenes grandes",
    RESET_DEFAULT: "Reiniciar a la configuración por defecto",
    CARD_MODAL_WIDTH_PERCENT: "Porcentaje del ancho de las tarjetas de memoria",
    SCROLL_TO_CLOZE_AUTO: "Auto-scroll to cloze",
    SCROLL_TO_CLOZE_AUTO_DESC:
        "Automatically scroll the hidden cloze deletion (e.g., [...]) into view when the card is shown.",
    SCROLL_BEHAVIOR: "Scroll behavior",
    SCROLL_BEHAVIOR_DESC:
        "Choose how the card scrolls to the hidden cloze — instantly or smoothly with animation.",
    SCROLL_BLOCK: "Scroll position",
    SCROLL_BLOCK_DESC:
        "Define where the hidden cloze will appear in the view after scrolling — top, center, bottom, or nearest visible.",
    RANDOMIZE_CARD_ORDER: "¿Aleatorizar el orden de las tarjetas para revisión?",
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
    DISABLE_CLOZE_CARDS: "¿Deshabilitar deletreo de huecos en las tarjetas?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "¿Convertir ==resaltados== a deletreo de huecos?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Añadir/eliminar el <code>${defaultPattern}</code> de tus "Patrones de Deletreo de Huecos"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "¿Convertir **texto en negrita** a deletreo de huecos?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Añadir/eliminar el <code>${defaultPattern}</code> de tus "Patrones de Deletreo de Huecos"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "¿Convertir {{llaves rizadas}} a deletreo de huecos?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Añadir/eliminar el <code>${defaultPattern}</code> de tus "Patrones de Deletreo de Huecos"',
    CLOZE_PATTERNS: "Patrones de deletreo de huecos",
    CLOZE_PATTERNS_DESC:
        'Escriba los patrones de deletreo de huecos separados por saltos de línea. . Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Separador de tarjetas de memorización en línea",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Note que después de cambiar este ajuste, tendrá que cambiar manualmente todas las notas que tenga.",
    INLINE_REVERSED_CARDS_SEPARATOR:
        "Separador de tarjetas de memorización para tarjetas de notas invertidas",
    MULTILINE_CARDS_SEPARATOR: "Separador para tarjetas de memorización multilínea",
    MULTILINE_REVERSED_CARDS_SEPARATOR:
        "Separador para tarjetas de memorización multilínea invertidas",
    MULTILINE_CARDS_END_MARKER:
        "Caracteres que denotan el fin de los clozes y tarjetas didácticas de varias líneas",
    NOTES: "Notes",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Activar panel de revisión de notas al arrancar",
    TAGS_TO_REVIEW: "Etiquetas a revisar",
    TAGS_TO_REVIEW_DESC:
        "Escriba las etiquetas separadas por espacios o saltos de líneas, por ejemplo, #revisión #etiqueta2 #etiqueta3.",
    OPEN_RANDOM_NOTE: "Abrir una nota al azar para revisar",
    OPEN_RANDOM_NOTE_DESC:
        "Cuando deshabilita esto, las notas son ordenadas por importancia (Algoritmo PageRank).",
    AUTO_NEXT_NOTE: "Abrir la siguiente nota automáticamente después de una revisión",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Habilita las opciones de revisión en el menú Archivo (por ejemplo: Revisar: Fácil, Bien, Difícil)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Si desactivas las opciones de revisión en el menú Archivo, puedes revisar tus notas usando los comandos del plugin y, si los definiste, las teclas rápidas asociadas.",
    MAX_N_DAYS_REVIEW_QUEUE: "Número máximo de días a mostrar en el panel derecho.",
    MIN_ONE_DAY: "El número de días debe ser al menos uno.",
    VALID_NUMBER_WARNING: "Por favor especifique un número válido.",
    UI: "User Interface",
    OPEN_IN_TAB: "Open in new tab",
    OPEN_IN_TAB_DESC: "Turn this off to open the plugin in a modal window",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Los árboles de mazos deberían ser expandidos al inicio.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Desactiva esto para contraer mazos anidados en la misma tarjeta. Útil si tienes tarjetas que pertenecen a muchos mazos en el mismo archivo.",
    ALGORITHM: "Algoritmo",
    CHECK_ALGORITHM_WIKI:
        'Para más información, revisa la <a href="${algoUrl}">implementación del algoritmo</a>.',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Base ease",
    BASE_EASE_DESC: "El mínimo es 130, es preferible que esté aproximado a 250.",
    BASE_EASE_MIN_WARNING: "La facilidad base de las tarjetas debe ser al menos 130.",
    LAPSE_INTERVAL_CHANGE:
        "El intervalo cambiará cuando se revise una tarjeta o nota como Difícil.",
    LAPSE_INTERVAL_CHANGE_DESC: "NuevoInterval = ViejoIntervalo * CambioDeIntervalo / 100.",
    EASY_BONUS: "Bonificación para Fácil",
    EASY_BONUS_DESC:
        "La bonificación para Fácil te permite establecer la diferencia entre intervalos al responder Bien y Fácil en las tarjetas o notas (mínimo = 100%).",
    EASY_BONUS_MIN_WARNING: "El bono de facilidad debe ser al menos 100.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Intervalo máximo en días",
    MAX_INTERVAL_DESC:
        "Te permite establecer un límite mayor en el intervalo (por defecto es de 100 años).",
    MAX_INTERVAL_MIN_WARNING: "El intervalo máximo debe ser de al menos un día.",
    MAX_LINK_CONTRIB: "Contribución máxima de las notas vinculadas.",
    MAX_LINK_CONTRIB_DESC:
        "Contribución máxima de la facilidad ponderada de las notas vinculadas a la facilidad inicial.",
    LOGGING: "Registro",
    DISPLAY_SCHEDULING_DEBUG_INFO:
        "¿Mostrar información de depuración en la consola de desarrollador",
    DISPLAY_PARSER_DEBUG_INFO: "Show the parser's debugging information on the developer console",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Cola de notas a revisar",
    CLOSE: "Cerrar",
    NEW: "Nuevo",
    YESTERDAY: "Ayer",
    TODAY: "Hoy",
    TOMORROW: "Mañana",

    // stats-modal.tsx
    STATS_TITLE: "Estadísticas",
    MONTH: "Mes",
    QUARTER: "Trimestre o Cuatrimestre", // En Inglés: Quarter.
    YEAR: "Año",
    LIFETIME: "Tiempo de Vida",
    FORECAST: "Pronóstico",
    FORECAST_DESC: "El número de tarjetas vencidas en el futuro",
    SCHEDULED: "Programado",
    DAYS: "Días",
    NUMBER_OF_CARDS: "Número de tarjetas",
    REVIEWS_PER_DAY: "Carga: ${avg} Revisiones por día",
    INTERVALS: "Intervalos",
    INTERVALS_DESC: "Retrasos hasta que las revisiones se muestren de nuevo",
    COUNT: "Conteo",
    INTERVALS_SUMMARY: "Intervalo de carga: ${avg}, Intervalo mayor: ${longest}",
    EASES: "Facilidad",
    EASES_SUMMARY: "Carga de Facilidad: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Tipos de tarjetas",
    CARD_TYPES_DESC: "Esto incluye también a las tarjetas enterradas, si las hay",
    CARD_TYPE_NEW: "Nueva",
    CARD_TYPE_YOUNG: "Joven",
    CARD_TYPE_MATURE: "Madura",
    CARD_TYPES_SUMMARY: "Tarjetas Totales: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
