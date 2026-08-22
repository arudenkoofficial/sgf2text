## Context

The share control shipped in the form's action row, third after Convert and Copy. On
the live page it was missed on a first look, and the reason it was missed is the reason
it was in the wrong place: everything else in that row acts on the game record, so a
third button there reads as a third thing done to the game.

The page already sorts its controls this way and says so. The language control sits in
the masthead with a comment explaining that it belongs "beside the name of the site
rather than among the fields of the form, where it read as a per-conversion setting".
Sharing the page is the same kind of action and was filed in the place that comment
argues against.

## Goals / Non-Goals

**Goals:**

- Sharing offered where the page's own actions are: the masthead and the footer.
- One accessible name for one action, in both places.
- The outcome announced beside the control that was pressed.
- Every message announced according to what it is about, with the subject stated at the
  call site so the routing is testable — including the message about a file, the last
  one still filed under the game record.
- No press answered with silence unless silence is the right answer.
- A mark that helps a sighted visitor find the control without becoming the only thing
  that names it.

**Non-Goals:**

- Changing what one press of the control does. The sheet, the clipboard fallback and
  the silence for a cancellation are all as they were; what `web/share.ts` gained is a
  reading of the rejection that means "a share is already open", which is a defect this
  change made reachable rather than a change of behaviour it set out to make.
- A third wording, or a "share the game" control. The game is never shared.
- An icon-only control. The button was missed while carrying a text label; a glyph
  alone would be worse, and unreadable to the visitor this page is for.
- Making the masthead control sticky or floating. A control that follows the viewport
  is one more thing to meet unexpectedly while reading.

## Decisions

### Two controls, one name

Both buttons are labelled "Share the Page", from the same catalogue entry. Two
different names for one action would tell a screen reader user that the page offers
two things, and she would have to press one to find out that it does not.

The duplication is for the visitor who is at the top of the page and the visitor who
has read to the bottom. Neither has to travel to the other end to find it, which is
the only reason to have two.

The masthead is where the *page's* controls already live, so the share button joins the
language control there rather than being wedged between the site's name and it. In the
footer it goes immediately before the home screen disclosure: both are about taking
this page with you, and reading them one after the other is reading one thought.

### Each control has its own notice region

The requirement about a message staying with the field it describes exists for the
reader at high magnification, for whom a message at the other end of the page is a
message never seen. One notice region cannot satisfy that for two controls at opposite
ends of the page, so each control gets its own.

That makes four regions: the field's description, the form's notice for the result and
the clipboard, and one beside each share control. Only one ever holds text.

### The call site names the subject; everything else follows

Three arrangements, and the third is the one that holds. First a separate "is this
about the record" flag beside the region, which could contradict the region it
travelled with. Then the region alone —

    announce(message, tone = 'info', region = status)

— which removed the contradiction, since `where` was read off the region itself. But it
left the subject written down nowhere. The choice of region became a habit spread over
ten call sites, and the mistake that keeps happening is choosing the wrong one: three
messages shipped in the wrong region, and not one of them failed a test, because there
was nothing to fail against.

So the call site states the fact it actually knows:

    announce(subject, message, tone = 'info', notice = resultNotice)

`destinationFor(subject)` decides whether the field's description or a notice is used,
which makes the routing a decision this codebase makes once and a test can read —
`destinationFor('file') === 'notice'` is now an assertion rather than a habit. The
fourth argument only says *which* notice, and only the share controls need it, since
they are the same action in two places.

`web/announcement.ts` keeps deciding validity and focus from `{tone, where}` and learns
nothing about position. Where a message appears is the shell's business; what a message
is about, and what that means for the field, is a decision worth testing without a DOM.

### The field's description is not a notice

Putting a message in a notice clears the other notices. It does not clear the field's
description, and that is a correction: it did clear it until now, so sharing the page
blanked the sentence explaining why a record was invalid while leaving the mark of
invalidity behind. A screen reader then announced "invalid data" with nothing to say
what was wrong.

The distinction is that the field's description is *state* — it holds until the field's
state changes — while a notice is an event. Anything about a record survives until that
record is converted or replaced.

### The mark is drawn, not borrowed

An inline SVG, `aria-hidden="true"` and `focusable="false"`, beside the text.

Drawn in the page's own hairline idiom rather than copied from one platform's share
glyph. The page already refuses this kind of borrowing for the language control — "No
flags: a flag names a country, not a language" — and the reasoning carries: iOS draws
sharing as a box with an arrow, Android as three joined dots, and a page that picks one
is telling half its visitors about a control they do not have. An arrow leaving an open
tray says "this goes somewhere else" without naming whose menu it goes through.

Inline rather than a file, because it is two paths and a file would be a request, a
line in the deploy and a line in the publication test for something smaller than the
markup referencing it.

### One sheet at a time, and the browser is asked rather than remembered

Found by pressing the control twice in a browser rather than by reasoning about it.
`navigator.share` rejects a second call while the first is unresolved, with
`InvalidStateError` — "an earlier share has not yet completed". That is not a
cancellation, so `shareThePage` treated it as a refusal and fell through to the
clipboard: the page overwrote whatever she was holding and told her the address had been
copied, while the sheet she had opened was still standing and might still have
succeeded.

Two controls is what put this within reach. One button, and a second press means
pressing the same thing twice; two, and the other one is right there on the page while
the sheet is open.

The first fix for it was a guard of our own — a flag set before the call and cleared
when the promise settled — and that flag was itself the worse defect. A promise that
never settles never clears it, and both controls then answer every press with nothing at
all, for the rest of the visit. Demonstrated in a browser, not deduced: one press whose
promise never arrived left the page mute while its clipboard was still working, and
before the guard existed that same second press at least reached the clipboard — badly,
but audibly. The guard turned a wrong answer into no answer, which for this visitor is
the worse of the two.

So the rejection is classified instead, and there is no state here to latch:

| rejection | outcome | said |
| --- | --- | --- |
| `AbortError` | `cancelled` | nothing — she closed it on purpose |
| `InvalidStateError` | `busy` | nothing — the sheet still stands |
| anything else | clipboard fallback | copied, or failed |

The general shape of the mistake: I kept my own copy of a fact the browser owns. While
outcomes arrive the two agree and the duplicate looks harmless; they part exactly where
mine cannot be corrected. The browser's answer can change back — if it has forgotten the
outstanding share, the next press opens a sheet — and that recovery is what a boolean
could not offer.

## Risks / Trade-offs

- **Two buttons with one name read as a duplicate to a screen reader user sweeping the
  page's controls** → accepted, and it is the lesser cost: the alternative is a name
  that differs without the action differing. Landmarks tell them apart — one is in the
  banner, one in the footer.
- **Four live regions is more machinery than one** → they are inert when empty, and the
  alternative is a confirmation appearing where the visitor is not.
- **The masthead grows a third item and gets tight on a narrow screen** → the masthead
  already wraps, and the language control and the button share a group so they wrap
  together rather than stranding the button beside the site's name.
- **A drawn mark is less instantly recognisable than the platform glyph** → the text
  label is what names the control; the mark is there to catch the eye, and catching it
  is what a mark in the masthead does regardless of which one it is.

## Migration Plan

No data and no addresses change. The control moves, so anyone who learned where it was
in the last day has to find it again — which is the point, since where it was is where
it was not found.

The form's notice region stays exactly where it is, holding exactly what it held minus
the share outcomes.

## Open Questions

- A repeated identical answer is still silent. `say` returns early when the region
  already holds the text, so no DOM mutation happens and a polite region says nothing:
  demonstrated with two presses of the copy control, one mutation for the first and zero
  for the second. She presses again precisely because she is unsure, and gets nothing.
  Left out of this change deliberately — it is not about sharing, it reaches every
  message on the page, and the fix needs a screen reader to confirm that an identical
  rewrite is spoken at all. Its own change, next.
- Settled as "before the disclosure", on the reasoning that sharing is the commoner
  act. A reader who came to the footer for the instruction meets a button first, which
  is the cost; the disclosure is one item to pass rather than a paragraph.
- Does the masthead control need a shorter label at narrow widths? "Share" alone is
  ambiguous next to a game record, which is why the full name exists; the answer is
  probably that it wraps rather than shortens.
