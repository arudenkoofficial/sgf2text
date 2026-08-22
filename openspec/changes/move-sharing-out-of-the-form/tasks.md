## 1. The field's description stops being collateral

A correction that comes first, because it is a live defect and the rest of this change
multiplies the places that can trigger it: a message in a notice clears the field's
description, so sharing the page blanks the sentence explaining an invalid record while
leaving the mark of invalidity behind.

- [x] 1.1 Write a failing test asserting that a message in a notice leaves the field's description standing, so a record that failed to parse keeps its explanation while the page talks about something else.
- [x] 1.2 Write a failing test asserting that a message in one notice clears the other notices, since only one event has just happened.
- [x] 1.3 Separate the two rules in `render`: notices are mutually exclusive, and the field's description is cleared only by another message about the field.

## 2. The region a message speaks in

- [x] 2.1 Write a failing test asserting that whether a message is about the field is derived from the region it is rendered into, so no call site can name a region at one end of the page while claiming to describe the field.
- [x] 2.2 Change `announce` to take the region as its last argument, defaulting to the field's description, and derive `where` from it rather than passing the two separately.
- [x] 2.3 Keep `web/announcement.ts` deciding validity and focus from `{tone, where}` alone — position stays the shell's business.

## 3. The mark

- [x] 3.1 Draw the mark as inline SVG in the page's hairline idiom — an arrow leaving an open tray — sized to the button's text and inheriting `currentColor`, so it follows the label in both colour schemes and in either button state.
- [x] 3.2 Write a failing test asserting the mark is hidden from assistive technology (`aria-hidden`, and not focusable) and that the control's name comes from its text rather than from the mark.

## 4. The controls move

- [x] 4.1 Write a failing test asserting the form's action row holds Convert and Copy and no share control, so nothing there suggests the game is what would be shared.
- [x] 4.2 Write a failing test asserting there are exactly two share controls, that both take their name from the same catalogue entry, and that one is inside the masthead and the other inside the footer.
- [x] 4.3 Write a failing test asserting each share control has a notice region as its sibling, and that the field's `aria-describedby` still names only the field's own region.
- [x] 4.4 Move the button out of `.actions`, and add the two controls with their regions: the masthead one grouped with the language control so the two wrap together, the footer one immediately before the home screen disclosure.
- [x] 4.5 Style the masthead control so it reads as a control and not as a heading's neighbour, at the same border and text contrast the spec requires of every other control.
- [x] 4.6 Wire both controls in `main.ts` to the same handler, each announcing into its own region, and translate both labels in `applyVisible`.

## 5. One sheet at a time

Found by pressing the control twice in a browser, and reachable because there are now
two of them: `navigator.share` rejects a second call with `InvalidStateError`, which is
not a cancellation, so it fell through to the clipboard — overwriting whatever she was
holding and telling her the address had been copied while the sheet she opened was
still standing.

The first fix was a guard of the page's own, and it was the worse defect: a promise that
never settles never releases it, so both controls answered every press with nothing at
all for the rest of the visit. Demonstrated in a browser, and 5.4–5.6 replace it.

- [x] 5.1 Write a failing test asserting a second attempt while one is open is refused and leaves the clipboard untouched.
- [x] 5.2 Write a failing test asserting the guard clears itself however the attempt ends, so one unanswered sheet does not disable sharing for the visit.
- [x] 5.3 Add the guard in `web/share.ts`, one for the page rather than one per control, and say nothing for a refused press.
- [x] 5.4 Write a failing test asserting `InvalidStateError` is read as "a sheet is already open" — announced as nothing, and never redirected to the clipboard.
- [x] 5.5 Write a test asserting a press that follows an unanswered one still reaches the browser, so no state of the page's own can latch both controls into silence.
- [x] 5.6 Delete the guard and classify the rejection instead, leaving the browser as the only holder of the fact that a share is outstanding.

## 6. What a message is about, stated where it is announced

The routing was the one link no test could reach: every call site picked a region by
hand, so a message about the wrong thing was a mistake nothing could catch — and it
caught none of the three that shipped. The message about a file is the last one still
filed under the game record, marking her record invalid and pulling focus into it
because a *file* could not be read.

- [x] 6.1 Write a failing test asserting that only a message about the record becomes the record's description, and that the result, a file and the page are each announced as events.
- [x] 6.2 Write a failing test asserting a file that could not be read leaves the record unmarked, since nothing about the file examined it.
- [x] 6.3 Add `Subject` and `destinationFor` to `web/announcement.ts`, and have `announce` take the subject and derive the region from it rather than accepting one.
- [x] 6.4 Move the file failure to the form's notice, which sits directly under the file control.

## 7. Delivery

- [x] 7.1 Run the whole suite, both type checks and both builds.
- [x] 7.2 Measure the new control's contrast in both colour schemes — text 4.5:1, border 3:1 against the page and against its own fill — rather than judging it by eye.
- [x] 7.3 Confirm the page still asks nothing of a third party: the mark is inline, so no file was added to the deploy.
- [x] 7.4 Look at the rendered page in both schemes and at a narrow width, and confirm the masthead wraps rather than crushing the site's name.
- [ ] 7.5 Open, and archived open: verify with a screen reader that the two controls read as the same action in two places, that an outcome is announced beside the control that was pressed, and that a standing message about the record survives a share.

  The third of these is verified in a browser already — a failed conversion followed
  by two shares left the field still marked invalid and still holding its
  explanation. What needs a screen reader is the first two, and specifically whether
  two controls sharing one name read as a duplicate when she sweeps the page's
  controls, or whether the banner and footer landmarks tell them apart as intended.

  That is a judgement about how it sounds, not a fact about the DOM, so it can only
  come from someone using it with VoiceOver on an iPhone. Archived open rather than
  held: the controls work, are reachable, and are named; what is unverified is
  whether the naming choice was the right one, and reopening that is a change of
  wording, not a defect to fix.
