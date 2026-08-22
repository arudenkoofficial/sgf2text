## Why

Four ways this page still leaves her without an answer, or gives her one that is no
longer true. Three were demonstrated in a browser rather than reasoned about.

**A repeated press is answered with nothing.** The page skips writing a message when the
region already holds that exact sentence, so no DOM change happens and a polite live
region says nothing. Measured: pressing the copy control twice with nothing converted
produced one mutation for the first press and **zero** for the second. The same holds
for two shares with the same outcome, and for two failed copies in a row. She presses
again precisely because she is not sure the first press registered — and gets silence,
which for her is indistinguishable from a control that does not work.

**Choosing the same file again may do nothing at all.** The file control is never
cleared, so re-choosing the file already in it does not always reach the page. Nothing
is read, nothing is said.

**Changing the language re-announces something that already finished.** The standing
message is rewritten in the new language, which is right for a failure — the record is
still broken and she is owed the reason in a language she reads. It is wrong for "the
address of this page has been copied": switching language then reports a copy that is
not happening. Demonstrated: the notice was rewritten and re-announced on the language
change.

**The mark on the record outlives the record.** After a failed conversion the field
keeps `aria-invalid="true"` and the sentence explaining why, and keeps them while she
pastes an entirely different game. Until she presses convert again, the field tells a
screen reader that the record it holds is wrong — about a record the page has never
seen.

All four are the same shape: the page treats a message as a thing it has already said
rather than as an answer she is owed now.

## What Changes

- A message is written whenever it is announced, even when the sentence is unchanged, so
  a repeated action is confirmed a second time rather than silently.
- The file control is cleared after each choice, so choosing the same file twice is two
  answered actions.
- A change of language restates a failure and drops a finished confirmation, rather than
  re-announcing both.
- Editing the record clears the field's description and its mark of invalidity, because
  they describe a record that no longer exists.

## Capabilities

### Modified Capabilities

- `web-converter`: adds a requirement that every action is answered including a repeat;
  adds a requirement that a message does not outlive what it describes; modifies
  `Copying the result` so the confirmation is owed on every copy rather than on the
  first one.

## Impact

- `web/main.ts` — `say` stops skipping an unchanged sentence; `reannounce` distinguishes
  a standing failure from a finished confirmation; the file control is cleared; the
  record's own message is cleared when the record changes.
- `web/announcement.ts` — decides which standing messages survive a change of language,
  and which are cleared when the record is replaced, so both are testable without a DOM.
- `test/web-announcement.test.ts` — the new decisions.
- `test/web-index-html.test.ts` — unchanged markup, so nothing expected here.

No new strings, no new assets, no change to what leaves the browser.
