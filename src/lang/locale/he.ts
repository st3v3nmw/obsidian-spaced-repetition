// Hebrew - עברית.
import { IBaseLocale } from "src/lang/base-locale";
import en from "src/lang/locale/en";

const he: IBaseLocale = {
    ...en,
    language: "he",
    languageName: "עברית",
    // flashcard-modal.tsx
    CRAM_MODE: "מצב שינון",
    REVIEW_MODE: "מצב חזרה",
    DECKS: "חפיסות",
    DUE_CARDS: "כרטיסים לחזרה",
    DUE: "לחזרה",
    NEW_CARDS: "כרטיסים חדשים",
    SEEN_CARDS: "כרטיסים שנצפו",
    SEEN: "נצפו",
    TOTAL_CARDS: "סך הכרטיסים",
    TOTAL: "סך הכל",
    BACK: "חזרה",
    SKIP: "דילוג",
    EDIT_CARD: "עריכת כרטיס",
    RESET_CARD_PROGRESS: "איפוס התקדמות הכרטיס",
    HARD: "קשה",
    GOOD: "טוב",
    EASY: "קל",
    SHOW_ANSWER: "הצג תשובה",
    CARD_PROGRESS_RESET: "התקדמות הכרטיס אופסה.",
    SAVE: "שמירה",
    CANCEL: "ביטול",
    NO_INPUT: "לא הוזן קלט.",
    CURRENT_EASE_HELP_TEXT: "קלוּת נוכחית: ",
    CURRENT_INTERVAL_HELP_TEXT: "מרווח נוכחי: ",
    CARD_GENERATED_FROM: "נוצר מתוך: ${notePath}",
    JUMP_TO: "מעבר לכרטיס",
    JUMP_TO_AND_CLOSE: "סגירה ומעבר לכרטיס",
    OPEN_IN_BACKGROUND: "פתיחת הכרטיס ברקע",
    VIEW_CARD_INFO: "הצגת פרטי הכרטיס",
    DELETE_CARD: "מחיקת כרטיס",
    DELETE_CARD_CONFIRMATION:
        "לא ניתן לבטל פעולה זו והיא עלולה לשנות את הפתקים שלך באופן לא רצוי. האם אתה בטוח שברצונך למחוק כרטיס זה?",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "פתיחת פתק לחזרה",
    REVIEW_CARDS: "חזרה על כרטיסים",
    REVIEW_DIFFICULTY_FILE_MENU: "חזרה: ${difficulty}",
    REVIEW_NOTE_DIFFICULTY_CMD: "חזרה על הפתק כ${difficulty}",
    REVIEW_CARD_DIFFICULTY_CMD: "חזרה על הכרטיס כ${difficulty}",
    CRAM_ALL_CARDS: "בחר חפיסה לשינון",
    REVIEW_ALL_CARDS: "חזרה על כרטיסים מכל הפתקים",
    REVIEW_CARDS_IN_NOTE: "חזרה על כרטיסים בפתק זה",
    CRAM_CARDS_IN_NOTE: "שינון כרטיסים בפתק זה",
    VIEW_STATS: "הצגת סטטיסטיקות",
    OPEN_REVIEW_QUEUE_VIEW: "פתיחת תור חזרת הפתקים בסרגל הצד",
    STATUS_BAR: "חזרה: ${dueNotesCount} פתק(ים), ${dueFlashcardsCount} כרטיס(ים) לחזרה",
    SYNC_TIME_TAKEN: "הסנכרון ארך ${t} מילישניות",
    NOTE_IN_IGNORED_FOLDER: "הפתק שמור בתיקייה שאינה נכללת (בדוק בהגדרות).",
    PLEASE_TAG_NOTE: "יש לתייג את הפתק כראוי לצורך חזרה (בהגדרות).",
    RESPONSE_RECEIVED: "התקבלה תגובה.",
    NO_DECK_EXISTS: "לא קיימת חפיסה עבור ${deckName}",
    ALL_CAUGHT_UP: "סיימת הכול! 😃",
    REVIEW_REMINDER_NOTICE: "הכרטיסים מוכנים לחזרה. חזור ל-Obsidian כדי להמשיך ללמוד.",

    // scheduling.ts
    DAYS_STR_IVL: "${interval} ימים",
    MONTHS_STR_IVL: "${interval} חודשים",
    YEARS_STR_IVL: "${interval} שנים",
    DAYS_STR_IVL_MOBILE: "${interval}י",
    MONTHS_STR_IVL_MOBILE: "${interval}ח",
    YEARS_STR_IVL_MOBILE: "${interval}ש",

    // settings.ts
    SETTINGS_HEADER: "חזרה מרווחת",
    GROUP_TAGS_FOLDERS: "תגיות ותיקיות",
    GROUP_FLASHCARD_REVIEW: "חזרה על כרטיסים",
    GROUP_FLASHCARD_SEPARATORS: "מפרידי כרטיסים",
    GROUP_DATA_STORAGE: "אחסון נתוני התזמון",
    GROUP_DATA_STORAGE_DESC: "בחר היכן לאחסן את נתוני התזמון",
    PLUGIN_DATA_STORE_INFO:
        "נתוני התזמון נשמרים בקובצי markdown בתוך הכספת שלך (בתיקייה שהוגדרה תחת נתוני תזמון). תזמוני הפתקים מזוהים באמצעות מזהה ייחודי (sr-id) שנוסף ל-frontmatter של כל פתק, כך שהם שורדים שינויי שם והעברות בתוך Obsidian ומחוצה לו. תזמוני הכרטיסים מזוהים באמצעות hash של טקסט הכרטיס — עריכת צד הפנים של כרטיס תאפס את תזמונו.",
    MIGRATE_TO_PLUGIN_DATA: "להעביר את נתוני התזמון לנתוני התוסף?",
    CONFIRM_MIGRATE_TO_PLUGIN_DATA:
        "כל הערות <!--SR:...--> ושדות ה-frontmatter מסוג sr-* יועברו לקובצי תזמון markdown בכספת, ושדה sr-id יתווסף ל-frontmatter של כל פתק כמזהה יציב. פעולה זו עשויה להימשך רגע בכספות גדולות. אין לערוך פתקים עד לסיום ההעברה.",
    MIGRATING_TO_PLUGIN_DATA: "מעביר את נתוני התזמון לנתוני התוסף...",
    MIGRATE_TO_NOTES: "להעביר את נתוני התזמון בחזרה לפתקים?",
    CONFIRM_MIGRATE_TO_NOTES:
        "כל נתוני התזמון ייכתבו מחדש כהערות <!--SR:...--> ושדות frontmatter מסוג sr-*. פעולה זו עשויה להימשך רגע בכספות גדולות. אין לערוך פתקים עד לסיום ההעברה.",
    MIGRATING_TO_NOTES: "מעביר את נתוני התזמון לפתקים...",
    GROUP_FLASHCARDS_NOTES: "כרטיסים ופתקים",
    GROUP_CONTRIBUTING: "תרומה לפרויקט",
    CHECK_WIKI: 'למידע נוסף, עיין ב<a href="${wikiUrl}">ויקי</a>.',
    GITHUB_DISCUSSIONS:
        'בקר בקטע ה<a href="${discussionsUrl}">דיונים</a> לעזרה, משוב ושאלות ותשובות.',
    GITHUB_ISSUES: 'פתח <a href="${issuesUrl}">כאן</a> issue אם יש לך בקשת תכונה או דיווח על באג.',
    GITHUB_SOURCE_CODE: 'קוד המקור של הפרויקט זמין ב<a href="${githubProjectUrl}">GitHub</a>.',
    CODE_CONTRIBUTION_INFO: '<a href="${codeContributionUrl}">כך</a> ניתן לתרום קוד לתוסף.',
    TRANSLATION_CONTRIBUTION_INFO:
        '<a href="${translationContributionUrl}">כך</a> ניתן לתרגם את התוסף לשפה נוספת.',
    FOLDERS_TO_IGNORE: "תיקיות שיש להתעלם מהן",
    FOLDERS_TO_IGNORE_DESC:
        "הזן נתיבי תיקיות או תבניות glob בשורות נפרדות, למשל Templates/Scripts או ‎**/*.excalidraw.md. הגדרה זו משותפת לכרטיסים ולפתקים כאחד.",
    OBSIDIAN_INTEGRATION: "שילוב בתוך Obsidian",
    FLASHCARDS: "כרטיסיות",
    FLASHCARD_EASY_LABEL: 'טקסט לחצן "קל"',
    FLASHCARD_GOOD_LABEL: 'טקסט לחצן "טוב"',
    FLASHCARD_HARD_LABEL: 'טקסט לחצן "קשה"',
    FLASHCARD_AGAIN_LABEL: 'טקסט לחצן "שוב"',
    FLASHCARD_EASY_DESC: 'התאמה אישית של התווית ללחצן "קל"',
    FLASHCARD_GOOD_DESC: 'התאמה אישית של התווית ללחצן "טוב"',
    FLASHCARD_HARD_DESC: 'התאמה אישית של התווית ללחצן "קשה"',
    FLASHCARD_AGAIN_DESC: 'התאמה אישית של התווית ללחצן "שוב"',
    REVIEW_BUTTON_DELAY: "השהיית לחיצה על הלחצנים (מילישניות)",
    REVIEW_BUTTON_DELAY_DESC: "הוסף השהיה ללחצני החזרה לפני שניתן ללחוץ עליהם שוב.",
    FLASHCARD_TAGS: "תגיות כרטיסים",
    FLASHCARD_TAGS_DESC:
        "הזן תגיות מופרדות ברווחים או בשורות חדשות, למשל ‎#flashcards #deck2 #deck3.",
    FLASHCARD_TAGS_TO_IGNORE: "תגיות שיש להתעלם מהן",
    FLASHCARD_TAGS_TO_IGNORE_DESC:
        "הזן תגיות מופרדות ברווחים או בשורות חדשות. פתקים הכוללים אחת מתגיות אלו יוחרגו מחזרת הכרטיסים.",
    CONVERT_FOLDERS_TO_DECKS: "המרת תיקיות לחפיסות ותת-חפיסות",
    CONVERT_FOLDERS_TO_DECKS_DESC: "זוהי חלופה לאפשרות תגיות הכרטיסים שלמעלה.",
    INLINE_SCHEDULING_COMMENTS: "לשמור את הערת התזמון באותה שורה כמו השורה האחרונה של הכרטיס?",
    INLINE_SCHEDULING_COMMENTS_DESC: "הפעלת אפשרות זו תמנע מהערות ה-HTML לשבור את עיצוב הרשימות.",
    BURY_SIBLINGS_TILL_NEXT_DAY: "קבירת כרטיסים אחים עד היום הבא",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "כרטיסים אחים הם כרטיסים שנוצרו מאותו טקסט כרטיס, למשל השמטות (cloze deletions)",
    SHOW_CARD_CONTEXT: "הצגת הקשר בכרטיסים",
    SHOW_CARD_CONTEXT_DESC: "למשל: כותרת > כותרת 1 > תת-כותרת > ... > תת-כותרת",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS: "הצגת מועד החזרה הבא בלחצני החזרה",
    SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC: "שימושי כדי לדעת עד כמה רחוק בעתיד הכרטיסים שלך נדחים.",
    SHOW_DELETE_BUTTON: "הצגת לחצן המחיקה",
    SHOW_DELETE_BUTTON_DESC: "מוסיף לחצן מחיקה לממשק חזרת הכרטיסים.",
    CARD_MODAL_HEIGHT_PERCENT: "אחוז גובה הכרטיס",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "רצוי להגדיר ל-100% במכשירים ניידים או אם יש לך תמונות גדולות מאוד",
    RESET_DEFAULT: "איפוס לברירת המחדל",
    CARD_MODAL_WIDTH_PERCENT: "אחוז רוחב הכרטיס",
    RANDOMIZE_CARD_ORDER: "לסדר את הכרטיסים באקראי במהלך החזרה?",
    REVIEW_CARD_ORDER_WITHIN_DECK: "סדר הצגת הכרטיסים בחפיסה במהלך החזרה",
    REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL: "לפי הסדר בתוך החפיסה (כל הכרטיסים החדשים תחילה)",
    REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL: "לפי הסדר בתוך החפיסה (כל הכרטיסים לחזרה תחילה)",
    REVIEW_CARD_ORDER_NEW_FIRST_RANDOM: "באקראי בתוך החפיסה (כל הכרטיסים החדשים תחילה)",
    REVIEW_CARD_ORDER_DUE_FIRST_RANDOM: "באקראי בתוך החפיסה (כל הכרטיסים לחזרה תחילה)",
    REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD: "כרטיס אקראי מחפיסה אקראית",
    REVIEW_DECK_ORDER: "סדר הצגת החפיסות במהלך החזרה",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL:
        "לפי הסדר (לאחר שכל הכרטיסים בחפיסה הקודמת נבדקו)",
    REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM: "באקראי (לאחר שכל הכרטיסים בחפיסה הקודמת נבדקו)",
    REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD: "כרטיס אקראי מחפיסה אקראית",
    REVIEW_REMINDERS: "תזכורות חזרה",
    REVIEW_REMINDERS_DESC:
        "בודק מעת לעת אם יש כרטיסים חדשים או כרטיסים לחזרה ומזכיר לך כאשר יש כרטיסים מוכנים לחזרה.",
    REVIEW_REMINDER_CHECK_ON_STARTUP: "בדיקה מיידית עם ההפעלה",
    REVIEW_REMINDER_CHECK_ON_STARTUP_DESC:
        "מריץ בדיקה אחת כאשר פריסת ההפעלה של Obsidian מוכנה, ללא המתנה למרווח הראשון.",
    REVIEW_REMINDER_INTERVAL: "מרווח התזכורת (דקות)",
    REVIEW_REMINDER_INTERVAL_DESC: "בודק כל N דקות. מינימום דקה אחת, מקסימום 1440 דקות.",
    REVIEW_REMINDER_INTERVAL_MIN_WARNING: "מרווח התזכורת חייב להיות מספר בין 1 ל-1440.",
    REVIEW_REMINDER_MESSAGE: "הודעת התזכורת",
    REVIEW_REMINDER_MESSAGE_DESC:
        "הודעה מותאמת אישית אופציונלית המוצגת בהתראת התזכורת. השאר ריק כדי להשתמש בהודעת ברירת המחדל.",
    REVIEW_REMINDER_AUTO_OPEN: "פתיחת החזרה אוטומטית",
    REVIEW_REMINDER_AUTO_OPEN_DESC:
        "כאשר מופעל, התזכורות פותחות ישירות את מפגש חזרת הכרטיסים הקיים.",
    REVIEW_REMINDER_SHOW_NOTICE: "הצגת התראה בעת התזכורת",
    REVIEW_REMINDER_SHOW_NOTICE_DESC: "מציג התראה זמנית כאשר מופעלת תזכורת חזרה.",
    REVIEW_REMINDER_PLAY_SOUND: "השמעת צליל בעת התזכורת",
    REVIEW_REMINDER_PLAY_SOUND_DESC: "משמיע צליל התראה קצר כאשר מופעלת תזכורת חזרה.",
    REVIEW_REMINDER_BOUNCE_DOCK: "הקפצת סמל ה-Dock בעת התזכורת",
    REVIEW_REMINDER_BOUNCE_DOCK_DESC: "במחשב שולחני, מקפיץ את סמל ה-Dock כאשר מופעלת תזכורת חזרה.",
    DISABLE_CLOZE_CARDS: "להשבית כרטיסי השמטה?",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS: "המרת תבניות השמטה לשדות קלט",
    CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC: "החלף תבניות השמטה בשדות קלט בעת חזרה על כרטיסי השמטה.",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "להמיר ==הדגשות== להשמטות",
    CONVERT_HIGHLIGHTS_TO_CLOZES_DESC:
        'הוסף/הסר את <code>${defaultPattern}</code> מ"תבניות ההשמטה" שלך',
    CONVERT_BOLD_TEXT_TO_CLOZES: "להמיר **טקסט מודגש** להשמטות",
    CONVERT_BOLD_TEXT_TO_CLOZES_DESC:
        'הוסף/הסר את <code>${defaultPattern}</code> מ"תבניות ההשמטה" שלך',
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "להמיר {{סוגריים מסולסלים}} להשמטות",
    CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC:
        'הוסף/הסר את <code>${defaultPattern}</code> מ"תבניות ההשמטה" שלך',
    CLOZE_PATTERNS: "תבניות השמטה",
    CLOZE_PATTERNS_DESC:
        'הזן תבניות השמטה מופרדות בשורות חדשות. עיין ב<a href="${docsUrl}">ויקי</a> להנחיות.',
    INLINE_CARDS_SEPARATOR: "מפריד לכרטיסים בשורה אחת",
    FIX_SEPARATORS_MANUALLY_WARNING: "שים לב שלאחר שינוי זה עליך לערוך ידנית כל כרטיס קיים.",
    INLINE_REVERSED_CARDS_SEPARATOR: "מפריד לכרטיסים הפוכים בשורה אחת",
    MULTILINE_CARDS_SEPARATOR: "מפריד לכרטיסים מרובי-שורות",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "מפריד לכרטיסים הפוכים מרובי-שורות",
    MULTILINE_CARDS_END_MARKER: "תווים המסמנים את סוף ההשמטות והכרטיסים מרובי-השורות",
    NOTES: "פתקים",
    NOTE: "פתק",
    REVIEW_PANE_ON_STARTUP: "הפעלת חלונית חזרת הפתקים בעת ההפעלה",
    TAGS_TO_REVIEW: "תגיות לחזרה",
    TAGS_TO_REVIEW_DESC: "הזן תגיות מופרדות ברווחים או בשורות חדשות, למשל ‎#review #tag2 #tag3.",
    NOTE_TAGS_TO_IGNORE: "תגיות שיש להתעלם מהן",
    NOTE_TAGS_TO_IGNORE_DESC:
        "הזן תגיות מופרדות ברווחים או בשורות חדשות. פתקים הכוללים אחת מתגיות אלו יוחרגו מחזרת הפתקים.",
    OPEN_RANDOM_NOTE: "פתיחת פתק אקראי לחזרה",
    OPEN_RANDOM_NOTE_DESC: "כאשר אפשרות זו כבויה, הפתקים מסודרים לפי חשיבות (PageRank).",
    AUTO_NEXT_NOTE: "פתיחת הפתק הבא אוטומטית לאחר חזרה",
    MAX_N_DAYS_REVIEW_QUEUE: "מספר הימים המרבי להצגה בחלונית חזרת הפתקים",
    MIN_ONE_DAY: "מספר הימים חייב להיות לפחות 1.",
    VALID_NUMBER_WARNING: "אנא הזן מספר תקין.",
    UI: "ממשק משתמש",
    OPEN_IN_TAB: "פתיחה בכרטיסייה חדשה",
    OPEN_IN_TAB_DESC: "כבה אפשרות זו כדי לפתוח את התוסף בחלון קופץ",
    STATUS_BAR_SETTINGS: "שורת המצב",
    SHOW_STATUS_BAR: "הצגת שורת המצב",
    SHOW_STATUS_BAR_DESC: "כבה אפשרות זו כדי להסתיר את כל הודעות המצב בשורת המצב של Obsidian",
    SHOW_CARD_STATUS_BAR_ITEM: "הצגת פריט הכרטיס בשורת המצב",
    SHOW_CARD_STATUS_BAR_ITEM_DESC:
        "כבה אפשרות זו כדי להסתיר את מצב חזרת הכרטיסים בשורת המצב של Obsidian",
    SHOW_NOTE_STATUS_BAR_ITEM: "הצגת פריט הפתק בשורת המצב",
    SHOW_NOTE_STATUS_BAR_ITEM_DESC:
        "כבה אפשרות זו כדי להסתיר את מצב חזרת הפתק בשורת המצב של Obsidian",
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM: 'הצגת פריט "עדכון זמין" בשורת המצב',
    SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM_DESC:
        'כבה אפשרות זו כדי להסתיר את פריט "עדכון זמין" ולהפסיק את שליפת מספר הגרסה החדש ביותר',
    SHOW_RIBBON_ICON: "הצגת סמל בסרגל הצד",
    SHOW_RIBBON_ICON_DESC: "כבה אפשרות זו כדי להסתיר את סמל התוסף מסרגל הצד של Obsidian",
    ENABLE_FILE_MENU_REVIEW_OPTIONS: "הפעלת אפשרויות החזרה בתפריט הקובץ (למשל חזרה: קל, טוב, קשה)",
    ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "אם תשבית את אפשרויות החזרה בתפריט הקובץ, תוכל לחזור על הפתקים באמצעות פקודות התוסף, ואם הגדרת אותם, קיצורי המקלדת המשויכים.",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "עצי החפיסות יוצגו בתחילה במצב מורחב",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "כבה אפשרות זו כדי לכווץ חפיסות מקוננות באותו כרטיס. שימושי אם יש לך כרטיסים השייכים לחפיסות רבות באותו קובץ.",
    ALGORITHM: "אלגוריתם",
    CHECK_ALGORITHM_WIKI: 'למידע נוסף, עיין ב<a href="${algoUrl}">פרטי האלגוריתם</a>.',
    SM2_OSR_VARIANT: "וריאנט SM-2 של OSR",
    SWITCH_TO_FSRS_ALGORITHM: "להחליף את אלגוריתם הכרטיסים ל-FSRS?",
    CONFIRM_FSRS_ALGORITHM_SWITCH:
        "מעבר ל-FSRS עלול לגרום לאובדן נתונים בלתי צפוי, מכיוון שהוא עדיין אינו נבדק מספיק! המעבר משנה את אופן עיצוב נתוני התזמון של הכרטיסים ככל שחוזרים עליהם. משמעות הדבר היא שכרטיסים שנכתבו מחדש בפורמט FSRS ידרשו הרבה יותר פרמטרים, ולכן הערת תזמון ארוכה וחודרנית יותר. נעשה מאמץ מרבי לשמור על תאימות לאחור עבור הערות התזמון, למקרה שתרצה לחזור ל-OSR. משמעות הדבר היא שנתוני התזמון שלך ייכתבו מחדש לפורמט OSR ברגע שתחזור על כרטיס כאשר OSR מופעל.",
    BASE_EASE: "קלוּת בסיס",
    BASE_EASE_DESC: "המינימום הוא 130, רצוי בסביבות 250.",
    BASE_EASE_MIN_WARNING: "קלוּת הבסיס חייבת להיות לפחות 130.",
    LAPSE_INTERVAL_CHANGE: 'שינוי המרווח כאשר חוזרים על כרטיס/פתק כ"קשה"',
    LAPSE_INTERVAL_CHANGE_DESC: "מרווחחדש = מרווחישן * שינויהמרווח / 100.",
    EASY_BONUS: "בונוס קלוּת",
    EASY_BONUS_DESC:
        'בונוס הקלוּת מאפשר לך לקבוע את ההבדל במרווחים בין מענה "טוב" ל"קל" על כרטיס/פתק (מינימום = 100%).',
    EASY_BONUS_MIN_WARNING: "בונוס הקלוּת חייב להיות לפחות 100.",
    LOAD_BALANCE: "הפעלת מאזן העומסים",
    LOAD_BALANCE_DESC: `מכוונן מעט את המרווח כך שמספר החזרות ביום יהיה עקבי יותר.
        זה כמו ה-fuzz של Anki, אך במקום להיות אקראי, הוא בוחר את היום עם מספר החזרות הנמוך ביותר.
        הוא כבוי עבור מרווחים קצרים.`,
    MAX_INTERVAL: "מרווח מרבי בימים",
    MAX_INTERVAL_DESC: "מאפשר לך לקבוע גבול עליון למרווח (ברירת מחדל = 100 שנים).",
    MAX_INTERVAL_MIN_WARNING: "המרווח המרבי חייב להיות לפחות יום אחד.",
    MAX_LINK_CONTRIB: "תרומת קישורים מרבית",
    MAX_LINK_CONTRIB_DESC: "התרומה המרבית של הקלוּת המשוקללת של פתקים מקושרים לקלוּת ההתחלתית.",
    LOGGING: "רישום ביומן",
    DISPLAY_SCHEDULING_DEBUG_INFO: "הצגת מידע ניפוי הבאגים של המתזמן במסוף המפתחים",
    DISPLAY_PARSER_DEBUG_INFO: "הצגת מידע ניפוי הבאגים של המנתח במסוף המפתחים",
    SCHEDULING: "תזמון",
    EXPERIMENTAL: "ניסיוני",
    HELP: "עזרה",
    STORE_IN_NOTES: "בתוך הפתקים",
    DELETE_SCHEDULING_DATA_ALL: "מחיקת נתוני תזמון",
    DELETE_SCHEDULING_DATA_ALL_DESC: "מחיקת נתוני התזמון מכל הפתקים והכרטיסים.",
    DELETE: "מחיקה",
    CONFIRM_SCHEDULING_DATA_ALL_DELETION:
        "האם אתה בטוח שברצונך למחוק את כל נתוני התזמון מהפתקים והכרטיסים שלך? לא ניתן לבטל פעולה זו.",
    CONFIRM: "אישור",
    SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS: "מחיקת נתוני התזמון בעיצומה...",
    SCHEDULING_DATA_HAS_BEEN_DELETED: "נתוני התזמון נמחקו מכל הפתקים והכרטיסים.",
    USE_CUSTOM_HOTKEYS: "שימוש בקיצורי מקלדת מותאמים אישית",
    USE_CUSTOM_HOTKEYS_DESC:
        "הפעלת קיצורי מקלדת מותאמים אישית לפקודות חזרת הכרטיסים. קיצורי ברירת המחדל לא יהיו פעילים לאחר הפעלת אפשרות זו. ניתן להשתמש בקיצורים המותאמים רק בעת שימוש באפשרות 'פתיחה בכרטיסייה חדשה'.",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "תור חזרת הפתקים",
    CLOSE: "סגירה",
    NEW: "חדש",
    YESTERDAY: "אתמול",
    TODAY: "היום",
    TOMORROW: "מחר",

    // stats-modal.tsx
    STATS_TITLE: "סטטיסטיקות",
    MONTH: "חודש",
    QUARTER: "רבעון",
    YEAR: "שנה",
    LIFETIME: "כל הזמן",
    FORECAST: "תחזית",
    FORECAST_DESC: "מספר הכרטיסים שיהיו לחזרה בעתיד",
    SCHEDULED: "מתוזמן",
    DAYS: "ימים",
    NUMBER_OF_CARDS: "מספר הכרטיסים",
    REVIEWS_PER_DAY: "ממוצע: ${avg} חזרות ליום",
    INTERVALS: "מרווחים",
    INTERVALS_DESC: "השהיות עד שהחזרות מוצגות שוב",
    COUNT: "כמות",
    INTERVALS_SUMMARY: "מרווח ממוצע: ${avg}, מרווח ארוך ביותר: ${longest}",
    EASES: "רמות קלוּת",
    EASES_SUMMARY: "קלוּת ממוצעת: ${avgEase}",
    EASE: "קלוּת",
    CARD_TYPES: "סוגי כרטיסים",
    CARD_TYPES_DESC: "כולל גם כרטיסים קבורים, אם ישנם",
    CARD_TYPE_NEW: "חדש",
    CARD_TYPE_YOUNG: "צעיר",
    CARD_TYPE_MATURE: "בשל",
    CARD_TYPES_SUMMARY: "סך הכרטיסים: ${totalCardsCount}",
    SEARCH: "חיפוש",
    PREVIOUS: "הקודם",
    NEXT: "הבא",

    // settings.ts
    SETTINGS_TAB_HEADING: "הגדרות",
    MAIN_SETTINGS_PAGE: "הגדרות ראשיות",

    // NoteReviewQueue.ts
    NOTE_REVIEW_QUEUE_HINT:
        "לחץ על פתק כלשהו כדי לפתוח אותו לחזרה. כדי לדרג חזרה לחץ על שלוש הנקודות שליד הפתק.",
    NOTE_REVIEW_QUEUE_EMPTY_HINT:
        "אין פתקים לחזרה. כדי להוסיף פתקים, הוסף את התגית 'review' לאחד מהפתקים שלך.",

    // StatusBarManager.ts
    OPEN_DECK_FOR_REVIEW: "פתיחת חפיסה לחזרה",
    UPDATE_AVAILABLE: "עדכון זמין",

    // Statistics
    PERIOD_TITLE: "תקופה",
    PERIOD_DESC: "פרק הזמן שיוצג בתרשימים",

    // Card controls reset button
    DELETE_SCHEDULING_DATA_OF_CURRENT_CARD: "למחוק את נתוני התזמון של הכרטיס?",
    CONFIRM_SCHEDULING_DATA_DELETION_OF_CURRENT_CARD:
        "האם אתה בטוח שברצונך למחוק את נתוני התזמון מהכרטיס הנוכחי שלך? לא ניתן לבטל פעולה זו.",
    SCHEDULING_DATA_DELETION_IN_PROGRESS_OF_CURRENT_CARD: "מוחק את נתוני התזמון של הכרטיס...",

    // Settings > Scheduling
    START_OF_DAY: "תחילת היום",
    START_OF_DAY_DESC: "השעה שבה היום מתחיל (פורמט: HH:MM:SS, ברירת מחדל: 00:00:00)",
    INVALID_START_OF_DAY_WARNING: "פורמט לא תקין לתחילת היום",

    // Settings > Scheduling > Delete
    DELETE_SCHEDULING_DATA_IN_NOTES: "מחיקת נתוני התזמון בפתקים",
    DELETE_SCHEDULING_DATA_IN_NOTES_DESC: "מחיקת נתוני התזמון מכל הפתקים.",
    DELETE_SCHEDULING_DATA_IN_CARDS: "מחיקת נתוני התזמון בכרטיסים",
    DELETE_SCHEDULING_DATA_IN_CARDS_DESC: "מחיקת נתוני התזמון מכל הכרטיסים.",
    CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION:
        "האם אתה בטוח שברצונך למחוק את כל נתוני התזמון מהפתקים שלך? לא ניתן לבטל פעולה זו.",
    CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION:
        "האם אתה בטוח שברצונך למחוק את כל נתוני התזמון מהכרטיסים שלך? לא ניתן לבטל פעולה זו.",
    SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS: "מחיקת נתוני התזמון בעיצומה...",
    SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS: "מחיקת נתוני התזמון בעיצומה...",
    // Settings > main-page
    INFO: "מידע",
    // Card responses
    AGAIN: "שוב",
    // Settings > info
    CHECK_ROADMAP: 'עיין ב<a href="${roadMapUrl}">מפת הדרכים</a> לתכונות עתידיות.',
    CHECK_DEV_NEWS: 'עיין ב<a href="${devNewsUrl}">חדשות הפיתוח</a> לעדכוני הפיתוח האחרונים.',

    OPEN_MENU: "פתיחת תפריט",
    DELETE_NOTE_SCHEDULING_DATA_IN_NOTE: "מחיקת נתוני תזמון הפתק בתוך הפתק",
    CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION:
        "האם אתה בטוח שברצונך למחוק את נתוני תזמון הפתק בפתק זה?",
    NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS: "מוחק את נתוני תזמון הפתק בפתק...",
    DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE: "מחיקת נתוני התזמון של הכרטיסים בפתק",
    CONFIRM_SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION:
        "האם אתה בטוח שברצונך למחוק את נתוני התזמון של הכרטיסים בפתק?",
    SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION_IN_PROGRESS:
        "מוחק את נתוני התזמון של הכרטיסים בפתק...",

    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA: "מחיקת תגיות בעת מחיקת נתוני תזמון",
    DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA_DESC: "מחיקת תגיות בעת מחיקת נתוני תזמון",

    ENABLE_FILE_MENU_DELETE_BUTTON: "הפעלת לחצן המחיקה בתפריט הקובץ",
    ENABLE_FILE_MENU_DELETE_BUTTON_DESC: "מפעיל את לחצן המחיקה בתפריט הקובץ עבור נתוני תזמון",

    DATA_PAGE_NAME: "נתונים",
    GROUP_RESET_SETTINGS: "איפוס הגדרות",
    GROUP_RESET_SETTINGS_DESC: "איפוס כל ההגדרות לערכי ברירת המחדל שלהן",
    RESET_SETTINGS: "איפוס הגדרות",
    CONFIRM_RESET_SETTINGS: "האם אתה בטוח שברצונך לאפס את כל ההגדרות לערכי ברירת המחדל שלהן?",
    RESET_SETTINGS_CONFIRMATION: "מאפס את כל ההגדרות לערכי ברירת המחדל שלהן...",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE: "פורמט התאריך בתור חזרת הפתקים",
    DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE_DESC:
        'פורמט התאריך בתור חזרת הפתקים (ראה <a href="${docsUrl}">moment.js</a> לפרטים). מתעדכן רק כאשר תור חזרת הפתקים נפתח מחדש.',
    MIGRATE_TO_FOLDER: "העברה לתיקייה",
    CONFIRM_MIGRATE_TO_FOLDER: "האם אתה בטוח שברצונך לעבור לאחסון בתיקייה?",
    MIGRATING_TO_FOLDER: "מעביר לאחסון בתיקייה...",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS: "שימוש ב-callouts עבור הערות התזמון",
    USE_CALLOUTS_FOR_SCHEDULING_COMMENTS_DESC:
        "השתמש כברירת מחדל ב-callout של מטא-נתוני sr עבור הערות התזמון במקום בהערות רגילות. פעולה זו תסתיר את הערות התזמון בתוך callout שנראה כמו שורה ריקה בעורך.",
    HIDE_SCHEDULING_COMMENTS_IN_LIVE_PREVIEW: "הסתרת הערות תזמון בתצוגה חיה (Live Preview)",
    HIDE_SCHEDULING_COMMENTS_IN_LIVE_PREVIEW_DESC:
        "מכווץ ומסתיר באופן אוטומטי הערות תזמון <!--SR:...--> בעורך Live Preview כאשר הסמן אינו מעל ההערה.",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_BUTTON: "העברה",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_DESC:
        "ההעברה תכניס את הערות התזמון לתוך callout של מטא-נתוני sr. callout זה נועד להסתיר את הערות התזמון.",
    CONFIRM_MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT:
        "ההעברה תשנה את כל הכרטיסים שלך. אנא גבה אותם תחילה למקרה שתרצה לבטל את ההעברה מאוחר יותר או למקרה שהיא תשבור את הכרטיסים שלך עקב באג. האם אתה בטוח שברצונך להעביר את הערות התזמון ל-callouts של מטא-נתוני sr?",
    MIGRATING_SCHEDULING_COMMENTS_TO_CALLOUT: "מעביר את הערות התזמון ל-callouts של מטא-נתוני sr...",
    MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT: "העברת הערות התזמון ל-callout של מטא-נתוני sr",
    DEFAULT_LOCALE_NAME: "- ברירת המחדל של Obsidian -",
    LANGUAGE_SETTINGS: "הגדרות שפה",
    LANGUAGE_SETTINGS_DESC:
        "בחר את השפה שבה תרצה להשתמש בממשק התוסף. שינוי זה ייכנס לתוקף מלא רק לאחר הפעלה מחדש של Obsidian.",
    DEBUG_LOG: "יומן ניפוי באגים",
    COPY: "העתקה",
    NO_DECKS_TO_REVIEW:
        "אין חפיסות עם כרטיסים לחזרה. ודא שיצרת כרטיסים כלשהם על ידי הוספת התגית 'flashcards' לפתק ולאחר מכן הוספת כרטיסים אליו (ראה בעמוד התוסף לפרטים על כך). אם עשית את כל זה ועדיין אינך רואה כאן חפיסות, ככל הנראה מדובר בבאג בתוסף. ישנו באג ידוע המתרחש כאשר חוזרים על הכרטיסים מהר מאוד, אז המערכת נתקעת והחפיסות אינן מוצגות. אנא נסה לפתוח שוב את רשימת החפיסות לאחר מספר שניות.",
};

export default he;
