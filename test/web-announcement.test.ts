import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  destinationFor,
  fieldInvalidity,
  staleRegions,
  survivesRestatement,
} from '../web/announcement.ts';
import type { Destination, Subject, Tone } from '../web/announcement.ts';

/**
 * A message on this page carries two facts: how it is drawn, and what it is about. From
 * that pair follow three decisions — where the message is said, whether the game field
 * is reported as invalid, and how long the message stays true — and all three used to
 * live inside the DOM shell where no test could reach them. They are here instead, for
 * the same reason `share.ts` is: `main.ts` is the one module a `node --test` run cannot
 * import.
 *
 * Each of the three has now been got wrong in production at least once, which is the
 * argument for this file existing rather than a theory about it. Where a message is said
 * was a choice made by hand at every call site, so three messages shipped in the wrong
 * region and not one of them failed a test.
 */
test('only a message about the record becomes the record’s description', () => {
  assert.equal(destinationFor('record'), 'field');

  for (const subject of ['result', 'file', 'page'] as const) {
    assert.equal(
      destinationFor(subject),
      'notice',
      `a message about the ${subject} is an event, said beside the control that caused it`,
    );
  }
});

test('a file that could not be read does not accuse the record', () => {
  // The last of the three, and the one left standing when the others were moved: a
  // file that failed to load has a plausible claim on the field, since the field is
  // where its contents were going. But nothing read the record — it may be a perfectly
  // good game she pasted an hour ago — and marking it invalid tells her it is wrong on
  // the evidence of a file. That is the mistake the requirement names.
  assert.equal(destinationFor('file'), 'notice');
  assert.equal(fieldInvalidity({ tone: 'error', where: destinationFor('file') }), null);
});

test('every subject has somewhere to be said', () => {
  // A new subject added to the union without a destination would fall through to
  // `undefined` here rather than to a sensible default, and a region of `undefined` is
  // a message nobody reads.
  const subjects: readonly Subject[] = ['record', 'result', 'file', 'page'];

  for (const subject of subjects) {
    assert.ok(
      destinationFor(subject) === 'field' || destinationFor(subject) === 'notice',
      `${subject} names a real region`,
    );
  }
});

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

/**
 * Where a message is drawn, once the page offers the same action in more than one
 * place. Two share controls at opposite ends of a page cannot share one region: the
 * reader at high magnification sees only the part of the page she is in, so a
 * confirmation drawn at the other end is a confirmation never drawn.
 */
const field = { kind: 'field' as Destination, name: 'status' };
const formNotice = { kind: 'notice' as Destination, name: 'notice' };
const mastheadNotice = { kind: 'notice' as Destination, name: 'notice-top' };
const footerNotice = { kind: 'notice' as Destination, name: 'notice-bottom' };
const all = [field, formNotice, mastheadNotice, footerNotice];

test('a notice clears the other notices', () => {
  // One event has just happened, so one sentence describes the present. The others
  // stopped being true and would still be found by anyone reading the page in order.
  const stale = staleRegions(all, footerNotice);

  assert.deepEqual(
    stale.map((region) => region.name).sort(),
    ['notice', 'notice-top'],
    'every other notice is emptied',
  );
});

test('a notice never clears the field’s description', () => {
  // The defect this exists to prevent, and it shipped: sharing the page emptied the
  // sentence explaining why a record could not be parsed, while leaving the field
  // marked invalid. A screen reader then announced a problem with nothing to say what
  // it was.
  for (const speaking of [formNotice, mastheadNotice, footerNotice]) {
    assert.ok(
      !staleRegions(all, speaking).includes(field),
      `speaking in ${speaking.name} leaves the record’s own message standing`,
    );
  }
});

test('the field’s description is replaced, never cleared', () => {
  // It is state rather than an event: it holds until the field's condition changes,
  // which is what makes it safe to read out every time she reaches the field.
  assert.ok(
    !staleRegions(all, field).includes(field),
    'the region being spoken into is not also emptied',
  );
});

test('a message about the record supersedes a standing notice', () => {
  // A conversion is newer news than "the address was copied", so the older sentence
  // goes rather than the two of them standing side by side as if both had just
  // happened.
  assert.deepEqual(
    staleRegions(all, field).map((region) => region.name).sort(),
    ['notice', 'notice-bottom', 'notice-top'],
  );
});

test('one message at a time, and it is the one just announced', () => {
  for (const speaking of all) {
    const standing = all.filter((region) => !staleRegions(all, speaking).includes(region));

    assert.ok(standing.includes(speaking), `${speaking.name} keeps what was just said`);
    assert.ok(
      standing.every((region) => region === speaking || region.kind === 'field'),
      'nothing else holds a message, except the field describing itself',
    );
  }
});

/**
 * How long a message stays true, which is the third question about a message beside what
 * it is about and where it is said — and the one that had no answer written anywhere.
 *
 * It comes up when the language changes: the standing message is restated so that a
 * failure is not left in a language she does not read. Restating a *confirmation* reports
 * an event that is not happening, and the page did exactly that — change the language
 * after copying and it announced the copy again.
 */
test('a failure survives being restated, wherever it is said', () => {
  // The condition it describes still holds: the record is still broken, the clipboard
  // still refused. She is owed the reason in the language she is now reading.
  assert.equal(survivesRestatement({ tone: 'error', where: 'field' }), true);
  assert.equal(survivesRestatement({ tone: 'error', where: 'notice' }), true);
});

test('the field’s own messages always survive', () => {
  // Including "done, N moves", which is a confirmation by tone and a description of
  // state by function: the result it counts is sitting on the page right now, so it has
  // to be readable in the language the page has just switched to.
  assert.equal(survivesRestatement({ tone: 'info', where: 'field' }), true);
});

test('a finished confirmation in a notice does not survive', () => {
  // The only combination that describes an event rather than a condition, and the one
  // that shipped wrong: "the address of this page has been copied" restated on a
  // language change is a copy that did not happen.
  assert.equal(survivesRestatement({ tone: 'info', where: 'notice' }), false);
});

test('exactly one of the four combinations is an event', () => {
  // Stated as a whole so the rule cannot be widened by accident: everything the field
  // says is its present state, and an error anywhere is a condition still in force.
  const combinations = (['info', 'error'] as const).flatMap((tone) =>
    (['field', 'notice'] as const).map((where) => ({ tone, where })),
  );

  const finished = combinations.filter((standing) => !survivesRestatement(standing));

  assert.deepEqual(finished, [{ tone: 'info', where: 'notice' }]);
});
