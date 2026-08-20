import { isSgfError, sgfToText } from '../src/index.ts';
import type { SgfErrorCode } from '../src/index.ts';

type UiStrings = {
  htmlLang: string;
  title: string;
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
 * The page's own labels. Kept apart from the library's locales, which describe
 * games rather than interfaces.
 */
const UI: Record<string, UiStrings> = {
  ru: {
    htmlLang: 'ru',
    title: 'sgf2text — запись партии Го текстом',
    skipLink: 'Перейти к конвертеру',
    tagline:
      'Превращает SGF-запись партии Го в текст, который читает скринридер: ход за ходом, с координатами и снятыми камнями.',
    sgfLabel: 'Вставьте SGF-запись партии',
    fileLabel: 'Или выберите файл .sgf',
    langLabel: 'Язык записи',
    convert: 'Преобразовать',
    copy: 'Скопировать текст',
    resultHeading: 'Результат',
    placeholder: 'Здесь появится запись партии.',
    privacy: 'Партия обрабатывается прямо в браузере и никуда не отправляется.',
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
    done: (moves) => `Готово. Ходов в записи: ${moves}.`,
    emptyResult: 'Копировать пока нечего: сначала преобразуйте партию.',
    copied: 'Текст скопирован в буфер обмена.',
    copyFailed: 'Не удалось скопировать. Выделите текст результата и скопируйте вручную.',
  },
  en: {
    htmlLang: 'en',
    title: 'sgf2text — a Go game as readable text',
    skipLink: 'Skip to the Converter',
    tagline:
      'Turns an SGF Go game record into text a screen reader can read out: move by move, with coordinates and captured stones.',
    sgfLabel: 'Paste an SGF game record',
    fileLabel: 'Or choose an .sgf file',
    langLabel: 'Output language',
    convert: 'Convert',
    copy: 'Copy the Text',
    resultHeading: 'Result',
    placeholder: 'The game record will appear here.',
    privacy: 'The game is converted in your browser and is never sent anywhere.',
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
    done: (moves) => `Done. Moves in the record: ${moves}.`,
    emptyResult: 'There is nothing to copy yet: convert a game first.',
    copied: 'The text has been copied to the clipboard.',
    copyFailed: 'Copying failed. Select the result text and copy it manually.',
  },
};

const need = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page is missing ${selector}`);
  }

  return element;
};

const form = need<HTMLFormElement>('#form');
const input = need<HTMLTextAreaElement>('#sgf');
const file = need<HTMLInputElement>('#file');
const language = need<HTMLSelectElement>('#lang');
const convertButton = need<HTMLButtonElement>('#convert');
const copyButton = need<HTMLButtonElement>('#copy');
const status = need<HTMLParagraphElement>('#status');
const result = need<HTMLPreElement>('#result');

const ui = (): UiStrings => UI[language.value] ?? UI.ru!;

/**
 * Announcements go through a small status line rather than making the whole
 * result a live region: a live region holding a 300-move game would be read
 * out in full on every conversion.
 */
const announce = (message: string, tone: 'info' | 'error' = 'info'): void => {
  status.textContent = message;
  status.dataset.tone = tone;

  // The status is the field's description, so a failure has to mark the field
  // invalid too — otherwise a screen reader reads the message but the input
  // still sounds fine.
  input.setAttribute('aria-invalid', tone === 'error' ? 'true' : 'false');

  if (tone === 'error') {
    input.focus();
  }
};

const showResult = (text: string): void => {
  // textContent only. A player name or comment may contain angle brackets, and
  // nothing from a game file is ever treated as markup.
  result.textContent = text;
  copyButton.setAttribute('aria-disabled', text === '' ? 'true' : 'false');
};

const countMoves = (text: string): number =>
  text.split('\n').filter((line) => /^\d+\./.test(line)).length;

const convert = (): void => {
  const strings = ui();
  const sgf = input.value.trim();

  if (sgf === '') {
    showResult('');
    announce(strings.emptyInput, 'error');
    return;
  }

  try {
    const text = sgfToText(input.value, { locale: language.value });
    showResult(text);
    announce(strings.done(countMoves(text)));
  } catch (error) {
    // The input is left exactly as the visitor typed it, so it can be corrected.
    // Only translated wording is announced: the library's own messages are
    // English, and English spliced into Russian speech is barely intelligible
    // through a screen reader.
    showResult('');
    announce(isSgfError(error) ? strings.errors[error.code] : strings.parseFailed, 'error');
  }
};

const applyLanguage = (): void => {
  const strings = ui();

  document.documentElement.lang = strings.htmlLang;
  document.title = strings.title;

  need('#skip-link').textContent = strings.skipLink;
  need('#tagline').textContent = strings.tagline;
  need('#sgf-label').textContent = strings.sgfLabel;
  need('#file-label').textContent = strings.fileLabel;
  need('#lang-label').textContent = strings.langLabel;
  need('#result-heading').textContent = strings.resultHeading;
  need('#privacy').textContent = strings.privacy;
  convertButton.textContent = strings.convert;
  copyButton.textContent = strings.copy;
  result.dataset.placeholder = strings.placeholder;
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  convert();
});

/**
 * The chosen language lives in the URL, so a link can open the page in either
 * language — useful for sending someone straight to the version they read.
 */
const rememberLanguageInUrl = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language.value);
  window.history.replaceState(null, '', url);
};

const restoreLanguageFromUrl = (): void => {
  const requested = new URL(window.location.href).searchParams.get('lang');
  if (requested !== null && requested in UI) {
    language.value = requested;
  }
};

language.addEventListener('change', () => {
  applyLanguage();
  rememberLanguageInUrl();

  // A game already converted is re-rendered, so the visitor does not have to
  // paste it again to hear it in another language.
  if (result.textContent !== '') {
    convert();
  }
});

file.addEventListener('change', () => {
  const chosen = file.files?.[0];
  if (chosen === undefined) {
    return;
  }

  chosen
    .text()
    .then((text) => {
      input.value = text;
      convert();
    })
    .catch(() => {
      announce(ui().fileFailed, 'error');
    });
});

copyButton.addEventListener('click', () => {
  const text = result.textContent ?? '';
  if (text === '') {
    // The button stays focusable while there is nothing to copy, so say why
    // rather than doing nothing when it is pressed.
    announce(ui().emptyResult, 'error');
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      announce(ui().copied);
    })
    .catch(() => {
      announce(ui().copyFailed, 'error');
    });
});

restoreLanguageFromUrl();
applyLanguage();
