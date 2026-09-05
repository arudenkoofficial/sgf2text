## Why

The page has grown a second audience it does not have: a skip link, a subtitle, a
paste field, two share controls, a home screen disclosure and two footer paragraphs
are all things a sighted visitor glances past. The player this converter exists for
does not glance. She listens to the page in order, so every permanent line and every
stop in the tab order is a toll she pays on every visit, before she reaches the two
things she came for — choose the file, hear the game.

She has also never needed the paste field. A game reaches her as a file, and the
page already converts a chosen file the moment it is chosen; the field is a way in
that costs her a stop, a label and a placeholder read out as SGF punctuation.

What she cannot do at all is keep the text. The page's answer to taking the game
away is the clipboard, which holds it until the next thing she copies and is gone
when the browser closes. A game she wants to replay on a tactile board tomorrow has
to be converted again tomorrow.

## What Changes

- **BREAKING** The paste field goes. A game arrives as a file; choosing one converts
  it, as it already does. Nobody can paste SGF text into the page any more.
- **BREAKING** The convert control goes with it. Choosing the file is the action, and
  a button that re-does what has just been done is one more stop announcing itself.
- **BREAKING** The copy control goes too. A file on her device is the durable version
  of what copying offered, so the clipboard stops being the way the text leaves the
  page. The result stays selectable and focusable, which is what a manual copy needs.
- **BREAKING** Both share controls go. Handing the tool to another player becomes the
  browser's own share control again.
- **BREAKING** The disclosure explaining how to keep the page on a home screen goes.
  The manifest, the icons and the translated icon name stay: the icon still works and
  is still named in her language — the page simply stops explaining it every visit.
- **BREAKING** The skip link goes. It exists to jump over a header full of controls,
  and after this change the whole page is about four stops long.
- The subtitle goes. The tagline is reworded to say what the converter does without
  restating the line above it, and the file control is renamed now that it is no
  longer the second of two ways in.
- The heading at the top of the page names who the converter is for, rather than
  only naming itself. The document title, the description and the home screen name
  are left as they are: they are read once, by a crawler or from an icon, and were
  not what the page was spending her time on.
- The two footer paragraphs — the promise that the file never leaves the browser, and
  the credit to the Japan Go Association for the Visually Impaired with the link to
  the source — stay on screen and leave the accessibility tree, along with their
  links' place in the tab order. Anyone who looks at the page still sees where the
  idea came from; she stops hearing it on every visit.
- A new control saves the converted text as a `.txt` file on her device, named with
  the date and time it was saved so one save cannot quietly replace another. It is
  present from the start so that passing through the page teaches her it exists,
  marked disabled while there is nothing to save, and it answers every press in a
  live region beside it.
- Where the browser will not save a file from a link — an older Safari, which is the
  browser most likely to be in her hand — the same control hands the file to the
  system share sheet instead, so she can file it where she keeps her games. The
  control has one name and says which of the two happened.
- The page stops asking the browser to confirm a reload. That guard protected text
  that existed nowhere else; the record now comes from a file she still holds, and
  the converted text can be saved, so the interruption defends nothing.

## Capabilities

### New Capabilities

None. Saving the text is the same page doing one more thing with a conversion it has
already made, so it belongs to the capability that already describes the page.

### Modified Capabilities

- `web-converter`: the page takes a file and only a file; conversion is triggered by
  choosing one rather than by a control; the converted text is taken away as a saved
  file rather than through the clipboard; sharing the page, copying the result, the
  home screen instruction, the skip link and the warning before leaving are all
  removed; the footer's paragraphs stay visible but leave the accessibility tree.

## Impact

- `web/index.html`: the paste field, the convert, copy and share controls, the
  disclosure and the skip link are removed; the save control and the page's one
  remaining notice region are added under the result; the footer paragraphs gain
  `aria-hidden` and their links leave the tab order.
- `web/main.ts`: the record moves from the field's value into the page's own memory,
  which is what a language change re-converts from; `aria-invalid` and the field's
  description move to the file control; the clipboard, share and `beforeunload`
  wiring go; the save control's two branches are detected at press time.
- `web/share.ts` becomes `web/save.ts`: the payload changes from the page's address to
  the converted file, and the outcome model — a cancelled sheet and an already-open
  sheet are silence, not failure — is what the file-sharing branch needs unchanged.
  `test/web-share.test.ts` follows it to `test/web-save.test.ts`.
- `web/announcement.ts`: the subject that only sharing used goes, and a file that
  could not be read becomes a verdict on the control that took it.
- `web/ui-strings.ts`: the strings for the skip link, subtitle, paste label, convert,
  copy and share go; the wording for a file that holds no game stops telling her to
  paste one; the save control's name and its outcomes arrive.
- `test/web-index-html.test.ts`, `test/web-ui-strings.test.ts`,
  `test/web-announcement.test.ts`: the page they assert against changes shape.
- The library in `src/` is untouched: this change is entirely the page.
