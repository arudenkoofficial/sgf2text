import { test } from 'node:test';
import assert from 'node:assert/strict';
import GoBoard from '@sabaki/go-board';
import { western } from '../src/coords.ts';

test('names the top-right star point on a 19x19 board', () => {
  assert.equal(western.format({ x: 15, y: 3 }, 19), 'Q16');
});

test('names the ninth column J, never I', () => {
  assert.equal(western.format({ x: 8, y: 0 }, 19), 'J19');

  const columns = Array.from({ length: 19 }, (_, x) => western.format({ x, y: 0 }, 19));
  assert.ok(
    columns.every((coord) => !coord.startsWith('I')),
    `the letter I must never appear as a column: ${columns.join(' ')}`,
  );
});

test('counts rows from the bottom edge of the board in play', () => {
  assert.equal(western.format({ x: 2, y: 2 }, 9), 'C7');
  assert.equal(western.format({ x: 0, y: 0 }, 9), 'A9');
  assert.equal(western.format({ x: 8, y: 8 }, 9), 'J1');
});

// @sabaki/go-board already implements this notation. We keep our own
// implementation — it must work without a board, and a locale may later need
// a different system — but the library makes a thorough oracle: an off-by-one
// or a misplaced skipped letter shows up on some vertex of some board size.
test('agrees with @sabaki/go-board on every vertex of every supported size', () => {
  for (const size of [9, 13, 19]) {
    const board = GoBoard.fromDimensions(size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        assert.equal(
          western.format({ x, y }, size),
          board.stringifyVertex([x, y]),
          `disagreement at x=${x}, y=${y} on a ${size}x${size} board`,
        );
      }
    }
  }
});
