import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareThePage } from '../web/share.ts';
import type { ShareCapabilities, SharePayload } from '../web/share.ts';
import { canonicalUrl } from '../web/metadata.ts';

/**
 * The share control's decision, tested away from the DOM.
 *
 * The branch worth this file is the one that announces nothing. `navigator.share`
 * rejects when the visitor closes the sheet, which is indistinguishable from a
 * failure unless the rejection is read — and announcing a failure there tells a
 * blind visitor something went wrong at the moment she deliberately backed out.
 * That path cannot be reached through `node --test` at all, so the decision lives
 * in a function and the DOM only supplies its arguments.
 */

const PAYLOAD: SharePayload = {
  title: 'sgf2text — a Go game as readable text',
  url: 'https://sgf.rudenko.live/?lang=en',
};

/** A rejection shaped like the one a browser raises when the sheet is dismissed. */
const abort = (): Error => {
  const error = new Error('Share canceled');
  error.name = 'AbortError';

  return error;
};

type Recorder = {
  capabilities: ShareCapabilities;
  shared: SharePayload[];
  copied: string[];
};

const recorder = (
  behaviour: { share?: 'ok' | Error; copy: 'ok' | Error } = { share: 'ok', copy: 'ok' },
): Recorder => {
  const shared: SharePayload[] = [];
  const copied: string[] = [];

  const capabilities: ShareCapabilities = {
    copy: async (text: string) => {
      copied.push(text);
      if (behaviour.copy !== 'ok') {
        throw behaviour.copy;
      }
    },
  };

  if (behaviour.share !== undefined) {
    capabilities.share = async (payload: SharePayload) => {
      shared.push(payload);
      if (behaviour.share !== 'ok') {
        throw behaviour.share;
      }
    };
  }

  return { capabilities, shared, copied };
};

test('a dismissed sheet is not a failure, and does not fall through to the clipboard', async () => {
  const { capabilities, shared, copied } = recorder({ share: abort(), copy: 'ok' });

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(
    outcome,
    'cancelled',
    'closing the sheet is the visitor’s decision, and nothing is announced about it',
  );
  assert.equal(shared.length, 1, 'the sheet was offered');
  assert.deepEqual(
    copied,
    [],
    'a cancelled share must not silently copy instead — she chose to do nothing',
  );
});

test('a successful share never touches the clipboard', async () => {
  const { capabilities, shared, copied } = recorder();

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(outcome, 'shared');
  assert.deepEqual(shared, [PAYLOAD]);
  assert.deepEqual(copied, [], 'the clipboard is the fallback, not a companion');
});

test('no share capability copies the address instead', async () => {
  const { capabilities, copied } = recorder({ share: undefined, copy: 'ok' });

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(outcome, 'copied');
  assert.deepEqual(
    copied,
    [PAYLOAD.url],
    'what is copied is the address, not the title beside it',
  );
});

test('a rejection other than AbortError also falls back to the clipboard', async () => {
  // `navigator.share` exists on browsers that then refuse the call, so the
  // capability being present is not the same as the call being possible.
  const refusal = new Error('Permission denied');
  refusal.name = 'NotAllowedError';

  const { capabilities, shared, copied } = recorder({ share: refusal, copy: 'ok' });

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(outcome, 'copied');
  assert.equal(shared.length, 1, 'the share was attempted before falling back');
  assert.deepEqual(copied, [PAYLOAD.url]);
});

test('when both the sheet and the clipboard fail, the outcome says so', async () => {
  const { capabilities, copied } = recorder({
    share: new Error('no sheet'),
    copy: new Error('no clipboard'),
  });

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(
    outcome,
    'failed',
    'the visitor is owed an announcement naming the browser’s own share control',
  );
  assert.equal(copied.length, 1, 'the clipboard was attempted');
});

test('the outcome is never a rejection the caller has to catch', async () => {
  // The caller announces; it does not handle errors. A throw here would leave the
  // live region silent, which is the one outcome a blind visitor cannot detect.
  const { capabilities } = recorder({
    share: new Error('no sheet'),
    copy: new Error('no clipboard'),
  });

  await assert.doesNotReject(() => shareThePage(capabilities, PAYLOAD));
});

test('the address shared is the language-carrying canonical one', async () => {
  const base = new URL('https://sgf.rudenko.live/');
  const { capabilities, shared } = recorder();

  await shareThePage(capabilities, { title: 'x', url: canonicalUrl(base, 'ru') });

  assert.equal(
    shared[0]?.url,
    'https://sgf.rudenko.live/?lang=ru',
    'a Russian reader hands over the Russian address, not whichever language the recipient’s cookie holds',
  );
});

test('the payload reaches the sheet unchanged', async () => {
  const { capabilities, shared } = recorder();

  await shareThePage(capabilities, PAYLOAD);

  assert.deepEqual(
    shared[0],
    PAYLOAD,
    'the title travels with the address: a bare URL in a chat says nothing about what it opens',
  );
});

/**
 * A second press while the first sheet is still open.
 *
 * Found by pressing the control twice in a browser, and easy to reach once the same
 * action is offered in two places: the other control is right there while the sheet
 * stands. `navigator.share` refuses the second call with `InvalidStateError` — "an
 * earlier share has not yet completed" — which is not a cancellation, so it used to
 * fall through to the clipboard: the page overwrote whatever she was holding and told
 * her the address had been copied, while the sheet she opened might still succeed.
 *
 * The browser is the one that knows whether a share is outstanding, so the browser is
 * asked. A boolean of our own answered the same question from memory, and the two
 * disagreed in exactly the case where ours could never recover — see the test below.
 */
test('a second press while a sheet is open is refused, not redirected', async () => {
  const busy = new Error('An earlier share has not yet completed.');
  busy.name = 'InvalidStateError';

  const { capabilities, shared, copied } = recorder({ share: busy, copy: 'ok' });

  const outcome = await shareThePage(capabilities, PAYLOAD);

  assert.equal(
    outcome,
    'busy',
    'an outcome she is still waiting for is not an outcome to report',
  );
  assert.equal(shared.length, 1, 'the browser was asked, and it answered');
  assert.deepEqual(
    copied,
    [],
    'her clipboard is left alone: the sheet she opened may still succeed',
  );
});

test('an unanswered sheet does not disable sharing for the rest of the visit', async () => {
  // The regression this exists to prevent, and it shipped: a guard held open until
  // `navigator.share` settled, and a promise that never settles held it open forever.
  // Both controls then answered every press with nothing at all — and silence is the
  // one outcome a blind visitor cannot detect. Demonstrated in a browser: after one
  // such press the page went mute while its clipboard was still working.
  //
  // So this asserts there is no state here to latch. A press that follows an
  // unanswered one reaches the browser, which either refuses it — the test above — or
  // has forgotten and opens the sheet. Either way the page recovers, which a boolean
  // of ours could not.
  let opened = 0;

  const capabilities: ShareCapabilities = {
    share: async () => {
      opened += 1;

      if (opened === 1) {
        // Never settles, exactly like a sheet nobody has answered.
        await new Promise<void>(() => {});
      }
    },
    copy: async () => {
      throw new Error('the clipboard must not be reached in either press');
    },
  };

  void shareThePage(capabilities, PAYLOAD);
  const second = await shareThePage(capabilities, PAYLOAD);

  assert.equal(second, 'shared', 'the second press is answered on its own merits');
  assert.equal(opened, 2, 'and it reached the browser rather than a memory of one');
});
