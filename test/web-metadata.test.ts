import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alternateLinks, canonicalUrl } from '../web/metadata.ts';

const SUPPORTED = ['en', 'ru'] as const;
const base = new URL('https://arudenkoofficial.github.io/sgf2text/');

test('each language canonicalises to its own address', () => {
  const english = canonicalUrl(base, 'en');
  const russian = canonicalUrl(base, 'ru');

  assert.equal(english, 'https://arudenkoofficial.github.io/sgf2text/?lang=en');
  assert.equal(russian, 'https://arudenkoofficial.github.io/sgf2text/?lang=ru');

  // A shared canonical would collapse the two versions into one and make the
  // hreflang set pointless.
  assert.notEqual(english, russian);
});

test('English keeps an explicit address despite being the served language', () => {
  // The bare URL already serves English, but only `?lang=en` forces it for a
  // visitor whose cookie says Russian. One uniform rule, and the address bar
  // always matches the canonical.
  assert.match(canonicalUrl(base, 'en'), /\?lang=en$/);
});

test('the alternate set covers every language plus a default', () => {
  const alternates = alternateLinks(base, SUPPORTED);

  assert.deepEqual(
    alternates.map((alternate) => alternate.hreflang),
    ['en', 'ru', 'x-default'],
  );
});

test('x-default points at the address that serves the floor language', () => {
  const alternates = alternateLinks(base, SUPPORTED);
  const fallback = alternates.find((alternate) => alternate.hreflang === 'x-default');

  assert.equal(fallback?.href, 'https://arudenkoofficial.github.io/sgf2text/');
  assert.doesNotMatch(fallback?.href ?? '', /lang=/, 'no language is asserted');
});

test('every alternate agrees with that language canonical', () => {
  for (const { hreflang, href } of alternateLinks(base, SUPPORTED)) {
    if (hreflang === 'x-default') {
      continue;
    }

    assert.equal(href, canonicalUrl(base, hreflang), `${hreflang} is self-consistent`);
  }
});

test('addresses are fully qualified, as search engines require', () => {
  const addresses = [
    canonicalUrl(base, 'ru'),
    ...alternateLinks(base, SUPPORTED).map((alternate) => alternate.href),
  ];

  for (const address of addresses) {
    assert.match(address, /^https:\/\//, `${address} carries a scheme and a host`);
  }
});

test('addresses come from the base given, never a hardcoded host', () => {
  // A repo rename or a custom domain must need no edit here, which is why the page
  // rebuilds these from `location` at runtime rather than trusting the HTML.
  const elsewhere = new URL('https://sgf2text.example/tool/');

  assert.equal(canonicalUrl(elsewhere, 'ru'), 'https://sgf2text.example/tool/?lang=ru');
  assert.equal(
    alternateLinks(elsewhere, SUPPORTED).at(-1)?.href,
    'https://sgf2text.example/tool/',
  );
});

test('a base already carrying a query or fragment does not accumulate one', () => {
  // The page passes `location`, which may hold the previous language and an anchor
  // the visitor followed. Neither belongs in a canonical address.
  const dirty = new URL('https://arudenkoofficial.github.io/sgf2text/?lang=ru&x=1#main');

  assert.equal(canonicalUrl(dirty, 'en'), 'https://arudenkoofficial.github.io/sgf2text/?lang=en');
  assert.equal(
    alternateLinks(dirty, SUPPORTED).at(-1)?.href,
    'https://arudenkoofficial.github.io/sgf2text/',
  );
});
