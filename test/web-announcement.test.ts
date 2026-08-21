import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldInvalidity } from '../web/announcement.ts';
import type { Destination, Tone } from '../web/announcement.ts';

/**
 * A message on this page carries two independent facts: how it is drawn, and what it
 * is about. The pair decides one thing beyond the text itself — whether the game
 * field is reported as invalid — and that decision used to live inside the DOM shell
 * where no test could reach it. It is here instead, for the same reason `share.ts`
 * is: `main.ts` is the one module a `node --test` run cannot import.
 */
test('a failure about the record marks the field invalid', () => {
  assert.equal(fieldInvalidity({ tone: 'error', where: 'field' }), 'true');
});

test('a success about the record clears the mark', () => {
  // The record that failed a moment ago has just converted, so the field is no
  // longer wrong and must stop saying it is.
  assert.equal(fieldInvalidity({ tone: 'info', where: 'field' }), 'false');
});

test('a failure read out in the notice leaves a standing mark alone', () => {
  // The regression this exists to prevent: a share that could not happen used to
  // write `aria-invalid="false"` over a record that had failed to parse and was
  // still sitting in the field. The field then reported itself valid to a screen
  // reader while holding a record the page had already rejected.
  assert.equal(fieldInvalidity({ tone: 'error', where: 'notice' }), null);
});

test('a success read out in the notice leaves a standing mark alone', () => {
  // Same in the other direction: the address reaching the clipboard says nothing
  // about the record in the field, so it must not vouch for it either.
  assert.equal(fieldInvalidity({ tone: 'info', where: 'notice' }), null);
});

test('only a mark of invalidity is a reason to move focus', () => {
  // `main.ts` moves focus exactly when this returns 'true', which is why the
  // condition is stated once here rather than twice there. The two used to be
  // separate expressions in `render` and `announce`, free to drift apart into a
  // field that is marked invalid without being reached, or reached without being
  // marked.
  const moves = (tone: Tone, where: Destination): boolean =>
    fieldInvalidity({ tone, where }) === 'true';

  assert.equal(moves('error', 'field'), true, 'her record is what needs correcting');
  assert.equal(
    moves('error', 'notice'),
    false,
    'the share failed; the field is not where she is needed',
  );
  assert.equal(moves('info', 'field'), false, 'success never takes focus');
  assert.equal(moves('info', 'notice'), false);
});
