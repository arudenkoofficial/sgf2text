/**
 * The addresses that tell a search engine the two languages are translations of
 * one page rather than duplicates competing with each other.
 *
 * DOM-free for the same reason as `language.ts`: the tests import it, so it is
 * typechecked without the `dom` lib.
 */

export type AlternateLink = {
  hreflang: string;
  href: string;
};

/** The query parameter that carries the language, matching the cookie's name. */
const LANGUAGE_PARAM = 'lang';

/**
 * Built from the base it is given rather than a hardcoded host, so a repository
 * rename or a custom domain needs no edit. The page passes `location`, which may
 * still carry the previous language and an anchor the visitor followed — neither
 * belongs in a canonical address, so both are dropped.
 */
const addressFor = (base: URL, language: string | null): string => {
  const address = new URL(base.href);
  address.search = '';
  address.hash = '';

  if (language !== null) {
    address.searchParams.set(LANGUAGE_PARAM, language);
  }

  return address.href;
};

/**
 * Each language canonicalises to its own address, English included. The bare URL
 * already serves English, but only `?lang=en` forces it for a visitor whose cookie
 * says Russian — and one uniform rule keeps the address bar and the canonical in
 * agreement for both languages.
 */
export const canonicalUrl = (base: URL, language: string): string => addressFor(base, language);

/**
 * One alternate per language, plus `x-default` pointing at the bare URL. That is
 * the address which serves the floor language to anyone the other alternates do
 * not cover — and since the resolution chain also ends in that language, what
 * `x-default` promises and what the URL delivers are the same thing.
 */
export const alternateLinks = (
  base: URL,
  supported: readonly string[],
): readonly AlternateLink[] => [
  ...supported.map((language) => ({ hreflang: language, href: addressFor(base, language) })),
  { hreflang: 'x-default', href: addressFor(base, null) },
];

/**
 * Which manifest belongs to a language.
 *
 * A manifest is a static file and cannot follow the language control, so there is one
 * per language and the page swaps the link. Derived from the language rather than
 * listed in the catalogue, so adding a language cannot produce an entry that names a
 * file nobody wrote — the file is either there under the derived name or the suite
 * says so.
 *
 * Relative, like every other address this page builds: the host lives in CNAME and
 * nowhere else.
 */
export const manifestAddress = (language: string): string =>
  `manifest.${language}.webmanifest`;
