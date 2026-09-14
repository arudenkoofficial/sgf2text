import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLocale, isSgfError, sgfToText } from '../src/index.ts';
import type { SgfErrorCode } from '../src/index.ts';

const codeOf = (run: () => unknown): SgfErrorCode => {
  try {
    run();
  } catch (error) {
    assert.ok(isSgfError(error), 'the failure carries a code');
    return error.code;
  }

  throw new Error('the call was expected to fail and did not');
};

// An interface cannot translate a failure it can only read as English prose.
test('every failure carries a machine-readable code', () => {
  assert.equal(codeOf(() => sgfToText('')), 'empty-input');
  assert.equal(codeOf(() => sgfToText('this is not a game record')), 'not-sgf');
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[19:9];B[pd])')), 'rectangular-board');
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[nonsense];B[pd])')), 'unreadable-size');
  assert.equal(codeOf(() => getLocale('ja')), 'unknown-locale');
});

/**
 * A point the board does not have. These reached the coordinate formatter, which
 * threw a bare `Error` about column numbers — untranslatable, and only when the
 * column ran past the alphabet. Below that it did not throw at all.
 */
test('a move outside the board is a failure, not a coordinate', () => {
  // The case that did not throw: `jj` is the tenth point of the tenth row, so on
  // a 9×9 board it fell one row past the bottom and was read out as "K0". No
  // board has a row zero, nothing failed, and the exit code was zero.
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[9]PB[a]PW[b];B[jj])')), 'unreadable-move');
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[19]PB[a]PW[b];B[zz])')), 'unreadable-move');
});

test('a setup stone outside the board is a failure too', () => {
  // It would otherwise be placed, counted in the position and read out at a
  // coordinate that does not exist — a board she cannot build.
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[9]AB[zz]AW[dd]PL[B];B[aa])')), 'unreadable-move');
});

test('emptying a point outside the board is not a failure', () => {
  // The one that is allowed to pass, and only because nothing follows from it:
  // `AE` on a point the board does not have removes no stone and says nothing.
  assert.match(sgfToText('(;GM[1]SZ[9]AB[cc]AW[dd]PL[B]AE[zz];B[aa])'), /C7/);
});

test('a board too large to name is refused before anything is written', () => {
  // SGF allows up to 52; western notation names 25, I being skipped. This used to
  // print the metadata block and then fail part-way through the moves, leaving
  // half a record on standard output.
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[26]PB[a]PW[b];B[aa])')), 'unsupported-size');
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[26:26];B[aa])')), 'unsupported-size');
});

test('a board the notation can just name is still accepted', () => {
  assert.match(sgfToText('(;GM[1]SZ[25]PB[a]PW[b];B[aa])'), /A25/);
});

test('the message stays available for developers and the CLI', () => {
  try {
    sgfToText('(;GM[1]SZ[19:9];B[pd])');
    assert.fail('expected a failure');
  } catch (error) {
    assert.ok(isSgfError(error));
    assert.match(error.message, /[Rr]ectangular/);
    assert.equal(error.name, 'SgfError');
  }
});

test('a square board written the long way is checked like any other', () => {
  // `SZ[19:19]` is legal and means 19×19. That branch used to return before every
  // check below it, so an oversized board passed and `SZ[x:x]` produced a board of
  // NaN points that nothing objected to.
  assert.match(sgfToText('(;GM[1]SZ[19:19]PB[a]PW[b];B[pd])'), /19×19/);
  assert.equal(codeOf(() => sgfToText('(;GM[1]SZ[x:x];B[aa])')), 'unreadable-size');
});
