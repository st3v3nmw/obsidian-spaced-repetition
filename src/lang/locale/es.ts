// Spanish - Español.
import { IBaseLocale } from "src/lang/base-locale";
import en from "src/lang/locale/en";

const es: IBaseLocale = {
    ...en,
    language: "es",
    languageName: "Español",
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
    VIEW_CARD_INFO: "View Card Info",

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
    CONVERT_CLOZE_PATTERNS_TO_INPUTS: "Convert cloze patterns to input fields",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC:
        "Replace cloze patterns with input fields when reviewing cloze cards.",
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
    DELETE_SCHEDULING_DATA_ALL: "Delete Scheduling Data",
    DELETE_SCHEDULING_DATA_ALL_DESC: "Delete scheduling data from all notes and flashcards.",
    DELETE: "Delete",
    CONFIRM_SCHEDULING_DATA_ALL_DELETION:
        "Are you sure you want to delete all scheduling data from your notes and flashcards? This action cannot be undone.",
    CONFIRM: "Confirm",
    SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS: "Scheduling data deletion in progress...",
    SCHEDULING_DATA_HAS_BEEN_DELETED:
        "Scheduling data has been deleted from all notes and flashcards.",

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

    // settings.ts
    SETTINGS_TAB_HEADING: "Settings",
    MAIN_SETTINGS_PAGE: "MAIN_SETTINGS",

    // NoteReviewQueue.ts
    NOTE_REVIEW_QUEUE_HINT: "Click on the 3 dots next to the note to open the review menu.",

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
    // Settings > main-page
    INFO: "Info",
    // Card responses
    AGAIN: "Again",
    // Settings > info
    CHECK_ROADMAP: 'Check out the <a href="${roadMapUrl}">roadmap</a> for upcoming features.',
    CHECK_DEV_NEWS:
        'Check out the <a href="${devNewsUrl}">dev news</a> for the latest development news.',

    // --- Claves que faltaban y recurrían al inglés (#282) ---

    // flashcard-modal.tsx
    CRAM_MODE: "Modo de memorización intensiva",
    REVIEW_MODE: "Modo de revisión",
    DUE: "Vencida",
    SEEN_CARDS: "Tarjetas Vistas",
    SEEN: "Vistas",
    TOTAL: "Total",
    JUMP_TO: "Ir a la tarjeta",
    JUMP_TO_AND_CLOSE: "Cerrar e ir a la tarjeta",
    OPEN_IN_BACKGROUND: "Abrir tarjeta en segundo plano",
    DELETE_CARD: "Eliminar tarjeta",
    DELETE_CARD_CONFIRMATION:
        "Esta acción no se puede deshacer y podría alterar tus notas de forma no deseada. ¿Seguro que quieres eliminar esta tarjeta?",

    // main.ts
    REVIEW_CARD_DIFFICULTY_CMD: "Revisar tarjeta como ${difficulty}",
    REVIEW_REMINDER_NOTICE:
        "Tus tarjetas están listas para revisar. Vuelve a Obsidian para seguir aprendiendo.",

    // settings.ts
    PLUGIN_DATA_STORE_INFO:
        "Los datos de programación se guardan en archivos markdown dentro de tu bóveda (en el directorio configurado bajo Datos de programación). Las programaciones de las notas se identifican mediante un ID único (sr-id) añadido al frontmatter de cada nota, de modo que sobreviven a renombrados y movimientos dentro o fuera de Obsidian. Las programaciones de las tarjetas se identifican mediante un hash del texto de la tarjeta: editar el anverso de una tarjeta reiniciará su programación.",
    MIGRATE_TO_PLUGIN_DATA: "¿Migrar los datos de programación a los datos del plugin?",
    CONFIRM_MIGRATE_TO_PLUGIN_DATA:
        "Todos los comentarios <!--SR:...--> y los campos de frontmatter sr-* se moverán a archivos markdown de programación en la bóveda, y se añadirá un campo sr-id al frontmatter de cada nota como identificador estable. Esto puede tardar un momento en bóvedas grandes. No edites las notas hasta que la migración termine.",
    MIGRATING_TO_PLUGIN_DATA: "Migrando los datos de programación a los datos del plugin...",
    MIGRATE_TO_NOTES: "¿Migrar los datos de programación de vuelta a las notas?",
    CONFIRM_MIGRATE_TO_NOTES:
        "Todos los datos de programación se volverán a escribir como comentarios <!--SR:...--> y campos de frontmatter sr-*. Esto puede tardar un momento en bóvedas grandes. No edites las notas hasta que la migración termine.",
    MIGRATING_TO_NOTES: "Migrando los datos de programación a las notas...",
    FLASHCARD_AGAIN_LABEL: "Texto del botón: Otra vez",
    FLASHCARD_AGAIN_DESC: 'Personalice la etiqueta para el botón "Otra vez"',
    FLASHCARD_TAGS_TO_IGNORE: "Etiquetas a ignorar",
    FLASHCARD_TAGS_TO_IGNORE_DESC:
        "Escriba las etiquetas separadas por espacios o saltos de línea. Las notas que contengan cualquiera de estas etiquetas se excluirán de la revisión de tarjetas.",
    SHOW_DELETE_BUTTON: "Mostrar el botón Eliminar",
    SHOW_DELETE_BUTTON_DESC: "Añade un botón de eliminar a la interfaz de revisión de tarjetas.",
    REVIEW_REMINDERS: "Recordatorios de revisión",
    REVIEW_REMINDERS_DESC:
        "Comprueba periódicamente si hay tarjetas nuevas o vencidas y te avisa cuando hay tarjetas listas para revisar.",
    REVIEW_REMINDER_CHECK_ON_STARTUP: "Comprobar inmediatamente al iniciar",
    REVIEW_REMINDER_CHECK_ON_STARTUP_DESC:
        "Ejecuta una comprobación cuando el diseño inicial de Obsidian está listo, sin esperar al primer intervalo.",
    REVIEW_REMINDER_INTERVAL: "Intervalo de recordatorio (minutos)",
    REVIEW_REMINDER_INTERVAL_DESC:
        "Comprueba cada N minutos. Mínimo 1 minuto, máximo 1440 minutos.",
    REVIEW_REMINDER_INTERVAL_MIN_WARNING:
        "El intervalo de recordatorio debe ser un número entre 1 y 1440.",
    REVIEW_REMINDER_MESSAGE: "Mensaje del recordatorio",
    REVIEW_REMINDER_MESSAGE_DESC:
        "Mensaje personalizado opcional que se muestra en el aviso del recordatorio. Déjalo vacío para usar el mensaje predeterminado.",
    REVIEW_REMINDER_AUTO_OPEN: "Abrir la revisión automáticamente",
    REVIEW_REMINDER_AUTO_OPEN_DESC:
        "Cuando está activado, los recordatorios abren directamente la sesión de revisión de tarjetas existente.",
    REVIEW_REMINDER_SHOW_NOTICE: "Mostrar aviso al recordar",
    REVIEW_REMINDER_SHOW_NOTICE_DESC:
        "Muestra un aviso temporal cuando se activa un recordatorio de revisión.",
    REVIEW_REMINDER_PLAY_SOUND: "Reproducir sonido al recordar",
    REVIEW_REMINDER_PLAY_SOUND_DESC:
        "Reproduce un breve sonido de alerta cuando se activa un recordatorio de revisión.",
    REVIEW_REMINDER_BOUNCE_DOCK: "Hacer rebotar el icono del dock al recordar",
    REVIEW_REMINDER_BOUNCE_DOCK_DESC:
        "En escritorio, hace rebotar el icono del dock cuando se activa un recordatorio de revisión.",
    NOTE_TAGS_TO_IGNORE: "Etiquetas a ignorar",
    NOTE_TAGS_TO_IGNORE_DESC:
        "Escriba las etiquetas separadas por espacios o saltos de línea. Las notas que contengan cualquiera de estas etiquetas se excluirán de la revisión de notas.",
    STATUS_BAR_SETTINGS: "Barra de estado",
    SHOW_CARD_STATUS_BAR_ITEM: "Mostrar el elemento de la tarjeta en la barra de estado",
    SHOW_CARD_STATUS_BAR_ITEM_DESC:
        "Desactiva esto para ocultar el estado de revisión de la tarjeta en la barra de estado de Obsidian",
    SHOW_NOTE_STATUS_BAR_ITEM: "Mostrar el elemento de la nota en la barra de estado",
    SHOW_NOTE_STATUS_BAR_ITEM_DESC:
        "Desactiva esto para ocultar el estado de revisión de la nota en la barra de estado de Obsidian",
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM:
        "Mostrar el elemento de actualización disponible en la barra de estado",
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM_DESC:
        "Desactiva esto para ocultar el elemento de actualización disponible en la barra de estado y para detener la comprobación del número de la versión más reciente",
    SWITCH_TO_FSRS_ALGORITHM: "¿Cambiar el algoritmo de las tarjetas a FSRS?",
    CONFIRM_FSRS_ALGORITHM_SWITCH:
        "¡Cambiar a FSRS puede provocar una pérdida de datos imprevista, ya que aún no está suficientemente probado! El cambio modifica cómo se formatean los datos de programación de las tarjetas a medida que se revisan. Esto significa que las tarjetas reescritas en el formato FSRS requerirán muchos más parámetros y, por tanto, un comentario de programación más largo e intrusivo. Se hace el mayor esfuerzo por mantener la compatibilidad hacia atrás con los comentarios de programación, por si quisieras volver a OSR. Esto significa que tus datos de programación se reescribirán al formato OSR en cuanto revises una tarjeta con OSR activado.",
    USE_CUSTOM_HOTKEYS: "Usar teclas rápidas personalizadas",
    USE_CUSTOM_HOTKEYS_DESC:
        "Habilita teclas rápidas personalizadas para los comandos de revisión de tarjetas. Las teclas rápidas predeterminadas no estarán activas tras habilitar esto. Las teclas rápidas personalizadas solo se pueden usar con la opción 'Abrir en una pestaña nueva'.",

    // Settings > Scheduling > Delete
    DELETE_SCHEDULING_DATA_IN_NOTES: "Eliminar los datos de programación de las notas",
    DELETE_SCHEDULING_DATA_IN_NOTES_DESC: "Elimina los datos de programación de todas las notas.",
    DELETE_SCHEDULING_DATA_IN_CARDS: "Eliminar los datos de programación de las tarjetas",
    DELETE_SCHEDULING_DATA_IN_CARDS_DESC:
        "Elimina los datos de programación de todas las tarjetas.",
    CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION:
        "¿Seguro que quieres eliminar todos los datos de programación de tus notas? Esta acción no se puede deshacer.",
    CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION:
        "¿Seguro que quieres eliminar todos los datos de programación de tus tarjetas? Esta acción no se puede deshacer.",
    SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS:
        "Eliminación de datos de programación en curso...",
    SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS:
        "Eliminación de datos de programación en curso...",

    // NoteReviewQueue.ts
    NOTE_REVIEW_QUEUE_EMPTY_HINT:
        "No hay notas para revisar. Para añadir algunas, agrega la etiqueta 'review' en una de tus notas.",

    // Card controls / note menu
    OPEN_MENU: "Abrir menú",
    DELETE_NOTE_SCHEDULING_DATA_IN_NOTE: "Eliminar los datos de programación de la nota en la nota",
    CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION:
        "¿Seguro que quieres eliminar los datos de programación de la nota en esta nota?",
    NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS:
        "Eliminando los datos de programación de la nota en la nota...",
    DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE:
        "Eliminar los datos de programación de las tarjetas en la nota",
    CONFIRM_SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION:
        "¿Seguro que quieres eliminar los datos de programación de las tarjetas en la nota?",
    SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION_IN_PROGRESS:
        "Eliminando los datos de programación de las tarjetas en la nota...",
    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA:
        "Eliminar las etiquetas al eliminar los datos de programación",
    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA_DESC:
        "Eliminar las etiquetas al eliminar los datos de programación",
    ENABLE_FILE_MENU_DELETE_BUTTON: "Habilitar el botón de eliminar del menú de archivo",
    ENABLE_FILE_MENU_DELETE_BUTTON_DESC:
        "Habilita el botón de eliminar en el menú de archivo para los datos de programación",

    // Settings > data / reset / storage
    DATA_PAGE_NAME: "Datos",
    GROUP_RESET_SETTINGS: "Restablecer ajustes",
    GROUP_RESET_SETTINGS_DESC: "Restablece todos los ajustes a sus valores predeterminados",
    RESET_SETTINGS: "Restablecer ajustes",
    CONFIRM_RESET_SETTINGS:
        "¿Seguro que quieres restablecer todos los ajustes a sus valores predeterminados?",
    RESET_SETTINGS_CONFIRMATION:
        "Restableciendo todos los ajustes a sus valores predeterminados...",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE: "Formato de fecha para la cola de revisión de notas",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE_DESC:
        'Formato de fecha para la cola de revisión de notas (consulta <a href="${docsUrl}">moment.js</a> para más detalles). Solo se actualiza al reabrir la cola de revisión de notas.',
    MIGRATE_TO_FOLDER: "Migrar a directorio",
    CONFIRM_MIGRATE_TO_FOLDER: "¿Seguro que quieres migrar al almacenamiento en directorio?",
    MIGRATING_TO_FOLDER: "Migrando al almacenamiento en directorio...",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS: "Usar callouts para los comentarios de programación",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS_DESC:
        "Usa por defecto el callout de metadatos sr para los comentarios de programación en lugar de comentarios normales. Esto ocultará los comentarios de programación en un callout que parece una línea vacía en el editor.",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_BUTTON: "Migrar",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_DESC:
        "La migración pondrá los comentarios de programación en un callout de metadatos sr. Este callout está diseñado para ocultar los comentarios de programación.",
    CONFIRM_MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT:
        "La migración modificará todas tus tarjetas. Por favor, haz una copia de seguridad primero por si quieres revertir la migración más tarde o por si rompe tus tarjetas debido a un error. ¿Seguro que quieres migrar los comentarios de programación a callouts de metadatos sr?",
    MIGRATING_SCHEDULING_COMMENTS_TO_CALLOUT:
        "Migrando los comentarios de programación a callouts de metadatos sr...",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT:
        "Migrar los comentarios de programación a callout de metadatos sr",
    DEFAULT_LOCALE_NAME: "- Predeterminado de Obsidian -",
    LANGUAGE_SETTINGS: "Ajustes de idioma",
    LANGUAGE_SETTINGS_DESC:
        "Selecciona el idioma que quieres usar para la interfaz del plugin. Esto solo tendrá pleno efecto tras reiniciar Obsidian.",
    DEBUG_LOG: "Registro de depuración",
    COPY: "Copiar",
    NO_DECKS_TO_REVIEW:
        "No hay mazos con tarjetas para revisar. Asegúrate de haber creado algunas tarjetas añadiendo la etiqueta 'flashcards' a una nota y luego agregando tarjetas a ella (consulta la página del plugin para más detalles). Si hiciste todo eso y aún no ves ningún mazo aquí, probablemente se deba a un error del plugin. Hay un error conocido que ocurre cuando se revisan las tarjetas muy rápido: el sistema falla y los mazos no se muestran. Por favor, intenta abrir la lista de mazos de nuevo tras unos segundos.",
};

export default es;
