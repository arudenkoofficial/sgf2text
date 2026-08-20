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
