## Context

Three of the four defects here were found by driving the page in a browser and counting
DOM mutations, not by reading the code. The code reads correctly in all four places; what
it does not do is answer her.

The page now has three separate questions about a message, and until this change only
two of them had an answer written down anywhere:

| question | where it is decided |
| --- | --- |
| what is it about | `destinationFor(subject)` |
| where is it said | the region the shell passes |
| **for how long is it true** | **nowhere** |

The third is the interesting one, and it is where the two subtler defects live. A message
is written once and then treated as a thing the page has already said — so a repeat is
skipped as redundant, and a stale one is re-announced as though it were current. Both are
the same missing idea seen from opposite ends.

## Goals / Non-Goals

**Goals:**

- Every press answered, including one that produces the same sentence as the last.
- The same file, chosen twice, read twice.
- A change of language restates what is still true and drops what has finished.
- The record's own verdict cleared when the record is replaced.

**Non-Goals:**

- New strings, new controls, new markup. Nothing on screen moves.
- Announcing a cancellation or a share the browser refuses. Those are still silent, and
  for the same reason as before: the outcome has not happened.
- Making the result area a live region. A 300-move game read out on every conversion is
  the reason it is not one.
- Debouncing or throttling the announcements. The presses are hers; each one is answered.

## Decisions

### An unchanged sentence is still written

`say` returned early when the region already held the text. Removing that early return is
the whole fix, and the two facts that make it safe were measured rather than assumed:

    textContent = ''      over an empty region  → 0 mutation records
    textContent = 'same'  over 'same'           → 1 mutation record (removed 1, added 1)

So the clearing loop in `render` costs nothing when there is nothing to clear — which was
the early return's only stated benefit — and a repeated sentence produces the mutation a
live region needs.

What the DOM does is now right. Whether every screen reader *speaks* an identical rewrite
is a separate question, and not one this codebase can answer: VoiceOver is known to
collapse some identical consecutive announcements. If verification finds it silent there,
the next step is clearing the region and writing it back on the following frame — worse
code for a real reason, which is a trade to make on evidence rather than in advance. So
the mutation is fixed here and the verification is a task, not a promise.

### A file control is emptied after it is read

One line, and the reason it is not obvious: `change` fires when the control's value
changes, and choosing the file already in it does not always change it. Browsers differ,
which is exactly why the page should not depend on which one she has. Emptying the control
after the choice has been taken makes the next identical choice a change in every browser.

The `File` is captured before the reset, so the read is unaffected.

### A standing failure survives a language change; a finished confirmation does not

`reannounce` rewrites the standing message in the new language. That is right for a
failure and wrong for a confirmation, and the distinction is not tone alone — "Done, 2
moves" is a confirmation that must be retranslated, because it describes the result
sitting on the page right now.

The line that actually separates them is whether the message describes a *condition* or
an *event*:

| message | describes | on a language change |
| --- | --- | --- |
| the record could not be parsed | a condition still in force | restated in the new language |
| done, N moves | the result now on the page | restated in the new language |
| the address has been copied | an event that finished | cleared, silently |
| copying failed | a condition: the clipboard refused | restated |

Which is the same field/notice split already in `destinationFor`, crossed with tone: a
notice carrying `info` is the only combination that describes a finished event. Everything
in the field describes the field's present state, and an error anywhere describes something
still wrong. So the decision is one small function over `{tone, where}` — the same pair
`fieldInvalidity` already takes, which is a hint that the pair is the real unit here.

A cleared notice announces nothing: a polite region reports what appears in it, not what
leaves.

### The record's verdict is cleared by editing the record

The field's description and `aria-invalid` are a verdict on a specific record. She
replaces the record, and the verdict is about something that no longer exists — so it goes
when the field's value changes, rather than surviving until the next conversion.

Cleared on `input`, which fires for typing and pasting and not for the page's own writes,
so loading a file still converts and announces normally.

**Read from the field, not from the standing announcement.** The first implementation
asked `announcement` whether the record had a verdict, and it was wrong in the way this
codebase's own distinction predicts: `announcement` is the last thing the page *said*,
while the field's description is a state that outlives it. Fail a conversion, then share
the page, and the verdict is still standing in the field while the last announcement is
the share's — so the check reported nothing to clear and the mark stayed. Caught by
driving the page rather than by reading it: the browser run had a share confirmation
sitting in a notice, which is exactly the arrangement that breaks it.

Which is the same mistake as the guard in the previous change — one variable answering for
two independent facts — and worth naming twice, because it did not look like the same
mistake while I was making it.

Only a verdict about the record is cleared. A notice about the clipboard or the page has
nothing to do with what she is typing, and clearing it would make editing the field a way
to erase an answer she has not read yet.

`aria-invalid` is removed rather than set to `'false'`. There is no verdict, and `'false'`
is a verdict — it claims the record is valid, which the page has not checked.

## Risks / Trade-offs

- **A repeated announcement may still be silent on VoiceOver** → the DOM mutation is the
  necessary half and is now correct; the sufficient half is a task with a real device,
  and the fallback (clear, then write on the next frame) is known if it is needed.
- **Clearing the verdict on every keystroke is more work per keypress** → it is one
  comparison and, when there is nothing standing about the record, nothing else. A
  textarea holding a 300-move record is unaffected: nothing here reads the value.
- **A visitor who edits the field loses the explanation before she has acted on it** →
  she is editing the thing the explanation was about, which is acting on it. The
  explanation returns, current, on the next conversion.
- **Two presses in flight at once could announce out of order** → they already could, and
  the answer is unchanged: the last one to settle is the one standing. Both are hers, and
  both describe something that happened.

## Migration Plan

Nothing to migrate. No strings, no markup, no addresses.

## Open Questions

- If VoiceOver proves to collapse identical announcements, is the clear-then-rewrite
  worth it for every message, or only for the ones a visitor repeats on purpose — copy
  and share? Deciding before the device test would be guessing.
