import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, UI, stringsFor } from '../web/ui-strings.ts';

const keysOf = (value: object): string[] => Object.keys(value).sort();

test('every language defines the same keys', () => {
  const reference = UI[DEFAULT_LANGUAGE];
  assert.ok(reference !== undefined, `the default language ${DEFAULT_LANGUAGE} is present`);

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = UI[language];
    assert.ok(strings !== undefined, `${language} is in the catalogue`);

    for (const key of keysOf(reference)) {
      assert.ok(
        key in strings,
        `${language} is missing "${key}" — a forgotten translation would be read aloud as undefined`,
      );
    }

    assert.deepEqual(keysOf(strings), keysOf(reference), `${language} defines no extra keys either`);
  }
});

test('every language defines the same error codes', () => {
  const reference = UI[DEFAULT_LANGUAGE];
  assert.ok(reference !== undefined);

  for (const language of SUPPORTED_LANGUAGES) {
    assert.deepEqual(
      keysOf(UI[language]?.errors ?? {}),
      keysOf(reference.errors),
      `${language} covers every error the converter can raise`,
    );
  }
});

test('no string is left empty', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    const strings = UI[language];
    assert.ok(strings !== undefined);

    for (const [key, value] of Object.entries(strings)) {
      if (typeof value !== 'string') {
        continue;
      }

      assert.notEqual(value.trim(), '', `${language}.${key} says something`);
    }
  }
});

test('the served language is the one the page falls back to', () => {
  // The fallback and the served document must name the same language, or a visitor
  // about whom nothing is known watches the page change after it loads.
  assert.equal(stringsFor('de').htmlLang, DEFAULT_LANGUAGE);
  assert.equal(stringsFor(DEFAULT_LANGUAGE).htmlLang, DEFAULT_LANGUAGE);
});

test('the default language is listed first, as the control shows it first', () => {
  assert.equal(SUPPORTED_LANGUAGES[0], DEFAULT_LANGUAGE);
});

test('each language declares itself as the document language', () => {
  // The compiler already pins this — the catalogue is checked against
  // `{ [L in LocaleId]: UiStrings & { htmlLang: L } }`. This is the backstop for
  // when there is no compiler in the chain: Node strips types rather than
  // checking them, so nothing but this assertion stands between a mistyped tag
  // and `documentElement.lang` naming one language over another language's text.
  for (const language of SUPPORTED_LANGUAGES) {
    assert.equal(
      UI[language]?.htmlLang,
      language,
      `${language} must declare itself, or a screen reader reads its words with another language's phonemes`,
    );
  }
});

/**
 * The completeness test above compares the languages against each other, which
 * catches a key present in one and missing from the other — and passes happily when
 * a key was forgotten in both. These name the strings this page cannot do without.
 */
test('the sharing and home screen strings are present in every language', () => {
  const required = [
    'share',
    'shared',
    'addressCopied',
    'shareFailed',
    'appName',
    'keepSummary',
    'keepInstruction',
  ] as const;

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = UI[language];
    assert.ok(strings !== undefined);

    for (const key of required) {
      assert.equal(
        typeof strings[key],
        'string',
        `${language}.${key} is a string the page reads out`,
      );
      assert.notEqual((strings[key] as string).trim(), '', `${language}.${key} says something`);
    }
  }
});

test('copying an address is not announced as copying the game', () => {
  // Two different things land on the clipboard from two different controls. One
  // message for both would tell a visitor the text was copied when what she has is
  // an address, and she cannot look at the clipboard to find out otherwise.
  for (const language of SUPPORTED_LANGUAGES) {
    const strings = UI[language];
    assert.ok(strings !== undefined);

    assert.notEqual(
      strings.addressCopied,
      strings.copied,
      `${language} distinguishes the address from the converted text`,
    );
  }
});

test('the home screen name is short enough to survive a home screen', () => {
  // iOS truncates the label under an icon. A name that arrives cut in half is worse
  // than a short one, and this is the label VoiceOver reads on her home screen.
  for (const language of SUPPORTED_LANGUAGES) {
    const name = UI[language]?.appName ?? '';

    assert.ok(
      name.length <= 15,
      `${language}.appName is ${name.length} characters: "${name}" — too long for an icon label`,
    );
  }
});

test('each language names its own locale for a link preview', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    assert.match(
      UI[language]?.ogLocale ?? '',
      new RegExp(`^${language}_[A-Z]{2}$`),
      `${language} carries a language_TERRITORY locale, which is not derivable from the tag`,
    );
  }
});
