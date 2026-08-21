/**
 * What happens when the share control is pressed, decided apart from the DOM.
 *
 * DOM-free for the same reason as `language.ts` and `metadata.ts`: the tests import
 * it, so it is typechecked without the `dom` lib — and the branch that matters here
 * is unreachable through a browser in `node --test`.
 *
 * That branch is the cancellation. `navigator.share` rejects both when the sheet
 * fails to open and when the visitor closes it, and the two are told apart only by
 * reading the rejection. Announcing a failure for a cancellation would tell a blind
 * visitor that something went wrong at the moment she deliberately backed out — so
 * this returns an outcome and the caller says nothing at all for that one.
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
 * `cancelled` is the outcome that must stay silent. `failed` is the one owed an
 * announcement naming the browser's own share control, since by then the page has
 * nothing left to try.
 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Matched on `name` rather than with `instanceof DOMException`, which would tie this
 * module to a DOM global it otherwise does not need — and would miss a browser that
 * rejects with a plain error carrying the same name.
 */
const isCancellation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';

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

    return copy(capabilities, payload.url);
  }
};
