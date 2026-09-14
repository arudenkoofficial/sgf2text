import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, UI, stringsFor } from '../ui-strings.ts';
import type { UiStrings } from '../ui-strings.ts';

const keysOf = (value: object): string[] => Object.keys(value).sort();

/**
 * One language's strings, with the check that they are there at all done once rather
 * than at the head of every loop below.
 *
 * Read out of `UI` rather than through `stringsFor`, which falls back to English: a
 * language missing from the catalogue would then answer every assertion in this file
 * in English's words and pass.
 */
const stringsIn = (language: string): UiStrings => {
  const strings = UI[language];
  assert.ok(strings !== undefined, `${language} is in the catalogue`);

  return strings;
};

test('every language defines the same keys', () => {
  const reference = stringsIn(DEFAULT_LANGUAGE);

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

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
  const reference = stringsIn(DEFAULT_LANGUAGE);

  for (const language of SUPPORTED_LANGUAGES) {
    assert.deepEqual(
      keysOf(stringsIn(language).errors),
      keysOf(reference.errors),
      `${language} covers every error the converter can raise`,
    );
  }
});

test('no string is left empty', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    for (const [key, value] of Object.entries(stringsIn(language))) {
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
      stringsIn(language).htmlLang,
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
test('the saving and home screen strings are present in every language', () => {
  const required = ['save', 'nameSuffix', 'fileLabel', 'nothingToSave', 'saveFailed', 'appName'] as const;

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

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

test('a file written and a file handed over are announced by name, and differently', () => {
  // She cannot look to find out which happened. One is in her downloads; the other is
  // wherever she filed it from the sheet — so one sentence for both would leave her
  // hunting in the wrong place. Both name the file, because the name is the only
  // handle she has on it afterwards.
  const name = 'sgf2text-2026.09.03-14-05.txt';

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

    assert.equal(typeof strings.savedToDevice, 'function', `${language}.savedToDevice takes the name`);
    assert.equal(typeof strings.handedToSheet, 'function', `${language}.handedToSheet takes the name`);

    const saved = strings.savedToDevice(name);
    const handed = strings.handedToSheet(name);

    assert.ok(saved.includes(name), `${language}.savedToDevice names the file it wrote`);
    assert.ok(handed.includes(name), `${language}.handedToSheet names the file it handed over`);
    assert.notEqual(saved, handed, `${language} tells the two destinations apart`);

    // Different before the file name, not merely different. String inequality is not
    // audible distinguishability: both sentences used to open with the name, which a
    // screen reader spells out character by character, so they ran identically for a
    // dozen spoken tokens and then parted on a single verb. What differs has to arrive
    // before the part she has to sit through.
    assert.notEqual(
      saved.slice(0, saved.indexOf(name)),
      handed.slice(0, handed.indexOf(name)),
      `${language} says which of the two happened before it spells the file name`,
    );
  }
});

test('a file that could not be read says whether the previous game is still on the page', () => {
  // The save control stays live on a failed read, holding the game before it, and would
  // write that game under a fresh timestamp. She cannot see the substitution and the
  // file name does not carry the game, so this sentence is the only place she learns it.
  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

    const alone = strings.fileFailed(false);
    const overAGame = strings.fileFailed(true);

    assert.notEqual(alone.trim(), '', `${language}.fileFailed says something on its own`);
    assert.notEqual(
      alone,
      overAGame,
      `${language} warns that the text on the page is the game before it`,
    );
    assert.ok(
      overAGame.startsWith(alone.replace(/\.$/, '')),
      `${language} still leads with the file that could not be read`,
    );
  }
});

test('the four things saving can say are four different sentences', () => {
  // Written, handed over, nothing to save, and failed. Four outcomes she can only tell
  // apart by what she hears, so two of them sharing a sentence would make one of the
  // four undetectable.
  const name = 'sgf2text-2026.09.03-14-05.txt';

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

    const said = [
      strings.savedToDevice(name),
      strings.handedToSheet(name),
      strings.nothingToSave,
      strings.saveFailed,
    ];

    assert.equal(new Set(said).size, said.length, `${language} says four different things`);
  }
});

test('no string outlives the control it named', () => {
  // A string left in the catalogue is a translation someone maintains for a control
  // that is not on the page, and the next reader has no way to tell which.
  const gone = [
    'skipLink',
    'subtitle',
    'sgfLabel',
    'convert',
    'copy',
    'copied',
    'copyFailed',
    'emptyResult',
    'emptyInput',
    'share',
    'shared',
    'addressCopied',
    'shareFailed',
    'keepSummary',
    'keepInstruction',
  ];

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

    for (const key of gone) {
      assert.ok(
        !(key in strings),
        `${language}.${key} names a control the page no longer has`,
      );
    }
  }
});

test('nothing in either language tells her to paste anything', () => {
  // There is nowhere to paste. The two messages that said so were the empty-file
  // wording and the `empty-input` error beside it, and both were about a field that
  // this change removes — an instruction to use a control that is not there is worse
  // than no instruction at all.
  const paste = /вставьт|вставит|paste/i;

  for (const language of SUPPORTED_LANGUAGES) {
    const strings = stringsIn(language);

    for (const [key, value] of Object.entries(strings)) {
      if (typeof value !== 'string') {
        continue;
      }

      assert.doesNotMatch(value, paste, `${language}.${key} does not send her to a field`);
    }

    for (const [code, value] of Object.entries(strings.errors)) {
      assert.doesNotMatch(value, paste, `${language}.errors.${code} does not send her to a field`);
    }
  }
});

test('the home screen name is short enough to survive a home screen', () => {
  // iOS truncates the label under an icon. A name that arrives cut in half is worse
  // than a short one, and this is the label VoiceOver reads on her home screen.
  for (const language of SUPPORTED_LANGUAGES) {
    const name = stringsIn(language).appName;

    assert.ok(
      name.length <= 15,
      `${language}.appName is ${name.length} characters: "${name}" — too long for an icon label`,
    );
  }
});

test('each language names its own locale for a link preview', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    assert.match(
      stringsIn(language).ogLocale,
      new RegExp(`^${language}_[A-Z]{2}$`),
      `${language} carries a language_TERRITORY locale, which is not derivable from the tag`,
    );
  }
});
