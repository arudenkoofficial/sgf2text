/**
 * Choosing which language the page speaks, and remembering it.
 *
 * Nothing here touches the DOM, which is not tidiness for its own sake: the tests
 * live in `test/`, so this module joins the root TypeScript program, and that
 * program has no `dom` lib. A stray `document` fails `npm run typecheck` rather
 * than waiting to be noticed.
 */

/** Which of the sources decided, so the caller knows whether to store the answer. */
export type LanguageSource = 'url' | 'cookie' | 'fallback';

export type ResolvedLanguage = {
  language: string;
  source: LanguageSource;
};

/**
 * Deliberately without a browser language list. Russian is reached only by an act
 * of choosing — a link that names it, the language control, or the cookie
 * remembering one of those — so a visitor's page never changes without an action
 * of theirs. Sniffing `navigator.languages` was meant to serve the Russian-reading
 * player, but blind users commonly run an English-language system with an English
 * screen reader, making it least reliable for exactly her.
 */
export type LanguageRequest = {
  urlParam: string | null;
  cookie: string | null;
  supported: readonly string[];
  fallback: string;
};

/**
 * `ru-BY` names Russian narrowed to a region, not a different language, so a
 * region subtag falls back to its primary one. The same matcher serves the URL and
 * the cookie, so where a tag arrives from never changes how it is read.
 */
const match = (requested: string | null, supported: readonly string[]): string | null => {
  if (requested === null) {
    return null;
  }

  const wanted = requested.trim().toLowerCase();
  if (wanted === '') {
    return null;
  }

  const exact = supported.find((language) => language.toLowerCase() === wanted);
  if (exact !== undefined) {
    return exact;
  }

  const primary = wanted.split('-')[0] ?? '';

  return supported.find((language) => language.toLowerCase() === primary) ?? null;
};

/**
 * The chain, in order: the URL wins, so sending someone a link in a language
 * actually sends them that language. An unsupported value is passed over rather
 * than ending resolution, so `?lang=de` still lets the cookie have its turn.
 */
export const resolveLanguage = ({
  urlParam,
  cookie,
  supported,
  fallback,
}: LanguageRequest): ResolvedLanguage => {
  const fromUrl = match(urlParam, supported);
  if (fromUrl !== null) {
    return { language: fromUrl, source: 'url' };
  }

  const fromCookie = match(cookie, supported);
  if (fromCookie !== null) {
    return { language: fromCookie, source: 'cookie' };
  }

  return { language: fallback, source: 'fallback' };
};

export const LANGUAGE_COOKIE = 'lang';

/** A year: long enough that a player who returns seasonally is still remembered. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Reads one cookie out of a `document.cookie` header.
 *
 * The value is returned raw rather than percent-decoded. A language tag never
 * needs encoding, and decoding could throw on a hand-edited cookie — which would
 * break resolution entirely instead of letting an unrecognised value be passed
 * over, which is what the chain already does with anything it does not know.
 */
export const readCookie = (header: string, name: string): string | null => {
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) {
      continue;
    }

    // An exact name, so `mylang` is never mistaken for `lang`.
    if (pair.slice(0, separator).trim() !== name) {
      continue;
    }

    const value = pair.slice(separator + 1).trim();
    if (value === '') {
      return null;
    }

    return value;
  }

  return null;
};

/**
 * `SameSite=Lax`, never `Strict`: `Strict` withholds the cookie on a cross-site
 * top-level navigation, which is precisely how someone arrives from a link in a
 * chat — the one visit where a remembered language matters most.
 *
 * The value is a language tag and nothing else. This is the only thing on a page
 * that promises to keep a game in the browser which now travels to the host, and
 * it should stay boring enough to say so in one sentence.
 */
export const languageCookie = (language: string): string =>
  `${LANGUAGE_COOKIE}=${language}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`;
