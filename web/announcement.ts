/**
 * What a message means for the game field, decided apart from the DOM.
 *
 * DOM-free for the same reason as `language.ts`, `metadata.ts` and `share.ts`: the
 * tests import it, so it is typechecked without the `dom` lib — and `main.ts`, where
 * this used to live, is the one module a `node --test` run cannot reach.
 *
 * The two facts are deliberately separate. `tone` is how a message is drawn; `where`
 * is which of the page's two live regions it belongs in. Collapsing them into one
 * flag is what made a share that could not happen announce a problem with her game
 * record: the page had nothing to say about the record, and said it anyway.
 */

import type { SgfDocument } from '../src/index.ts';
import type { UiStrings } from './ui-strings.ts';

export type Tone = 'info' | 'error';

/**
 * `field` is the region the game field names in `aria-describedby`, so it holds only
 * what the record in the field is about. `notice` is everything else the page has to
 * say — the result, the clipboard, the address of the page.
 */
export type Destination = 'field' | 'notice';

/**
 * What a message is about. The one fact a call site actually knows, and now the only
 * one it states.
 *
 * Call sites used to name the destination instead, which was an improvement on naming
 * it twice — a separate "is this about the record" flag could contradict the region it
 * was passed with. But it left the subject unwritten anywhere, so the choice of region
 * was a habit spread across ten call sites and no test could see it. Three messages
 * shipped in the wrong one; none of the three failed a test.
 *
 * Named for the thing rather than the place, so the mapping below is a decision this
 * file makes once and a test can read.
 */
export type Subject =
  /** The game in the field: what it converted to, or why it would not. */
  | 'record'
  /** The converted text and the clipboard it is copied to. */
  | 'result'
  /** A file that was chosen — which is not the same as the record in the field. */
  | 'file'
  /** This page: its address, and handing it to somebody else. */
  | 'page';

/**
 * The field's description is read out every time she reaches the field, so only a
 * message about the record may live there. Everything else is an event: it happened
 * once, it is said beside the control that caused it, and it is superseded rather than
 * kept.
 *
 * `file` is the one that reads as a close call. A file that failed to load has a
 * plausible claim on the field, since the field is where its contents were going and
 * where she can paste them instead. It is still a notice: nothing examined the record,
 * so marking it invalid — which is what the field's own region does with a failure —
 * tells her the game she is holding is wrong on the evidence of a file.
 */
export const destinationFor = (subject: Subject): Destination =>
  subject === 'record' ? 'field' : 'notice';

export type Standing = {
  tone: Tone;
  where: Destination;
};

/**
 * The value `aria-invalid` should take on the game field, or `null` for "leave the
 * attribute exactly as it is".
 *
 * `null` rather than `'false'` for anything read out in the notice, and the
 * distinction is the whole point: a record that failed to parse is still sitting in
 * the field when the share control is pressed, and writing `'false'` over it would
 * have the field vouch for a record the page has already rejected — while the message
 * on screen talks about something else entirely.
 *
 * The same answer decides where focus goes, since a field worth marking invalid is
 * exactly a field worth sending her to. Stated once so the two cannot drift into a
 * field that is marked without being reached, or reached without being marked.
 */
export const fieldInvalidity = ({ tone, where }: Standing): 'true' | 'false' | null => {
  if (where === 'notice') {
    return null;
  }

  return tone === 'error' ? 'true' : 'false';
};

/**
 * Whether a standing message is still worth saying when the page restates it.
 *
 * The page restates the standing message when the language changes, so that a failure
 * is never left sitting in a language she does not read. Restating a *confirmation*
 * reports an event that is not happening, and the page did precisely that: copy the
 * address, change the language, and it announced the copy again.
 *
 * The line is not tone alone. "Done, 2 moves" is a confirmation by tone, but the result
 * it counts is on the page right now, so it describes the field's present state and has
 * to be readable in the language just switched to. Everything the field says is its
 * present state; an error anywhere is a condition still in force. Which leaves one
 * combination out of four describing something finished.
 *
 * A cleared notice announces nothing — a polite region reports what appears in it, not
 * what leaves — so dropping one is silent.
 */
export const survivesRestatement = ({ tone, where }: Standing): boolean =>
  where === 'field' || tone === 'error';

/**
 * Which regions have to be emptied when a message is put in one of them.
 *
 * Two rules, and keeping them apart is the whole of this function. A notice is an
 * event, so a newer one supersedes every older one: two confirmations standing side by
 * side read as two things that just happened. The field's description is not an event
 * but the condition of the field, so nothing empties it — it is replaced when there is
 * something new to say about the record, and otherwise it stands.
 *
 * It used to be one rule, and the page shipped with the consequence: sharing wiped the
 * sentence explaining why a record could not be parsed while leaving the field marked
 * invalid, so a screen reader announced a problem it could not explain.
 *
 * Generic over the region so this stays free of the DOM: the shell passes its own
 * objects, the tests pass plain ones.
 */
export const staleRegions = <T extends { kind: Destination }>(
  regions: readonly T[],
  speaking: T,
): readonly T[] => regions.filter((region) => region !== speaking && region.kind === 'notice');

/**
 * What the page says about a file it has just converted.
 *
 * The count depends on what the file is. A game has moves; a problem has lines
 * of an answer, and adding up the moves of all of them produces a number that
 * describes nothing — which is what the page did, because it counted the lines
 * of the finished text that begin with a numeral rather than asking the record.
 *
 * Here rather than in `main.ts`, for the reason everything else in this file is:
 * the DOM shell is the one module a `node --test` run cannot import, so a choice
 * left there is a choice no test can see.
 */
export const conversionMessage = (file: SgfDocument, strings: UiStrings): string =>
  file.kind === 'problem'
    ? strings.doneProblem(file.problem.lines.length)
    : strings.done(file.record.events.filter((event) => event.kind !== 'setup').length);
