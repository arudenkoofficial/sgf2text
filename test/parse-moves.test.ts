import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGame } from '../src/parse.ts';

const fixture = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('reads moves in play order', () => {
  const game = parseGame(fixture('plain.sgf'));

  assert.deepEqual(game.moves[0], { kind: 'move', color: 'B', at: { x: 15, y: 3 } });
  assert.deepEqual(game.moves[1], { kind: 'move', color: 'W', at: { x: 3, y: 15 } });
  assert.equal(game.moves.length, 7);
});

// The Japanese converter throws on this file: B[] is not a coordinate it can
// look up, so the whole game fails to convert.
test('reads a modern pass', () => {
  const game = parseGame(fixture('pass-modern.sgf'));

  assert.deepEqual(game.moves[2], { kind: 'pass', color: 'B' });
  assert.deepEqual(game.moves[3], { kind: 'pass', color: 'W' });
  assert.equal(game.moves.length, 5);
});

test('reads a legacy pass on boards where tt is off the grid', () => {
  const game = parseGame(fixture('pass-legacy.sgf'));

  assert.deepEqual(game.moves[1], { kind: 'pass', color: 'W' });
});

test('treats tt as a real move on a board large enough to hold it', () => {
  const game = parseGame('(;GM[1]SZ[21];B[tt])');

  assert.deepEqual(game.moves[0], { kind: 'move', color: 'B', at: { x: 19, y: 19 } });
});

// The Japanese converter throws here too: a comment-only node has no colour
// letter where it expects one.
test('skips nodes that carry no move', () => {
  const game = parseGame(fixture('comment-node.sgf'));

  assert.deepEqual(game.moves, [
    { kind: 'move', color: 'B', at: { x: 15, y: 3 } },
    { kind: 'move', color: 'W', at: { x: 3, y: 15 } },
    { kind: 'move', color: 'B', at: { x: 15, y: 15 } },
  ]);
});

// The Japanese converter silently splices both branches into one game,
// presenting a sequence that was never played.
test('follows only the main line through variations', () => {
  const game = parseGame(fixture('variations.sgf'));

  assert.deepEqual(game.moves, [
    { kind: 'move', color: 'B', at: { x: 15, y: 3 } },
    { kind: 'move', color: 'W', at: { x: 3, y: 15 } },
    { kind: 'move', color: 'B', at: { x: 15, y: 15 } },
  ]);
});

test('reads handicap stones as a setup with coordinates', () => {
  const game = parseGame(fixture('handicap4.sgf'));

  assert.equal(game.meta.handicap, 4);
  assert.deepEqual(game.moves[0], {
    kind: 'setup',
    stones: [
      { color: 'B', at: { x: 3, y: 3 } },
      { color: 'B', at: { x: 15, y: 3 } },
      { color: 'B', at: { x: 3, y: 15 } },
      { color: 'B', at: { x: 15, y: 15 } },
    ],
  });
  assert.deepEqual(game.moves[1], { kind: 'move', color: 'W', at: { x: 5, y: 16 } });
});

test('reports a handicap count that comes without placements', () => {
  const game = parseGame('(;GM[1]SZ[19]HA[4];W[fq])');

  assert.equal(game.meta.handicap, 4);
  assert.ok(
    game.moves.every((move) => move.kind !== 'setup'),
    'a handicap count alone must not invent a setup event',
  );
});
