// Português do Brasil
// Brazilian Portuguese

export default {
    // flashcard-modal.tsx
    DECKS: "Baralhos",
    DUE_CARDS: "Cartas para Colocar em Dia",
    NEW_CARDS: "Novas Cartas",
    TOTAL_CARDS: "Total de Cartas",
    BACK: "Voltar",
    SKIP: "Pular",
    EDIT_CARD: "Editar Cartão",
    RESET_CARD_PROGRESS: "Reiniciar o Progresso da Carta",
    HARD: "Difícil",
    GOOD: "OK",
    EASY: "Fácil",
    SHOW_ANSWER: "Mostrar Resposta",
    CARD_PROGRESS_RESET: "O Progresso da Carta foi reiniciado",
    SAVE: "Salvar",
    CANCEL: "Cancelar",
    NO_INPUT: "Nenhuma entrada fornecida.",
    CURRENT_EASE_HELP_TEXT: "Facilidade atual: ",
    CURRENT_INTERVAL_HELP_TEXT: "Intervalo atual: ",
    CARD_GENERATED_FROM: "Gerada a partir de: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Abrir uma nota para revisar",
    REVIEW_CARDS: "Revisar flashcards",
    REVIEW_DIFFICULTY_FILE_MENU: "Revisão: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Revisar nota como ${difficulty}",
    REVIEW_ALL_CARDS: "Revisar flashcards de todas as notas",
    CRAM_ALL_CARDS: "Selecione um baralho para revisar",
    REVIEW_CARDS_IN_NOTE: "Revisar flashcards nessa nota",
    CRAM_CARDS_IN_NOTE: "Revisar todas as flashcards nessa nota",
    VIEW_STATS: "Ver estatísticas",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR:
        "Revisão: ${dueNotesCount} nota(s), ${dueFlashcardsCount} Carta(s) para colocar em dia",
    SYNC_TIME_TAKEN: "Sincronização levou ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "Nota é salva na pasta ignorada (cheque as configurações).",
    PLEASE_TAG_NOTE: "Por favor etiquete a nota apropriadamente para revisar (nas configurações).",
    RESPONSE_RECEIVED: "Resposta recebida.",
    NO_DECK_EXISTS: "Nenhum baralho existe para ${deckName}",
    ALL_CAUGHT_UP: "Você colocou tudo em dia agora :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} dia(s)",
    MONTHS_STR_IVL: "${interval} mês(es)",
    YEARS_STR_IVL: "${interval} ano(s)",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}a",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: 'Para mais informações, cheque a <a href="${wikiUrl}">wiki</a>.',
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
    FOLDERS_TO_IGNORE: "Pastas para ignorar",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Flashcards",
    FLASHCARD_EASY_LABEL: "Texto do Botão de Fácil",
    FLASHCARD_GOOD_LABEL: "Texto do Botão de OK",
    FLASHCARD_HARD_LABEL: "Texto do Botão de Difícil",
    FLASHCARD_EASY_DESC: 'Customize o rótulo para o botão de "Fácil"',
    FLASHCARD_GOOD_DESC: 'Customize o rótulo para o botão de "OK"',
    FLASHCARD_HARD_DESC: 'Customize o rótulo para o botão de "Difícil"',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Etiquetas dos Flashcards",
    FLASHCARD_TAGS_DESC:
        "Insira etiquetas separadas por espaços ou quebras de linha ex: #flashcards #baralho2 #baralho3.",
    CONVERT_FOLDERS_TO_DECKS: "Converter pastas para baralhos e sub-baralhos?",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "Isso é uma alternativa para a opção de etiqueta dos Flashcards em cima.",
    INLINE_SCHEDULING_COMMENTS:
        "Salvar comentários de agendamento na mesma linha que a última linha do flashcard?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Ligar isso vai fazer com que os comentários em HTML não quebrem a formatação de listas.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Enterrar cartas irmãs até o próximo dia?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Cartas irmãs são geradas pelo texto da mesma carta ex: omissão de palavras",
    SHOW_CARD_CONTEXT: "Mostrar contexto nas cartas?",
    SHOW_CARD_CONTEXT_DESC: "ex: Título > Cabeçalho 1 > Subcabeçalho > ... > Subcabeçalho",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Porcentagem da Altura do Flashcard",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Deveria estar configurado em 100% em dispositivos móveis ou se você tem imagens muito grandes",
    RESET_DEFAULT: "Reiniciar para a pré-definição",
    CARD_MODAL_WIDTH_PERCENT: "Porcentagem de Largura do Flashcard",
    RANDOMIZE_CARD_ORDER: "Aleatorizar a ordem das cartas durante a revisão?",
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
    DISABLE_CLOZE_CARDS: "Desabilitar cartas que usam omissão de palavras?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Converter ==marca-texto== em omissões?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Adiciona/remove o <code>${defaultPattern}</code> dos seus "Padrões de Omissão"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Converter **texto em negrito** em omissões?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Adiciona/remove o <code>${defaultPattern}</code> dos seus "Padrões de Omissão"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Converter {{chaves}} em omissões?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Adiciona/remove o <code>${defaultPattern}</code> dos seus "Padrões de Omissão"',
    CLOZE_PATTERNS: "Padrões de Omissão",
    CLOZE_PATTERNS_DESC:
        'Entre os padrões de omissão separados por quebras de linha. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Separador para flashcards inline",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Note que depois de mudar isso você vai ter que manualmente mudar quaisquer flashcards que você tenha.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Separador para flashcards inline reversos",
    MULTILINE_CARDS_SEPARATOR: "Separador para flashcards de múltiplas linhas",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Separador para flashcards de múltiplas linhas reversos",
    MULTILINE_CARDS_END_MARKER: "Caracteres que denotam o fim de clozes e flashcards multilinha",
    NOTES: "Notas",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Habilitar painel de revisão de notas na inicialização",
    TAGS_TO_REVIEW: "Etiquetas para revisar",
    TAGS_TO_REVIEW_DESC:
        "Insira etiquetas separadas por espaços ou quebra de linhas ex: #revisar #etiqueta2 #etiqueta3.",
    OPEN_RANDOM_NOTE: "Abrir uma nota aleatória para revisar",
    OPEN_RANDOM_NOTE_DESC:
        "Quando você desabilitar isso, as notas vão ser ordenadas por importância (PageRank).",
    AUTO_NEXT_NOTE: "Abrir a próxima nota automaticamente depois de uma revisão",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "Ative as opções de revisão no menu Arquivo (ex.: Revisão: Fácil, OK, Difícil)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Se você desativar as opções de revisão no menu Arquivo, poderá revisar suas anotações usando os comandos do plugin e, se os tiver definido, as teclas de atalho associadas.",
    MAX_N_DAYS_REVIEW_QUEUE: "Número máximo de dias para exibir no painel direito",
    MIN_ONE_DAY: "O número de dias deve ser pelo menos 1.",
    VALID_NUMBER_WARNING: "Por favor Insira um número válido.",
    UI: "User Interface",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Árvores de baralhos devem inicialmente ser exibidas como expandidas",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Desabilite isso para colapsar baralhos que estão um dentro do outro na mesma carta. Útil se você tem cartas que pertencem a muitos baralhos em um mesmo arquivo.",
    ALGORITHM: "Algorítmo",
    CHECK_ALGORITHM_WIKI:
        'Para mais informações, cheque a <a href="${algoUrl}">implementação do algorítmo</a>.',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Facilidade base",
    BASE_EASE_DESC: "mínimo = 130, preferivelmente por volta de 250.",
    BASE_EASE_MIN_WARNING: "A facilidade base deve ser pelo menos 130.",
    LAPSE_INTERVAL_CHANGE:
        "Mudança de intervalo quando você revisa um(a) flashcard/nota como difícil",
    LAPSE_INTERVAL_CHANGE_DESC: "novoIntervalo = velhoIntervalo * mudancaIntervalo / 100.",
    EASY_BONUS: "Bônus de Fácil",
    EASY_BONUS_DESC:
        "O bônus de fácil te permite mudar a diferência entre intervalos de responder OK e Fácil em um(a) flashcard/nota (mínimo = 100%).",
    EASY_BONUS_MIN_WARNING: "O bônus de fácil deve ser pelo menos 100.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Intervalo máximo em dias",
    MAX_INTERVAL_DESC:
        "Te permite colocar um limite máximo no intervalo (pré-definição = 100 anos).",
    MAX_INTERVAL_MIN_WARNING: "O intervalo máximo deve ser pelo menos 1 dia.",
    MAX_LINK_CONTRIB: "Contribuição Máxima de Links",
    MAX_LINK_CONTRIB_DESC:
        "Contribuição máxima da facilidade ponderada das notas linkadas à facilidade inicial.",
    LOGGING: "Logging",
    DISPLAY_SCHEDULING_DEBUG_INFO: "Mostrar informação de debugging no console de desenvolvimento",
    DISPLAY_PARSER_DEBUG_INFO: "Show the parser's debugging information on the developer console",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Fila de Notas para Revisar",
    CLOSE: "Fechar",
    NEW: "Novo",
    YESTERDAY: "Ontem",
    TODAY: "Hoje",
    TOMORROW: "Amanhã",

    // stats-modal.tsx
    STATS_TITLE: "Estatísticas",
    MONTH: "Mês",
    QUARTER: "Trimestre",
    YEAR: "Ano",
    LIFETIME: "Tempo Total",
    FORECAST: "Previsão",
    FORECAST_DESC: "O número de cartas a serem colocadas em dia no futuro",
    SCHEDULED: "Agendado",
    DAYS: "Dias",
    NUMBER_OF_CARDS: "Número de cartas",
    REVIEWS_PER_DAY: "Média: ${avg} revisões/dia",
    INTERVALS: "Intervalos",
    INTERVALS_DESC: "Atrasos até que as revisões sejam exibidas de novo",
    COUNT: "Contagem",
    INTERVALS_SUMMARY: "Intervalo em média: ${avg}, Maior intervalo: ${longest}",
    EASES: "Facilidades",
    EASES_SUMMARY: "Facilidade em média: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Tipos de Cartas",
    CARD_TYPES_DESC: "Isso também inclui cartas enterradas, caso existam",
    CARD_TYPE_NEW: "Novo",
    CARD_TYPE_YOUNG: "Jovem",
    CARD_TYPE_MATURE: "Amadurecido",
    CARD_TYPES_SUMMARY: "Total de cartas: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
