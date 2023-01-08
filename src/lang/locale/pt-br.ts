// Português do Brasil
// Brazilian Portuguese

export default {
    // flashcard-modal.tsx
    DECKS: "Baralhos",
    DUE_CARDS: "Cartas para Colocar em Dia",
    NEW_CARDS: "Novas Cartas",
    TOTAL_CARDS: "Total de Cartas",
    BACK: "Back",
    EDIT_CARD: "Edit Card",
    RESET_CARD_PROGRESS: "Reiniciar o Progresso da Carta",
    HARD: "Difícil",
    GOOD: "OK",
    EASY: "Fácil",
    SHOW_ANSWER: "Mostrar Resposta",
    CARD_PROGRESS_RESET: "O Progresso da Carta foi reiniciado",
    SAVE: "Save",
    CANCEL: "Cancel",
    NO_INPUT: "No input provided.",
    CURRENT_EASE_HELP_TEXT: "Current Ease: ",
    CURRENT_INTERVAL_HELP_TEXT: "Current Interval: ",
    CARD_GENERATED_FROM: "Generated from: ${notePath}",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Abrir uma nota para revisar",
    REVIEW_CARDS: "Revisar flashcards",
    REVIEW_EASY_FILE_MENU: "Revisão: Fácil",
    REVIEW_GOOD_FILE_MENU: "Revisão: OK",
    REVIEW_HARD_FILE_MENU: "Revisão: Difícil",
    REVIEW_NOTE_EASY_CMD: "Revisar nota como fácil",
    REVIEW_NOTE_GOOD_CMD: "Revisar nota como OK",
    REVIEW_NOTE_HARD_CMD: "Revisar nota como difícil",
    REVIEW_ALL_CARDS: "Revisar flashcards de todas as notas",
    CRAM_ALL_CARDS: "Select a deck to cram",
    REVIEW_CARDS_IN_NOTE: "Revisar flashcards nessa nota",
    CRAM_CARDS_IN_NOTE: "Revisar todas as flashcards nessa nota",
    VIEW_STATS: "Ver estatísticas",
    STATUS_BAR:
        "Revisão: ${dueNotesCount} nota(s), ${dueFlashcardsCount} Carta(s) para colocar em dia",
    SYNC_TIME_TAKEN: "Sicronização levou ${t}ms",
    NOTE_IN_IGNORED_FOLDER: "Nota é salva na pasta ignorada (cheque as configurações).",
    PLEASE_TAG_NOTE: "Por favor etiquete a nota apropriadamente para revisar (nas configurações).",
    RESPONSE_RECEIVED: "Resposta recebida.",
    NO_DECK_EXISTS: "Nenhum baralho existe para ${deckName}",
    ALL_CAUGHT_UP: "Você colocou tudo em prazo agora :D.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} dia(s)",
    MONTHS_STR_IVL: "${interval} mês(es)",
    YEARS_STR_IVL: "${interval} ano(s)",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}a",

    // settings.ts
    SETTINGS_HEADER: "Plguin Spaced Repetition - Configuração",
    CHECK_WIKI: 'Para mais informações, checke o <a href="${wiki_url}">wiki</a>.',
    FOLDERS_TO_IGNORE: "Pastas para ignorar",
    FOLDERS_TO_IGNORE_DESC:
        "Ensira o caminho das pastas separado por quebras de linha ex: Templates Meta/Scripts",
    FLASHCARDS: "Flashcards",
    FLASHCARD_EASY_LABEL: "Texto do Botão de Fácil",
    FLASHCARD_GOOD_LABEL: "Texto do Botão de OK",
    FLASHCARD_HARD_LABEL: "Texto do Botão de Difícil",
    FLASHCARD_EASY_DESC: 'Costumize o rótulo para o botão de "Fácil"',
    FLASHCARD_GOOD_DESC: 'Costumize o rótulo para o botão de "OK"',
    FLASHCARD_HARD_DESC: 'Customize o rótulo para o botão de "Difícil"',
    FLASHCARD_TAGS: "Etiquetas dos Flashcards",
    FLASHCARD_TAGS_DESC:
        "Ensira etiquetas separadas por espaços ou quebras de linha ex: #flashcards #baralho2 #baralho3.",
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
    SHOW_CARD_CONTEXT: "Mostrar conxtexto nas cartas?",
    SHOW_CARD_CONTEXT_DESC: "ex: Título > Cabeçalho 1 > Subcabeçalho > ... > Subcabeçalho",
    CARD_MODAL_HEIGHT_PERCENT: "Porcentagem da Altura do Flashcard",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Deveria estar configurado em 100% em dispositivos móveis ou se você tem imagens muito grandes",
    RESET_DEFAULT: "Reiniciar para a pré-definição",
    CARD_MODAL_WIDTH_PERCENT: "Porcentagem de Largura do Flashcard",
    RANDOMIZE_CARD_ORDER: "Aleatorizar a ordem das cartas durante a revisão?",
    DISABLE_CLOZE_CARDS: "Desabilitar cartas que usam omissão de palavras?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Converter ==marca-texto== em omissões?",
    CONVERT_BOLD_TEXT_TO_CLOZES: "Converter **texto em negrito** em omissões?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Converter {{chaves}} em omissões?",
    INLINE_CARDS_SEPARATOR: "Separador para flashcards inline",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Note que depois de mudar isso você vai ter que manualmente mudar quaisquer flashcards que você tenha.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Separador para flashcards inline reversos",
    MULTILINE_CARDS_SEPARATOR: "Separador para flashcards de múltiplas linhas",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Separador para flashcards de múltiplas linhas reversos",
    NOTES: "Notas",
    REVIEW_PANE_ON_STARTUP: "Enable note review pane on startup",
    TAGS_TO_REVIEW: "Etiquetas para revisar",
    TAGS_TO_REVIEW_DESC:
        "Ensira etiquetas separadas por espaços ou quebra de linhas ex: #revisar #etiqueta2 #etiqueta3.",
    OPEN_RANDOM_NOTE: "Abrir uma nota aleatória para revisar",
    OPEN_RANDOM_NOTE_DESC:
        "Quando você desabilitar isso, as notas vão ser ordenadas por importância (PageRank).",
    AUTO_NEXT_NOTE: "Abrir a próxima nota automaticamente depois de uma revisão",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "Desabilitar opções de revisão no menu de arquivos ex: Revisão: Fácil OK Difícil",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "Depois de desabilitar, você pode revisar usando os atalhos de comando. Reinicie Obsidian depois de mudar isso.",
    MAX_N_DAYS_REVIEW_QUEUE: "Número máximo de dias para exibir no painel direito",
    MIN_ONE_DAY: "O número de dias deve ser pelo menos 1.",
    VALID_NUMBER_WARNING: "Por favor ensira um número válido.",
    UI_PREFERENCES: "Preferências de UI",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "Árvores de baralhos devem inicialmente serem exibidas como expandidas",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Desabilite isso para colapsar baralhos que estão um dentro do outro na mesma carta. Útil se você tem cartas que pertencem a muitos baralhos em um mesmo arquivo.",
    ALGORITHM: "Algorítmo",
    CHECK_ALGORITHM_WIKI:
        'Para mais informações, cheque a <a href="${algo_url}">implementação do algorítmo</a>.',
    BASE_EASE: "Facilidade base",
    BASE_EASE_DESC: "mínimo = 130, preferivelmente aproximadamente 250.",
    BASE_EASE_MIN_WARNING: "A facilidade base deve ser pelo menos 130.",
    LAPSE_INTERVAL_CHANGE:
        "Mudança de intervalo quando você revisa um(a) flashcard/nota como difícil",
    LAPSE_INTERVAL_CHANGE_DESC: "novoIntervalo = velhoIntervalo * mudancaIntervalo / 100.",
    EASY_BONUS: "Bônus de Fácil",
    EASY_BONUS_DESC:
        "O bônus de fácil te permite mudar a diferência entre intervalos de responder OK e Fácil em um(a) flashcard/nota (mínimo = 100%).",
    EASY_BONUS_MIN_WARNING: "O bônus de fácil deve ser pelo menos 100.",
    MAX_INTERVAL: "Intervalo Máximo",
    MAX_INTERVAL_DESC:
        "Te permite colocar um limite máximo no intervalo (pré-definição = 100 anos).",
    MAX_INTERVAL_MIN_WARNING: "O intervalo máximo deve ser pelo menos 1 dia.",
    MAX_LINK_CONTRIB: "Contribuição Máxima de Links",
    MAX_LINK_CONTRIB_DESC:
        "Contribuição máxima da facilidade ponderada das notas linkadas à facilidade inicial.",
    LOGGING: "Logging",
    DISPLAY_DEBUG_INFO: "Mostrar informação de debugging no console de desenvolvimento?",

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
    QUARTER: "Quarto",
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
    CARD_TYPES: "Tipos de Cartas",
    CARD_TYPES_DESC: "Isso também inclui cartas enterrados, caso existam",
    CARD_TYPE_NEW: "Novo",
    CARD_TYPE_YOUNG: "Jovem",
    CARD_TYPE_MATURE: "Amadurecido",
    CARD_TYPES_SUMMARY: "Total de cartas: ${totalCardsCount}",
};
