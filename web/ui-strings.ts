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
  tagline: string;
  sgfLabel: string;
  fileLabel: string;
  langLabel: string;
  convert: string;
  copy: string;
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
  emptyInput: string;
  fileFailed: string;
  parseFailed: string;
  errors: Record<SgfErrorCode, string>;
  done: (moves: number) => string;
  emptyResult: string;
  copied: string;
  copyFailed: string;
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
    title: 'sgf2text — a Go game as readable text',
    // Shorter and flatter than the tagline: this one is read out of a search
    // result or a link preview, out of any context that would explain it.
    description:
      'Converts an SGF Go game record into plain text a screen reader can speak, with the coordinates of every move and the stones it captures.',
    ogLocale: 'en_US',
    skipLink: 'Skip to the Converter',
    tagline:
      'Turns an SGF Go game record into text a screen reader can read out: move by move, with coordinates and captured stones.',
    sgfLabel: 'Paste an SGF game record',
    fileLabel: 'Or choose an .sgf file',
    langLabel: 'Page language',
    convert: 'Convert',
    copy: 'Copy the Text',
    resultHeading: 'Result',
    placeholder: 'The game record will appear here.',
    privacy: 'The game is converted in your browser and is never sent anywhere.',
    creditsBefore: 'The idea and the shape of the output come from ',
    creditsBetween:
      ', by the Japan Go Association for the Visually Impaired. Source code: ',
    emptyInput: 'The field is empty: paste a game record or choose a file.',
    fileFailed: 'The file could not be read.',
    parseFailed: 'The game record could not be parsed.',
    errors: {
      'empty-input': 'The field is empty: paste a game record or choose a file.',
      'not-sgf': 'This does not look like an SGF game record. Check that the file is the right one.',
      'rectangular-board': 'Rectangular boards are not supported yet.',
      'unreadable-size': 'The record states a board size that cannot be read.',
      'unreadable-move': 'The record contains a move that could not be read.',
      'unknown-locale': 'That language is not supported.',
    },
    done: (moves: number) => `Done. Moves in the record: ${moves}.`,
    emptyResult: 'There is nothing to copy yet: convert a game first.',
    copied: 'The text has been copied to the clipboard.',
    copyFailed: 'Copying failed. Select the result text and copy it manually.',
  },
  ru: {
    htmlLang: 'ru',
    title: 'sgf2text — запись партии Го текстом',
    description:
      'Преобразует SGF-запись партии Го в текст, который читает скринридер: координаты каждого хода и снятые им камни.',
    ogLocale: 'ru_RU',
    skipLink: 'Перейти к конвертеру',
    tagline:
      'Превращает SGF-запись партии Го в текст, который читает скринридер: ход за ходом, с координатами и снятыми камнями.',
    sgfLabel: 'Вставьте SGF-запись партии',
    fileLabel: 'Или выберите файл .sgf',
    langLabel: 'Язык страницы',
    convert: 'Преобразовать',
    copy: 'Скопировать текст',
    resultHeading: 'Результат',
    placeholder: 'Здесь появится запись партии.',
    privacy: 'Партия обрабатывается прямо в браузере и никуда не отправляется.',
    creditsBefore: 'Идея и структура вывода — ',
    creditsBetween: ', Японская ассоциация Го для незрячих. Исходный код: ',
    emptyInput: 'Поле пустое: вставьте запись партии или выберите файл.',
    fileFailed: 'Не удалось прочитать файл.',
    parseFailed: 'Не удалось разобрать запись партии.',
    errors: {
      'empty-input': 'Поле пустое: вставьте запись партии или выберите файл.',
      'not-sgf': 'Это не похоже на SGF-запись партии. Проверьте, тот ли файл выбран.',
      'rectangular-board': 'Прямоугольные доски пока не поддерживаются.',
      'unreadable-size': 'В записи указан непонятный размер доски.',
      'unreadable-move': 'В записи есть ход, который не удалось прочитать.',
      'unknown-locale': 'Такой язык не поддерживается.',
    },
    done: (moves: number) => `Готово. Ходов в записи: ${moves}.`,
    emptyResult: 'Копировать пока нечего: сначала преобразуйте партию.',
    copied: 'Текст скопирован в буфер обмена.',
    copyFailed: 'Не удалось скопировать. Выделите текст результата и скопируйте вручную.',
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
