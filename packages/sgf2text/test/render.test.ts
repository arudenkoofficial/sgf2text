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

/**
 * What the handicap label may and may not be put on. It used to be put on the
 * first setup event anywhere in the file, whatever colour the stones were and
 * wherever they sat, which is the same mistake `read-sgf-problems` removed from
 * the problem side and left standing here.
 */
const renderSgf = (sgf: string, locale = 'ru') =>
  render(replay(parseGame(sgf)), getLocale(locale));

test('a position of both colours is stated, not called a handicap', () => {
  // A game resumed from a diagram. White stones on the board before move 1 rule
  // out a handicap, whatever else the file says.
  const text = renderSgf('(;GM[1]FF[4]SZ[19]PB[Bob]PW[Alice]RE[B+R]AW[dd]AB[pp];B[qq];W[cc])');

  assert.doesNotMatch(text, /Фора/);
  assert.match(text, /^Чёрные: 1 камень — Q4$/m);
  assert.match(text, /^Белые: 1 камень — D16$/m);
});

test('a stone placed after play has begun is said where it happens', () => {
  // Dropping it would be worse than mislabelling it: the rules are applied to
  // that stone either way — the capture below depends on it — so a reader who is
  // never told it appeared ends up with a board the text no longer describes.
  const all = lines(renderSgf('(;GM[1]SZ[9];B[ba];AW[aa];B[ab])'));

  assert.doesNotMatch(all.join('\n'), /Фора/);

  const placed = all.findIndex((line) => line.startsWith('Поставлено'));
  assert.ok(placed > 0, 'the stone that appears is announced');
  assert.equal(all[placed], 'Поставлено 1 камень белых: A9');
  assert.match(all[placed - 1] ?? '', /^1\. /, 'after the move it follows in the file');
  assert.match(all[placed + 1] ?? '', /^2\. Чёрные A8 — снято 1 камень белых: A9$/);
});

test('a real handicap is still a handicap', () => {
  const text = renderSgf(
    '(;GM[1]FF[4]SZ[19]HA[4]KM[0.5]PB[Bob]PW[Alice]RE[W+3.5]AB[dd][pd][dp][pp]PL[W];W[qf])',
  );

  assert.match(text, /^Фора: 4 камня — D16, Q16, D4, Q4$/m);
  assert.doesNotMatch(text, /^Чёрные: 4 камня/m, 'a handicap is not restated as a position');
});

/**
 * The distinction the whole of `AE` support rests on. A capture means somebody's
 * move worked; a removal means the author edited the position. Both take a stone
 * off her board, and her board cannot tell her which happened — only the sentence
 * can, so the two must not share a verb.
 */
test('a stone taken off by AE is not worded as a capture', () => {
  const removal = renderSgf('(;GM[1]SZ[9];B[ba];AW[aa];AE[aa];B[ab])');
  const capture = renderSgf('(;GM[1]SZ[9];B[ba];AW[aa];B[ab])');

  assert.match(removal, /^Убрано с доски 1 камень белых: A9$/m);
  assert.doesNotMatch(removal, /снято/, 'nothing was captured, and nothing says so');
  assert.match(capture, /снято 1 камень белых: A9/);
  assert.doesNotMatch(capture, /Убрано/);
});

test('a point emptied before the first move is silently absent', () => {
  // The reader starts from an empty board: there is no stone at C7 to take off.
  const text = renderSgf('(;GM[1]SZ[9]AB[cc][dd]AE[cc]PB[a]PW[b];W[ce])');

  assert.doesNotMatch(text, /Убрано/);
  assert.match(text, /^Фора: 1 камень — D6$/m);
});

test('names the placed stones in English too', () => {
  const text = renderSgf('(;GM[1]SZ[9];B[ba];AW[aa];B[ab])', 'en');

  assert.match(text, /^1 stone of white placed: A9$/m);
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
