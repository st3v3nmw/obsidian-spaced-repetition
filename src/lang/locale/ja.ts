// 日本語

export default {
    // flashcard-modal.tsx
    DECKS: "デッキ",
    DUE_CARDS: "期日のカード",
    NEW_CARDS: "新規のカード",
    TOTAL_CARDS: "カード合計",
    BACK: "Back",
    EDIT_LATER: "後で編集",
    RESET_CARD_PROGRESS: "カードの進捗をリセット",
    HARD: "Hard",
    GOOD: "Good",
    EASY: "Easy",
    SHOW_ANSWER: "解答を表示",
    CARD_PROGRESS_RESET: "カードの進捗がリセットされました。",

    // main.ts
    OPEN_NOTE_FOR_REVIEW: "レビューするノートを開く",
    REVIEW_CARDS: "フラッシュカードのレビュー",
    REVIEW_EASY_FILE_MENU: "レビュー: Easy",
    REVIEW_GOOD_FILE_MENU: "レビュー: Good",
    REVIEW_HARD_FILE_MENU: "レビュー: Hard",
    REVIEW_NOTE_EASY_CMD: "ノートをEasyとしてレビューする",
    REVIEW_NOTE_GOOD_CMD: "ノートをGoodとしてレビューする",
    REVIEW_NOTE_HARD_CMD: "ノートをHardとしてレビューする",
    REVIEW_CARDS_IN_NOTE: "このノートのフラッシュカードをレビューする",
    CRAM_CARDS_IN_NOTE: "このノートのフラッシュカードを詰め込み学習する",
    REVIEW_ALL_CARDS: "すべてのノートからフラッシュカードをレビューする",
    VIEW_STATS: "統計を閲覧する",
    STATUS_BAR: "レビュー: ${dueNotesCount}ノート, ${dueFlashcardsCount}カードが期日",
    SYNC_TIME_TAKEN: "同期に${t}msかかりました。",
    NOTE_IN_IGNORED_FOLDER: "ノートが無視するフォルダに保存されています(設定を確認してください)。",
    PLEASE_TAG_NOTE:
        "レビューを行うにはノートに対して正しくタグ付けしてください(設定を確認してください)。",
    RESPONSE_RECEIVED: "答えを受け取りました。",
    NO_DECK_EXISTS: "${deckName}にはデッキが存在しません。",
    ALL_CAUGHT_UP: "今日の課題をすべて達成しました :D",

    // scheduling.ts
    DAYS_STR_IVL: "${interval}日後",
    MONTHS_STR_IVL: "${interval}月後",
    YEARS_STR_IVL: "${interval}年後",
    DAYS_STR_IVL_MOBILE: "${interval}d",
    MONTHS_STR_IVL_MOBILE: "${interval}m",
    YEARS_STR_IVL_MOBILE: "${interval}y",

    // settings.ts
    SETTINGS_HEADER: "Spaced Repetition Plugin - 設定",
    CHECK_WIKI: '詳細については<a href="${wiki_url}">wiki</a>を確認してください。',
    FOLDERS_TO_IGNORE: "無視するフォルダ",
    FOLDERS_TO_IGNORE_DESC:
        'フォルダパスを改行で区切って入力してください。"Templates Meta/Scripts" のようなスペースによる区切りでの書き方は無効です。',
    FLASHCARDS: "フラッシュカード",
    FLASHCARD_EASY_LABEL: "Easy Button Text",
    FLASHCARD_GOOD_LABEL: "Good Button Text",
    FLASHCARD_HARD_LABEL: "Hard Button Text",
    FLASHCARD_EASY_DESC: 'Customize the label for the "Easy" Button',
    FLASHCARD_GOOD_DESC: 'Customize the label for the "Good" Button',
    FLASHCARD_HARD_DESC: 'Customize the label for the "Hard" Button',
    FLASHCARD_TAGS: "フラッシュカードに使用するタグ",
    FLASHCARD_TAGS_DESC:
        'タグをスペースまたは改行で区切って入力してください。例: "#flashcards #deck2 #deck3"',
    CONVERT_FOLDERS_TO_DECKS: "フォルダをデッキとサブデッキとして使用しますか？",
    CONVERT_FOLDERS_TO_DECKS_DESC:
        "これは上記のタグを使用したデッキ構築の代替となるオプションです。",
    INLINE_SCHEDULING_COMMENTS:
        "フラッシュカードの最終行と同一の行にスケジューリングコメントを保存しますか？",
    INLINE_SCHEDULING_COMMENTS_DESC:
        "このオプションを有効化すると、HTMLコメントによってMarkdownのリストフォーマットが崩れなくなります。",
    BURY_SIBLINGS_TILL_NEXT_DAY: "次のレビューまでシブリングを延期しますか？",
    BURY_SIBLINGS_TILL_NEXT_DAY_DESC:
        "シブリングは同一のカードテキストから生成されたカード、つまり穴埋め問題の派生カードです。",
    SHOW_CARD_CONTEXT: "カードにコンテキストを表示しますか？",
    SHOW_CARD_CONTEXT_DESC:
        "｢タイトル > 見出し 1 > 副見出し > ... > 副見出し｣の表示を行うかどうかを決めます。",
    CARD_MODAL_HEIGHT_PERCENT: "フラッシュカードの縦サイズのパーセンテージ",
    CARD_MODAL_SIZE_PERCENT_DESC:
        "モバイル版、または非常に大きなサイズの画像がある場合には100%にする必要があります。",
    RESET_DEFAULT: "デフォルト値にリセットする",
    CARD_MODAL_WIDTH_PERCENT: "フラッシュカードの横サイズのパーセンテージ",
    FILENAME_OR_OPEN_FILE:
        "フラッシュカードレビューで｢後で編集｣の代わりにファイル名を表示しますか？",
    RANDOMIZE_CARD_ORDER: "レビュー中のカードの順番をランダムにしますか？",
    DISABLE_CLOZE_CARDS: "穴埋めカードを無効化しますか？",
    CONVERT_HIGHLIGHTS_TO_CLOZES: "==ハイライト==を穴埋めとして使用しますか？",
    CONVERT_BOLD_TEXT_TO_CLOZES: "**ボールド体**を穴埋めとして使用しますか？",
    CONVERT_CURLY_BRACKETS_TO_CLOZES: "{{中括弧}}を穴埋めとして使用しますか？",
    INLINE_CARDS_SEPARATOR: "インラインフラッシュカードに使用するセパレーター",
    FIX_SEPARATORS_MANUALLY_WARNING:
        "このオプションを変更する場合には、作成済みのフラッシュカードを手動で編集し直す必要があることに注意してください。",
    INLINE_REVERSED_CARDS_SEPARATOR: "インラインの表裏反転フラッシュカードに使用するセパレーター",
    MULTILINE_CARDS_SEPARATOR: "複数行のフラッシュカードに使用するセパレーター",
    MULTILINE_REVERSED_CARDS_SEPARATOR: "複数行の表裏反転フラッシュカードに使用するセパレーター",
    NOTES: "ノート",
    REVIEW_PANE_ON_STARTUP: "Enable note review pane on startup",
    TAGS_TO_REVIEW: "レビューに使用するタグ",
    TAGS_TO_REVIEW_DESC:
        'タグをスペースまたは改行で区切って入力してください。例: "#review #tag2 #tag3"',
    OPEN_RANDOM_NOTE: "ランダムにノートを開いてレビューする",
    OPEN_RANDOM_NOTE_DESC:
        "このオプションが無効化されている状態では、ノートは重要度(ページランク)による順番で表示されます。",
    AUTO_NEXT_NOTE: "レビュー後に次のノートを自動的に開く",
    DISABLE_FILE_MENU_REVIEW_OPTIONS:
        "ファイルメニューでのレビューオプションを無効化(｢レビュー: Easy｣等の項目を非表示にする)",
    DISABLE_FILE_MENU_REVIEW_OPTIONS_DESC:
        "無効化した後、コマンドホットキーを使ってレビューすることが可能になります。このオプションを変更した場合にはObsidianをリロードしてください。",
    MAX_N_DAYS_REVIEW_QUEUE: "右パネルに表示する最大の日数",
    MIN_ONE_DAY: "日数には1以上の数字を指定してください。",
    VALID_NUMBER_WARNING: "有効な数字を入力してください。",
    UI_PREFERENCES: "ユーザー インターフェイスの設定",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE: "デッキ ツリーは最初は展開して表示する必要があります",
    INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC:
        "これをオフにすると、同じカード内のネストされたデッキが折りたたまれます。同じファイルに多くのデッキに属するカードがある場合に便利です。",
    ALGORITHM: "アルゴリズム",
    CHECK_ALGORITHM_WIKI:
        '詳細については<a href="${algo_url}">アルゴリズムの実装</a>を確認してください。',
    BASE_EASE: "ベースの易しさ",
    BASE_EASE_DESC: "最小値は130ですが、 適正値はおおよそ250です。",
    BASE_EASE_MIN_WARNING: "ベースの易しさには130以上の数字を指定してください。",
    LAPSE_INTERVAL_CHANGE: "フラッシュカード/ノートをHardとしてレビューした際の間隔変更",
    LAPSE_INTERVAL_CHANGE_DESC: '"新しい間隔 = 以前の間隔 * 間隔変更 / 100" として計算されます。',
    EASY_BONUS: "Easyボーナス",
    EASY_BONUS_DESC:
        "Easyボーナスによってフラッシュカード/ノートにおける間隔の差分を設定できます(最小値 = 100%)。",
    EASY_BONUS_MIN_WARNING: "Easyボーナスには100以上の数字を指定してください。",
    MAX_INTERVAL: "間隔の最大値",
    MAX_INTERVAL_DESC: "間隔に上限値を設定することができます(デフォルト値 = 100年)。",
    MAX_INTERVAL_MIN_WARNING: "間隔の最大値には1以上の数字を指定してください。",
    MAX_LINK_CONTRIB: "リンクコントリビューションの最大値",
    MAX_LINK_CONTRIB_DESC:
        "最初の易しさに対して、リンクされたノートの重み付けされた易しさが寄与する最大値を指定してください。",
    LOGGING: "ログ管理",
    DISPLAY_DEBUG_INFO: "デベロッパーコンソールにてデバッグ情報を表示しますか？",

    // sidebar.ts
    NOTES_REVIEW_QUEUE: "ノートレビューのキュー",
    CLOSE: "閉じる",
    NEW: "新規",
    YESTERDAY: "昨日",
    TODAY: "今日",
    TOMORROW: "明日",

    // stats-modal.tsx
    STATS_TITLE: "統計",
    MONTH: "Month",
    QUARTER: "Quarter",
    YEAR: "Year",
    LIFETIME: "Lifetime",
    FORECAST: "予測",
    FORECAST_DESC: "復習期日が来るカードの枚数",
    SCHEDULED: "スケジューリング済み",
    DAYS: "日",
    NUMBER_OF_CARDS: "カード数",
    REVIEWS_PER_DAY: "平均: ${avg}レビュー/日",
    INTERVALS: "間隔",
    INTERVALS_DESC: "次のレビュー予定日",
    COUNT: "カウント",
    INTERVALS_SUMMARY: "間隔の平均値: ${avg}, 最長の間隔: ${longest}",
    EASES: "易しさ",
    EASES_SUMMARY: "易しさの平均値: ${avgEase}",
    CARD_TYPES: "カードタイプ",
    CARD_TYPES_DESC: "延期のカードがある場合にはこれに含まれます",
    CARD_TYPE_NEW: "新規",
    CARD_TYPE_YOUNG: "復習(初期)",
    CARD_TYPE_MATURE: "復習(後期)",
    CARD_TYPES_SUMMARY: "カードの合計: ${totalCardsCount}枚",
};
