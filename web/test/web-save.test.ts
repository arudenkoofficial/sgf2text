import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadName, saveTheText } from '../save.ts';
import type { SaveCapabilities } from '../save.ts';

/**
 * What the save control does, tested away from the DOM.
 *
 * Two things live in this module and both are here for the same reason: neither can
 * be reached through `node --test` in the browser it matters in. The name has rules —
 * padding, local time, characters a file system refuses — and the outcome has branches
 * that are invisible from the outside, because the ones worth the most announce
 * nothing at all.
 *
 * `navigator.share` rejects when the sheet fails to open, when the visitor closes it,
 * and when one is already open: three outcomes told apart only by reading the
 * rejection, two of them hers rather than a failure. That reasoning arrived with the
 * share control this page no longer has, and it is exactly what the sheet branch of
 * saving needs.
 */

/** A rejection shaped like the one a browser raises when the sheet is dismissed. */
const abort = (): Error => {
  const error = new Error('Share canceled');
  error.name = 'AbortError';

  return error;
};

type Recorder = {
  capabilities: SaveCapabilities;
  written: number;
  handed: number;
};

/**
 * `undefined` for a branch means the browser does not offer it at all, which is a
 * different thing from offering it and refusing the call — the distinction the whole
 * module is built on.
 */
const recorder = (behaviour: {
  download?: 'ok' | Error;
  share?: 'ok' | Error;
}): Recorder => {
  const state = { written: 0, handed: 0 };
  const capabilities: SaveCapabilities = {};

  if (behaviour.download !== undefined) {
    capabilities.download = (): void => {
      state.written += 1;
      if (behaviour.download !== 'ok') {
        throw behaviour.download;
      }
    };
  }

  if (behaviour.share !== undefined) {
    capabilities.share = async (): Promise<void> => {
      state.handed += 1;
      if (behaviour.share !== 'ok') {
        throw behaviour.share;
      }
    };
  }

  return {
    capabilities,
    get written() {
      return state.written;
    },
    get handed() {
      return state.handed;
    },
  };
};

test('the name carries the date and the time the file was saved', () => {
  assert.equal(
    downloadName(new Date(2026, 8, 3, 14, 5)),
    'sgf2text-2026.09.03-14-05.txt',
    'the date and time are the identifier: two saves of two games are told apart by it',
  );
});

test('every part of the name is padded to two digits', () => {
  // Otherwise January sorts after October in her folder, and a saved game is found by
  // reading the list rather than by looking at it.
  assert.equal(downloadName(new Date(2026, 0, 7, 9, 4)), 'sgf2text-2026.01.07-09-04.txt');
});

test('the name holds nothing a file system forbids', () => {
  // The request drew the time as 18:23. A colon is forbidden in a Windows file name
  // and was historically illegal in the Finder, so the browser would have rewritten or
  // truncated the name — and the identifier she was promised is the part that would
  // have disappeared.
  const moments = [
    new Date(2026, 8, 3, 18, 23),
    new Date(2026, 11, 31, 23, 59),
    new Date(2026, 0, 1, 0, 0),
  ];

  for (const moment of moments) {
    assert.doesNotMatch(
      downloadName(moment),
      /[<>:"/\\|?*]/,
      `${downloadName(moment)} survives contact with a file system`,
    );
  }
});

test('the time in the name is hers, not the one a server would read', () => {
  // Pinned to a zone rather than left to the machine, because the machine that runs
  // this in CI is set to UTC — where local time and UTC agree, and an implementation
  // reading UTC parts would pass every other assertion in this file.
  const zone = process.env.TZ;
  process.env.TZ = 'Asia/Tokyo';

  try {
    assert.equal(
      downloadName(new Date(Date.UTC(2026, 8, 3, 20, 0))),
      'sgf2text-2026.09.04-05-00.txt',
      'nine hours ahead: the name says the fourth at five in the morning, which is what her clock says',
    );
  } finally {
    // Deleted rather than assigned back when there was nothing there: writing
    // `undefined` into `process.env` stores the string "undefined", which is not a
    // zone any machine is in.
    if (zone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = zone;
    }
  }
});

test('a browser that writes the file never opens a sheet', async () => {
  const recording = recorder({ download: 'ok', share: 'ok' });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(outcome, 'saved');
  assert.equal(recording.written, 1, 'the file was written');
  assert.equal(
    recording.handed,
    0,
    'a browser that will simply write the file should simply write it, not raise a sheet to dismiss',
  );
});

test('where a link cannot save, the file goes to the sheet', async () => {
  // An older Safari, which is the browser most likely to be in her hand. An
  // unsupported `download` attribute does not throw — it navigates to the blob and
  // opens the text in a tab — so the page never offers the branch at all rather than
  // discovering it failed.
  const recording = recorder({ share: 'ok' });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(outcome, 'shared', 'a file handed over is not a file written, and says so');
  assert.equal(recording.handed, 1);
});

test('a link that throws still leaves her the sheet', async () => {
  const recording = recorder({ download: new Error('createObjectURL failed'), share: 'ok' });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(outcome, 'shared');
  assert.equal(recording.written, 1, 'the link branch was attempted');
  assert.equal(recording.handed, 1, 'and its failure is not the end of the road');
});

test('a dismissed sheet is not a failure', async () => {
  const recording = recorder({ share: abort() });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(
    outcome,
    'cancelled',
    'closing the sheet is the visitor’s decision, and nothing is announced about it',
  );
  assert.equal(recording.handed, 1, 'the sheet was offered');
});

test('a second press while a sheet is open is refused, not answered', async () => {
  // `navigator.share` refuses the second call with `InvalidStateError` — "an earlier
  // share has not yet completed". Not a cancellation and not a failure: the outcome
  // she is waiting for has not happened, and reporting one now would report something
  // that has not.
  const busy = new Error('An earlier share has not yet completed.');
  busy.name = 'InvalidStateError';

  const recording = recorder({ share: busy });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(outcome, 'busy');
  assert.equal(recording.handed, 1, 'the browser was asked, and it answered');
});

test('any other rejection is the failure she is owed a sentence about', async () => {
  // `navigator.share` exists on browsers that then refuse the call, so the capability
  // being present is not the same as the call being possible.
  const refusal = new Error('Permission denied');
  refusal.name = 'NotAllowedError';

  const recording = recorder({ share: refusal });

  const outcome = await saveTheText(recording.capabilities);

  assert.equal(outcome, 'failed');
  assert.equal(recording.handed, 1, 'the sheet was attempted before giving up');
});

test('a browser offering neither branch says so rather than doing nothing', async () => {
  const outcome = await saveTheText({});

  assert.equal(
    outcome,
    'failed',
    'she is left with an instruction — select the result and copy it — not with a control that went quiet',
  );
});

test('the outcome is never a rejection the caller has to catch', async () => {
  // The caller announces; it does not handle errors. A throw here would leave the
  // live region silent, which is the one outcome a blind visitor cannot detect.
  const recording = recorder({
    download: new Error('no link'),
    share: new Error('no sheet'),
  });

  await assert.doesNotReject(() => saveTheText(recording.capabilities));
});

test('an unanswered sheet does not disable saving for the rest of the visit', async () => {
  // The regression this exists to prevent, and it shipped once already under the share
  // control: a guard held open until `navigator.share` settled, and a promise that
  // never settles held it open forever. The control then answered every press with
  // nothing at all — and silence is the one outcome a blind visitor cannot detect.
  //
  // So this asserts there is no state here to latch. A press that follows an
  // unanswered one reaches the browser, which either refuses it — the test above — or
  // has forgotten and opens the sheet. Either way the page recovers, which a boolean
  // of ours could not.
  let opened = 0;

  const capabilities: SaveCapabilities = {
    share: async () => {
      opened += 1;

      if (opened === 1) {
        // Never settles, exactly like a sheet nobody has answered.
        await new Promise<void>(() => {});
      }
    },
  };

  void saveTheText(capabilities);
  const second = await saveTheText(capabilities);

  assert.equal(second, 'shared', 'the second press is answered on its own merits');
  assert.equal(opened, 2, 'and it reached the browser rather than a memory of one');
});
