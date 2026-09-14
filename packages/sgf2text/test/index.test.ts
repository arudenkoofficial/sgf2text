import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOCALE_IDS, sgfToDocument, sgfToRecord, sgfToText } from '../src/index.ts';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixture = (name: string): string => readFileSync(fixturesDir + name, 'utf8');

test('converts a game with the default locale', () => {
  const text = sgfToText(fixture('plain.sgf'));

  assert.match(text, /Чёрные/, 'the default language is Russian');
  assert.match(text, /Q16/);
});

test('converts a game in a requested locale', () => {
  const text = sgfToText(fixture('plain.sgf'), { locale: 'en' });

  assert.match(text, /Black/);
  assert.doesNotMatch(text, /Чёрные/);
});

test('rejects an unknown locale', () => {
  assert.throws(() => sgfToText(fixture('plain.sgf'), { locale: 'ja' }), /Unknown language/);
});

test('exposes the record without any display strings', () => {
  const record = sgfToRecord(fixture('capture-single.sgf'));

  assert.equal(record.size, 9);
  assert.deepEqual(record.meta.result, { kind: 'resignation', winner: 'B' });

  const capture = record.events.find((event) => event.kind === 'move' && event.n === 3);
  assert.deepEqual(capture, {
    kind: 'move',
    n: 3,
    color: 'B',
    at: { x: 0, y: 1 },
    captures: [{ x: 0, y: 0 }],
  });

  // Nothing in the record is language-specific: it is data for other tools,
  // such as the OGS userscript, which needs the moves and not the prose.
  assert.doesNotMatch(JSON.stringify(record), /Чёрные|Black|камень|stone/);
});

test('converts a problem file as a problem', () => {
  const text = sgfToText(fixture('problem-attack.sgf'));

  assert.match(text, /^Задача\. Ход белых\.$/m);
  assert.match(text, /^Решение: 8 вариантов\.$/m);
  assert.match(text, /^Белые: 14 камней — /m);

  // The bug this whole change exists for: a constructed position is not a
  // handicap, and twenty-seven stones of two colours read out as one list of
  // coordinates cannot be put on a board.
  assert.doesNotMatch(text, /Фора/);
});

test('leaves a game record exactly as it was', () => {
  const text = sgfToText(fixture('plain.sgf'));

  assert.doesNotMatch(text, /Задача|Решение|Вариант/);
  assert.match(text, /^Размер доски: 19×19$/m);
  assert.match(text, /^1\. Чёрные Q16$/m);
});

test('tells the two genres apart on the way in', () => {
  assert.equal(sgfToDocument(fixture('plain.sgf')).kind, 'game');
  assert.equal(sgfToDocument(fixture('handicap4.sgf')).kind, 'game');
  assert.equal(sgfToDocument(fixture('variations.sgf')).kind, 'game');
  assert.equal(sgfToDocument(fixture('problem-attack.sgf')).kind, 'problem');
  assert.equal(sgfToDocument(fixture('problem-position-only.sgf')).kind, 'problem');
});

test('exposes a problem as data, with no language in it', () => {
  const document = sgfToDocument(fixture('problem-attack.sgf'));
  assert.equal(document.kind, 'problem');
  if (document.kind !== 'problem') {
    return;
  }

  const { problem } = document;
  assert.equal(problem.size, 19);
  assert.equal(problem.toPlay, 'W');
  assert.equal(problem.setup.length, 27);
  assert.equal(problem.lines.length, 8);

  // The note is the file's own text and stays as the file wrote it; nothing the
  // converter itself says is language-specific here.
  assert.doesNotMatch(
    JSON.stringify({ ...problem, note: undefined }),
    /Чёрные|Задача|Вариант|Problem|Variation|камень|stone/,
  );
});

// `sgfToRecord` is what the README documents for other tools to consume, such as
// the OGS userscript. A problem is a second genre, not a change to the first.
test('sgfToRecord still returns a game record, of the shape it always had', () => {
  const record = sgfToRecord(fixture('handicap4.sgf'));

  assert.deepEqual(Object.keys(record).sort(), ['events', 'meta', 'size']);
  assert.equal(record.size, 19);
  assert.equal(record.meta.handicap, 4);
  assert.equal(record.events[0]?.kind, 'setup');
  assert.equal(record.events.filter((event) => event.kind === 'move').length, 3);
});

// The regression net. Every fixture here is a game that either the Japanese
// converter mishandles or that exercises the rules; none of them may throw.
test('converts every fixture in every locale', () => {
  const fixtures = readdirSync(fixturesDir).filter((name) => name.endsWith('.sgf'));
  assert.ok(fixtures.length >= 12, 'the fixture set is present');

  for (const name of fixtures) {
    for (const locale of LOCALE_IDS) {
      const text = sgfToText(fixture(name), { locale });

      assert.ok(text.length > 0, `${name} in ${locale} produced no text`);
      assert.doesNotMatch(text, /undefined|NaN/, `${name} in ${locale} leaked a placeholder`);
    }
  }
});
