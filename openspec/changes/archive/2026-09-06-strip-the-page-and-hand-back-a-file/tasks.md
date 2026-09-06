## 1. The file the page hands back

- [x] 1.1 `git mv web/share.ts web/save.ts` and `git mv test/web-share.test.ts
      test/web-save.test.ts`, so the outcome model and its reasoning keep their
      history instead of arriving as new files.
- [x] 1.2 Write a failing test asserting `downloadName` turns a given moment into
      `sgf2text-2026.09.03-14-05.txt`, with the month, day, hour and minute
      zero-padded.
- [x] 1.3 Write a failing test asserting the name holds no colon and no other
      character Windows forbids in a file name (`< > : " / \ | ? *`), so the browser
      has nothing to repair.
- [x] 1.4 Write a failing test asserting the name is built from the moment's local
      parts rather than its UTC ones, by naming a moment whose UTC day differs from
      its local day.
- [x] 1.5 Write a failing test asserting `saveTheText` returns `saved` when the link
      branch is available, and never reaches the sheet branch in that case.
- [x] 1.6 Write a failing test asserting it returns `shared` when the link branch is
      absent and the sheet accepts the file.
- [x] 1.7 Write failing tests asserting the sheet's three rejections stay told apart:
      `AbortError` is `cancelled`, `InvalidStateError` is `busy`, and anything else is
      `failed`.
- [x] 1.8 Write a failing test asserting a browser offering neither branch returns
      `failed`, and a failing test asserting the function never rejects, whatever
      either capability does.
- [x] 1.9 Rewrite `web/save.ts`: export `downloadName(at: Date)` and
      `saveTheText(capabilities)` where the capabilities are two optional thunks
      supplied by the page, keep every comment explaining why a cancellation and a
      concurrent sheet are silence, and delete the page-address payload and the
      clipboard fallback.

## 2. The page's words

- [x] 2.1 Write a failing test in `test/web-ui-strings.test.ts` asserting that
      `skipLink`, `subtitle`, `sgfLabel`, `convert`, `copy`, `copied`, `copyFailed`,
      `emptyResult`, `share`, `keepSummary`, `keepInstruction`, `shared`,
      `addressCopied` and `shareFailed` are absent from the catalogue, so no string
      outlives the control it named.
- [x] 2.2 Write a failing test asserting the catalogue defines `nameSuffix`, `save`,
      `savedToDevice`, `handedToSheet`, `nothingToSave` and `saveFailed` in every
      language, and that the two confirmations are functions of the file name rather
      than fixed sentences.
- [x] 2.3 Write a failing test asserting the two confirmations differ in every
      language, since a file written to her downloads and a file handed to a sheet are
      in different places.
- [x] 2.4 Write a failing test asserting the four sentences saving can say — written,
      handed over, nothing to save, failed — are four different sentences, since she
      tells the four outcomes apart by what she hears and nothing else.
- [x] 2.5 Write a failing test asserting no wording in either language tells the
      visitor to paste anything — neither the empty-file message nor the
      `empty-input` error wording — since there is nowhere to paste.
- [x] 2.6 Edit `web/ui-strings.ts`: drop the fourteen strings, rename `emptyInput` to
      `emptyFile` now that it describes a file rather than a field, add the six, reword
      the tagline, the file label, the empty-file message and the `empty-input` error
      wording in both languages, and leave `title`, `description`, `ogLocale` and
      `appName` untouched.

## 3. The served document

- [x] 3.1 Write a failing test in `test/web-index-html.test.ts` asserting the served
      document has no `#sgf` textarea, no `#convert`, no `#copy`, no `#share-top`,
      no `#share-bottom`, no `#keep` disclosure and no `.skip-link`.
- [x] 3.2 Write a failing test asserting the document carries a save control whose
      accessible name is the served language's `save`, that it ships
      `aria-disabled="true"`, and that it stands in the result department with the
      page's notice region beside it.
- [x] 3.3 Write a failing test asserting `#status` is the file control's
      `aria-describedby`, and that the input department holds no notice region of its
      own now that nothing there produces one.
- [x] 3.4 Write a failing test asserting `#privacy` and `#credits` carry
      `aria-hidden="true"` and that every anchor inside `#credits` carries
      `tabindex="-1"`.
- [x] 3.5 Write a failing test asserting the heading holds the served language's
      `nameSuffix` in an element of its own, beside the drawn name and its accent
      mark.
- [x] 3.6 Update the existing assertions in that file — the served-strings list, the
      other-language list and the share-control tests — to the page this change
      leaves behind, and delete the ones about controls that are gone.
- [x] 3.7 Rewrite `web/index.html`: remove the paste field with its label, the convert
      and copy controls, the form element, both share controls with their regions, the
      disclosure and the skip link; move `aria-describedby="status"` onto `#file`; add
      the save control with `#notice` beside it under the result; mark the footer
      paragraphs `aria-hidden`; give the heading its translated tail.
- [x] 3.8 Remove the CSS the deleted markup owned — `.skip-link`, the
      `main:focus:not(:focus-visible)` rule, `.share`, `.page-actions` and
      `button .mark-share` — and keep the focus rules every remaining control relies
      on, `#result` included.

## 4. Where a message goes

- [x] 4.1 Write a failing test in `test/web-announcement.test.ts` asserting
      `destinationFor('file') === 'field'`, so a file that could not be read is a
      verdict on the control that took it.
- [x] 4.2 Write a failing test asserting the `Subject` union no longer admits
      `'page'`, by exhausting `destinationFor` over the subjects the page still has.
- [x] 4.3 Edit `web/announcement.ts`: drop the `page` subject, move `file` to the
      field, and rewrite the comments that explain both — the old reasoning names a
      field the page no longer has.

## 5. The page's wiring

`main.ts` is the one module `node --test` cannot import, so the failing tests for this
group are the ones in groups 1 to 4 that its collaborators now have to satisfy.

- [x] 5.1 Hold the last file's text in a module-level `record` in `web/main.ts`, set
      by the file handler and read by `convert()`, and delete every read of
      `input.value`.
- [x] 5.2 Move `aria-invalid` and the focus-on-failure call onto `#file`, and move
      `forgetTheVerdict` from the textarea's `input` event to the head of the file
      handler, so choosing a file retires the verdict on the one before it.
- [x] 5.3 Leave the language-change guard as "a result is on the page" rather than "a
      record is in memory", so a standing failure is restated by `reannounce()` and
      focus is not pulled out of the language control.
- [x] 5.4 Reduce the page to one notice region: drop `announce`'s `notice` argument,
      keep `#status` for the field and `#notice` for events, and register both with
      `staleRegions` as before.
- [x] 5.5 Build the save capabilities at press time, with the file already made: the
      link branch offered only when `'download' in HTMLAnchorElement.prototype`, the
      sheet branch only when `navigator.canShare` accepts that file.
- [x] 5.6 Implement the link branch: a `Blob` of the result text typed
      `text/plain;charset=utf-8`, an anchor carrying `download` and
      `downloadName(new Date())`, a click, and `URL.revokeObjectURL` on a later task —
      revoking in the same task cancels the download in Safari.
- [x] 5.7 Implement the sheet branch: `navigator.share` with the file alone, no title
      and no text, so a target that prefers text cannot swallow the file.
- [x] 5.8 Answer every press in `#notice`: `saved` and `shared` each name the file and
      say which happened, `cancelled` and `busy` say nothing, `failed` names the
      result on the page, and an empty result says there is nothing to save.
- [x] 5.9 Keep the save control's `aria-disabled` in step with the result, in the same
      place `showResult` already did it for copying.
- [x] 5.10 Translate the new strings and the heading's tail in `applyVisible`, and drop
      the lines that translated the skip link, the subtitle, the paste label, the
      convert and copy controls, the share labels and the disclosure.
- [x] 5.11 Give `applyCredits` the `tabindex="-1"` on both links it builds, so the
      attribute survives a language change rather than being written once in the HTML.
- [x] 5.12 Delete the `beforeunload` guard, the submit handler, the clipboard handler
      and the share wiring — `shareCapabilities`, `share`, `shareButtons`,
      `shareNotices` and the loop binding them.

## 6. Loose ends

- [x] 6.1 Run `npx tsc --noEmit -p web/tsconfig.json` and clear every type error the
      removals leave behind.
- [x] 6.2 Check the README for anything it says about pasting a record, copying the
      result, sharing the page or the home screen instruction, and correct what it now
      misdescribes.
- [x] 6.3 Check that `test/published-assets.test.ts` still passes untouched: no asset
      is added or removed by this change, and a surprise there means something else
      moved.

## 7. Delivery

- [x] 7.1 Run the whole suite with `node --test`, every existing test passing or
      knowingly updated by groups 2 to 4.
- [x] 7.2 Rebuild the bundle and confirm the page still asks nothing of a third party
      and still makes no network request while converting or saving.
- [x] 7.3 Walk the page by keyboard alone: four stops — language, file, result, save —
      each announced, each drawing a focus ring, and the save control announcing
      itself as disabled before the first conversion.
- [x] 7.4 Save a converted game in a browser that honours the link branch, and confirm
      the file lands with the expected name and holds exactly the text on the page.
- [x] 7.5 Force the sheet branch by disabling the link capability, and confirm the file
      reaches the sheet, that dismissing it announces nothing, and that a second press
      still works afterwards.
- [ ] 7.6 Check both branches on her own device with VoiceOver before this ships — the
      design records the feature test as the one risk that cannot be settled from
      here.

## 8. What the review found

A five-way review of the finished change. The findings that survived verification, and
what closing each one cost.

- [x] 8.1 A change of language re-converted over a standing verdict: a file that could
      not be read leaves the previous game on the page, so "a result is on the page" was
      true of a game two files back. The re-conversion overwrote the verdict and set
      `aria-invalid="false"`, leaving the page vouching for a file it could not read.
      Extracted as `reconvertsOnLanguageChange` in `web/announcement.ts`, where a test can
      read it, with the verdict taken from the control's own mark rather than from the
      last thing the page said.
- [x] 8.2 `saveTheText(...).then(f).catch(g)` caught throws from `f` as well as rejections
      of the promise, so a file that had been written could be announced as a save that
      failed. Two-argument `then`, so the backstop covers only what it claims to.
- [x] 8.3 `saveCapabilities` was evaluated as an argument, outside the promise whose
      `.catch` exists so that something is always said. Built inside a `try` instead, and
      the shared `File` is now built only where a sheet might take it — it was constructed
      unconditionally, and a throw there destroyed the link branch that would have worked.
- [x] 8.4 The link branch's `catch` in `web/save.ts` swallowed our own defects silently.
      It reports to the console now, which is the only place this page can report
      anything, and still falls through to the sheet.
- [x] 8.5 The object URL leaked and the anchor stayed in the document whenever the link
      branch threw. Both are released in `finally`, since `saveTheText` treats the closure
      as all-or-nothing.
- [x] 8.6 The shared `File` was typed bare `text/plain` while the blob carried
      `;charset=utf-8`, so a share target taking the type at its word read her Russian as
      latin-1. One constant for both.
- [x] 8.7 One standing message for two regions: pressing save with nothing to save
      replaced the page's only standing message, and the next change of language left the
      file control's description in the language she had switched away from. Held per
      region now, and `reannounce` walks them.
- [x] 8.8 `destinationFor` was a ternary returning bare literals, so a fourth subject
      compiled cleanly and inherited `field` — where an error marks her file invalid and
      takes her focus. A total `Record<Subject, Destination>` makes it a compile error.
- [x] 8.9 The caller of `saveTheText` handled the outcomes with a fall-through, so a sixth
      outcome would have been announced as a failure. An explicit `failed` branch and a
      `never` binding close the union at the one place that decides what she hears.
- [x] 8.10 The disabled save control drew its label at 2.12:1 in light and 2.82:1 in dark,
      against the 4.5:1 this page holds itself to — and it is the state the page ships in.
      `opacity: 0.45` over the accent colours replaced by the measured `--ink-soft` on
      `--paper-sunk`.
- [x] 8.11 A failed read leaves the previous game on the page with the save control live
      over it. `fileFailed` became a function of whether that game stands, so she is told
      rather than left to save it under a fresh timestamp unknowingly.
- [x] 8.12 Both English confirmations said "to your device" and opened with the file name,
      which a screen reader spells out — so the two ran identically for a dozen spoken
      tokens. The destination leads now, in both languages.
- [x] 8.13 `applyHomeScreenName` was placed last because "nothing follows it", which was
      true of its function and false of its caller: the URL, the cookie and the
      re-conversion all follow. Caught like `applyMetadata`.
- [x] 8.14 `Announcement` carried both the subject and the region derived from it, so the
      type could describe a save confirmation filed under the file control's description.
      The region is derived where it is used.
- [x] 8.15 Comments that stated what the code does not do: the claim that every error path
      empties the result first (the false premise 8.1 rested on), the inverted argument for
      the record variable, the `emptyFile` note about parsing, and the duplicated feature-
      test paragraph. Corrected, and the detached-anchor workaround now names Firefox.
- [x] 8.16 Tests for what nothing watched: every `need()` selector against the served
      document, a label pointing at each of the two older controls, the page's stop count
      as a positive claim rather than a blocklist of old ids, `tabindex="0"` and
      `translate="no"` on the result, and the absence of `beforeunload`. Each verified by
      mutation before being kept.
- [x] 8.17 `test/web-announcement.test.ts`'s exhaustiveness test could not fail: it
      asserted the return type, and its typed array accepted a widened union. Replaced by a
      type-level check plus the total mapping in 8.8, both verified to break the build.

### The three that were decisions rather than defects

- [x] 8.18 The save control was named "Download the Game or Problem" / «Скачать
      партию/задачу», which named one of its two branches: pressing *Скачать* and hearing
      that the file was handed to a sheet describes something other than what she pressed.
      Renamed to *Save* / *Сохранить*, which is true of both destinations — and *download*
      was wrong on its own terms, since nothing is downloaded: the file is made in her
      browser out of text already on the page, which is the promise the footer makes.
- [x] 8.19 `saveFailed` is restated on every change of language, and stays that way. The
      argument for dropping it is that it reports a finished attempt; the argument for
      keeping it is that the text is still unsaved, which is a condition in force at the
      moment she switches. Dropping it is also silent — a cleared polite region announces
      nothing — so she would lose her only indication that the file was never written.
      Recorded here so the rule is not re-litigated from the symptom.
- [x] 8.20 The footer element remained a `contentinfo` landmark with both its paragraphs
      `aria-hidden`, so a reader cycling landmarks arrived at an empty stop. The attribute
      is on the landmark now, and stays on both paragraphs as the statement of intent at
      each level. Pinned by a test — whose first draft read the word out of the prose above
      the element and failed against a correct document.

## 9. Simplification, after the review

- [x] 9.1 The two regions were stated four times — two constants, an array literal and a
      ternary. Collapsed to `REGIONS`, with the list read back off it, and each entry
      pinned to the key it is filed under by `satisfies { [D in Destination]: Region &
      { kind: D } }`. `kind` and the key are read by different code, so filing the notice
      under `field` would have compiled and made a save confirmation the file control's
      description. Verified: swapping them is now a compile error.
- [x] 9.2 Four byte-identical `saveFailed` announcements became `announceSaveFailure()`,
      each call site keeping its own comment. `canonicalUrl` is computed once, so the
      canonical link and `og:url` cannot come to differ.
- [x] 9.3 `metaByName` and `metaByProperty` were one function written twice, each with a
      fallback pattern that matched a strict subset of the first — reachable only when the
      first had already found nothing.
- [x] 9.4 Nine copies of `UI[language] ?? {}` in the string tests became one `stringsIn`
      that asserts the language exists. The `?? {}` and `?? ''` fallbacks had made the
      assertions vacuous: an empty `ru.appName` satisfied the icon-label test on
      `''.length <= 15`. Verified: emptying it now fails three tests.
