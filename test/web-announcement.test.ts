import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  conversionMessage,
  summarise,
  destinationFor,
  fieldInvalidity,
  reconvertsOnLanguageChange,
  staleRegions,
  survivesRestatement,
} from '../web/announcement.ts';
import type { Destination, Subject, Tone } from '../web/announcement.ts';
import { SUPPORTED_LANGUAGES, stringsFor } from '../web/ui-strings.ts';
import { sgfToDocument } from '../src/index.ts';

const fixture = (name: string): string =>
  readFileSync(new URL(`../test/fixtures/${name}`, import.meta.url), 'utf8');

/**
 * A message on this page carries two facts: how it is drawn, and what it is about. From
 * that pair follow three decisions — where the message is said, whether the control that
 * took the file is reported as invalid, and how long the message stays true — and all
 * three used to live inside the DOM shell where no test could reach them. They are here
 * instead, for the same reason `save.ts` is: `main.ts` is the one module a `node --test`
 * run cannot import.
 *
 * Each of the three has now been got wrong in production at least once, which is the
 * argument for this file existing rather than a theory about it. Where a message is said
 * was a choice made by hand at every call site, so three messages shipped in the wrong
 * region and not one of them failed a test.
 */
test('only a message about the game the page was given becomes the control’s description', () => {
  assert.equal(destinationFor('record'), 'field');

  assert.equal(
    destinationFor('result'),
    'notice',
    'a message about the converted text is an event, said beside the control that caused it',
  );
});

test('a file that could not be read is a verdict on the control that took it', () => {
  // This changed with the field it used to reason about. While the page held a textarea,
  // a failed read was a notice: the record in the field might be a perfectly good game
  // she pasted an hour ago, and nothing about the file had examined it — so marking it
  // invalid told her the game she was holding was wrong on the evidence of a file.
  //
  // There is no such record now. The chosen file is the only game the page has, so a
  // file it could not read is a verdict on the only thing there is — and choosing
  // another file, in that control, is the one thing she can do about it, which is
  // exactly when focus should follow the message.
  assert.equal(destinationFor('file'), 'field');
  assert.equal(fieldInvalidity({ tone: 'error', where: destinationFor('file') }), 'true');
});

/**
 * The exhaustiveness check, and it has to be a type-level one.
 *
 * This test used to loop over the three subjects asserting each landed in `'field'` or
 * `'notice'`, which is the return type — so the assertion could not fail, whatever
 * `destinationFor` did. Worse, the list was typed `readonly Subject[]`, so widening the
 * union still compiled and the test still passed: it was checking nothing about the one
 * thing it was written to check.
 *
 * `Exhaustive` fails to compile the moment `Subject` gains a member, and the root
 * `tsconfig.json` includes `test`, so `npm run typecheck` is where this one is read.
 * `destinationFor` itself is now a total `Record`, which makes the same mistake a
 * compile error in `announcement.ts` too — this is the second lock rather than the only
 * one.
 */
type Exhaustive = Subject extends 'record' | 'result' | 'file' ? true : never;
const subjectsAreExactlyThese: Exhaustive = true;

test('every subject is mapped to a region by name rather than by a default', () => {
  assert.ok(subjectsAreExactlyThese);

  // Stated one at a time on purpose. A loop asserting "each lands somewhere" is what
  // this test used to be, and a fall-through default satisfies that while sending a
  // subject nobody has thought about to the field — where an error marks her file
  // invalid and takes her focus.
  assert.equal(destinationFor('record'), 'field');
  assert.equal(destinationFor('result'), 'notice');
  assert.equal(destinationFor('file'), 'field');
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
  // The regression this exists to prevent: an action that could not happen used to
  // write `aria-invalid="false"` over a file that had failed to parse and was still
  // the last one chosen. The control then reported itself valid to a screen reader
  // while holding a verdict the page had already reached.
  assert.equal(fieldInvalidity({ tone: 'error', where: 'notice' }), null);
});

test('a success read out in the notice leaves a standing mark alone', () => {
  // Same in the other direction: a file reaching her device says nothing about
  // whether the last file she chose could be read, so it must not vouch for it either.
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

  assert.equal(moves('error', 'field'), true, 'the file she chose is what needs replacing');
  assert.equal(
    moves('error', 'notice'),
    false,
    'saving failed; the file control is not where she is needed',
  );
  assert.equal(moves('info', 'field'), false, 'success never takes focus');
  assert.equal(moves('info', 'notice'), false);
});

/**
 * Where a message is drawn. The page currently has one region for events, beside the
 * one control that produces them, and this rule is what the next one will rely on: two
 * controls at opposite ends of a page cannot share a region, because the reader at high
 * magnification sees only the part of the page she is in, so a confirmation drawn at
 * the other end is a confirmation never drawn.
 *
 * Tested with a second notice the page does not currently have, on purpose. The rule
 * held for two share controls, it has to hold for whatever arrives next, and a fixture
 * with one notice in it could not tell whether it still does.
 */
const field = { kind: 'field' as Destination, name: 'status' };
const saveNotice = { kind: 'notice' as Destination, name: 'notice' };
const elsewhere = { kind: 'notice' as Destination, name: 'notice-elsewhere' };
const all = [field, saveNotice, elsewhere];

test('a notice clears the other notices', () => {
  // One event has just happened, so one sentence describes the present. The others
  // stopped being true and would still be found by anyone reading the page in order.
  const stale = staleRegions(all, elsewhere);

  assert.deepEqual(
    stale.map((region) => region.name).sort(),
    ['notice'],
    'every other notice is emptied',
  );
});

test('a notice never clears the field’s description', () => {
  // The defect this exists to prevent, and it shipped: an action on the page emptied
  // the sentence explaining why a record could not be parsed, while leaving the control
  // marked invalid. A screen reader then announced a problem with nothing to say what
  // it was.
  for (const speaking of [saveNotice, elsewhere]) {
    assert.ok(
      !staleRegions(all, speaking).includes(field),
      `speaking in ${speaking.name} leaves the file’s own message standing`,
    );
  }
});

test('the field’s description is replaced, never cleared', () => {
  // It is state rather than an event: it holds until the control's condition changes,
  // which is what makes it safe to read out every time she reaches the control.
  assert.ok(
    !staleRegions(all, field).includes(field),
    'the region being spoken into is not also emptied',
  );
});

test('a message about the game supersedes a standing notice', () => {
  // A conversion is newer news than "the file has been saved", so the older sentence
  // goes rather than the two of them standing side by side as if both had just
  // happened.
  assert.deepEqual(
    staleRegions(all, field).map((region) => region.name).sort(),
    ['notice', 'notice-elsewhere'],
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
 * after taking the text away and it announced that again.
 */
test('a failure survives being restated, wherever it is said', () => {
  // The condition it describes still holds: the file is still the one that would not
  // convert, saving still refused. She is owed the reason in the language she is now
  // reading.
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
  // that shipped wrong: "the file has been saved" restated on a language change is a
  // save that did not happen.
  assert.equal(survivesRestatement({ tone: 'info', where: 'notice' }), false);
});

/**
 * Whether a change of language re-converts the game the page is holding.
 *
 * This lived in the language control's handler as `if (result.textContent !== '')`, and
 * it was wrong in a way no test could see — which is the argument for every decision in
 * this file, arriving once more.
 *
 * The guard was reasoned about against a file that failed to *parse*, where the result is
 * emptied and there is nothing to re-convert. The case it was never checked against is a
 * file that could not be *read*: nothing examined it, so the previous game's text is
 * deliberately left standing while the file control carries a verdict about the new file.
 * A result on the page then meant "re-convert", the page announced a success about the
 * previous game into the field region, and that overwrote the verdict and marked the
 * control valid — so the page vouched for the file it had just said it could not read.
 */
test('a game on the page is re-converted when the language changes', () => {
  assert.equal(reconvertsOnLanguageChange({ hasResult: true, fileIsMarkedInvalid: false }), true);
});

test('nothing is re-converted when the page holds no result', () => {
  // A file that failed to parse: the result was emptied, and the standing failure is
  // restated by the page rather than re-derived by converting again.
  assert.equal(reconvertsOnLanguageChange({ hasResult: false, fileIsMarkedInvalid: true }), false);
});

test('a standing verdict on the file outweighs a result still on the page', () => {
  // The defect this predicate exists for. Re-converting here would announce the previous
  // game as a success, wipe the sentence explaining the verdict, and set the mark to
  // `'false'` — the page vouching for a file it could not read.
  assert.equal(reconvertsOnLanguageChange({ hasResult: true, fileIsMarkedInvalid: true }), false);
});

test('the verdict is read from the control rather than from the last thing said', () => {
  // Read from the mark, not from the standing announcement, and the distinction is the
  // one `forgetTheVerdict` records: the last thing the page *said* may be about the save
  // she just pressed, while the verdict on her file is a state that outlives it. Asking
  // the announcement would report no verdict to respect.
  //
  // Expressed here as the property that matters: the mark alone decides, whatever else
  // the page has been saying.
  assert.equal(reconvertsOnLanguageChange({ hasResult: true, fileIsMarkedInvalid: true }), false);
  assert.equal(reconvertsOnLanguageChange({ hasResult: true, fileIsMarkedInvalid: false }), true);
});

/**
 * What the page says once a file has converted. The page used to count the lines
 * of the finished text that begin with a numeral, which for a game is its moves
 * and for a problem is every move of every line of the answer added together —
 * forty-five for the reference problem, a number that describes nothing and that
 * a listener has no way to check against anything.
 */
test('a problem is announced as a problem, not as a game of many moves', () => {
  const problem = sgfToDocument(fixture('problem-attack.sgf'));

  for (const language of SUPPORTED_LANGUAGES) {
    const said = conversionMessage(summarise(problem), stringsFor(language));

    assert.match(said, /\b8\b/, `${language} states how many lines the answer holds`);
    assert.doesNotMatch(said, /\b45\b/, `${language} does not sum the moves of every line`);
  }
});

test('a game is still announced by the moves in it', () => {
  const game = sgfToDocument(fixture('plain.sgf'));

  assert.match(conversionMessage(summarise(game), stringsFor('ru')), /\b7\b/);
  assert.notEqual(
    conversionMessage(summarise(game), stringsFor('ru')),
    conversionMessage(summarise(sgfToDocument(fixture('problem-attack.sgf'))), stringsFor('ru')),
    'the two genres are not announced in the same words',
  );
});

/**
 * The one count that must not be spoken as a count. `test/locales.test.ts` holds
 * the same rule for the heading in the converted text; this is the announcement
 * beside it, which had no such guard and said "lines in the solution: 0" while
 * the text on the page read "the file records no solution".
 */
test('a problem with no solution is not announced as a count of nothing', () => {
  const problem = sgfToDocument(fixture('problem-position-only.sgf'));

  for (const language of SUPPORTED_LANGUAGES) {
    const said = conversionMessage(summarise(problem), stringsFor(language));

    assert.doesNotMatch(said, /\b0\b/, `${language} does not read a zero out`);
    assert.match(said, /задач|problem/i, `${language} still says what the file is`);
  }
});

// The handicap stones are placed, not played, and were never part of the count.
test('setup stones are not counted as moves', () => {
  assert.match(conversionMessage(summarise(sgfToDocument(fixture('handicap4.sgf'))), stringsFor('ru')), /\b3\b/);
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
