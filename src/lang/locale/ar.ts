// العربية

export default {
    // flashcard-modal.tsx
    DECKS: "الرُزمَات",
    DUE_CARDS: "بطاقات مُستحقة",
    NEW_CARDS: "بطاقات جديدة",
    TOTAL_CARDS: "إجمالي البطاقات",
    BACK: "رجوع",
    SKIP: "Skip",
    EDIT_CARD: "تعديل البطاقة",
    RESET_CARD_PROGRESS: "إعادة تعيين تقدُّمْ البطاقة",
    HARD: "صعب",
    GOOD: "جيد",
    EASY: "سهل",
    SHOW_ANSWER: "أظهِر الإجابة",
    CARD_PROGRESS_RESET: ".تمَّت إعادة تعيين تقدُّم البطاقة",
    SAVE: "حفظ",
    CANCEL: "إلغاء",
    NO_INPUT: ".لم يتِم تقديم أي مُدخلات",
    CURRENT_EASE_HELP_TEXT: ":السهولة الحالية",
    CURRENT_INTERVAL_HELP_TEXT: ":الفاصل الزمني الحالي",
    CARD_GENERATED_FROM: "${notePath} :تم إنشاؤها من",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "افتح الملاحظة للمراجعة",
    REVIEW_CARDS: "مراجعة البطاقات",
    REVIEW_DIFFICULTY_FILE_MENU: "${difficulty} :مراجعة",
    REVIEW_NOTE_DIFFICULTY_CMD: "${difficulty} مراجعة الملاحظة كـ",
    CRAM_ALL_CARDS: "حدد رُزمَة للحشر",
    REVIEW_ALL_CARDS: "مراجعة البطاقات من جميع الملاحظات",
    REVIEW_CARDS_IN_NOTE: "مراجعة البطاقات  من هذه الملاحظة",
    CRAM_CARDS_IN_NOTE: "أحشر جميع بطاقات هذه الملاحظة",
    VIEW_STATS: "عرض الإحصائيات",
    OPEN_REVIEW_QUEUE_VIEW: "Open Notes Review Queue in sidebar",
    STATUS_BAR: "البطاقات المستحقة ${dueFlashcardsCount},ملاحظات ${dueNotesCount}:مراجعة",
    SYNC_TIME_TAKEN: "${t}ms استغراق المزامنة",
    NOTE_IN_IGNORED_FOLDER: ".الملاحظة يتم حفظها ضمن المجلد الذي تم تجاهله (تحقق من الإعدادات)",
    PLEASE_TAG_NOTE: ".يرجى وضع وسم على الملاحظة بشكل مناسب للمراجعة (في الإعدادات)",
    RESPONSE_RECEIVED: ".استُلمت الاستجابة",
    NO_DECK_EXISTS: "${deckName} لا يوجد رُزمَة",
    ALL_CAUGHT_UP: "😆 لقد تم القبض عليكم جميعا الآن",

    // scheduling.ts
    DAYS_STR_IVL: "يوم/أيام ${interval}",
    MONTHS_STR_IVL: "شهر/أشهر ${interval}",
    YEARS_STR_IVL: "سنة/سنوات ${interval}",
    DAYS_STR_IVL_MOBILE: "ي${interval}",
    MONTHS_STR_IVL_MOBILE: "ش${interval}",
    YEARS_STR_IVL_MOBILE: "س${interval}",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition",
    GROUP_TAGS_FOLDERS: "Tags & Folders",
    GROUP_FLASHCARD_REVIEW: "Flashcard Review",
    GROUP_FLASHCARD_SEPARATORS: "Flashcard Separators",
    GROUP_DATA_STORAGE: "Storage of Scheduling Data",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flashcards & Notes",
    GROUP_CONTRIBUTING: "Contributing",
    CHECK_WIKI: '.<a href="${wikiUrl}">wiki</a> لمزيد من المعلومات ، تحقق من',
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
    FOLDERS_TO_IGNORE: "مجلدات لتجاهلها",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "البطاقات",
    FLASHCARD_EASY_LABEL: "نص الزر سهل",
    FLASHCARD_GOOD_LABEL: "نص الزر جيد",
    FLASHCARD_HARD_LABEL: "نص الزر صعب",
    FLASHCARD_EASY_DESC: '"تخصيص التسمية للزر "سهل',
    FLASHCARD_GOOD_DESC: '"تخصيص التسمية للزر "جيد',
    FLASHCARD_HARD_DESC: '"تخصيص التسمية للزر "صعب',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "وُسوم البطاقات",
    FLASHCARD_TAGS_DESC: "#2أدخل الوُسوم مفصولة بمسافات أو أسطر جديدة ، أي بطاقات# رزمة3# رزمة",
    CONVERT_FOLDERS_TO_DECKS: "تحويل المجلدات إلى ملفات أصلية و ملفات الفرعية؟",
    CONVERT_FOLDERS_TO_DECKS_DESC: ".هذا هو بديل لخيار وسوم البطاقة أعلاه",
    INLINE_SCHEDULING_COMMENTS: "حفظ تعليق الجدولة على نفس السطر مثل السطر الأخير للبطاقة ؟",
    INLINE_SCHEDULING_COMMENTS_DESC: "لا تكسر تنسيق القائمة HTML سيؤدي تشغيل هذا إلى جعل تعليقات",
    BURY_SIBLINGS_TILL_NEXT_DAY: "أخفي البطاقات الشقيقة حتى اليوم التالي",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "cloze deletions : البطاقات الشقيقة هي بطاقات تم إنشاؤها من نفس نص البطاقة كـ",
    SHOW_CARD_CONTEXT: "إظهار السياق في البطاقات؟",
    SHOW_CARD_CONTEXT_DESC: "i.e. Title > Heading 1 > Subheading > ... > Subheading",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "نسبة ارتفاع البطاقة",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "يجب ضبطها على 100 ٪ على الهاتف المحمول أو إذا كان لديك صور كبيرة جدًا",
    RESET_DEFAULT: "إعادة تعيين إلى الافتراضي",
    CARD_MODAL_WIDTH_PERCENT: "نسبة عرض البطاقة",
    RANDOMIZE_CARD_ORDER: "ترتيب بطاقة عشوائي أثناء المراجعة؟",
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
    DISABLE_CLOZE_CARDS: "؟cloze تعطيل بطاقات",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "Convert ==highlights== to clozes",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'Add/remove the <code>${defaultPattern}</code> from your "Cloze Patterns"',
    CONVERT_BOLD_TEXT_TO_CLOZES: "Convert **bolded text** to clozes",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'Add/remove the <code>${defaultPattern}</code> from your "Cloze Patterns"',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "Convert {{curly brackets}} to clozes",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'Add/remove the <code>${defaultPattern}</code> from your "Cloze Patterns"',
    CLOZE_PATTERNS: "Cloze Patterns",
    CLOZE_PATTERNS_DESC:
        'Enter cloze patterns separated by newlines. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "فاصل من أجل البطاقات المضمنة",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "ضع في حسابك أنه بعد تغيير هذا ، يجب عليك تعديل أي بطاقات لديك بالفعل يدويًا",
    INLINE_REVERSED_CARDS_SEPARATOR: "فاصل من أجل البطاقات العكسية المضمنة",
    MULTILINE_CARDS_SEPARATOR: "فاصل من أجل البطاقات المتعددة",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "فاصل من أجل البطاقات العكسية المتعددة",
    MULTILINE_CARDS_END_MARKER: "الأحرف التي تدل على نهاية الكلوزات وبطاقات التعلم المتعددة الأسطر",
    NOTES: "ملاحظات",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "تمكين جزء مراجعة الملاحظات عند بدء التشغيل",
    TAGS_TO_REVIEW: "وسوم للمراجعة",
    TAGS_TO_REVIEW_DESC: "#أدخل الوسوم مفصولة بمسافات أو خطوط جديدة ، أي : مراجعة# وسم2# وسم3",
    OPEN_RANDOM_NOTE: "افتح ملاحظة عشوائية للمراجعة",
    OPEN_RANDOM_NOTE_DESC: "(Pagerank) عند تعطيل هذا الخيار ،الملاحظات سيتم ترتيبُها حسب الأهمية",
    AUTO_NEXT_NOTE: "افتح الملاحظة التالية تلقائيًا بعد المراجعة",
    ENABLE_FILE_MENU_REVIEW_OPTIONS:
        "فعّل خيارات المراجعة في قائمة الملف (مثال: مراجعة: سهل، جيد، صعب)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "إذا قمت بتعطيل خيارات المراجعة في قائمة الملف، يمكنك مراجعة ملاحظاتك باستخدام أوامر الإضافة وإذا كنت قد حددتها، باستخدام مفاتيح الاختصار المرتبطة.",
    MAX_N_DAYS_REVIEW_QUEUE: "الحد الأقصى لعدد الأيام التي يجب عرضها على اللوحة اليمنى",
    MIN_ONE_DAY: "يجب أن يكون عدد الأيام 1 على الأقل",
    VALID_NUMBER_WARNING: "يرجى تقديم رقم صالح",
    UI: "User Interface",
    SHOW_STATUS_BAR: "Show status bar",
    SHOW_STATUS_BAR_DESC:
        "Turn this off to hide the flashcard's review status in Obsidian's status bar",
    SHOW_RIBBON_ICON: "Show icon in the ribbon bar",
    SHOW_RIBBON_ICON_DESC: "Turn this off to hide the plugin icon from Obsidian's ribbon bar",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE:
        "يجب أن يكون العرض الشجري للرُزم موسع بحيث تطهر الملفات الفرعية كلها",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        " عطل هذا الخيار لطي الرُزم المتداخلة في نفس البطاقة , مفيد إذا كان لديك بطاقات تنتمي إلى العديد من الرُزم في نفس الملف",
    ALGORITHM: "خوارزمية",
    CHECK_ALGORITHM_WIKI: '<a href="${algoUrl}">algorithm details</a> :لمزيد من المعلومات تحقق من',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "سهولة القاعدة",
    BASE_EASE_DESC: "الحد الأدنى = 130 ، ويفضل حوالي 250.",
    BASE_EASE_MIN_WARNING: "يجب أن تكون سهولة القاعدة 130 على الأقل.",
    LAPSE_INTERVAL_CHANGE: "الفاصل الزمني يتغير عند مراجعة بطاقة/ملاحظة صعبة",
    LAPSE_INTERVAL_CHANGE_DESC: "newInterval = oldInterval * intervalChange / 100.",
    EASY_BONUS: "مكافأة سهلة",
    EASY_BONUS_DESC:
        "تتيح لك المكافأة السهلة ضبط الفرق في الفواصل الزمنية بين الرد الجيد والسهل على بطاقة/ملاحظة (الحد الأدنى = 100 ٪).",
    EASY_BONUS_MIN_WARNING: "يجب أن تكون المكافأة السهلة 100 على الأقل.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Maximum interval in days",
    MAX_INTERVAL_DESC: "يتيح لك وضع حد أعلى  للفاصل الزمني (افتراضي = 100 عام).",
    MAX_INTERVAL_MIN_WARNING: "يجب أن يكون الحد الأقصى للفاصل الزمني لمدة يوم واحد على الأقل.",
    MAX_LINK_CONTRIB: "أقصى مساهمة ارتباط",
    MAX_LINK_CONTRIB_DESC: "أقصى مساهمة للسهولة المرجحة للملاحظات المرتبطة بالسهولة الأولية.",
    LOGGING: "تسجيل",
    DISPLAY_SCHEDULING_DEBUG_INFO: "عرض معلومات التصحيح على وحدة تحكم المطور",
    DISPLAY_PARSER_DEBUG_INFO: "Show the parser's debugging information on the developer console",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "ملاحظات قائمة المراجعة",
    CLOSE: "أغلق",
    NEW: "جديد",
    YESTERDAY: "البارحة",
    TODAY: "اليوم",
    TOMORROW: "الغد",

    // stats-modal.tsx
    STATS_TITLE: "إحصائيات",
    MONTH: "شهر",
    QUARTER: "ربع السنة",
    YEAR: "سنة",
    LIFETIME: "",
    FORECAST: "",
    FORECAST_DESC: "عدد البطاقات المستحقة في المستقبل",
    SCHEDULED: "المقرر",
    DAYS: "أيام",
    NUMBER_OF_CARDS: "عدد البطاقات",
    REVIEWS_PER_DAY: "المراجعات/اليوم ${avg} :متوسط",
    INTERVALS: "فواصل زمنية",
    INTERVALS_DESC: "التأخير حتى يتم عرض المراجعات مرة أخرى",
    COUNT: "عدد",
    INTERVALS_SUMMARY: "${longest} : أطول فاصل زمني ,${avg} :متوسط الفاصل الزمني",
    EASES: "السهولة",
    EASES_SUMMARY: "${avgEase} :متوسط السهولة",
    EASE: "Ease",
    CARD_TYPES: "أنواع البطاقات",
    CARD_TYPES_DESC: "وهذا يشمل البطاقات المخفية كذلك ، إن وجدت",
    CARD_TYPE_NEW: "جديدة",
    CARD_TYPE_YOUNG: "صغيرة",
    CARD_TYPE_MATURE: "ناضجة",
    CARD_TYPES_SUMMARY: " ${totalCardsCount} :إجمالي عدد البطاقات",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
