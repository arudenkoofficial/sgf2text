## Context

The page today offers two ways in — a textarea to paste into and a file control —
and the textarea is more than an input. It is also the page's memory: the file
handler writes the file's text into `input.value` and calls `convert()`, `convert()`
reads it back, and a change of language re-converts from it. `aria-invalid` is set on
it, `#status` is its `aria-describedby`, the `beforeunload` guard reads it, and
`forgetTheVerdict` is bound to its `input` event.

So removing the field is not a deletion in the HTML. Six behaviours are wired
through it, and each has to be given a new home before it can go.

It offers two ways out as well, and both are borrowed: the clipboard, which holds the
game until the next copy, and the share sheet, which hands over the page's address
rather than the game. Neither leaves anything on her device.

Around the form the page carries a skip link, a subtitle, two share controls with a
region each, a disclosure explaining how to make a home screen icon, and two footer
paragraphs. All of it is permanent, and permanent is what costs a listener: she reads
the page in order, so the page's furniture is a toll on every visit rather than
something to look past.

## Goals / Non-Goals

**Goals:**

- One way in — a file — with conversion triggered by choosing it.
- One way out: the converted text saved to her device as a `.txt` she can find by
  name, working on the browser she actually uses.
- Every removal carried through to the strings table, the tests and the spec, so
  nothing is left describing a control that is gone.
- The credit to the Japan Go Association for the Visually Impaired stays on the page
  for anyone who looks at it.

**Non-Goals:**

- The library in `src/` is untouched. This change never reaches the converter.
- The icons and the manifests stay exactly as they are. Only the paragraph explaining
  them goes.
- No new dependency, no build change, and still no network request.
- No progressive-enhancement scaffolding for browsers nobody here uses: the two save
  branches exist because one of them is her Safari, not to cover the field.

## Decisions

### The record moves from the field into the page's own memory

A module-level `let record: string | null` holds the text of the last file read. The
file handler sets it, `convert()` reads it, and a change of language re-converts from
it. This is what the textarea was actually being used for, minus the part where a
visitor could edit it.

Considered and rejected: keeping a hidden textarea as the buffer. It would leave the
DOM holding state for no reason, and a hidden form control is a thing every future
reader of the page has to work out.

The guard on re-converting after a language change stays what it is today — a result
is on the page — rather than becoming "a record is in memory". The distinction is
load-bearing. A record that failed to parse leaves a message standing and no result;
`reannounce()` restates that message in the new language without moving focus, which
is what the spec requires of a visitor who is operating the language control. Were
the guard to become "a record is in memory", a failed record would be re-converted
instead of restated, `announce()` would run, and focus would be pulled out of the
language control and into the file control — the precise behaviour the existing
scenario forbids.

### The file control becomes the field, and a file that cannot be read becomes its verdict

`aria-describedby="status"` and `aria-invalid` move to `#file`, so the field region
keeps its meaning: the condition of the thing the game came in through.

The subject `file` — a file that could not be read — changes destination and becomes a
message about the field, marking the control and taking focus. The reasoning that made
it a notice was explicit: the field might be holding a perfectly good game the visitor
pasted an hour ago, and nothing about a failed file read examined it. With the field
gone there is no such record. The chosen file is the only record the page has, so a
file it could not read is a verdict on the only thing there is, and she has something
to act on — choosing another file — which is exactly when focus should follow the
message.

Considered and rejected: collapsing the field/notice distinction now that only one
subject is left on the field side. The distinction is what keeps "the file has been
saved" out of the file control's description, where it would be read out every time
she reached the control, minutes after the saving.

`forgetTheVerdict` moves from the textarea's `input` event to the start of the file
handler: choosing a file replaces the record, which retires whatever the page last said
about the one before it. Without that move, a failed read after a failed parse would
leave the old parse verdict standing on the control while a notice talked about the new
file.

### Choosing a file is the only trigger, and the form goes with the button

With the convert control gone, nothing submits. The `<form>` element goes too: a form
that cannot be submitted promises an action the page does not have, and the section
already groups the control with its announcements through `aria-labelledby`. The
spec's scenario about the language control standing outside the form is reworded to
name the department instead.

`emptyInput` survives as a message but stops being about a field: a file can hold no
game, and the wording that told her to paste one is wrong twice over now. It is
renamed and rewritten, in the strings table and in the library-error wording for
`empty-input` alongside it.

### Copying goes, and the result carries what it was for

A saved file is the durable version of what the clipboard offered, so keeping both
would leave two controls for one job — and the clipboard is the one that loses the
game when the browser closes.

Two things copying was quietly doing have to be picked up. It was the fallback the
page named when something else failed, so the message for a save that fails now names
the result itself: the text is still on the page, it can be selected, and it is
reachable from the keyboard because `#result` keeps its `tabindex="0"`. And it was one
of the two controls that produced notices, which is why the page had two notice
regions; with copying gone there is exactly one control left that produces them.

### One notice region, and the rule that says when there must be more

`#notice` moves out of the input department and stands beside the save control, under
the result. The field region stays where it is, beside the control it describes.

So `announce` loses its `notice` argument: there is one notice region, and the region
follows from the subject alone. The general rule stays in the spec — where the page
offers more than one control that answers in a notice, each needs its own region,
because one fixed region cannot sit beside two controls at opposite ends of a page.
That rule was learned from a real defect and outlives the controls that taught it; the
page simply no longer needs two.

### Saving has two branches, and each is chosen by what can actually be known

The control tries to save a file from a link, and hands the file to the system share
sheet where it cannot.

For the link branch, a feature test is the only signal there is: `'download' in
HTMLAnchorElement.prototype`. An unsupported `download` attribute does not throw —
the browser navigates to the blob instead and opens the text in a tab — so there is no
outcome to read, and nothing to fall back from after the fact.

For the sheet branch, the outcome is what decides, and `save.ts` already knows why:
`navigator.share` exists on browsers that then refuse the call, so the capability
existing is not the same as the call being possible. Its three rejections stay told
apart by name — a cancellation is hers, an already-open sheet has no outcome yet, and
only the rest is a failure.

Both capabilities are built at press time with the file in hand, not once at load. A
permission can be granted between one press and the next, and `navigator.canShare`
cannot answer about a file that does not exist yet.

Considered and rejected: sniffing the browser and its version. The user agent is a
string browsers lie in, and the question it would be answering is one the feature test
answers directly.

Considered and rejected: preferring the share sheet everywhere, since on iOS it also
lets her choose where the file lands. It is the more powerful branch and it is also a
sheet to dismiss on every save; a browser that will simply write the file should
simply write the file.

The two outcomes get two sentences. A file written to her downloads and a file handed
to a sheet end up in different places, and she cannot look to find out which happened
— the same reason the page already keeps "the text has been copied" apart from "the
address has been copied".

### `web/share.ts` becomes `web/save.ts` rather than being deleted

The module is the outcome model, and the outcome model is exactly what the sheet branch
needs. What changes is the payload — a file instead of the page's address — and the
fallback, which is no longer the clipboard. What survives is every comment explaining
why a cancellation and a concurrent share are silence rather than failure, including
the paragraph about a latch of our own that stayed shut for the rest of the visit.

Renamed in git rather than rewritten from scratch, so that history follows it.

### The save control is always there, and disabled rather than absent

It ships like the copy control did: present from the first paint, `aria-disabled="true"`
while the result is empty, never removed from the tab order. The page already made this
decision for copying and wrote down why — a `disabled` button is not reachable, so a
visitor tabbing the page never learns the action exists. A control that appears only
after a conversion is a control she cannot discover before she needs it.

The confirmation names the file it wrote. A file she cannot name is a file she has to
hunt for among everything else in her downloads, and the name is the only handle she
has on it.

### The file name

`sgf2text-YYYY.MM.DD-HH-MM.txt`, in her own local time, because the name is for her
clock rather than for a server's. The minutes are separated from the hours by a hyphen
rather than the colon the request drew: a colon is forbidden in a Windows file name and
was historically illegal in the Finder, so the browser would silently rewrite or
truncate the name — and the identifier she was promised would be the part that
disappeared. Two saves inside the same minute produce the same name and the browser
appends its own suffix; they are also the same text, so nothing is lost.

`downloadName` lives in `save.ts` beside the outcome model, DOM-free, so the only part
with rules is reachable by `node --test`. This is the split `language.ts`,
`metadata.ts` and `announcement.ts` already use: `main.ts` is the one module a test run
cannot import, so a decision left there is a decision no test can see.

### The footer stays visible and leaves the accessibility tree

`aria-hidden="true"` on the promise and on the credits, and `tabindex="-1"` on both
links inside the credits. The attribute on its own would leave two focusable links with
no accessible name — a control a keyboard user can reach and a screen reader cannot
name — so the links leave the tab order with the text that explains them.

Both paragraphs stay translated. They are still on screen, so the requirement that
every visible string follows the language still covers them, and the promise that the
file never leaves the browser is still the sentence the "asks nothing of a third party"
requirement exists to make auditable.

### The skip link goes because the page it skips is gone

After this change the stops are: the language control, the file control, the result,
save. Four. A link whose whole purpose is to jump over a crowded header is one of four
stops on a page with no crowded header.

### The heading names the audience; the document title does not change

The `<h1>` keeps its drawn name — `sgf`, the accent `2`, `text` — and gains a
translated tail in an element of its own, so translating the tail cannot delete the
mark. The page already learned this the hard way on the share control's label, where
writing to the button's own text would have wiped the glyph beside it.

The document title, the description, the link-preview tags and the home screen name are
left alone. They are read once, from a search result or an icon, and were not the
furniture she was paying for.

## Risks / Trade-offs

- **The feature test can be optimistic.** A WebKit that reports `download` on the
  prototype and ignores it would open the text in a tab while the page announces a
  saved file — the worst of the failures, because it is silent and confident. → Verify
  on her device. If her browser is one of those, the branch order inverts on iOS and
  the sheet becomes the default there.
- **The link branch has no observable outcome.** Once the click is dispatched the page
  cannot know whether the file was written, so the confirmation is on faith. → The
  confirmation names the file, which is what lets her go and check; and the sheet
  branch, which does report an outcome, is the one used where the link branch is not
  available.
- **A browser with neither branch leaves her with a manual copy.** → The failure
  message says exactly that, and the result keeps its place in the tab order so the
  text can be reached and selected from the keyboard.
- **The `.txt` is UTF-8 without a byte-order mark.** Current Windows tools detect
  UTF-8; an old editor would show Russian as mojibake, which a screen reader reads as
  noise. → Ask her what she opens the file in, and add a BOM if the answer is an old
  editor.
- **Nobody can paste a game any more, and nobody can copy one.** A record that arrives
  in a chat message has to be saved to a file first, and sending a converted game on
  to someone means sending the saved file. → Both are the trade she asked for; they are
  recorded here so the cost is not rediscovered as a defect.
- **Sharing the page is gone.** Handing the tool to the next player now means the
  browser's own share control, which is what the removed button existed to save her
  from hunting for. → Reversible: the requirement is removed in this change's delta
  rather than quietly abandoned, and the implementation is in git.
- **`aria-invalid` on a file input** is announced differently by different screen
  readers, and the control is emptied right after a file is taken, so it reads as
  "no file chosen, invalid". → The sentence in `#status` carries the reason, and it is
  the control's description, so it is read with it.

## Open Questions

- Nothing is settled about what she does with a saved file afterwards. If sending a
  game on to a teacher turns out to be common, the sheet branch is the one that
  already does it and could be offered as a second control rather than a fallback.
- Whether the empty-file case is worth its own wording at all, or whether such a file
  should simply report as unparseable. The message exists today and is kept, reworded;
  nobody has reported meeting it.
