import type { LocaleId, SgfErrorCode } from '../src/index.ts';

/**
 * The page's own labels. Kept apart from the library's locales, which describe
 * games rather than interfaces.
 *
 * Also kept apart from the DOM wiring in `main.ts`, so a test can read these
 * strings and check them against what `web/index.html` actually serves. That
 * served document is the one thing nobody sees by accident any more: JavaScript
 * replaces it before a developer looks at the page.
 */
export type UiStrings = {
  htmlLang: string;
  title: string;
  description: string;
  ogLocale: string;
  skipLink: string;
  /**
   * A line between the name and the tagline: it says what the page makes, where
   * the name only says what it is called. Kept in this table rather than left in
   * the HTML, because the HTML is served in one language and this line has to
   * follow the language control like everything else on the page.
   */
  subtitle: string;
  tagline: string;
  sgfLabel: string;
  fileLabel: string;
  langLabel: string;
  convert: string;
  copy: string;
  /**
   * Named as a phrase rather than as the bare verb the other buttons use: a screen
   * reader reaches this out of any context that would say what is being shared, and
   * "Share" alone beside a game record reads as an offer to share the game.
   */
  share: string;
  /**
   * The name offered for a home screen icon, which is not the document title — that
   * one is a sentence, and iOS truncates an icon label to about a dozen characters.
   * Translated, because this label ends up among the reader's own language on her
   * home screen and is read out there every time she looks for the tool.
   */
  appName: string;
  /**
    * The two departments are headed rather than merely numbered: the numerals beside
    * them are decoration a screen reader is better off not reading, so the heading
    * carries the meaning and the numeral is hidden from the accessibility tree.
    */
  inputHeading: string;
  resultHeading: string;
  placeholder: string;
  privacy: string;
  /**
   * The credits paragraph wraps two links, so it arrives in the pieces between
   * them rather than as one string. It was never in this table before, which made
   * it the one paragraph that stayed in whichever language the HTML happened to be
   * written in.
   */
  creditsBefore: string;
  creditsBetween: string;
  /**
   * The disclosure holding the home screen instruction. Collapsed by default: a
   * reader who listens to the page linearly pays for every permanent paragraph on
   * every visit, and this text is needed once.
   */
  keepSummary: string;
  /**
   * Why this is words rather than a button: on iOS, "Add to Home Screen" belongs to
   * Safari's own share menu and is not reachable from a page's share sheet. The text
   * says so, because a visitor who cannot find a control assumes she missed it — and
   * looking for something that does not exist is the more expensive failure.
   *
   * Every control it mentions is named as a screen reader announces it. Instructions
   * written for sighted readers say "the square with an arrow", which tells a blind
   * visitor neither where the control is nor what she will hear when she reaches it.
   */
  keepInstruction: string;
  emptyInput: string;
  fileFailed: string;
  parseFailed: string;
  errors: Record<SgfErrorCode, string>;
  done: (moves: number) => string;
  /**
   * Separate from `done`, and not a plural of it. A problem's answer is a set of
   * lines rather than one run of moves, and the moves of every line added
   * together is a number about nothing.
   *
   * Zero is its own sentence rather than a count of nothing, for the reason
   * `locale.solution` gives one layer down: "lines in the solution: 0" is heard
   * as a number, and a listener who hears a number waits for the list. The page
   * used to say it while the result beside it read "the file records no
   * solution" — a count and a denial of the same fact, in that order.
   */
  doneProblem: (variations: number) => string;
  emptyResult: string;
  copied: string;
  copyFailed: string;
  shared: string;
  /**
   * Distinct from `copied`, which describes the converted text. Two controls put two
   * different things on the clipboard, and a visitor cannot look at it to find out
   * which one she has.
   */
  addressCopied: string;
  /** The last resort: names the browser's own control, since the page has nothing left to try. */
  shareFailed: string;
};

/**
 * English first, because English is what the document is served in: the language
 * control must open on the language the page is already in, and the alternate
 * links are emitted in this order.
 *
 * Checked against the library's own `LocaleId` rather than `Record<string, …>`,
 * which ties the page's languages to the ones the converter can actually render.
 * Adding a language here without adding a locale to the library would otherwise
 * translate the whole page and leave every conversion failing with "that language
 * is not supported" — in the newly added language.
 *
 * `htmlLang: L` pins each entry's tag to the key it is filed under, so an entry
 * cannot claim a language other than its own. That tag becomes
 * `documentElement.lang`, which is what chooses the screen reader's voice.
 */
const CATALOGUE = {
  en: {
    htmlLang: 'en',
    title: 'sgf2text — Go games and problems as readable text',
    // Shorter and flatter than the tagline: this one is read out of a search
    // result or a link preview, out of any context that would explain it.
    description:
      'Converts SGF Go files — game records and problems alike — into plain text a screen reader can speak, with the coordinates of every move and the stones it captures.',
    ogLocale: 'en_US',
    skipLink: 'Skip to the Converter',
    subtitle: 'Game records and problems, written out as text',
    tagline:
      'Turns an SGF Go file — a game record or a problem — into text a screen reader can read out: move by move, with coordinates and captured stones.',
    sgfLabel: 'Paste an SGF game record or problem',
    fileLabel: 'Or choose an .sgf file',
    langLabel: 'Page language',
    convert: 'Convert',
    copy: 'Copy the Text',
    share: 'Share the Page',
    appName: 'SGF to text',
    inputHeading: 'Input',
    resultHeading: 'Result',
    placeholder: 'The converted text will appear here.',
    privacy: 'The file is converted in your browser and is never sent anywhere.',
    creditsBefore: 'The idea and the shape of the output come from ',
    creditsBetween:
      ', by the Japan Go Association for the Visually Impaired. Source code: ',
    keepSummary: 'Keep this page on your home screen',
    keepInstruction:
      'Open your browser’s Share control and choose “Add to Home Screen”. In Safari on iPhone that control is in the toolbar at the bottom of the screen, and VoiceOver announces it as “Share”. This page cannot do it for you: adding an icon is the browser’s own action, and a page is not allowed to perform it.',
    emptyInput: 'The field is empty: paste a game record or a problem, or choose a file.',
    fileFailed: 'The file could not be read.',
    parseFailed: 'The file could not be parsed.',
    errors: {
      'empty-input': 'The field is empty: paste a game record or a problem, or choose a file.',
      'not-sgf': 'This does not look like an SGF file. Check that the file is the right one.',
      'rectangular-board': 'Rectangular boards are not supported yet.',
      'unreadable-size': 'The record states a board size that cannot be read.',
      'unreadable-move': 'The record contains a move that could not be read.',
      'unknown-locale': 'That language is not supported.',
    },
    done: (moves: number) => `Done. Moves in the record: ${moves}.`,
    doneProblem: (variations: number) =>
      variations === 0
        ? 'Done. This is a problem, and the file records no solution.'
        : `Done. This is a problem. Lines in the solution: ${variations}.`,
    emptyResult: 'There is nothing to copy yet: convert a file first.',
    copied: 'The text has been copied to the clipboard.',
    copyFailed: 'Copying failed. Select the result text and copy it manually.',
    shared: 'The page has been shared.',
    addressCopied: 'The address of this page has been copied to the clipboard.',
    shareFailed: 'Sharing failed. Use your browser’s own Share control instead.',
  },
  ru: {
    htmlLang: 'ru',
    title: 'sgf2text — партии и задачи Го текстом',
    description:
      'Преобразует SGF-файлы Го — и записи партий, и задачи — в текст, который читает скринридер: координаты каждого хода и снятые им камни.',
    ogLocale: 'ru_RU',
    skipLink: 'Перейти к конвертеру',
    subtitle: 'Партии и задачи — текстом',
    tagline:
      'Превращает SGF-файл Го — запись партии или задачу — в текст, который читает скринридер: ход за ходом, с координатами и снятыми камнями.',
    sgfLabel: 'Вставьте SGF: запись партии или задачу',
    fileLabel: 'Или выберите файл .sgf',
    langLabel: 'Язык страницы',
    convert: 'Преобразовать',
    copy: 'Скопировать текст',
    share: 'Поделиться страницей',
    appName: 'SGF в текст',
    inputHeading: 'Ввод',
    resultHeading: 'Результат',
    placeholder: 'Здесь появится текст.',
    privacy: 'Файл обрабатывается прямо в браузере и никуда не отправляется.',
    creditsBefore: 'Идея и структура вывода — ',
    creditsBetween: ', Японская ассоциация Го для незрячих. Исходный код: ',
    keepSummary: 'Сохранить страницу на домашний экран',
    keepInstruction:
      'Откройте в браузере элемент «Поделиться» и выберите «На экран „Домой“». В Safari на iPhone этот элемент находится на панели инструментов внизу экрана, VoiceOver называет его «Поделиться». Сама страница этого сделать не может: добавление значка — действие браузера, странице оно недоступно.',
    emptyInput: 'Поле пустое: вставьте запись партии или задачу либо выберите файл.',
    fileFailed: 'Не удалось прочитать файл.',
    parseFailed: 'Не удалось разобрать файл.',
    errors: {
      'empty-input': 'Поле пустое: вставьте запись партии или задачу либо выберите файл.',
      'not-sgf': 'Это не похоже на SGF-файл. Проверьте, тот ли файл выбран.',
      'rectangular-board': 'Прямоугольные доски пока не поддерживаются.',
      'unreadable-size': 'В записи указан непонятный размер доски.',
      'unreadable-move': 'В записи есть ход, который не удалось прочитать.',
      'unknown-locale': 'Такой язык не поддерживается.',
    },
    done: (moves: number) => `Готово. Ходов в записи: ${moves}.`,
    doneProblem: (variations: number) =>
      variations === 0
        ? 'Готово. Это задача, решения в файле нет.'
        : `Готово. Это задача. Вариантов в решении: ${variations}.`,
    emptyResult: 'Копировать пока нечего: сначала преобразуйте файл.',
    copied: 'Текст скопирован в буфер обмена.',
    copyFailed: 'Не удалось скопировать. Выделите текст результата и скопируйте вручную.',
    shared: 'Страница отправлена.',
    addressCopied: 'Адрес страницы скопирован в буфер обмена.',
    shareFailed:
      'Не удалось поделиться. Воспользуйтесь элементом «Поделиться» в самом браузере.',
  },
} satisfies { [L in LocaleId]: UiStrings & { htmlLang: L } };

export const UI: Record<string, UiStrings> = CATALOGUE;

/**
 * The language the document is served in, and the last resort of the resolution
 * chain. One constant for both, so the served page and the fallback cannot drift
 * apart into a page that visibly changes language after it loads.
 */
export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES: readonly string[] = Object.keys(CATALOGUE);

export const stringsFor = (language: string): UiStrings =>
  UI[language] ?? CATALOGUE[DEFAULT_LANGUAGE];
