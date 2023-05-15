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
    REVIEW_EASY_FILE_MENU: "Revisar: Fácil",
    REVIEW_GOOD_FILE_MENU: "Revisar: Bien",
    REVIEW_HARD_FILE_MENU: "Revisar: Difícil",
    REVIEW_NOTE_EASY_CMD: "Revisar nota como fácil",
    REVIEW_NOTE_GOOD_CMD: "Revisar nota como bien",
    REVIEW_NOTE_HARD_CMD: "Revisar nota como difícil",
    CRAM_ALL_CARDS: "Selecciona un mazo a memorizar",
    REVIEW_ALL_CARDS: "Revisar tarjetas de todas las notas",
    REVIEW_CARDS_IN_NOTE: "Revisar tarjetas en esta nota",
    CRAM_CARDS_IN_NOTE: "Memorizar tarjetas en esta nota",
    VIEW_STATS: "Ver estadísticas",
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
    SETTINGS_HEADER: "Extensión de Repetición Espaciada - Ajustes",
    CHECK_WIKI: 'Para más información revisa la <a href="${wiki_url}">wiki</a>.',
    FOLDERS_TO_IGNORE: "Directorios a ignorar",
    FOLDERS_TO_IGNORE_DESC:
        "Escriba las rutas de los directorios separadas por saltos de línea, por ejemplo, Plantillas Extra/Guiones",
    FLASHCARDS: "Tarjetas de Memorización",
    FLASHCARD_EASY_LABEL: "Texto del botón: Fácil",
    FLASHCARD_GOOD_LABEL: "Texto del botón: Bien",
    FLASHCARD_HARD_LABEL: "Texto del botón: Difícil",
    FLASHCARD_EASY_DESC: "Personalize la etiqueta para el botón: Fácil",
    FLASHCARD_GOOD_DESC: "Personalize la etiqueta para el botón: Bien",
    FLASHCARD_HARD_DESC: "Personalize la etiqueta para el botón: Difícil",
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
    CARD_MODAL_HEIGHT_PERCENT: "Porcentaje de la altura de las tarjetas de memoria",
    CARD_MODAL_SIZE_PERCENT_DESC: "Debería ser establecido en 100% si tienes imágenes grandes",
    RESET_DEFAULT: "Reiniciar a la configuración por defecto",
    CARD_MODAL_WIDTH_PERCENT: "Porcentaje del ancho de las tarjetas de memoria",
    RANDOMIZE_CARD_ORDER: "¿Aleatorizar el orden de las tarjetas para revisión?",
    DISABLE_CLOZE_CARDS: "¿Deshabilitar deletreo de huecos en las tarjetas?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "¿Convertir ==resaltados== a deletreo de huecos?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "¿Convertir **texto en negrita** a deletreo de huecos?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "¿Convertir {{llaves rizadas}} a deletreo de huecos?",
    INLINE_CARDS_SEPARATOR: "Separador de tarjetas de memorización en línea",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Note que después de cambiar este ajuste, tendrá que cambiar manualmente todas las notas que tenga.",
    INLINE_REVERSED_CARDS_SEPARATOR:
        "Separador de tarjetas de memorización para tarjetas de notas invertidas",
    MULTILINE_CARDS_SEPARATOR: "Separador para tarjetas de memorización multilínea",
    MULTILINE_REVERSED_CARDS_SEPARATOR:
        "Separador para tarjetas de memorización multilínea invertidas",
    NOTES: "Notes",
    REVIEW_PANE_ON_STARTUP: "Activar panel de revisión de notas al arrancar",
    TAGS_TO_REVIEW: "Etiquetas a revisar",
    TAGS_TO_REVIEW_DESC:
        "Escriba las etiquetas separadas por espacios o saltos de líneas, por ejemplo, #revisión #etiqueta2 #etiqueta3.",
    OPEN_RANDOM_NOTE: "Abrir una nota al azar para revisar",
    OPEN_RANDOM_NOTE_DESC:
        "Cuando deshabilita esto, las notas son ordenadas por importancia (Algoritmo PageRank).",
    AUTO_NEXT_NOTE: "Abrir la siguiente nota automáticamente después de una revisión",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "Deshabilitar opciones de revisión en el menú de archivo, por ejemplo, Revisión: Fácil Bien Difícil",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Después de deshabilitarlo, puede hacer las revisiones utilizando atajos de teclado. Reinicie Obsidian después de cambiar esto.",
    MAX_N_DAYS_REVIEW_QUEUE: "Número máximo de días a mostrar en el panel derecho.",
    MIN_ONE_DAY: "El número de días debe ser al menos uno.",
    VALID_NUMBER_WARNING: "Por favor especifique un número válido.",
    UI_PREFERENCES: "Preferencias de la interfaz de usuario.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "Los árboles de mazos deberían ser expandidos al inicio.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Desactiva esto para contraer mazos anidados en la misma tarjeta. Útil si tienes tarjetas que pertenecen a muchos mazos en el mismo archivo.",
    ALGORITHM: "Algoritmo",
    CHECK_ALGORITHM_WIKI:
        'Para más información, revisa la <a href="${algo_url}">implementación del algoritmo</a>.',
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
    MAX_INTERVAL: "Intervalo máximo en días",
    MAX_INTERVAL_DESC:
        "Te permite establecer un límite mayor en el intervalo (por defecto es de 100 años).",
    MAX_INTERVAL_MIN_WARNING: "El intervalo máximo debe ser de al menos un día.",
    MAX_LINK_CONTRIB: "Contribución máxima de las notas vinculadas.",
    MAX_LINK_CONTRIB_DESC:
        "Contribución máxima de la facilidad ponderada de las notas vinculadas a la facilidad inicial.",
    LOGGING: "Registro",
    DISPLAY_DEBUG_INFO: "¿Mostrar información de depuración en la consola de desarrollador?",

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
    CARD_TYPES: "Tipos de tarjetas",
    CARD_TYPES_DESC: "Esto incluye también a las tarjetas enterradas, si las hay",
    CARD_TYPE_NEW: "Nueva",
    CARD_TYPE_YOUNG: "Joven",
    CARD_TYPE_MATURE: "Madura",
    CARD_TYPES_SUMMARY: "Tarjetas Totales: ${totalCardsCount}",
};
