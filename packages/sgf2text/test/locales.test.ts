import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALE_IDS, getLocale } from '../src/locales/index.ts';
import type { Locale } from '../src/locale.ts';

const keysOf = (value: object): string[] => Object.keys(value).sort();

/**
 * The compiler already pins this: every locale is declared `Locale`. This is the
 * backstop for when there is no compiler in the chain — Node strips types rather
 * than checking them, so nothing else stands between a forgotten translation and
 * a screen reader reading the word "undefined" out of a game record.
 */
test('every locale defines the same wording', () => {
  const reference = getLocale('ru');

  for (const id of LOCALE_IDS) {
    const locale = getLocale(id);

    assert.deepEqual(keysOf(locale), keysOf(reference), `${id} defines the same functions`);
    assert.deepEqual(keysOf(locale.labels), keysOf(reference.labels), `${id} defines the same labels`);
  }
});

test('no locale leaves a label empty', () => {
  for (const id of LOCALE_IDS) {
    for (const [key, value] of Object.entries(getLocale(id).labels)) {
      assert.notEqual(value.trim(), '', `${id}.labels.${key} says something`);
    }
  }
});

test('every locale words a problem, its setup and its answer', () => {
  const required = ['problem', 'setup', 'solution', 'line'] as const;

  for (const id of LOCALE_IDS) {
    const locale: Locale = getLocale(id);

    for (const key of required) {
      assert.equal(typeof locale[key], 'function', `${id} words ${key}`);
    }

    assert.notEqual(locale.labels.note.trim(), '');
  }
});

/**
 * Russian has three plural forms and the rule is not "one versus the rest". A
 * count read out with the wrong ending is understood, but it is heard as a
 * mistake on every single line of a twenty-seven stone position.
 */
test('Russian inflects the stones of a setup', () => {
  const ru = getLocale('ru');
  const at = (count: number): string => ru.setup('W', Array<string>(count).fill('A1'));

  assert.match(at(1), /^Белые: 1 камень — /);
  assert.match(at(2), /^Белые: 2 камня — /);
  assert.match(at(14), /^Белые: 14 камней — /);
  assert.match(at(21), /^Белые: 21 камень — /);
});

test('Russian inflects the number of lines in the answer', () => {
  const ru = getLocale('ru');

  assert.equal(ru.solution(1), 'Решение: 1 вариант.');
  assert.equal(ru.solution(2), 'Решение: 2 варианта.');
  assert.equal(ru.solution(8), 'Решение: 8 вариантов.');
  assert.equal(ru.solution(21), 'Решение: 21 вариант.');
});

test('English pluralises the same counts', () => {
  const en = getLocale('en');

  assert.match(en.setup('B', ['A1']), /^Black: 1 stone — /);
  assert.match(en.setup('B', ['A1', 'A2']), /^Black: 2 stones — /);
  assert.equal(en.solution(1), 'Solution: 1 variation.');
  assert.equal(en.solution(8), 'Solution: 8 variations.');
});

// A count of nothing is not a heading a listener can use, and silence would read
// as a text that was cut short.
test('a solution with no lines is stated rather than counted', () => {
  for (const id of LOCALE_IDS) {
    const heading = getLocale(id).solution(0);

    assert.notEqual(heading.trim(), '');
    assert.doesNotMatch(heading, /\b0\b/, `${id} does not announce zero of something`);
  }
});
