## 1. A repeated press is answered

Measured, not reasoned about: two presses of the copy control produced one DOM mutation
and then zero. A polite region reports what appears in it, so the second press said
nothing at all.

There is no unit test for this one and no honest way to write one — "the DOM was written"
is not a decision a pure function can hold, and `main.ts` is the module `node --test`
cannot import. So the evidence is a mutation count in a real browser, twice over: once to
show the guard's only stated benefit costs nothing to give up, once to show the repeat now
lands.

- [x] 1.1 Measure in a browser that writing an empty string over an already-empty region records no mutation, which is the whole of what the early return was protecting.
- [x] 1.2 Remove the early return in `say`.
- [x] 1.3 Measure in a browser that two identical presses of the copy control now record one mutation each, and the same for a share control.

## 2. The same file, chosen again

- [x] 2.1 Empty the file control after the chosen file has been taken, so choosing the same file again is a change in every browser rather than in some of them.
- [x] 2.2 Confirm in a browser that choosing the same file twice converts twice.

## 3. A finished action is not repeated by a change of language

The one decision here that is worth a test without a DOM, and it turns on the same pair
`fieldInvalidity` already takes: a notice carrying `info` is the only combination that
describes an event rather than a condition.

- [x] 3.1 Write a failing test asserting a standing failure survives a restatement in another language, wherever it is said, because the condition it describes still holds.
- [x] 3.2 Write a failing test asserting the field's own messages always survive, including "done, N moves", since they describe the state of the field rather than something that happened.
- [x] 3.3 Write a failing test asserting a finished confirmation in a notice does not survive, so changing the language cannot report a copy that is not happening.
- [x] 3.4 Add the decision to `web/announcement.ts` and have `reannounce` clear such a message and forget it, rather than rewriting it in the new language.
- [x] 3.5 Confirm in a browser that changing the language after sharing announces nothing about sharing, and that changing it after a failed conversion restates the reason.

## 4. A replaced record loses the verdict on the old one

Shell behaviour rather than a decision, and it has to read the field itself: the standing
announcement is the last thing the page *said*, while the field's description is a state
that outlives it. The first attempt asked the announcement and was wrong whenever a share
or a copy had spoken since the conversion failed — which the browser run caught.

What is new is that the field's mark is *removed* rather than set to `'false'`. The page
has no verdict on the new record, and `'false'` is a verdict.

- [x] 4.1 Clear the field's description and remove `aria-invalid` on `input`, and forget the standing announcement when it was the record's own.
- [x] 4.2 Leave a notice alone: it has nothing to do with what she is typing, and clearing it would make editing the field a way to erase an answer she has not read.
- [x] 4.3 Confirm in a browser that after a failed conversion, editing the field removes the mark and the explanation, that a notice beside a share control survives it, and that converting again produces a current verdict.

## 5. Delivery

- [x] 5.1 Run the whole suite, both type checks and both builds.
- [x] 5.2 Confirm nothing visible moved: the markup tests pass untouched, and no string was added.
- [ ] 5.3 Open, and archived open: verify with a screen reader that a repeated press is spoken a second time.

  Neither the author nor a browser can answer this. It needs VoiceOver on a real
  iPhone, which means it can only come from the player this page is for, in use —
  and asking her to be the test rig for it is not a thing to arrange lightly.

  Archiving it open is safe because the change cannot regress anything here. The
  region used to be left untouched on a repeat, so nothing was spoken; it is now
  rewritten, so the DOM reports the change. If VoiceOver collapses identical
  consecutive announcements anyway, the outcome is what it already was, not worse.

  If it turns out silent, the fix is known and does not need rediscovering: clear
  the region and write the sentence back on the following frame, and reopen this as
  its own change. Worth doing only on evidence — it is uglier code, and buying it
  in advance would be paying for a defect nobody has seen.
