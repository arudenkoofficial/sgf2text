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

    for (const key of [
      'title',
      'description',
      'tagline',
      'convert',
      'privacy',
      'share',
      'keepSummary',
      'keepInstruction',
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
    'skipLink',
    'tagline',
    'sgfLabel',
    'fileLabel',
    'langLabel',
    'convert',
    'copy',
    'share',
    'keepSummary',
    'keepInstruction',
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

const shareControls = (): string[] =>
  [...html.matchAll(/<button[^>]*id="share-[^"]*"[^>]*>[\s\S]*?<\/button>/g)].map(
    (match) => match[0],
  );

test('sharing is offered twice, and named once', () => {
  // Two places because neither the visitor at the top of the page nor the one who has
  // read to the bottom should have to travel to the other end. One name because they
  // do the same thing, and two names would promise a difference that does not exist.
  const controls = shareControls();

  assert.equal(controls.length, 2, 'one in the masthead, one in the footer');

  for (const control of controls) {
    assert.ok(
      collapse(control).includes(collapse(served.share)),
      'each carries its own accessible name as text, in the served language',
    );
    assert.doesNotMatch(
      control,
      /aria-disabled/,
      'unlike Copy, sharing is never in a state with nothing to act on',
    );
  }
});

test('sharing is not offered among the conversion controls', () => {
  // Where it was, and why it was missed: everything else in that row acts on the game
  // record, so a third button there read as a third thing done to the game.
  const actions = /<div class="actions">([\s\S]*?)<\/div>/.exec(html);

  assert.ok(actions !== null, 'the form has an actions row');

  const row = actions[1] ?? '';
  const buttons = [...row.matchAll(/<button[^>]*id="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(buttons, ['convert', 'copy'], 'the game’s controls, and only those');
});

test('each share control stands in a page-level department', () => {
  for (const [department, control] of [
    ['header', 'share-top'],
    ['footer', 'share-bottom'],
  ] as const) {
    const block = new RegExp(`<${department}[\\s\\S]*?</${department}>`).exec(html);

    assert.ok(block !== null, `the document has a ${department}`);
    assert.match(
      block[0],
      new RegExp(`id="${control}"`),
      `${control} is where the page’s own actions are`,
    );
  }
});

test('the mark beside each name is decorative', () => {
  // It is there to catch a sighted eye. To a screen reader it is nothing, and it is
  // never what names the control — the text is.
  const controls = shareControls();

  assert.equal(controls.length, 2, 'both controls are checked, so neither loop runs empty');

  for (const control of controls) {
    const svg = /<svg[^>]*>/.exec(control);

    assert.ok(svg !== null, 'the control carries a mark');
    assert.match(svg[0], /aria-hidden="true"/, 'hidden from assistive technology');
    assert.match(svg[0], /focusable="false"/, 'and not a tab stop of its own');
    assert.doesNotMatch(control, /aria-label/, 'the name comes from the text, not from a label');

    // The label is its own element so that translating it cannot reach the mark. Write
    // to the button's text instead and the glyph is deleted the first time the language
    // changes — which is a failure nobody would see in English.
    const label = /<span class="label">([\s\S]*?)<\/span>/.exec(control);

    assert.ok(label !== null, 'the label is an element of its own, not the button’s text');
    assert.equal(collapse(label[1] ?? '').trim(), collapse(served.share));
  }
});

test('the home screen instruction is a native disclosure', () => {
  const details = /<details[^>]*>([\s\S]*?)<\/details>/.exec(html);

  assert.ok(details !== null, 'the instruction is in a details element');

  const body = details[1] ?? '';
  const summary = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(body);

  assert.ok(summary !== null, 'with a summary, so it is operable without script');
  assert.ok(
    collapse(summary[1] ?? '').includes(collapse(served.keepSummary)),
    'the summary is the served language’s wording',
  );
  assert.ok(
    collapse(body).includes(collapse(served.keepInstruction)),
    'and the instruction itself is served, not left for the script to supply',
  );
});

test('the field is described by its own messages and no others', () => {
  // `#status` is what a screen reader reads out every time she reaches the field, so
  // it may hold only what the field is about. The messages about the result, the
  // clipboard and the address get their own region: one of them left in the
  // description would introduce her game record with a sentence about the clipboard,
  // long after the copying.
  const described = attribute(/id="sgf"[\s\S]*?aria-describedby="([^"]*)"/);

  assert.equal(described, 'status', 'exactly one region, and it is the field’s own');

  const regions = [...html.matchAll(/<p id="([^"]+)" role="status"><\/p>/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(
    regions,
    ['notice-top', 'status', 'notice', 'notice-bottom'],
    'a region for the field, and one beside each control that speaks',
  );
});

test('every share control has its own region beside it', () => {
  // One region cannot be beside two controls at opposite ends of a page, and a reader
  // at high magnification sees only the part of the page she is in — so a confirmation
  // drawn at the other end is one she never sees.
  const groups = [...html.matchAll(/<div class="share">([\s\S]*?)<\/div>/g)].map(
    (match) => match[1] ?? '',
  );

  assert.equal(groups.length, 2, 'each control is grouped with its own answer');

  for (const [control, own] of [
    ['share-top', 'notice-top'],
    ['share-bottom', 'notice-bottom'],
  ] as const) {
    const group = groups.find((candidate) => candidate.includes(`id="${control}"`));

    assert.ok(group !== undefined, `${control} is in a group of its own`);
    assert.match(group, new RegExp(`id="${own}"`), `and ${own} is the region in that group`);
    assert.doesNotMatch(
      group,
      /role="status"[\s\S]*role="status"/,
      'one region per control, so an answer cannot be drawn twice',
    );
  }
});

test('both regions sit with the controls that produce their messages', () => {
  // The requirement about a message staying with the field it describes is about the
  // reader at high magnification, for whom a message at the other end of the page is
  // a message never seen. Splitting the association must not move either one out of
  // the department holding the buttons.
  const form = /<form id="form"[^>]*>([\s\S]*?)<\/form>/.exec(html);

  assert.ok(form !== null, 'the controls live in the form');

  for (const region of ['status', 'notice']) {
    assert.match(
      form[1] ?? '',
      new RegExp(`id="${region}"`),
      `#${region} is beside the buttons, not at the other end of the page`,
    );
  }
});

test('the language control opens on the served language', () => {
  const options = [...html.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(options, [...SUPPORTED_LANGUAGES]);
  assert.equal(options[0], DEFAULT_LANGUAGE, 'no script has run yet, so the first option shows');
});
