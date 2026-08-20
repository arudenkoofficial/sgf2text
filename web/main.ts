import { isSgfError, sgfToText } from '../src/index.ts';
import {
  LANGUAGE_COOKIE,
  languageCookie,
  readCookie,
  resolveLanguage,
} from './language.ts';
import { alternateLinks, canonicalUrl } from './metadata.ts';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, stringsFor } from './ui-strings.ts';
import type { UiStrings } from './ui-strings.ts';

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

const ui = (): UiStrings => stringsFor(language.value);

/**
 * Announcements go through a small status line rather than making the whole
 * result a live region: a live region holding a 300-move game would be read
 * out in full on every conversion.
 *
 * A message arrives as a function of the strings rather than as a finished
 * sentence, so it can be rebuilt later in another language. The status line was
 * the one piece of text `applyLanguage` did not translate, and the messages that
 * outlive a switch are exactly the failures: every error path empties the result
 * first, and an empty result is what stops the game being re-converted. So an
 * error announced in English stayed under a `lang="ru"` document, which is the
 * wording a screen reader then reads out with the wrong language's phonemes.
 */
type Message = (strings: UiStrings) => string;
type Announcement = { message: Message; tone: 'info' | 'error' };

let announcement: Announcement | null = null;

const render = ({ message, tone }: Announcement): void => {
  status.textContent = message(ui());
  status.dataset.tone = tone;

  // The status is the field's description, so a failure has to mark the field
  // invalid too — otherwise a screen reader reads the message but the input
  // still sounds fine.
  input.setAttribute('aria-invalid', tone === 'error' ? 'true' : 'false');
};

const announce = (message: Message, tone: 'info' | 'error' = 'info'): void => {
  announcement = { message, tone };
  render(announcement);

  if (tone === 'error') {
    input.focus();
  }
};

/**
 * Re-renders the standing message in the current language. Deliberately not
 * `announce`: moving focus belongs to the failure that caused the message, not to
 * a later change of language. A visitor operating the language control must not
 * be thrown out of it and into the game field.
 */
const reannounce = (): void => {
  if (announcement !== null) {
    render(announcement);
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
  const sgf = input.value.trim();

  if (sgf === '') {
    showResult('');
    announce((strings) => strings.emptyInput, 'error');
    return;
  }

  try {
    const text = sgfToText(input.value, { locale: language.value });
    const moves = countMoves(text);
    showResult(text);
    announce((strings) => strings.done(moves));
  } catch (error) {
    // The input is left exactly as the visitor typed it, so it can be corrected.
    // Only translated wording is announced: the library's own messages are
    // English, and English spliced into Russian speech is barely intelligible
    // through a screen reader.
    //
    // The code is kept rather than the sentence, so the same failure can be
    // stated again if the language changes before it is dealt with.
    const code = isSgfError(error) ? error.code : null;
    showResult('');
    announce(
      (strings) => (code === null ? strings.parseFailed : strings.errors[code]),
      'error',
    );
  }
};

/**
 * The addresses are rebuilt from `location` rather than read from the HTML, so a
 * repository rename or a custom domain corrects itself for every visitor. The
 * hardcoded values in the document remain only as the floor for a crawler that
 * runs no JavaScript.
 */
const applyAddresses = (chosen: string): void => {
  // Resolved against the directory rather than assembled from `origin` and
  // `pathname`. Two reasons, both of which used to bite:
  //
  // `/sgf2text/index.html` and `/sgf2text/` are the same page, and building the
  // base from `pathname` gave each of them a canonical address naming itself — so
  // they competed as duplicates, which is the opposite of what the hreflang set is
  // here to do. `new URL('.', …)` resolves both to the directory.
  //
  // And `origin` serialises to the string "null" in a document with an opaque
  // origin, such as a sandboxed frame. `new URL('null' + '/sgf2text/')` is not a
  // valid URL, so this threw — in the middle of translating the page, leaving the
  // metadata in one language and every visible string in the other.
  const base = new URL('.', window.location.href);

  need<HTMLLinkElement>('link[rel="canonical"]').href = canonicalUrl(base, chosen);
  need<HTMLMetaElement>('meta[property="og:url"]').content = canonicalUrl(base, chosen);

  for (const { hreflang, href } of alternateLinks(base, SUPPORTED_LANGUAGES)) {
    const link = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${hreflang}"]`,
    );

    if (link !== null) {
      link.href = href;
    }
  }
};

const AIGO = 'https://aigo.tokyo/sgf-txt';
const REPOSITORY = 'https://github.com/arudenkoofficial/sgf2text';

const link = (href: string): HTMLAnchorElement => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = href.replace(/^https:\/\//, '');

  return anchor;
};

/**
 * Rebuilt from nodes rather than assigned as markup: the paragraph holds two
 * links, and this page never has a path that turns a string into HTML.
 */
const applyCredits = (strings: UiStrings): void => {
  need('#credits').replaceChildren(
    document.createTextNode(strings.creditsBefore),
    link(AIGO),
    document.createTextNode(strings.creditsBetween),
    link(REPOSITORY),
    document.createTextNode('.'),
  );
};

/**
 * The description and the link-preview tags reach a visitor before the page does
 * — in a search result, or in a link someone pasted into a chat — so they have to
 * follow the language too, not just what is visible on screen.
 */
const applyMetadata = (strings: UiStrings): void => {
  need<HTMLMetaElement>('meta[name="description"]').content = strings.description;
  need<HTMLMetaElement>('meta[property="og:title"]').content = strings.title;
  need<HTMLMetaElement>('meta[property="og:description"]').content = strings.description;
  need<HTMLMetaElement>('meta[property="og:locale"]').content = strings.ogLocale;
  applyAddresses(language.value);
};

const applyVisible = (strings: UiStrings): void => {
  // The language attribute belongs here rather than with the metadata: it is what
  // chooses the screen reader's voice, so it is read by the visitor, not by a
  // crawler, and it must never be the part that gets skipped.
  document.documentElement.lang = strings.htmlLang;
  document.title = strings.title;

  need('#skip-link').textContent = strings.skipLink;
  need('#subtitle').textContent = strings.subtitle;
  need('#tagline').textContent = strings.tagline;
  need('#sgf-label').textContent = strings.sgfLabel;
  need('#file-label').textContent = strings.fileLabel;
  need('#lang-label').textContent = strings.langLabel;
  need('#input-heading').textContent = strings.inputHeading;
  need('#result-heading').textContent = strings.resultHeading;
  need('#privacy').textContent = strings.privacy;
  applyCredits(strings);
  convertButton.textContent = strings.convert;
  copyButton.textContent = strings.copy;
  result.dataset.placeholder = strings.placeholder;
  reannounce();
};

/**
 * The visible page first, the metadata second.
 *
 * These were one sequence with the metadata at the front, so a single missing tag
 * aborted the run and left every label in one language beneath metadata already
 * rewritten into the other — the precise incoherence this change exists to
 * remove. Ordered this way, a metadata failure costs a crawler its signal and
 * costs the visitor nothing.
 *
 * A throw in here is our defect, not a condition of the visitor's browser, so
 * unlike the cookie and the address bar it is reported. The page makes no network
 * request by design, which leaves the console as the only place to report it.
 */
const applyLanguage = (): void => {
  const strings = ui();

  applyVisible(strings);

  try {
    applyMetadata(strings);
  } catch (error) {
    console.error('The page metadata could not be updated', error);
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  convert();
});

/**
 * A record in the field is unsaved work: it was pasted or read from a file, this
 * page stores nothing, and a reload loses it with no way back.
 *
 * Guarded on the field being non-empty, which keeps the dialog away from the
 * visitor who has converted nothing and is simply leaving. The browser decides
 * the wording — no message of ours is shown, and none is worth writing.
 */
window.addEventListener('beforeunload', (event) => {
  if (input.value.trim() === '') {
    return;
  }

  event.preventDefault();
});

/**
 * The chosen language lives in the URL, so a link can open the page in either
 * language — useful for sending someone straight to the version they read.
 */
const rememberLanguageInUrl = (): void => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('lang') === language.value) {
    return;
  }

  url.searchParams.set('lang', language.value);

  try {
    window.history.replaceState(null, '', url);
  } catch {
    // The same reasoning as the cookie, and the same failures: a document with an
    // opaque origin refuses a history write, and Safari refuses one after enough
    // of them in a short window. The address bar is a convenience; the page is
    // not. This used to run unguarded, and ahead of the translation, so a refusal
    // here left the language control naming a language the page was not in.
  }
};

/**
 * Reading cookies can raise a SecurityError in a sandboxed frame, and writing one
 * silently does nothing when the browser blocks them. Either way the page works in
 * full and the visitor is told nothing: a preference that could not be stored is
 * not their problem to solve.
 */
const storedLanguage = (): string | null => {
  try {
    return readCookie(document.cookie, LANGUAGE_COOKIE);
  } catch {
    return null;
  }
};

const rememberLanguageInCookie = (): void => {
  try {
    document.cookie = languageCookie(language.value);
  } catch {
    // Nothing to do and nothing to say.
  }
};

/**
 * The chain: the URL wins, then the cookie, then the language the document was
 * served in. `navigator.languages` is deliberately absent — Russian is reached
 * only by an act of choosing, so the page a visitor gets never changes without an
 * action of theirs.
 */
const restoreLanguage = (): void => {
  const { language: chosen } = resolveLanguage({
    urlParam: new URL(window.location.href).searchParams.get('lang'),
    cookie: storedLanguage(),
    supported: SUPPORTED_LANGUAGES,
    fallback: DEFAULT_LANGUAGE,
  });

  language.value = chosen;

  // The URL carries the resolved language from the start, not only after the
  // control is used. Otherwise a visitor reading Russian on the bare URL — because
  // their cookie says so — would copy an address that opens in whatever language
  // the recipient's own cookie holds, and the canonical address would disagree
  // with the one in the address bar.
  rememberLanguageInUrl();

  // A link someone was sent becomes their remembered choice, so the cookie always
  // holds the last language they actually saw.
  //
  // Written on every visit, including the ones that resolved *from* the cookie:
  // refreshing the expiry is the whole point. Skipping those visits meant the year
  // never slid forward, so a reader who chose Russian once and afterwards always
  // arrived on the bare URL lost it a year after that single choice — however
  // often she had come back in between. She is the one visitor for whom this
  // cookie is the only thing standing between her and an English page.
  rememberLanguageInCookie();
};

language.addEventListener('change', () => {
  applyLanguage();
  rememberLanguageInUrl();
  rememberLanguageInCookie();

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
      announce((strings) => strings.fileFailed, 'error');
    });
});

copyButton.addEventListener('click', () => {
  const text = result.textContent ?? '';
  if (text === '') {
    // The button stays focusable while there is nothing to copy, so say why
    // rather than doing nothing when it is pressed.
    announce((strings) => strings.emptyResult, 'error');
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      announce((strings) => strings.copied);
    })
    .catch(() => {
      announce((strings) => strings.copyFailed, 'error');
    });
});

restoreLanguage();
applyLanguage();
