/**
 * What happens when the share control is pressed, decided apart from the DOM.
 *
 * DOM-free for the same reason as `language.ts` and `metadata.ts`: the tests import
 * it, so it is typechecked without the `dom` lib — and the branch that matters here
 * is unreachable through a browser in `node --test`.
 *
 * Those branches are the two silent ones. `navigator.share` rejects when the sheet
 * fails to open, when the visitor closes it, and when one is already open — three
 * outcomes told apart only by reading the rejection, and two of them are hers rather
 * than a failure. Announcing a failure for a cancellation would tell a blind visitor
 * something went wrong at the moment she deliberately backed out; announcing one for a
 * sheet still standing would report an outcome that has not happened. So this returns
 * an outcome and the caller says nothing at all for either.
 */

export type SharePayload = {
  /** Travels with the address: a bare URL in a chat says nothing about what it opens. */
  title: string;
  url: string;
};

/**
 * The two capabilities, supplied by the page. `share` is optional because a browser
 * may not have it at all; `copy` is not, because the clipboard is the fallback and
 * a page with neither has nothing to offer.
 */
export type ShareCapabilities = {
  share?: (payload: SharePayload) => Promise<void>;
  copy: (text: string) => Promise<void>;
};

/**
 * `cancelled` and `busy` are the two that must stay silent — one because she closed the
 * sheet on purpose, one because the sheet is still standing and its outcome has not
 * happened yet. `failed` is the one owed an announcement naming the browser's own share
 * control, since by then the page has nothing left to try.
 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'busy' | 'failed';

/**
 * Both matched on `name` rather than with `instanceof DOMException`, which would tie
 * this module to a DOM global it otherwise does not need — and would miss a browser
 * that rejects with a plain error carrying the same name.
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
 * ours stayed shut for the rest of the visit, so both controls answered every press
 * with nothing at all. The browser's answer can change back; a latch of ours could not.
 */
const isConcurrent = (error: unknown): boolean => named(error, 'InvalidStateError');

const copy = async (capabilities: ShareCapabilities, url: string): Promise<ShareOutcome> => {
  try {
    await capabilities.copy(url);

    return 'copied';
  } catch {
    return 'failed';
  }
};

/**
 * Never rejects. The caller's only job is to announce the outcome, and a throw here
 * would leave the live region silent — the one result a blind visitor cannot detect.
 *
 * The fallback is chosen by outcome rather than by feature detection: `navigator.share`
 * is present on browsers that then refuse the call, so the capability existing is not
 * the same as the call being possible.
 */
export const shareThePage = async (
  capabilities: ShareCapabilities,
  payload: SharePayload,
): Promise<ShareOutcome> => {
  const { share } = capabilities;

  if (share === undefined) {
    return copy(capabilities, payload.url);
  }

  try {
    await share(payload);

    return 'shared';
  } catch (error) {
    if (isCancellation(error)) {
      return 'cancelled';
    }

    // Before this branch existed, a second press while the sheet stood fell through to
    // the clipboard: the page overwrote whatever she was holding and told her the
    // address had been copied, while the share she had already started might still
    // succeed. Two controls offering the same action is what put the second press
    // within reach.
    if (isConcurrent(error)) {
      return 'busy';
    }

    return copy(capabilities, payload.url);
  }
};
