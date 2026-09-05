/**
 * What happens when the save control is pressed, and what the file is called — both
 * decided apart from the DOM.
 *
 * DOM-free for the same reason as `language.ts`, `metadata.ts` and `announcement.ts`:
 * the tests import it, so it is typechecked without the `dom` lib — and the branches
 * that matter here are unreachable through a browser in `node --test`.
 *
 * This file was the share control's, and what is worth keeping from it is the habit of
 * reading a rejection rather than trusting a capability. `navigator.share` rejects when
 * the sheet fails to open, when the visitor closes it, and when one is already open —
 * three outcomes told apart only by name, and two of them hers rather than a failure.
 * Announcing a failure for a cancellation would tell a blind visitor something went
 * wrong at the moment she deliberately backed out; announcing one for a sheet still
 * standing would report an outcome that has not happened. So this returns an outcome,
 * and the caller says nothing at all for either.
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * The name the converted text is saved under.
 *
 * Local parts throughout, because the name exists for her clock rather than for a
 * server's: a game saved at five in the morning in Tokyo is named at five in the
 * morning.
 *
 * The minutes are separated from the hours by a hyphen rather than by the colon the
 * request drew. A colon is forbidden in a Windows file name and was historically
 * illegal in the Finder, so the browser would have rewritten or truncated the name —
 * and the identifier she was promised is precisely the part that would have gone.
 *
 * Two saves inside the same minute produce the same name, and the browser appends its
 * own suffix. They are also the same text, which is why this does not reach for
 * seconds to tell apart two copies of one thing.
 */
export const downloadName = (at: Date): string =>
  `sgf2text-${at.getFullYear()}.${pad(at.getMonth() + 1)}.${pad(at.getDate())}-${pad(
    at.getHours(),
  )}-${pad(at.getMinutes())}.txt`;

/**
 * The two ways a file can reach her device, supplied by the page.
 *
 * Both optional, and the difference between a branch that is absent and one that fails
 * is the whole of this design.
 *
 * `download` is offered only where the browser honours a download from a link. An
 * unsupported `download` attribute does not throw: the browser navigates to the blob
 * and opens the text in a tab, which for a blind visitor is a page of unlabelled text
 * where a saved file was promised. There is no outcome to read and nothing to fall back
 * from after the fact, so a feature test is the only signal there is and the page
 * withholds the branch rather than discovering it failed.
 *
 * `share` is the opposite. It is offered when the browser says it can take this
 * particular file, and then judged by the outcome of asking — because a browser that
 * says it can may still refuse.
 */
export type SaveCapabilities = {
  download?: () => void;
  share?: () => Promise<void>;
};

/**
 * `cancelled` and `busy` are the two that must stay silent — one because she closed the
 * sheet on purpose, one because the sheet is still standing and its outcome has not
 * happened yet.
 *
 * `saved` and `shared` are kept apart because the file ends up in different places and
 * she cannot look to find out which: one is in her downloads, the other wherever she
 * filed it. The page already learned this distinction on the clipboard, where two
 * controls put two different things on it and one sentence for both told her nothing.
 */
export type SaveOutcome = 'saved' | 'shared' | 'cancelled' | 'busy' | 'failed';

/**
 * Matched on `name` rather than with `instanceof DOMException`, which would tie this
 * module to a DOM global it otherwise does not need — and would miss a browser that
 * rejects with a plain error carrying the same name.
 */
const named = (error: unknown, name: string): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: unknown }).name === name;

const isCancellation = (error: unknown): boolean => named(error, 'AbortError');

/**
 * A sheet is already open and unanswered. `navigator.share` refuses the call with
 * `InvalidStateError` — "an earlier share has not yet completed".
 *
 * Read rather than remembered. A boolean of ours could answer the same question, and
 * did: it was set before the call and cleared when the promise settled. The two agree
 * while promises settle, and a promise that never settles is exactly where they part —
 * ours stayed shut for the rest of the visit, so the control answered every press with
 * nothing at all. The browser's answer can change back; a latch of ours could not.
 */
const isConcurrent = (error: unknown): boolean => named(error, 'InvalidStateError');

/**
 * Never rejects. The caller's only job is to announce the outcome, and a throw here
 * would leave the live region silent — the one result a blind visitor cannot detect.
 *
 * The link is tried first where it exists: a browser that will simply write the file
 * should simply write it, rather than raising a sheet she then has to dismiss on every
 * save.
 */
export const saveTheText = async (capabilities: SaveCapabilities): Promise<SaveOutcome> => {
  const { download, share } = capabilities;

  if (download !== undefined) {
    try {
      download();

      return 'saved';
    } catch (error) {
      // Building the blob, or dispatching the click, can fail on a browser that does
      // support the branch. Falling through hands her the sheet instead of a failure
      // she has no way to act on.
      //
      // Reported as well as survived, and the two are not the same decision. Whatever
      // reaches here is our defect rather than a condition of her browser — the branch
      // was withheld unless the browser honours it — and the page makes no network
      // request by design, which leaves the console as the only place it can be said.
      // Silently falling through is how a defect in this closure would be diagnosed over
      // the phone with someone who cannot read a screen.
      console.error('The link branch could not write the file', error);
    }
  }

  if (share === undefined) {
    return 'failed';
  }

  try {
    await share();

    return 'shared';
  } catch (error) {
    if (isCancellation(error)) {
      return 'cancelled';
    }

    if (isConcurrent(error)) {
      return 'busy';
    }

    return 'failed';
  }
};
