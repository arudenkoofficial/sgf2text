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
  /**
   * The words the heading carries beside the tool's name, and they are a separate
   * string for a reason the share control taught this page: the name is drawn, with
   * an accent mark inside it, so anything that writes over the heading's own text
   * deletes the mark. This is the tail alone, in an element of its own.
   *
   * It opens with its own separator, because how a language joins a name to a phrase
   * is that language's business rather than the markup's.
   */
  nameSuffix: string;
  tagline: string;
  fileLabel: string;
  langLabel: string;
  /**
   * Named as a phrase rather than as the bare verb, for the reason the share control
   * was: a screen reader reaches this out of any context that would say what is being
   * saved, and "Save" alone beside a game record is a promise about nothing in
   * particular.
   */
  save: string;
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
   *
   * Still translated although it is hidden from assistive technology: it is on screen,
   * and a visible paragraph left in a language the page is not in is wrong whoever is
   * reading it.
   */
  creditsBefore: string;
  creditsBetween: string;
  /**
   * A file whose text is blank.
   *
   * Announced before anything is parsed: `convert()` short-circuits on `trim() === ''`,
   * which is byte for byte the condition the library uses for `empty-input`. That is why
   * `errors['empty-input']` says the same thing and is unreachable from this page — it
   * exists because `Record<SgfErrorCode, string>` requires it, not because the page can
   * reach it. Anyone deleting the "redundant" guard in `convert()`, or merging the two
   * identical sentences, needs to know which one is load-bearing.
   *
   * The old wording told her to paste a record instead, which was an instruction to use a
   * control that no longer exists.
   */
  emptyFile: string;
  /**
   * A file the browser could not read at all — one still in the cloud rather than on the
   * device, or a handle that moved between the picker and the read.
   *
   * A function of what is left on screen, because the page is in two different states
   * afterwards and only one of them is safe to leave unsaid. Nothing examined the new
   * file, so the previous game's text is deliberately left standing — and where it is,
   * the save control is live and will write *that* game to her device, under a name
   * carrying only a timestamp. She cannot see the substitution, the file name does not
   * carry the game, and the confirmation names the file rather than what is in it. This
   * sentence is the only place she can be told.
   */
  fileFailed: (previousGameStands: boolean) => string;
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
  nothingToSave: string;
  /**
   * The two ways a file reaches her device, and they are two sentences because they
   * leave it in two places: one in her downloads, the other wherever she filed it from
   * the share sheet. She cannot look to find out which happened.
   *
   * Both name the file. A file she cannot name is a file she has to hunt for among
   * everything else in a folder, and the name is the only handle she has on it once
   * the page is closed.
   *
   * The destination leads, and the file name follows it. Both sentences opened with the
   * name — "The file sgf2text-2026.09.05-14-05.txt has been…" — which a screen reader
   * spells out at length, so the two announcements were identical for a dozen spoken
   * tokens and then differed by one verb she had to still be attending for. The fact
   * that differs goes first, where the two cannot be confused.
   *
   * The English pair also both said "to your device", which named neither place. A file
   * handed to a sheet has not reached the device yet — where it lands is the thing she
   * is being asked to decide.
   */
  savedToDevice: (name: string) => string;
  handedToSheet: (name: string) => string;
  /** The last resort: names the text still on the page, since nothing else is left to try. */
  saveFailed: string;
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
    nameSuffix: ' — a converter for blind players',
    tagline:
      'This converter turns an SGF Go file — a game record or a problem — into text: move by move, with coordinates and captured stones.',
    fileLabel: 'Choose an .sgf file',
    langLabel: 'Page language',
    save: 'Download the Game or Problem',
    appName: 'SGF to text',
    inputHeading: 'Input',
    resultHeading: 'Result',
    placeholder: 'The converted text will appear here.',
    privacy: 'The file is converted in your browser and is never sent anywhere.',
    creditsBefore: 'The idea and the shape of the output come from ',
    creditsBetween:
      ', by the Japan Go Association for the Visually Impaired. Source code: ',
    emptyFile: 'This file holds no game record and no problem.',
    fileFailed: (previousGameStands: boolean): string =>
      previousGameStands
        ? 'The file could not be read. The text on the page is still the game before it.'
        : 'The file could not be read.',
    parseFailed: 'The file could not be parsed.',
    errors: {
      'empty-input': 'This file holds no game record and no problem.',
      'not-sgf': 'This does not look like an SGF file. Check that the file is the right one.',
      'rectangular-board': 'Rectangular boards are not supported yet.',
      'unsupported-size':
        'The board is too large: the coordinates only go up to 25 columns.',
      'unreadable-size': 'The record states a board size that cannot be read.',
      'unreadable-move': 'The record contains a move that could not be read.',
      'unknown-locale': 'That language is not supported.',
    },
    done: (moves: number) => `Done. Moves in the record: ${moves}.`,
    doneProblem: (variations: number) =>
      variations === 0
        ? 'Done. This is a problem, and the file records no solution.'
        : `Done. This is a problem. Lines in the solution: ${variations}.`,
    nothingToSave: 'There is nothing to save yet: choose a file first.',
    savedToDevice: (name: string) => `Saved to your downloads: the file ${name}.`,
    handedToSheet: (name: string) =>
      `Handed to the share sheet: the file ${name}. Choose where to keep it.`,
    saveFailed:
      'The file could not be saved. The text is still on the page: select it there and copy it by hand.',
  },
  ru: {
    htmlLang: 'ru',
    title: 'sgf2text — партии и задачи Го текстом',
    description:
      'Преобразует SGF-файлы Го — и записи партий, и задачи — в текст, который читает скринридер: координаты каждого хода и снятые им камни.',
    ogLocale: 'ru_RU',
    nameSuffix: ' — конвертер для незрячих игроков',
    tagline:
      'Данный конвертер превращает SGF-файл Го — запись партии или задачу — в текст: ход за ходом, с координатами и снятыми камнями.',
    fileLabel: 'Выберите файл .sgf',
    langLabel: 'Язык страницы',
    save: 'Скачать партию/задачу',
    appName: 'SGF в текст',
    inputHeading: 'Ввод',
    resultHeading: 'Результат',
    placeholder: 'Здесь появится текст.',
    privacy: 'Файл обрабатывается прямо в браузере и никуда не отправляется.',
    creditsBefore: 'Идея и структура вывода — ',
    creditsBetween: ', Японская ассоциация Го для незрячих. Исходный код: ',
    emptyFile: 'В этом файле нет ни записи партии, ни задачи.',
    fileFailed: (previousGameStands: boolean): string =>
      previousGameStands
        ? 'Не удалось прочитать файл. На странице по-прежнему текст предыдущей партии.'
        : 'Не удалось прочитать файл.',
    parseFailed: 'Не удалось разобрать файл.',
    errors: {
      'empty-input': 'В этом файле нет ни записи партии, ни задачи.',
      'not-sgf': 'Это не похоже на SGF-файл. Проверьте, тот ли файл выбран.',
      'rectangular-board': 'Прямоугольные доски пока не поддерживаются.',
      'unsupported-size': 'Доска слишком большая: координаты доходят только до 25 столбцов.',
      'unreadable-size': 'В записи указан непонятный размер доски.',
      'unreadable-move': 'В записи есть ход, который не удалось прочитать.',
      'unknown-locale': 'Такой язык не поддерживается.',
    },
    done: (moves: number) => `Готово. Ходов в записи: ${moves}.`,
    doneProblem: (variations: number) =>
      variations === 0
        ? 'Готово. Это задача, решения в файле нет.'
        : `Готово. Это задача. Вариантов в решении: ${variations}.`,
    nothingToSave: 'Скачивать пока нечего: сначала выберите файл.',
    savedToDevice: (name: string) => `Сохранено в загрузки: файл ${name}.`,
    handedToSheet: (name: string) =>
      `Передано в меню «Поделиться»: файл ${name}. Выберите, куда сохранить.`,
    saveFailed:
      'Не удалось сохранить файл. Текст остался на странице: выделите его и скопируйте вручную.',
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
