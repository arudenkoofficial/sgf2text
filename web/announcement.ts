/**
 * What a message means for the control that took the game, decided apart from the DOM.
 *
 * DOM-free for the same reason as `language.ts`, `metadata.ts` and `save.ts`: the
 * tests import it, so it is typechecked without the `dom` lib — and `main.ts`, where
 * this used to live, is the one module a `node --test` run cannot reach.
 *
 * The two facts are deliberately separate. `tone` is how a message is drawn; `where`
 * is which of the page's two live regions it belongs in. Collapsing them into one
 * flag is what made an action that could not happen announce a problem with her game:
 * the page had nothing to say about the game, and said it anyway.
 */

import type { SgfDocument } from '../src/index.ts';
import type { UiStrings } from './ui-strings.ts';

export type Tone = 'info' | 'error';

/**
 * `field` is the region the file control names in `aria-describedby`, so it holds only
 * what the game the page was given is about. `notice` is everything else the page has
 * to say — the converted text, and the file it was saved to.
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
  /** The game the page was given: what it converted to, or why it would not. */
  | 'record'
  /** The converted text, and the file it is saved to. */
  | 'result'
  /** The chosen file itself — a file that could not be read at all. */
  | 'file';

/**
 * The control's description is read out every time she reaches it, so only a message
 * about the game she handed over may live there. Everything else is an event: it
 * happened once, it is said beside the control that caused it, and it is superseded
 * rather than kept.
 *
 * `file` sits on the field side, and it did not always. While the page held a textarea
 * to paste into, a file that could not be read was a notice: the record in the field
 * might be a perfectly good game she pasted an hour ago, and nothing about the file had
 * examined it — so marking that field invalid told her the game she was holding was
 * wrong on the evidence of something else entirely.
 *
 * There is no such record now. The chosen file is the only game the page has, which
 * makes a failed read a verdict on the only thing there is — and the control it marks
 * is where choosing another file happens, so it is also where she should be sent.
 *
 * Written as a total mapping rather than as a test for one subject with everything else
 * falling to the other side, and the difference is not style. A ternary returning bare
 * literals never touches the subject it was given, so nothing ties its branches to the
 * union's membership: a fourth subject compiled cleanly and inherited `field` — the
 * dangerous half, where an error marks her file invalid and takes her focus. The two
 * sibling ternaries in this file are safe from that because each branch reads a property
 * of the value it switched on, so a new kind fails to compile. This one had nothing to
 * read.
 *
 * A `Record` over the union makes adding a subject a compile error here, which is where
 * the decision belongs. The same shape the error wording already uses one file over.
 */
const DESTINATIONS: Record<Subject, Destination> = {
  record: 'field',
  result: 'notice',
  file: 'field',
};

export const destinationFor = (subject: Subject): Destination => DESTINATIONS[subject];

export type Standing = {
  tone: Tone;
  where: Destination;
};

/**
 * The value `aria-invalid` should take on the file control, or `null` for "leave the
 * attribute exactly as it is".
 *
 * `null` rather than `'false'` for anything read out in the notice, and the
 * distinction is the whole point: a file that failed to parse is still the last one
 * chosen when the save control is pressed, and writing `'false'` over it would have the
 * control vouch for a game the page has already rejected — while the message on screen
 * talks about something else entirely.
 *
 * The same answer decides where focus goes, since a control worth marking invalid is
 * exactly a control worth sending her to. Stated once so the two cannot drift into a
 * control that is marked without being reached, or reached without being marked.
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
 * reports an event that is not happening, and the page did precisely that: take the
 * text away, change the language, and it announced that again.
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
 * Whether a change of language re-converts the game the page is holding.
 *
 * This was `if (result.textContent !== '')` in the language control's handler, and it was
 * reasoned about against one of the two ways a file can fail. A file that fails to
 * *parse* empties the result, so a result on the page meant a game worth re-rendering and
 * the guard was right about it.
 *
 * A file that could not be *read* is the other way, and it leaves the opposite state:
 * nothing examined the new file, so the previous game's text is deliberately left on the
 * page while the control that took the file carries a verdict about it. "A result is on
 * the page" was then true of a game two files back. Re-converting announced that game as
 * a success into the field region — which overwrote the sentence explaining the verdict
 * and set the mark to `'false'`, so the page ended up vouching for the file it had just
 * said it could not read. That is the outcome `fieldInvalidity` returns `null` to
 * prevent, arriving by a route that goes around it.
 *
 * So the verdict wins. The result stays exactly as it is, and the standing failure is
 * restated in her new language, which is the whole of what a language change owes her
 * when the page could not read what she last handed it.
 *
 * The verdict is read from the control's own mark rather than from the last thing the
 * page said, and that distinction has bitten this page before: the last announcement may
 * be about a save she just pressed, while the verdict on her file is a state that
 * outlives it. One variable answering for two independent facts is the mistake this
 * codebase keeps re-learning.
 */
export const reconvertsOnLanguageChange = ({
  hasResult,
  fileIsMarkedInvalid,
}: {
  hasResult: boolean;
  fileIsMarkedInvalid: boolean;
}): boolean => hasResult && !fileIsMarkedInvalid;

/**
 * Which regions have to be emptied when a message is put in one of them.
 *
 * Two rules, and keeping them apart is the whole of this function. A notice is an
 * event, so a newer one supersedes every older one: two confirmations standing side by
 * side read as two things that just happened. The control's description is not an event
 * but the condition of the game the page was given, so nothing empties it — it is
 * replaced when there is something new to say about that game, and otherwise it stands.
 *
 * It used to be one rule, and the page shipped with the consequence: the share control
 * this page no longer has wiped the sentence explaining why a record could not be
 * parsed, while leaving the field marked invalid — so a screen reader announced a
 * problem it could not explain.
 *
 * Generic over the region so this stays free of the DOM: the shell passes its own
 * objects, the tests pass plain ones.
 */
export const staleRegions = <T extends { kind: Destination }>(
  regions: readonly T[],
  speaking: T,
): readonly T[] => regions.filter((region) => region !== speaking && region.kind === 'notice');

/**
 * Everything an announcement needs to know about a file that has just been
 * converted, and nothing else.
 *
 * Two scalars rather than the record itself, because the announcement outlives
 * the conversion: it is restated whenever the language changes, so whatever it
 * captures is held until the next message replaces it. Capturing the document
 * kept every event of a four-hundred-move game alive to recover a genre and a
 * count, and recomputed the count on each restatement.
 */
export type Conversion = { kind: 'game'; moves: number } | { kind: 'problem'; lines: number };

/**
 * The count depends on what the file is. A game has moves; a problem has lines
 * of an answer, and adding up the moves of all of them produces a number that
 * describes nothing — which is what the page did, because it counted the lines
 * of the finished text that begin with a numeral rather than asking the record.
 *
 * Setup stones are not moves, whether they open the game or appear part-way
 * through it. They are placed, not played, and were never part of the count.
 */
export const summarise = (file: SgfDocument): Conversion =>
  file.kind === 'problem'
    ? { kind: 'problem', lines: file.problem.lines.length }
    : {
        kind: 'game',
        moves: file.record.events.filter((event) => event.kind !== 'setup').length,
      };

/**
 * What the page says about a file it has just converted.
 *
 * Here rather than in `main.ts`, for the reason everything else in this file is:
 * the DOM shell is the one module a `node --test` run cannot import, so a choice
 * left there is a choice no test can see.
 */
export const conversionMessage = (conversion: Conversion, strings: UiStrings): string =>
  conversion.kind === 'problem'
    ? strings.doneProblem(conversion.lines)
    : strings.done(conversion.moves);
