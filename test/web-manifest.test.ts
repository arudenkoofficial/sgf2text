import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { manifestAddress } from '../web/metadata.ts';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, UI } from '../web/ui-strings.ts';

/**
 * The manifests are read by nobody who can complain. A visitor sees their effects only
 * at the moment she adds the page to her home screen, and by then a wrong value has
 * already become an icon she is stuck with.
 *
 * There is one per language, because the platform decides whether the icon is named
 * from the manifest or from `apple-mobile-web-app-title`, and that decision is not the
 * page's to make. A single manifest would leave one of the two sources holding a name
 * in a language she does not read.
 */
const path = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const html = readFileSync(path('../web/index.html'), 'utf8');

const served = UI[DEFAULT_LANGUAGE];
assert.ok(served !== undefined);

type Icon = { src: string; sizes: string; type?: string; purpose?: string };
type Manifest = {
  name?: string;
  short_name?: string;
  lang?: string;
  description?: string;
  icons?: Icon[];
  theme_color?: string;
  background_color?: string;
  display?: string;
  start_url?: string;
  scope?: string;
};

const file = (language: string): string => path(`../web/${manifestAddress(language)}`);

const source = (language: string): string | null =>
  existsSync(file(language)) ? readFileSync(file(language), 'utf8') : null;

const manifestFor = (language: string): Manifest => {
  const text = source(language);
  assert.ok(text !== null, `web/${manifestAddress(language)} exists`);

  return JSON.parse(text) as Manifest;
};

test('a manifest exists for every language the control offers', () => {
  // The one for the language that was not served is named by no tag in the document:
  // it comes into force only when she uses the language control, which is the visitor
  // it exists for.
  for (const language of SUPPORTED_LANGUAGES) {
    assert.ok(source(language) !== null, `web/${manifestAddress(language)} exists`);
  }
});

test('every manifest is valid JSON', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    assert.doesNotThrow(() => manifestFor(language), `${language} parses`);
  }
});

test('every manifest declares what a home screen needs', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    const manifest = manifestFor(language);

    for (const field of [
      'name',
      'short_name',
      'lang',
      'description',
      'icons',
      'theme_color',
      'background_color',
      'display',
      'start_url',
    ] as const) {
      assert.ok(manifest[field] !== undefined, `${language} declares ${field}`);
    }
  }
});

test('each manifest names the icon in its own language', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    const strings = UI[language];
    assert.ok(strings !== undefined, `${language} is in the catalogue`);

    const manifest = manifestFor(language);

    assert.equal(manifest.short_name, strings.appName, `${language} icon label`);
    assert.equal(manifest.lang, strings.htmlLang, `${language} declares its own tag`);
    assert.equal(manifest.description, strings.description, `${language} description`);
    assert.notEqual(
      manifest.name,
      strings.title,
      'the title is a sentence, not an application name',
    );
  }
});

test('the manifests differ only in what names them', () => {
  // Everything else in them — the icons, the colours, the scope — is one answer, and
  // one answer maintained in two files drifts. Only the four fields that carry a
  // language may differ.
  const translated = new Set(['name', 'short_name', 'lang', 'description']);

  const shared = (language: string): Manifest => {
    const manifest: Record<string, unknown> = { ...manifestFor(language) };
    for (const field of translated) {
      delete manifest[field];
    }

    return manifest as Manifest;
  };

  const [first, ...rest] = SUPPORTED_LANGUAGES;
  assert.ok(first !== undefined);

  for (const language of rest) {
    assert.deepEqual(
      shared(language),
      shared(first),
      `${language} agrees with ${first} about everything but its name`,
    );
  }
});

test('the icon opens the page in the browser, not as an application', () => {
  // She asked for an icon that opens this page. A standalone window would take away
  // the browser's own controls she reaches a page with — including the share control
  // this page's own instruction tells her to find.
  for (const language of SUPPORTED_LANGUAGES) {
    assert.equal(manifestFor(language).display, 'browser', `${language} opens a page`);
  }
});

test('the served document links the served language’s manifest', () => {
  const href = /<link rel="manifest"[^>]*href="([^"]+)"/.exec(html)?.[1];

  assert.equal(href, `./${manifestAddress(DEFAULT_LANGUAGE)}`);
});

test('every icon the manifests name exists on disk', () => {
  // The deploy copies files, not intentions: a manifest naming a file that was never
  // drawn ships as a 404, and the visitor least able to notice a missing icon is the
  // one this page is for.
  for (const language of SUPPORTED_LANGUAGES) {
    for (const icon of manifestFor(language).icons ?? []) {
      assert.ok(existsSync(path(`../web/${icon.src}`)), `${icon.src} exists`);
    }
  }
});

test('the manifests cover the sizes a home screen asks for', () => {
  const sizes = (manifestFor(DEFAULT_LANGUAGE).icons ?? []).map((icon) => icon.sizes);

  assert.ok(sizes.includes('192x192'), 'the smaller launcher size');
  assert.ok(sizes.includes('512x512'), 'the size a splash screen is drawn from');
});

test('the apple-touch-icon exists, since iOS accepts no SVG there', () => {
  const href = /<link rel="apple-touch-icon"[^>]*href="([^"]+)"/.exec(html)?.[1];

  assert.ok(href !== undefined, 'the document names one');
  assert.ok(existsSync(path(`../web/${href}`)), `${href} exists`);
  assert.match(href, /\.png$/, 'a PNG: iOS ignores an SVG in this slot');
});

test('the manifests carry the page’s own default colour scheme', () => {
  // The manifest format has no media queries, so it can hold one scheme only — and the
  // one it holds is the page's own default. `:root` carries the dark palette and light
  // is applied under a preference query, so a reader who has expressed no preference
  // gets a near-black page; a light splash around it is the browser painting the wrong
  // edition.
  const dark = /<meta name="theme-color" content="([^"]+)" media="\(prefers-color-scheme: dark\)"/
    .exec(html)?.[1];

  assert.ok(dark !== undefined, 'the document declares a dark-scheme theme colour');

  for (const language of SUPPORTED_LANGUAGES) {
    const manifest = manifestFor(language);

    assert.equal(manifest.theme_color, dark, `${language} agrees with the document`);
    assert.equal(manifest.background_color, dark, 'and paints its splash in the same colour');
  }
});

test('an installed copy opens on the page itself', () => {
  // Relative, so the same manifest serves whatever host the page is published at —
  // the address is recorded in CNAME and nowhere else.
  for (const language of SUPPORTED_LANGUAGES) {
    assert.doesNotMatch(
      manifestFor(language).start_url ?? '',
      /^https?:\/\//,
      'start_url is relative, so a move of host needs no edit here',
    );
  }
});

test('an installed copy does not force the served language', () => {
  // Baking `?lang=en` into start_url would override the cookie of the reader most
  // likely to install this, handing her an English page every time she opened her own
  // icon. A bare start_url lets the resolution chain do its job — and now that there
  // is a manifest per language, naming one here would be the same mistake twice.
  for (const language of SUPPORTED_LANGUAGES) {
    const manifest = manifestFor(language);

    for (const field of ['start_url', 'scope'] as const) {
      assert.doesNotMatch(
        manifest[field] ?? '',
        /lang=/,
        `${language}: ${field} names no language, so the remembered one still wins`,
      );
    }
  }
});
