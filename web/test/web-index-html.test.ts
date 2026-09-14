import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, UI } from '../ui-strings.ts';

/**
 * The served document is the one thing nobody sees by accident any more: a
 * developer opening the page has it replaced by JavaScript before they look, and
 * the audience it is actually for — a crawler that runs no JavaScript — cannot
 * complain. These assertions are the only thing watching it.
 */
const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');

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

/**
 * A meta tag's content, whether the tag names itself with `name` or with `property`.
 *
 * One pattern covers both the tags written on one line and the ones wrapped across
 * three, because a newline and the indent under it are whitespace and `\s+` already
 * spans them. Each of these used to try a second pattern behind a `??` that spelled the
 * newline out; that pattern matched a strict subset of the first, so it could only ever
 * run after the first had returned null — which is exactly when it had nothing to find
 * either.
 */
const metaContent = (named: 'name' | 'property', value: string): string | null =>
  attribute(new RegExp(`<meta\\s+${named}="${value}"\\s+content="([^"]*)"`, 's'));

const metaByName = (name: string): string | null => metaContent('name', name);

const metaByProperty = (property: string): string | null => metaContent('property', property);

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

    for (const key of [
      'title',
      'description',
      'nameSuffix',
      'tagline',
      'fileLabel',
      'save',
      'privacy',
    ] as const) {
      assert.ok(
        !flat.includes(collapse(other[key])),
        `${language}.${key} must not appear in the served document`,
      );
    }
  }
});

test('the visible strings are the served language’s', () => {
  for (const key of [
    'nameSuffix',
    'tagline',
    'fileLabel',
    'langLabel',
    'save',
    'inputHeading',
    'resultHeading',
    'placeholder',
    'privacy',
  ] as const) {
    assert.ok(flat.includes(collapse(served[key])), `${key} is served as "${served[key]}"`);
  }
});

test('the document declares its icons and its manifest', () => {
  // The page shipped with none of these, so a home screen icon was a screenshot and
  // an address — which is what a screen reader then reads out on her home screen.
  assert.ok(
    /<link rel="manifest" href="([^"]+)"/.test(html),
    'a manifest, so an installed icon carries a name',
  );
  assert.ok(
    /<link rel="apple-touch-icon"[^>]*href="([^"]+)"/.test(html),
    'an apple-touch-icon: iOS accepts no SVG here',
  );
  assert.ok(/<link rel="icon"[^>]*href="([^"]+)"/.test(html), 'a favicon, which the page never had');
});

test('the home screen name is served, and is not the document title', () => {
  const name = metaByName('apple-mobile-web-app-title');

  assert.equal(name, served.appName, 'the served value is the served language’s icon label');
  assert.notEqual(
    name,
    served.title,
    'the title is a sentence; an icon label is truncated to about a dozen characters',
  );
});

test('the icons and the manifest are asked of this origin', () => {
  const references = [...html.matchAll(/<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>/g)].map(
    (match) => match[0],
  );

  assert.ok(references.length > 0, 'there is something to check');

  for (const reference of references) {
    const href = /href="([^"]+)"/.exec(reference)?.[1] ?? '';

    assert.doesNotMatch(
      href,
      /^https?:\/\//,
      `${href} is relative: the page asks nothing of a third party, icons included`,
    );
  }
});

test('the controls this page no longer has are gone from the document', () => {
  // Every one of these was a permanent stop she passed on the way to the two things
  // she came for. Removed from the page and left in the document, each would still be
  // a stop — and one the script no longer wires to anything.
  for (const [what, pattern] of [
    ['the paste field', /id="sgf"/],
    ['the convert control', /id="convert"/],
    ['the copy control', /id="copy"/],
    ['the share control in the masthead', /id="share-top"/],
    ['the share control in the footer', /id="share-bottom"/],
    ['the home screen disclosure', /<details/],
    ['the skip link', /skip-link/],
    ['the form, which had nothing left to submit', /<form/],
  ] as const) {
    assert.doesNotMatch(html, pattern, `${what} is gone from the served document`);
  }
});

test('the save control is served, named, and disabled until there is something to save', () => {
  const control = /<button[^>]*id="save"[^>]*>([\s\S]*?)<\/button>/.exec(html);

  assert.ok(control !== null, 'the page ships a save control');
  assert.match(
    control[0],
    /aria-disabled="true"/,
    'aria-disabled rather than disabled: a disabled button leaves the tab order, and a control she never reaches is a control she never learns exists',
  );
  assert.equal(
    collapse(control[1] ?? '').trim(),
    collapse(served.save),
    'named as text in the served language, not by a label or a glyph',
  );
  assert.doesNotMatch(control[0], /aria-label/, 'the name comes from the text');
});

/**
 * The page's departments, each as its own slice of the document, so an assertion about
 * where something sits can be made against the department it has to sit in rather than
 * against the whole page.
 */
const departments = [...html.matchAll(/<section class="row"[\s\S]*?<\/section>/g)].map(
  (match) => match[0],
);

test('the save control stands under the result, with its answer beside it', () => {
  // The text it saves is the text above it, and the answer to a press belongs where
  // the press happened: a reader at high magnification sees only the part of the page
  // she is in.
  assert.equal(departments.length, 2, 'the page has its two departments');

  const result = departments.find((department) => department.includes('id="result"'));

  assert.ok(result !== undefined, 'one of them holds the result');
  assert.match(result, /id="save"/, 'the save control is in it');
  assert.match(result, /id="notice"/, 'and so is the region that answers it');

  const group = /<div class="save">([\s\S]*?)<\/div>/.exec(result);

  assert.ok(group !== null, 'the control and its answer are grouped');
  assert.match(group[1] ?? '', /id="save"/);
  assert.match(group[1] ?? '', /id="notice"/);
});

test('the footer stays on the page and out of the accessibility tree', () => {
  // The credit and the promise are still published, and no longer read out on every
  // visit. Both halves matter: hidden and deleted are not the same thing.
  for (const id of ['privacy', 'credits'] as const) {
    const paragraph = new RegExp(`<p id="${id}"[^>]*>`).exec(html);

    assert.ok(paragraph !== null, `#${id} is still in the document`);
    assert.match(paragraph[0], /aria-hidden="true"/, `#${id} is not read out`);
  }

  // The landmark itself, not only what is inside it. A footer element outside an article
  // or a section is `contentinfo`, so hiding the two paragraphs alone left a reader
  // cycling landmarks arriving at an empty stop — the cost this requirement exists to
  // remove, in the one list meant to be a shortcut.
  //
  // Matched with the trailing `>` required and no `<` inside, so a mention of the tag in
  // a comment cannot stand in for the tag. The first draft of this assertion read the
  // word out of the prose above the element and failed against a document that was
  // correct.
  const footer = /<footer(\s[^<>]*)?>/.exec(html);

  assert.ok(footer !== null, 'the footer is still in the document');
  assert.match(footer[0], /aria-hidden="true"/, 'the contentinfo landmark is not offered');

  const credits = /<p id="credits"[\s\S]*?<\/p>/.exec(html);

  assert.ok(credits !== null);

  const anchors = [...credits[0].matchAll(/<a\s[^>]*>/g)].map((match) => match[0]);

  assert.equal(anchors.length, 2, 'the credit names its source and this page’s own');

  for (const anchor of anchors) {
    assert.match(
      anchor,
      /tabindex="-1"/,
      'a link hidden from a screen reader must not stay a tab stop: reaching a control it cannot name announces nothing at all',
    );
  }
});

test('the heading carries its translated tail beside the drawn name', () => {
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);

  assert.ok(heading !== null, 'the page has its heading');

  const inside = heading[1] ?? '';

  assert.match(inside, /<span class="mark">2<\/span>/, 'the accent mark is still drawn in the name');

  // `</span\s*>` rather than `</span>`: HTML allows whitespace before the closing
  // bracket of an end tag, and the tail is written with the bracket hanging on its own
  // line so that no space creeps in between the name and the phrase beside it.
  const tail = /<span id="name-suffix">([\s\S]*?)<\/span\s*>/.exec(inside);

  assert.ok(
    tail !== null,
    'the tail is an element of its own, so translating it cannot delete the mark beside it',
  );
  assert.equal(collapse(tail[1] ?? ''), collapse(served.nameSuffix));
});

test('the file control is described by its own messages and no others', () => {
  // `#status` is what a screen reader reads out every time she reaches the control, so
  // it may hold only what the game she was given is about. A message about the result
  // or the saved file gets the other region: one of them left in the description would
  // introduce the control she picks a file with by talking about a file she saved
  // minutes ago.
  const described = attribute(/id="file"[\s\S]*?aria-describedby="([^"]*)"/);

  assert.equal(described, 'status', 'exactly one region, and it is the control’s own');

  const regions = [...html.matchAll(/<p id="([^"]+)" role="status"><\/p>/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(
    regions,
    ['status', 'notice'],
    'the condition of the file the page was given, and the answer to the one control that speaks',
  );
});

test('each region sits in the department whose messages it carries', () => {
  // The requirement about a message staying with the field it describes is for the
  // reader at high magnification, for whom a message at the other end of the page is a
  // message never seen. The input department describes the file; the result department
  // answers the save control.
  const input = departments.find((department) => department.includes('id="file"'));
  const result = departments.find((department) => department.includes('id="result"'));

  assert.ok(input !== undefined && result !== undefined, 'both departments are found');

  assert.match(input, /id="status"/, 'the file’s own description is beside the file control');
  assert.doesNotMatch(
    input,
    /id="notice"/,
    'and nothing in the input department answers a press any more, so no region waits there for one',
  );
  assert.match(result, /id="notice"/, 'the save control’s answer is beside the save control');
});

test('the language control opens on the served language', () => {
  const options = [...html.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(options, [...SUPPORTED_LANGUAGES]);
  assert.equal(options[0], DEFAULT_LANGUAGE, 'no script has run yet, so the first option shows');
});

/**
 * Everything `main.ts` reaches for, checked against the document that has to hold it.
 *
 * `need` throws on a missing selector by design, and `applyVisible` runs it fourteen
 * times before it reaches the save control's label. So a renamed id does not degrade the
 * page — it aborts the first `applyLanguage()` at the foot of the module, and the
 * language control silently does nothing for the rest of the visit, for every visitor,
 * with the served English still on screen.
 *
 * Six of those ids were asserted nowhere before this test. Renaming `#tagline`,
 * `#lang`, `#input-heading` and the rest passed the whole suite. Read out of `main.ts`
 * rather than listed here, so the check cannot fall behind the code it is checking.
 */
const SELECTORS = [...readFileSync(fileURLToPath(new URL('../main.ts', import.meta.url)), 'utf8')
  .matchAll(/need(?:<[^>]*>)?\(\s*'([^']+)'/g)]
  .map((match) => match[1] ?? '');

const resolves = (selector: string): boolean => {
  const id = /^#([\w-]+)$/.exec(selector);
  if (id !== null) {
    return new RegExp(`id="${id[1]}"`).test(html);
  }

  // Named for the shape it matches rather than `attribute`, which is the module's own
  // helper a few lines up and a different kind of thing entirely.
  const attributeSelector = /^(\w+)\[(\w[\w-]*)="([^"]+)"\]$/.exec(selector);
  if (attributeSelector !== null) {
    return new RegExp(
      `<${attributeSelector[1]}\\b[^>]*${attributeSelector[2]}="${attributeSelector[3]}"`,
    ).test(flat);
  }

  throw new Error(`This test does not know how to resolve ${selector}`);
};

test('every element the page reaches for is in the document it is served with', () => {
  assert.ok(SELECTORS.length > 10, 'the selectors were actually read out of main.ts');

  for (const selector of SELECTORS) {
    assert.ok(resolves(selector), `${selector} is missing from the served document`);
  }
});

test('the two older controls are named by a label that points at them', () => {
  // The save control's name is asserted elsewhere; these two were not. Deleting `for`
  // from either label left the control with no accessible name at all — a file button
  // announced as nothing, on the page the converter now exists around — and failed
  // nothing. The strings themselves being present somewhere in the document is a
  // different fact from a label that names this control.
  const labels: readonly (readonly [string, string])[] = [
    ['file', served.fileLabel],
    ['lang', served.langLabel],
  ];

  for (const [id, name] of labels) {
    const label = new RegExp(`<label for="${id}"[^>]*>([^<]+)</label>`).exec(flat);

    assert.ok(label !== null, `#${id} is named by a label pointing at it`);
    assert.equal(label[1]?.trim(), name, `#${id}'s label reads the served language's name`);
  }
});

test('the page is four stops long, and they are the four the change left', () => {
  // The blocklist of removed ids catches a resurrection under the old name and nothing
  // else: a textarea called something new, or a second share button, passed it. The
  // stop count is what this change is actually about, so it is asserted as the page's
  // own property rather than as a list of things that must not come back.
  const focusable = [...flat.matchAll(/<(a|button|input|select|textarea)\b([^>]*)>/g)];
  const inTheOrder = focusable.filter(([, , attributes]) => !/tabindex="-1"/.test(attributes ?? ''));

  const stops = inTheOrder.map(([, , attributes]) => /id="([^"]+)"/.exec(attributes ?? '')?.[1]);

  assert.deepEqual(
    stops,
    ['lang', 'file', 'save'],
    'every control in the tab order is one of the three, in the order she meets them',
  );

  // The fourth is the result itself, which is not a control and earns its stop another
  // way — see the test below.
  assert.doesNotMatch(flat, /<textarea/, 'there is nowhere to paste, under any name');
});

test('the result keeps the tab stop and the translation guard the change gave it', () => {
  const pre = /<pre id="result"([^>]*)>/.exec(flat)?.[1] ?? '';

  // Copying was removed on the strength of this attribute: `saveFailed` tells her the
  // text is still on the page and to select it there by hand, and a browser with neither
  // save branch has nothing else left to offer. An accessibility sweep deletes a
  // focusable `<pre>` on sight, so it is pinned here.
  assert.match(pre, /tabindex="0"/, 'the result is reachable by keyboard');

  // A coordinate put through a machine translator names a point that was not played.
  // This requirement moved from the textarea to the result with this change; nothing
  // moved with it until now.
  assert.match(pre, /translate="no"/, 'no translator rewrites the coordinates');
});

test('nothing interrupts her when she leaves', () => {
  // The guard protected text that existed nowhere else. The record now comes from a file
  // she still holds and the result can be saved, so the interruption defends nothing —
  // and a confirmation dialogue is an especially bad thing to leave standing for someone
  // who navigates by keyboard and sound. Asserted at text level because `main.ts` is the
  // one module `node --test` cannot import.
  const main = readFileSync(fileURLToPath(new URL('../main.ts', import.meta.url)), 'utf8');

  assert.doesNotMatch(main, /beforeunload/, 'the page asks the browser to confirm nothing');
});
