import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, UI } from '../web/ui-strings.ts';

/**
 * The served document is the one thing nobody sees by accident any more: a
 * developer opening the page has it replaced by JavaScript before they look, and
 * the audience it is actually for — a crawler that runs no JavaScript — cannot
 * complain. These assertions are the only thing watching it.
 */
const html = readFileSync(fileURLToPath(new URL('../web/index.html', import.meta.url)), 'utf8');

const served = UI[DEFAULT_LANGUAGE];
assert.ok(served !== undefined, 'the served language is in the catalogue');

/**
 * A browser collapses runs of whitespace, so a sentence wrapped across two indented
 * source lines is the same text as the single-spaced string it came from. Comparing
 * the collapsed forms is what makes the assertion about the rendered page rather
 * than about where the author happened to break a line.
 */
const collapse = (text: string): string => text.replace(/\s+/g, ' ');
const flat = collapse(html);

const attribute = (pattern: RegExp): string | null => pattern.exec(html)?.[1] ?? null;

const metaByName = (name: string): string | null =>
  attribute(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 's')) ??
  attribute(new RegExp(`<meta\\s+name="${name}"\\s*\\n\\s*content="([^"]*)"`, 's'));

const metaByProperty = (property: string): string | null =>
  attribute(new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 's')) ??
  attribute(new RegExp(`<meta\\s+property="${property}"\\s*\\n\\s*content="([^"]*)"`, 's'));

test('the document declares the language it is served in', () => {
  assert.equal(attribute(/<html lang="([^"]+)"/), DEFAULT_LANGUAGE);
});

test('the title is the served language’s title', () => {
  assert.equal(attribute(/<title>([^<]*)<\/title>/), served.title);
});

test('the description is the served language’s description', () => {
  assert.equal(metaByName('description'), served.description);
});

test('the link-preview tags reuse the title and the description', () => {
  assert.equal(metaByProperty('og:title'), served.title);
  assert.equal(metaByProperty('og:description'), served.description);
  assert.equal(metaByProperty('og:locale'), served.ogLocale);
});

test('the static tags a crawler needs are present and complete', () => {
  assert.equal(metaByProperty('og:type'), 'website');
  assert.equal(metaByProperty('og:site_name'), 'sgf2text');
  assert.equal(metaByName('twitter:card'), 'summary');

  for (const tag of ['og:title', 'og:description', 'og:locale', 'og:url'] as const) {
    assert.notEqual(metaByProperty(tag), '', `${tag} is filled rather than a placeholder`);
    assert.notEqual(metaByProperty(tag), null, `${tag} exists`);
  }
});

test('X is left to fall back to the Open Graph values', () => {
  // twitter:title and twitter:description would be synchronisation work and
  // nothing else, since X reads the Open Graph tags when they are absent.
  assert.equal(metaByName('twitter:title'), null);
  assert.equal(metaByName('twitter:description'), null);
});

test('a canonical address is declared, and it is fully qualified', () => {
  const canonical = attribute(/<link rel="canonical" href="([^"]+)"/);

  assert.ok(canonical !== null, 'a canonical link exists');
  assert.match(canonical, /^https:\/\//, 'search engines require an absolute URL');
  assert.match(canonical, new RegExp(`lang=${DEFAULT_LANGUAGE}$`), 'it points at itself');
});

test('every language has an alternate, plus a default', () => {
  const alternates = [...html.matchAll(/hreflang="([^"]+)"/g)].map((match) => match[1]);

  for (const language of SUPPORTED_LANGUAGES) {
    assert.ok(
      alternates.includes(language),
      `${language} has an alternate — a language added to the catalogue but forgotten here fails this`,
    );
  }

  assert.ok(alternates.includes('x-default'), 'a default for languages not listed');
});

test('alternate addresses are absolute and name their language', () => {
  const links = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gs)];

  assert.equal(links.length, SUPPORTED_LANGUAGES.length + 1, 'one per language, plus x-default');

  for (const [, hreflang, href] of links) {
    assert.match(href ?? '', /^https:\/\//, `${hreflang} is fully qualified`);

    if (hreflang === 'x-default') {
      assert.doesNotMatch(href ?? '', /lang=/, 'x-default asserts no language');
      continue;
    }

    assert.match(href ?? '', new RegExp(`lang=${hreflang}$`), `${hreflang} names itself`);
  }
});

test('the served document holds no wording from the other language', () => {
  // The whole point of the flip: metadata in one language over body text in
  // another gives a crawler two contradictory signals, and has a screen reader
  // read one language's words with another's phonemes until the module runs.
  for (const language of SUPPORTED_LANGUAGES) {
    if (language === DEFAULT_LANGUAGE) {
      continue;
    }

    const other = UI[language];
    assert.ok(other !== undefined);

    for (const key of ['title', 'description', 'tagline', 'convert', 'privacy'] as const) {
      assert.ok(
        !flat.includes(collapse(other[key])),
        `${language}.${key} must not appear in the served document`,
      );
    }
  }
});

test('the visible strings are the served language’s', () => {
  for (const key of [
    'skipLink',
    'tagline',
    'sgfLabel',
    'fileLabel',
    'langLabel',
    'convert',
    'copy',
    'resultHeading',
    'placeholder',
    'privacy',
  ] as const) {
    assert.ok(flat.includes(collapse(served[key])), `${key} is served as "${served[key]}"`);
  }
});

test('the language control opens on the served language', () => {
  const options = [...html.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(options, [...SUPPORTED_LANGUAGES]);
  assert.equal(options[0], DEFAULT_LANGUAGE, 'no script has run yet, so the first option shows');
});
