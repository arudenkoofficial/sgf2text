import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGame } from '../src/parse.ts';
import { replay } from '../src/replay.ts';
import { render } from '../src/render.ts';
import { getLocale } from '../src/locales/index.ts';

const recordOf = (name: string) =>
  replay(parseGame(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')));

const renderFixture = (name: string, locale = 'ru') =>
  render(recordOf(name), getLocale(locale));

const lines = (text: string) => text.split('\n');

test('puts the metadata block before the moves', () => {
  const text = renderFixture('plain.sgf');
  const all = lines(text);

  const firstMove = all.findIndex((line) => line.startsWith('1.'));
  const sizeLine = all.findIndex((line) => line.includes('19×19'));

  assert.ok(sizeLine >= 0, 'the board size is stated');
  assert.ok(firstMove > sizeLine, 'the move list follows the metadata');
});

test('states players, komi and result', () => {
  const text = renderFixture('plain.sgf');

  assert.match(text, /Alice/);
  assert.match(text, /Bob/);
  assert.match(text, /6,5/);
  assert.match(text, /3,5/);
});

// A Russian voice reads "6.5" as "six point five"; "6,5" it reads as a number.
test('formats numbers the way the language writes them', () => {
  assert.match(renderFixture('plain.sgf'), /Коми: 6,5/);
  assert.match(renderFixture('plain.sgf', 'en'), /Komi: 6\.5/);
});

// Both players on one line: two lines would double the listening time for a
// single fact — who played which colour.
test('puts both players on one line', () => {
  const ru = lines(renderFixture('plain.sgf')).filter((line) => /Alice|Bob/.test(line));
  assert.deepEqual(ru, ['Чёрные Alice, белые Bob']);

  const en = lines(renderFixture('plain.sgf', 'en')).filter((line) => /Alice|Bob/.test(line));
  assert.deepEqual(en, ['Black Alice, white Bob']);
});

test('names only the player the record knows', () => {
  const text = render(
    replay(parseGame('(;GM[1]SZ[19]PB[Alice];B[pd])')),
    getLocale('ru'),
  );

  assert.match(text, /^Чёрные Alice$/m);
  assert.doesNotMatch(text, /белые/i);
});

test('omits metadata the game does not carry, rather than printing it empty', () => {
  const text = render(recordOf('capture-single.sgf'), getLocale('ru'));

  assert.doesNotMatch(text, /undefined/);
  assert.doesNotMatch(text, /:\s*$/m, 'no label is left with an empty value');
});

test('numbers moves consecutively, one line each', () => {
  const text = renderFixture('plain.sgf');
  const moveLines = lines(text).filter((line) => /^\d+\./.test(line));

  assert.equal(moveLines.length, 7);
  assert.deepEqual(
    moveLines.map((line) => Number(line.split('.')[0])),
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test('names the vertex of every move in western notation', () => {
  const text = renderFixture('plain.sgf');
  const first = lines(text).find((line) => line.startsWith('1.'));

  assert.match(first ?? '', /Q16/);
});

test('renders a pass as its own numbered line', () => {
  const text = renderFixture('pass-modern.sgf');
  const third = lines(text).find((line) => line.startsWith('3.'));

  assert.match(third ?? '', /пас/i);
  assert.doesNotMatch(third ?? '', /[A-T]\d/, 'a pass has no coordinate');
});

test('lists the stones a capturing move removed', () => {
  const text = renderFixture('capture-corner.sgf');
  const fifth = lines(text).find((line) => line.startsWith('5.'));

  assert.ok(fifth !== undefined);
  assert.match(fifth, /A9/);
  assert.match(fifth, /A8/);
  assert.match(fifth, /2/, 'the number of captured stones is stated');
});

test('uses the singular when exactly one stone is captured', () => {
  const ru = renderFixture('capture-single.sgf');
  const third = lines(ru).find((line) => line.startsWith('3.'));
  assert.match(third ?? '', /1 камень/);

  const en = renderFixture('capture-single.sgf', 'en');
  const thirdEn = lines(en).find((line) => line.startsWith('3.'));
  assert.match(thirdEn ?? '', /1 stone\b/);
});

test('applies Russian plural forms to captured stones', () => {
  const two = renderFixture('capture-corner.sgf');
  assert.match(lines(two).find((line) => line.startsWith('5.')) ?? '', /2 камня/);
});

test('lists handicap stones by coordinate, not only by count', () => {
  const text = renderFixture('handicap4.sgf');
  const handicapLine = lines(text).find((line) => /D4|Q16/.test(line) && !/^\d+\./.test(line));

  assert.ok(handicapLine !== undefined, 'the handicap stones are listed');
  for (const coord of ['D16', 'Q16', 'D4', 'Q4']) {
    assert.match(handicapLine, new RegExp(coord));
  }
});

test('spells out every kind of result', () => {
  const resultLine = (re: string, locale = 'ru') => {
    const record = replay(parseGame(`(;GM[1]SZ[19]RE[${re}];B[pd])`));
    return lines(render(record, getLocale(locale))).find((line) => /^(Результат|Result)/.test(line));
  };

  assert.match(resultLine('W+R') ?? '', /сдал/i);
  assert.match(resultLine('B+3.5') ?? '', /3,5/);
  assert.match(resultLine('B+T') ?? '', /времени/i);
  assert.match(resultLine('0') ?? '', /ничья/i);
  assert.equal(resultLine(''), undefined, 'an absent result prints no line');

  assert.match(resultLine('W+R', 'en') ?? '', /resignation/i);
  assert.match(resultLine('B+T', 'en') ?? '', /time/i);
});

test('renders the same game in both languages with the same coordinates', () => {
  const ru = renderFixture('plain.sgf');
  const en = renderFixture('plain.sgf', 'en');

  assert.notEqual(ru, en, 'the languages differ');

  const coordsOf = (text: string) =>
    lines(text)
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.match(/[A-T]\d+/)?.[0]);

  assert.deepEqual(coordsOf(ru), coordsOf(en), 'coordinates are identical in both');
});

test('rejects a locale that does not exist, naming the ones that do', () => {
  assert.throws(() => getLocale('ja'), /ru/);
  assert.throws(() => getLocale('ja'), /en/);
});
