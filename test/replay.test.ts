import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGame } from '../src/parse.ts';
import { replay } from '../src/replay.ts';
import type { GameEvent, Vertex } from '../src/types.ts';

const record = (name: string) =>
  replay(parseGame(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')));

const moves = (events: GameEvent[]) => events.filter((event) => event.kind === 'move');

const capturesOf = (events: GameEvent[], n: number): Vertex[] => {
  const move = moves(events).find((event) => event.n === n);
  assert.ok(move !== undefined, `there is no move ${n}`);
  return move.captures;
};

test('records a single captured stone against the move that took it', () => {
  const game = record('capture-single.sgf');

  assert.deepEqual(capturesOf(game.events, 3), [{ x: 0, y: 0 }]);
  assert.deepEqual(capturesOf(game.events, 1), []);
  assert.deepEqual(capturesOf(game.events, 2), []);
});

test('records every stone of a captured group in the corner', () => {
  const game = record('capture-corner.sgf');
  const captured = capturesOf(game.events, 5);

  assert.equal(captured.length, 2);
  assert.deepEqual(new Set(captured.map((v) => `${v.x},${v.y}`)), new Set(['0,0', '0,1']));
});

test('records every stone of a captured group in the centre', () => {
  const game = record('capture-group.sgf');
  const captured = capturesOf(game.events, 11);

  assert.equal(captured.length, 2);
  assert.deepEqual(new Set(captured.map((v) => `${v.x},${v.y}`)), new Set(['4,4', '4,5']));
});

test('records both sides of a ko exchange', () => {
  const game = record('ko.sgf');

  // Black takes the ko, then white takes it back after a threat.
  assert.deepEqual(capturesOf(game.events, 9), [{ x: 4, y: 4 }]);
  assert.deepEqual(capturesOf(game.events, 12), [{ x: 3, y: 4 }]);
});

// Removal order matters: the stone goes down, enemy groups without liberties
// come off, and only then is the player's own group considered. Get it the
// other way round and this move looks like suicide and loses its capture.
test('handles a move that has no liberty of its own but captures', () => {
  const game = record('capture-looks-suicidal.sgf');
  const captured = capturesOf(game.events, 7);

  assert.equal(captured.length, 2);
  assert.deepEqual(new Set(captured.map((v) => `${v.x},${v.y}`)), new Set(['1,0', '0,1']));
});

test('leaves captures empty when a move takes nothing', () => {
  const game = record('plain.sgf');

  assert.ok(
    moves(game.events).every((move) => move.captures.length === 0),
    'a quiet opening captures nothing',
  );
});

test('numbers moves and passes consecutively across the whole game', () => {
  const game = record('pass-modern.sgf');
  const numbered = game.events.filter((event) => event.kind !== 'setup');

  assert.deepEqual(
    numbered.map((event) => event.n),
    [1, 2, 3, 4, 5],
  );
});

test('places handicap stones before the first move so captures stay correct', () => {
  const game = record('handicap4.sgf');
  const setup = game.events[0];

  assert.equal(setup?.kind, 'setup');
  assert.equal(setup.stones.length, 4);

  // The first numbered move is white's, as it must be in a handicap game.
  const first = moves(game.events)[0];
  assert.equal(first?.n, 1);
  assert.equal(first?.color, 'W');
});

test('carries the metadata and size through unchanged', () => {
  const game = record('plain.sgf');

  assert.equal(game.size, 19);
  assert.equal(game.meta.blackPlayer, 'Alice');
});
