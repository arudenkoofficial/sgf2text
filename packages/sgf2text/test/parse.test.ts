import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGame } from '../src/parse.ts';

const fixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('reads the metadata of a standard game', () => {
  const game = parseGame(fixture('plain.sgf'));

  assert.equal(game.size, 19);
  assert.equal(game.meta.event, 'Club match');
  assert.equal(game.meta.place, 'Online');
  assert.equal(game.meta.date, '2026-08-19');
  assert.equal(game.meta.blackPlayer, 'Alice');
  assert.equal(game.meta.whitePlayer, 'Bob');
  assert.equal(game.meta.komi, 6.5);
  assert.deepEqual(game.meta.result, { kind: 'points', winner: 'B', points: 3.5 });
});

// The Japanese converter loses the result here: it looks for the RE property
// with indexOf, which matches the letters 'RE' inside the player's name.
test('keeps the result when a player name contains another property name', () => {
  const game = parseGame(fixture('player-name-freddy.sgf'));

  assert.equal(game.meta.blackPlayer, 'FREDDY');
  assert.deepEqual(game.meta.result, { kind: 'points', winner: 'B', points: 2.5 });
});

test('defaults to a 19x19 board when SZ is absent', () => {
  const game = parseGame('(;GM[1]FF[4]PB[Alice]PW[Bob];B[pd])');

  assert.equal(game.size, 19);
});

test('reads an explicit board size', () => {
  const game = parseGame(fixture('capture-single.sgf'));

  assert.equal(game.size, 9);
});

test('rejects a rectangular board', () => {
  assert.throws(() => parseGame('(;GM[1]FF[4]SZ[19:9];B[pd])'), /rectangular/i);
});

test('rejects input that is not SGF', () => {
  assert.throws(() => parseGame(''), /empty/i);
  assert.throws(() => parseGame('   \n  '), /empty/i);
  assert.throws(() => parseGame('this is not a game record'), /SGF/i);
});

test('reads every form of result', () => {
  const withResult = (re: string) => parseGame(`(;GM[1]SZ[19]RE[${re}];B[pd])`).meta.result;

  assert.deepEqual(withResult('W+R'), { kind: 'resignation', winner: 'W' });
  assert.deepEqual(withResult('W+Resign'), { kind: 'resignation', winner: 'W' });
  assert.deepEqual(withResult('B+T'), { kind: 'time', winner: 'B' });
  assert.deepEqual(withResult('B+F'), { kind: 'forfeit', winner: 'B' });
  assert.deepEqual(withResult('B+12'), { kind: 'points', winner: 'B', points: 12 });
  assert.deepEqual(withResult('0'), { kind: 'draw' });
  assert.deepEqual(withResult('Draw'), { kind: 'draw' });
  assert.deepEqual(withResult('Void'), { kind: 'void' });
  assert.deepEqual(withResult('?'), { kind: 'unknown' });
});

test('omits metadata the file does not carry', () => {
  const game = parseGame('(;GM[1]SZ[19];B[pd])');

  assert.equal(game.meta.event, undefined);
  assert.equal(game.meta.komi, undefined);
  assert.equal(game.meta.result, undefined);
  assert.equal(game.meta.blackPlayer, undefined);
});
