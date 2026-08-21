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

export type Tone = 'info' | 'error';

/**
 * `field` is the region the game field names in `aria-describedby`, so it holds only
 * what the record in the field is about. `notice` is everything else the page has to
 * say — the result, the clipboard, the address of the page — and naming the region
 * rather than the subject is deliberate: at a call site, `'notice'` states where the
 * sentence will be read out, which is the fact that has consequences.
 */
export type Destination = 'field' | 'notice';

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
