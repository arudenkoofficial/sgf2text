## 1. The share outcome, decided in a testable place

The branch that matters is the one that announces nothing. It cannot be reached
through the DOM in `node --test`, so the decision moves into a function that takes
the two capabilities as arguments and returns which announcement to make.

- [x] 1.1 Write a failing test asserting that a rejection whose `name` is `AbortError` produces no announcement at all, and does not fall through to the clipboard — a visitor who closed the sheet must not be told anything happened.
- [x] 1.2 Write a failing test asserting that a successful share announces the shared outcome and never touches the clipboard.
- [x] 1.3 Write a failing test asserting that an absent share capability copies the address instead and announces the copied outcome.
- [x] 1.4 Write a failing test asserting that a rejection other than `AbortError` also falls back to the clipboard, since `navigator.share` exists on browsers that then refuse the call.
- [x] 1.5 Write a failing test asserting that when both the share and the clipboard fail, the announcement is the one naming the browser's own share control, rather than a generic failure.
- [x] 1.6 Write a failing test asserting the address handed to the share capability is the language-carrying canonical address, so a Russian reader shares the Russian URL.
- [x] 1.7 Implement the decision function in `web/share.ts`, taking a share function, a clipboard function and the address, and returning the announcement to make.

## 2. Strings

- [x] 2.1 Write a failing test asserting every new key is defined in both languages, extending the existing completeness check in `test/web-ui-strings.test.ts` rather than adding a second one.
- [x] 2.2 Add the share control's label, the four announcements (shared, copied, could-not-share, and nothing for the abort branch), the disclosure's summary and the home screen instruction to `UiStrings` and to both catalogue entries.
- [x] 2.3 Write the instruction so it names each browser control the way a screen reader announces it, and check by reading it aloud through a screen reader that no step is identified by shape, colour or position.

## 3. The served document

- [x] 3.1 Write a failing test asserting the document declares a manifest link, an `apple-touch-icon`, a favicon and an `apple-mobile-web-app-title`, and that the title's served value is the served language's title.
- [x] 3.2 Write a failing test asserting the document carries a share button with an accessible name and no `aria-disabled`, since unlike Copy it is never in a state with nothing to act on.
- [x] 3.3 Write a failing test asserting the instruction is a `<details>` with a `<summary>`, so it is a native disclosure rather than a scripted one.
- [x] 3.4 Add the share button to the actions row, after Convert and Copy.
- [x] 3.5 Add the icon, manifest and `apple-mobile-web-app-title` tags to the head.
- [x] 3.6 Add the disclosure to the footer, beside the privacy and credits lines, with the served language's wording.

## 4. Icons and the manifest

- [x] 4.1 Write a failing test asserting the manifest parses as JSON and declares `name`, `short_name`, `icons`, `theme_color`, `background_color` and `display`, and that every file its `icons` name exists on disk.
- [x] 4.2 Write a failing test asserting the manifest's `theme_color` equals the **dark**-scheme `theme-color` in the document — the page's own default, since `:root` carries the dark palette and light is applied only under a preference query.
- [x] 4.3 Draw the mark as an SVG and generate the raster sizes from it — a 180×180 `apple-touch-icon`, and 192 and 512 for the manifest — with the tooling already on the machine, then commit them as content.
- [x] 4.4 Write the manifest with the served language's name, superseded by task 9 which splits it per language.

## 5. Wiring

- [x] 5.1 Wire the share button in `main.ts` to the decision function from task 1, passing `navigator.share` when present, the clipboard writer, and the canonical address built by the same `canonicalUrl` call `applyAddresses` already uses.
- [x] 5.2 Announce a success through the existing `announce` helper with tone `info`, so focus stays where the visitor left it — a successful share is nothing to act on — and a failure with the failure tone but addressed to the page rather than to the field.
- [x] 5.3 Rewrite `apple-mobile-web-app-title` from the language catalogue in its own `applyHomeScreenName`, called last of everything — after the visible strings and after the metadata block — so the name follows the language control in both directions while a renamed tag cannot abort the translation of anything else.
- [x] 5.4 Translate the share label and the disclosure's summary in `applyVisible`, alongside the Convert and Copy labels.

## 6. Publishing

- [x] 6.1 Write a failing test that extracts every same-origin reference from `web/index.html` — `href`, `src`, the manifest and every icon — and asserts each one is a file the `Assemble the site` step of `pages.yml` would copy, deriving both sides from what exists rather than from a maintained list.
- [x] 6.2 Name the icons directory and the manifest in the `Assemble the site` step, and update the comment there that warns a new kind of asset has to be named or it never ships.

## 7. Delivery

- [x] 7.1 Run the whole suite, the two type checks and both builds, and confirm the only pre-existing behaviour edited is the message routing task 8 exists to correct.
- [x] 7.2 Confirm the page still issues no network request beyond its own origin, so the icons did not introduce a third-party fetch.
- [x] 7.3 Check the share button, the disclosure and the notice region at the contrast the spec requires — text 4.5:1, and the button's border 3:1 against both the page and its own fill — in both colour schemes, measured rather than judged by eye.
- [ ] 7.4 Verify on a real iPhone with VoiceOver: the share button announces its purpose and opens the sheet, cancelling the sheet says nothing, the disclosure reads as a disclosure, and adding the page to the home screen produces an icon named in the language being read.
- [ ] 7.5 Verify on the same device that reaching the game field after sharing reads the field's own label and description and nothing about the address, and that the icon opens the page in Safari with its own controls available.

## 8. A message describes only what it is about

Found in review of this change, and older than it: the messages about copying the
result were announced as failures about the input, so an empty *result* marked her
game record invalid and pulled focus into it. Sharing would have added three more.

- [x] 8.1 Write a failing test asserting a message addressed to the page leaves the field's validity untouched rather than declaring it valid, so a record that failed to parse keeps saying so.
- [x] 8.2 Write a failing test asserting focus moves on exactly the same condition that marks the field invalid, so the two cannot drift apart.
- [x] 8.3 Move the decision into `web/announcement.ts`, DOM-free like `share.ts`, since `main.ts` is the one module `node --test` cannot import.
- [x] 8.4 Write a failing test asserting the document carries two polite live regions, that the field's `aria-describedby` names only the one for messages about the record, and that both sit inside the section holding the controls that produce them.
- [x] 8.5 Add the second region to the document beside the existing one, styled by the same rules so a failure reads as a failure in either.
- [x] 8.6 Route each announcement to the region it belongs to: the record's own messages to the field's description, and the result, the clipboard and the address to the notice.
- [x] 8.7 Correct the three pre-existing messages — copied, could-not-copy, and nothing-to-copy — so none of them describes the field, and nothing-to-copy stops marking the record invalid and stops taking focus.

## 9. A manifest per language, and an icon that opens a page

- [x] 9.1 Write a failing test asserting a manifest exists and is published for every language the control offers, so no choice of language can put a missing file in force.
- [x] 9.2 Write a failing test asserting each manifest's `short_name` and `description` are its own language's, and its `lang` is that language.
- [x] 9.3 Write a failing test asserting the manifests are identical except for `name`, `short_name`, `lang` and `description` — one answer must not be maintained twice.
- [x] 9.4 Write a failing test asserting `display` is `browser`, so the icon opens the page with the browser's own controls rather than as a standalone window.
- [x] 9.5 Split the manifest into one file per language and delete the single one.
- [x] 9.6 Derive the manifest address for a language in `web/metadata.ts`, beside the other address builders, so it is testable without the DOM.
- [x] 9.7 Swap the `<link rel="manifest">` href in `applyHomeScreenName`, beside the meta tag it already rewrites, so both sources of the name carry the same language.

## 10. The publication guard reads the manifests too

- [x] 10.1 Write a failing test asserting an icon named by a manifest and by nothing else is still required to be published.
- [x] 10.2 Extend the reference sweep to read every manifest as well as the document, and to treat each language's manifest as a reference in its own right.
- [x] 10.3 Name both manifests in the `Assemble the site` step.
