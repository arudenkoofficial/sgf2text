import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSgf } from '../src/parse.ts';
import { buildProblem } from '../src/problem.ts';
import { renderProblem } from '../src/render.ts';
import { getLocale } from '../src/locales/index.ts';

const fixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const renderSgf = (sgf: string, locale = 'ru'): string => {
  const parsed = parseSgf(sgf);
  assert.equal(parsed.kind, 'problem');

  return renderProblem(buildProblem(parsed.problem), getLocale(locale));
};

const renderFixture = (name: string, locale = 'ru'): string => renderSgf(fixture(name), locale);

const lines = (text: string): string[] => text.split('\n');

const BLACK_SETUP = ['B18', 'B16', 'B11', 'B10', 'C16', 'C13', 'C12', 'D18', 'D17', 'D13', 'E16', 'E15', 'E14'];
const WHITE_SETUP = ['B15', 'B13', 'B12', 'C15', 'C11', 'D16', 'D15', 'D12', 'E18', 'E17', 'F16', 'F15', 'H17', 'H15'];

test('opens with the board size, the word for a problem and the side to move', () => {
  const all = lines(renderFixture('problem-attack.sgf'));

  assert.match(all[0] ?? '', /19×19/);
  assert.match(all[1] ?? '', /Задача/);
  assert.match(all[1] ?? '', /белых/, 'and whose move it is');
});

/**
 * The stones as two lines rather than one run of twenty-seven coordinates. The
 * colours are what a reader is placing by hand, and a list that does not say
 * which is which cannot be placed at all — which is how the converter read this
 * file before: "Фора: 27 камней".
 */
test('names the setup stones by colour, the side to move first', () => {
  const all = lines(renderFixture('problem-attack.sgf'));

  const whiteLine = all.findIndex((line) => line.startsWith('Белые:'));
  const blackLine = all.findIndex((line) => line.startsWith('Чёрные:'));

  assert.ok(whiteLine > 0 && blackLine > 0, 'both colours are stated');
  assert.ok(whiteLine < blackLine, 'white is to move, so white is read out first');

  assert.match(all[whiteLine] ?? '', /14 камней/);
  assert.match(all[blackLine] ?? '', /13 камней/);

  for (const coordinate of WHITE_SETUP) {
    assert.ok((all[whiteLine] ?? '').includes(coordinate), `white is missing ${coordinate}`);
  }
  for (const coordinate of BLACK_SETUP) {
    assert.ok((all[blackLine] ?? '').includes(coordinate), `black is missing ${coordinate}`);
  }

  // And no stone is read out under the wrong colour.
  for (const coordinate of BLACK_SETUP) {
    assert.ok(!(all[whiteLine] ?? '').split(', ').includes(coordinate), `${coordinate} is black`);
  }
});

// White-sided rather than black-sided, and it has to be: a position of black
// stones alone is a handicap, and is read as the game it is.
test('renders only the colour a one-sided position holds', () => {
  const text = renderSgf('(;GM[1]SZ[9]AW[cc][dd]PL[B];B[ee])');

  assert.match(text, /^Белые: 2 камня/m);
  assert.doesNotMatch(text, /^Чёрные:/m, 'no empty line is produced for the colour with no stones');
});

/**
 * A problem file carries player names, komi and a date as artefacts of the format
 * rather than as facts. "Чёрные Black, белые White" and "Коми: 0" are three
 * seconds of speech that say nothing.
 *
 * A result is not among them, and cannot be: `RE` is one of the two properties
 * that identify a game outright, so a file carrying one is read as a game rather
 * than reaching this renderer at all.
 */
test('omits the game metadata a problem file carries out of habit', () => {
  const text = renderSgf(
    '(;GM[1]SZ[9]AB[cc]AW[dd]PL[W]PW[White]PB[Black]KM[0.00]EV[Club]PC[Online]DT[2026-01-01];W[ee])',
  );

  assert.doesNotMatch(text, /Коми/);
  assert.doesNotMatch(text, /Фора/);
  assert.doesNotMatch(text, /Турнир|Club/);
  assert.doesNotMatch(text, /Место|Online/);
  assert.doesNotMatch(text, /Дата|2026-01-01/);
  assert.doesNotMatch(text, /^Чёрные Black/m, 'the placeholder players are not read out');
});

test('renders the note under a label of its own', () => {
  const text = renderFixture('problem-attack.sgf');

  assert.match(text, /^Примечание: White to play\./m);
  assert.match(text, /Guan-Zhi-Pu/, 'the whole of the note is carried, not its first line');
});

test('omits the label when the problem carries no note', () => {
  assert.doesNotMatch(renderFixture('problem-position-only.sgf'), /Примечание/);
});

test('states how many lines the solution holds, before any of them', () => {
  const all = lines(renderFixture('problem-attack.sgf'));

  const heading = all.findIndex((line) => line.startsWith('Решение'));
  assert.ok(heading > 0, 'the solution is introduced');
  assert.match(all[heading] ?? '', /8 вариантов/);

  // The heading is what lets a listener stop before the answer, so nothing of
  // the answer may precede it.
  const firstLine = all.findIndex((line) => line.startsWith('Вариант'));
  assert.ok(firstLine > heading, 'the first line of the answer follows the heading');
});

/**
 * A file whose answer is partly unreadable. Saying nothing would leave a reader
 * with a count she cannot check against anything, hunting for a refutation the
 * text never held — so the shortfall is stated beside the heading, where it can
 * still inform the decision to hear the answer at all.
 */
test('says how much of the solution could not be read', () => {
  const text = renderSgf('(;GM[1]SZ[9]AW[cc]AB[dd]PL[B];B[ba](;W[ab];B[bb])(;W[!!];B[ee]))');

  const all = lines(text);
  const heading = all.findIndex((line) => line.startsWith('Решение'));

  assert.match(all[heading] ?? '', /^Решение: 1 вариант\.$/, 'the heading counts what is there');
  assert.match(all[heading + 1] ?? '', /Ещё 1 вариант прочитать не удалось/);
  assert.ok(
    (all.findIndex((line) => line.startsWith('Вариант')) ?? 0) > heading + 1,
    'the shortfall is said before any of the answer',
  );
});

test('says a stone that appears inside a line, in the wording a game uses', () => {
  // The same sentence as on the game path, and it has to be: a stone appearing
  // mid-answer is the same event whichever genre the file belongs to, and a
  // reader who has learnt one sentence should not have to learn a second.
  const all = lines(renderSgf('(;GM[1]SZ[9]AB[hh]AW[dd]PL[B];B[ba](;AW[aa];B[ab]))'));

  const placed = all.indexOf('Поставлено 1 камень белых: A9');
  assert.ok(placed > 0, 'the stone that appears is announced inside the line');
  assert.match(all[placed - 1] ?? '', /^1\. Чёрные B9$/);
  assert.match(all[placed + 1] ?? '', /^2\. Чёрные A8 — снято 1 камень белых: A9$/);
});

test('stays silent about a solution that is whole', () => {
  assert.doesNotMatch(renderFixture('problem-attack.sgf'), /прочитать не удалось/);
});

test('says so when the file records no solution at all', () => {
  const text = renderFixture('problem-position-only.sgf');

  assert.match(text, /Решени[ея]/, 'silence would read as a text that was cut short');
  assert.doesNotMatch(text, /0 вариантов/);
});

/**
 * The tree read as a flat list. Indentation does not survive speech — a screen
 * reader either ignores leading whitespace or announces it as a count of
 * spaces — so a nested answer cannot be followed at all.
 */
test('renders every line in full from move 1, sharing nothing between them', () => {
  const all = lines(renderFixture('problem-attack.sgf'));

  const headings = all.filter((line) => line.startsWith('Вариант'));
  assert.equal(headings.length, 8);

  const moveLines = all.filter((line) => /^\d+\./.test(line));
  assert.equal(moveLines.length, 5 + 5 + 3 + 3 + 8 + 4 + 8 + 9);

  // Lines 1 and 2 diverge at their fourth move, and both still open at their
  // first: neither is written relative to the other.
  const opening = ['1. Белые E13', '2. Чёрные E12', '3. Белые F13'];
  const first = all.indexOf('Вариант 1 — правильный:');
  const second = all.indexOf('Вариант 2 — правильный:');

  assert.ok(first > 0 && second > first);
  assert.deepEqual(all.slice(first + 1, first + 4), opening);
  assert.deepEqual(all.slice(second + 1, second + 4), opening);
});

test('indents nothing and draws no rules in punctuation', () => {
  for (const name of ['problem-attack.sgf', 'problem-no-marks.sgf', 'problem-position-only.sgf']) {
    for (const locale of ['ru', 'en']) {
      for (const line of lines(renderFixture(name, locale))) {
        assert.doesNotMatch(line, /^\s+/, `${name} in ${locale} indents a line`);
        // A row of dashes is read out as a row of dashes.
        assert.doesNotMatch(line, /^([-=_*—])\1{2,}$/, `${name} in ${locale} draws a rule`);
      }
    }
  }
});

/**
 * The one capture in the reference problem, and the reason each line is replayed
 * on its own. Miss it and a white stone stays on the tactile board while the
 * text goes on describing a position that no longer exists.
 */
test('names a capture inside a line in the wording a game record uses', () => {
  const all = lines(renderFixture('problem-attack.sgf'));
  const ru = getLocale('ru');

  const second = all.indexOf('Вариант 2 — правильный:');
  assert.ok(second > 0);

  assert.equal(all[second + 4], ru.move(4, 'B', 'D11', ['D12'], 'W'));
  assert.match(all[second + 4] ?? '', /D12/);
});

test('marks the lines the file marks and stays silent about the others', () => {
  const marked = lines(renderFixture('problem-attack.sgf')).filter((line) =>
    line.startsWith('Вариант'),
  );

  assert.deepEqual(marked.slice(0, 4), [
    'Вариант 1 — правильный:',
    'Вариант 2 — правильный:',
    'Вариант 3 — правильный:',
    'Вариант 4 — правильный:',
  ]);
  assert.deepEqual(marked.slice(4), [
    'Вариант 5:',
    'Вариант 6:',
    'Вариант 7:',
    'Вариант 8:',
  ]);
});

// SGF cannot say that a branch fails, so neither may the converter.
test('never calls an unmarked line wrong', () => {
  for (const locale of ['ru', 'en']) {
    const text = renderFixture('problem-no-marks.sgf', locale);

    assert.doesNotMatch(text, /неверн|ошиб|неправильн|wrong|incorrect|fail/i);
  }
});

test('renders a problem in English with the same coordinates', () => {
  const en = renderFixture('problem-attack.sgf', 'en');

  assert.match(en, /^Problem\. White to play\.$/m);
  assert.match(en, /^White: 14 stones — /m);
  assert.match(en, /^Solution: 8 variations\.$/m);
  assert.match(en, /^Variation 1 — correct:$/m);
  assert.match(en, /^Variation 5:$/m);

  const coordinatesOf = (text: string): (string | undefined)[] =>
    lines(text)
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.match(/[A-T]\d+/)?.[0]);

  assert.deepEqual(coordinatesOf(en), coordinatesOf(renderFixture('problem-attack.sgf')));
});
