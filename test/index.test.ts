import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOCALE_IDS, sgfToRecord, sgfToText } from '../src/index.ts';

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
