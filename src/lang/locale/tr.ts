// Türkçe

export default {
    // flashcard-modal.tsx
    DECKS: "Desteler",
    DUE_CARDS: "Güncel Kartlar",
    NEW_CARDS: "Yeni Kartlar",
    TOTAL_CARDS: "Toplam Kartlar",
    BACK: "Geri",
    SKIP: "Atla",
    EDIT_CARD: "Kartı Düzenle",
    RESET_CARD_PROGRESS: "Kartın ilerlemesini sıfırla",
    HARD: "Zor",
    GOOD: "Orta",
    EASY: "Kolay",
    SHOW_ANSWER: "Cevabı Göster",
    CARD_PROGRESS_RESET: "Kartın ilerlemesi sıfırlandı.",
    SAVE: "Kaydet",
    CANCEL: "İptal",
    NO_INPUT: "Girdi sağlanmadı.",
    CURRENT_EASE_HELP_TEXT: "Mevcut Kolaylık: ",
    CURRENT_INTERVAL_HELP_TEXT: "Mevcut Aralık: ",
    CARD_GENERATED_FROM: "${notePath} kaynağından oluşturuldu.",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "Gözden geçirmek için bir not aç",
    REVIEW_CARDS: "Flash kartları gözden geçir",
    REVIEW_DIFFICULTY_FILE_MENU: "Gözden Geçir: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "Notu ${difficulty} derecesiyle gözden geçir",
    CRAM_ALL_CARDS: "Tüm destelerden yoğun tekrar yap",
    REVIEW_ALL_CARDS: "Tüm notlardaki flash kartları gözden geçir",
    REVIEW_CARDS_IN_NOTE: "Bu nottaki flash kartları gözden geçir",
    CRAM_CARDS_IN_NOTE: "Bu nottaki flash kartları yoğun tekrar yap",
    VIEW_STATS: "İstatistikleri görüntüle",
    OPEN_REVIEW_QUEUE_VIEW: "Kenar çubuğunda Not Gözden Geçirme Sırasını aç",
    STATUS_BAR: "Gözden Geçir: ${dueNotesCount} not, ${dueFlashcardsCount} kart güncel",
    SYNC_TIME_TAKEN: "Senkronizasyon ${t}ms sürdü",
    NOTE_IN_IGNORED_FOLDER: "Not, dışlanan klasörde kayıtlı (ayarları kontrol edin).",
    PLEASE_TAG_NOTE: "Lütfen gözden geçirmek için notu uygun şekilde etiketleyin (ayarlar içinde).",
    RESPONSE_RECEIVED: "Yanıt alındı.",
    NO_DECK_EXISTS: "${deckName} adında bir deste yok",
    ALL_CAUGHT_UP: "🏆 Şampiyon gibi bitirdin! 😄",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} gün",
    MONTHS_STR_IVL: "${interval} ay",
    YEARS_STR_IVL: "${interval} yıl",
    DAYS_STR_IVL_MOBILE: "${interval}g",
    MONTHS_STR_IVL_MOBILE: "${interval}a",
    YEARS_STR_IVL_MOBILE: "${interval}y",

    // settings.ts
    SETTINGS_HEADER: "Aralıklı Tekrar",
    GROUP_TAGS_FOLDERS: "Etiketler ve Klasörler",
    GROUP_FLASHCARD_REVIEW: "Flash Kartları Gözden Geçirme",
    GROUP_FLASHCARD_SEPARATORS: "Flash Kart Ayırıcıları",
    GROUP_DATA_STORAGE: "Planlama Verilerinin Saklanması",
    GROUP_DATA_STORAGE_DESC: "Choose where to store the scheduling data",
    GROUP_FLASHCARDS_NOTES: "Flash Kartlar ve Notlar",
    GROUP_CONTRIBUTING: "Katkıda Bulunma",
    CHECK_WIKI: 'Daha fazla bilgi için <a href="${wikiUrl}">wiki</a> sayfasına göz atın.',
    GITHUB_DISCUSSIONS:
        'Soru-cevap, geri bildirim ve genel tartışmalar için <a href="${discussionsUrl}">tartışmalar</a> bölümüne göz atın.',
    GITHUB_ISSUES:
        'Bir özellik isteğiniz ya da hata bildiriminiz varsa <a href="${issuesUrl}">buradan</a> bildirin.',
    GITHUB_SOURCE_CODE:
        'Proje kaynak koduna <a href="${githubProjectUrl}">GitHub</a> üzerinden ulaşabilirsiniz.',
    CODE_CONTRIBUTION_INFO:
        '<a href="${codeContributionUrl}">Kod katkıları</a> hakkında bilgi alın.',
    TRANSLATION_CONTRIBUTION_INFO:
        'Eklentiyi kendi dilinize çevirmek hakkında bilgi için <a href="${translationContributionUrl}">çeviri katkıları</a> sayfasını ziyaret edin.',
    FOLDERS_TO_IGNORE: "Yoksayılan Klasörler",
    FOLDERS_TO_IGNORE_DESC:
        "Enter folder paths or glob patterns on separate lines e.g. Templates/Scripts or **/*.excalidraw.md. This setting is common to both flashcards and notes.",
    OBSIDIAN_INTEGRATION: "Integration into Obsidian",
    FLASHCARDS: "Flash Kartlar",
    FLASHCARD_EASY_LABEL: "Kolay Butonu Metni",
    FLASHCARD_GOOD_LABEL: "Orta Butonu Metni",
    FLASHCARD_HARD_LABEL: "Zor Butonu Metni",
    FLASHCARD_EASY_DESC: '"Kolay" butonunun metnini özelleştirin',
    FLASHCARD_GOOD_DESC: '"Orta" butonunun metnini özelleştirin',
    FLASHCARD_HARD_DESC: '"Zor" butonunun metnini özelleştirin',
    REVIEW_BUTTON_DELAY: "Button Press Delay (ms)",
    REVIEW_BUTTON_DELAY_DESC: "Add a delay to the review buttons before they can be pressed again.",
    FLASHCARD_TAGS: "Flash Kart Etiketleri",
    FLASHCARD_TAGS_DESC:
        "Etiketleri boşluklar veya yeni satırlarla ayırarak girin, örneğin: #flashcards #deck2 #deck3.",
    CONVERT_FOLDERS_TO_DECKS: "Klasörleri destelere ve alt destelere dönüştür?",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "Bu, yukarıdaki Flash Kart etiketleri seçeneğine bir alternatiftir.",
    INLINE_SCHEDULING_COMMENTS: "Planlama yorumunu flash kartın son satırıyla aynı satıra kaydet?",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "Bunu açmak, HTML yorumlarının liste biçimlendirmesini bozmamasını sağlar.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "Kardeş kartları bir sonraki güne kadar gizle?",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "Kardeş kartlar, aynı kart metninden üretilen kartlardır (örneğin gizlemeler).",
    SHOW_CARD_CONTEXT: "Kartlarda bağlamı göster?",
    SHOW_CARD_CONTEXT_DESC: "Örneğin: Başlık > Başlık 1 > Alt Başlık > ... > Alt Başlık",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "Show next review time in the review buttons",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC:
        "Useful to know how far in the future your cards are being pushed.",
    CARD_MODAL_HEIGHT_PERCENT: "Flash Kart Yükseklik Yüzdesi",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "Mobilde veya çok büyük resimleriniz varsa %100 olarak ayarlayın.",
    RESET_DEFAULT: "Varsayılana sıfırla",
    CARD_MODAL_WIDTH_PERCENT: "Flash Kart Genişlik Yüzdesi",
    RANDOMIZE_CARD_ORDER: "İnceleme sırasında kart sırasını rastgele yap?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "İnceleme sırasında bir destede kartların görüntülenme sırası",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "Sıralı olarak (önce tüm yeni kartlar)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL: "Sıralı olarak (önce tüm güncel kartlar)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "Rastgele olarak (önce tüm yeni kartlar)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "Rastgele olarak (önce tüm güncel kartlar)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "Rastgele desteden rastgele kart",
    REVIEW_DECK_ORDER: "İnceleme sırasında destelerin görüntülenme sırası",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "Sıralı olarak (Önceki destedeki tüm kartlar gözden geçirildikten sonra)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM:
        "Rastgele olarak (Önceki destedeki tüm kartlar gözden geçirildikten sonra)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "Rastgele desteden rastgele kart",
    DISABLE_CLOZE_CARDS: "Gizli kartları devre dışı bırak?",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "==Vurgulanan== metni gizli kartlara dönüştür?",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        '"Cloze Patterns"den <code>${defaultPattern</code> öğesini ekleyin/kaldırın',
    CONVERT_BOLD_TEXT_TO_CLOZES: "**Kalın metni** gizli kartlara dönüştür?",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        '"Cloze Patterns"den <code>${defaultPattern</code> öğesini ekleyin/kaldırın',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "{{Kıvırcık parantezleri}} gizli kartlara dönüştür?",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        '"Cloze Patterns"den <code>${defaultPattern</code> öğesini ekleyin/kaldırın',
    CLOZE_PATTERNS: "Cloze Patterns",
    CLOZE_PATTERNS_DESC:
        'Enter cloze patterns separated by newlines. Check the <a href="${docsUrl}">wiki</a> for guidance.',
    INLINE_CARDS_SEPARATOR: "Satır içi flash kartlar için ayırıcı",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "Bunu değiştirdikten sonra mevcut flash kartlarınızı manuel olarak düzenlemeniz gerektiğini unutmayın.",
    INLINE_REVERSED_CARDS_SEPARATOR: "Satır içi ters flash kartlar için ayırıcı",
    MULTILINE_CARDS_SEPARATOR: "Çok satırlı flash kartlar için ayırıcı",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "Çok satırlı ters flash kartlar için ayırıcı",
    MULTILINE_CARDS_END_MARKER:
        "Gizli kartlar ve çok satırlı flash kartların sonunu belirten karakterler",
    NOTES: "Notlar",
    NOTE: "Note",
    REVIEW_PANE_ON_STARTUP: "Başlangıçta not inceleme panelini etkinleştir",
    TAGS_TO_REVIEW: "Gözden geçirilecek etiketler",
    TAGS_TO_REVIEW_DESC:
        "Etiketleri boşluklar veya yeni satırlarla ayırarak girin, örneğin: #review #tag2 #tag3.",
    OPEN_RANDOM_NOTE: "Gözden geçirmek için rastgele bir not aç",
    OPEN_RANDOM_NOTE_DESC: "Bunu kapattığınızda, notlar önem sırasına göre sıralanır (PageRank).",
    AUTO_NEXT_NOTE: "Bir incelemeden sonra otomatik olarak bir sonraki notu aç",
    MAX_N_DAYS_REVIEW_QUEUE: "Sağ panelde gösterilecek maksimum gün sayısı",
    MIN_ONE_DAY: "Gün sayısı en az 1 olmalıdır.",
    VALID_NUMBER_WARNING: "Lütfen geçerli bir sayı girin.",
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
        "Deste ağaçları başlangıçta genişletilmiş olarak gösterilmeli mi",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "Bunu kapatın, aynı dosyada birçok desteye ait kartlarınız varsa iç içe desteleri daraltmak için kullanışlıdır.",
    ALGORITHM: "Algoritma",
    CHECK_ALGORITHM_WIKI:
        'Daha fazla bilgi için <a href="${algoUrl}">algoritma uygulamasına</a> göz atın.',
    SM2_OSR_VARIANT: "OSR's variant of SM-2",
    BASE_EASE: "Temel kolaylık",
    BASE_EASE_DESC: "minimum = 130, tercihen yaklaşık 250.",
    BASE_EASE_MIN_WARNING: "Temel kolaylık en az 130 olmalıdır.",
    LAPSE_INTERVAL_CHANGE: "Bir flash kartı/notu zor olarak incelediğinizde aralık değişikliği",
    LAPSE_INTERVAL_CHANGE_DESC: "yeniAralık = eskiAralık * aralıkDeğişikliği / 100.",
    EASY_BONUS: "Kolaylık Bonusu",
    EASY_BONUS_DESC:
        "Kolaylık bonusu, bir flash kartı/notu İyi ve Kolay yanıtladığınızda aralıklardaki farkı ayarlamanıza olanak tanır (minimum = %100).",
    EASY_BONUS_MIN_WARNING: "Kolaylık bonusu en az %100 olmalıdır.",
    LOAD_BALANCE: "Enable load balancer",
    LOAD_BALANCE_DESC: `Slightly tweaks the interval so that the number of reviews per day is more consistent.
        It's like Anki's fuzz but instead of being random, it picks the day with the least amount of reviews.
        It's turned off for small intervals.`,
    MAX_INTERVAL: "Maksimum aralık (gün)",
    MAX_INTERVAL_DESC: "Aralığa bir üst sınır koymanıza olanak tanır (varsayılan = 100 yıl).",
    MAX_INTERVAL_MIN_WARNING: "Maksimum aralık en az 1 gün olmalıdır.",
    MAX_LINK_CONTRIB: "Maksimum bağlantı katkısı",
    MAX_LINK_CONTRIB_DESC:
        "Bağlantılı notların ağırlıklı kolaylık değerinin başlangıç kolaylığına maksimum katkısı.",
    LOGGING: "Kayıt tutma",
    DISPLAY_SCHEDULING_DEBUG_INFO: "Geliştirici konsolunda hata ayıklama bilgilerini göster",
    DISPLAY_PARSER_DEBUG_INFO:
        "Ayrıştırıcı için hata ayıklama bilgilerini geliştirici konsolunda göster",
    SCHEDULING: "Scheduling",
    EXPERIMENTAL: "Experimental",
    HELP: "Help",
    STORE_IN_NOTES: "In the notes",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "Not İnceleme Sırası",
    CLOSE: "Kapat",
    NEW: "Yeni",
    YESTERDAY: "Dün",
    TODAY: "Bugün",
    TOMORROW: "Yarın",

    // stats-modal.tsx
    STATS_TITLE: "İstatistikler",
    MONTH: "Ay",
    QUARTER: "Çeyrek",
    YEAR: "Yıl",
    LIFETIME: "Ömür Boyu",
    FORECAST: "Tahmin",
    FORECAST_DESC: "Gelecekte incelemeye alınacak kartların sayısı",
    SCHEDULED: "Planlanmış",
    DAYS: "Günler",
    NUMBER_OF_CARDS: "Kart Sayısı",
    REVIEWS_PER_DAY: "Ortalama: ${avg} inceleme/gün",
    INTERVALS: "Aralıklar",
    INTERVALS_DESC: "İncelemelerin tekrar gösterilme gecikmeleri",
    COUNT: "Sayı",
    INTERVALS_SUMMARY: "Ortalama aralık: ${avg}, En uzun aralık: ${longest}",
    EASES: "Kolaylıklar",
    EASES_SUMMARY: "Ortalama kolaylık: ${avgEase}",
    EASE: "Ease",
    CARD_TYPES: "Kart Türleri",
    CARD_TYPES_DESC: "Bu, gömülü kartları da içerir (varsa)",
    CARD_TYPE_NEW: "Yeni",
    CARD_TYPE_YOUNG: "Genç",
    CARD_TYPE_MATURE: "Olgun",
    CARD_TYPES_SUMMARY: "Toplam kart: ${totalCardsCount}",
    SEARCH: "Search",
    PREVIOUS: "Previous",
    NEXT: "Next",
};
