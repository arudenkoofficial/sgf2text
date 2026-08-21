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
