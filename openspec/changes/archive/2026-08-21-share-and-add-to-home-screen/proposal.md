## Why

A blind player reported looking for a way to send the page to someone and to keep
it as an icon on her phone's home screen, and not finding either. She was right
that neither exists: the page has no share control, and it ships no manifest, no
`apple-touch-icon` and no favicon at all.

Both of those cost her far more than they would cost a sighted reader. Reaching a
converter through a browser means finding the address bar, recalling or hunting for
the address, and confirming the right result — a sequence of VoiceOver gestures
every single time. An icon on the home screen replaces all of it with one gesture,
which is why "put it on my home screen" is one of the first things a screen reader
user asks of a tool they intend to use regularly. Without a manifest, iOS names
that icon after the URL and draws it from a screenshot, so what VoiceOver announces
on her home screen is a fragment of an address rather than the name of the tool.

Sharing matters for a second reason. This converter exists for a group of players
who are teaching each other, and the person best placed to hand it to the next
blind player is one who already uses it. That handover should be a button with a
name, not a hunt through the browser's own toolbar.

## What Changes

- A **Share** control on the page, alongside Convert and Copy. It offers the
  operating system's share sheet through `navigator.share`, passing the page's
  address in the language currently being read, so the recipient opens the version
  the sender was looking at.
- Where `navigator.share` is unavailable, the same control **copies the address**
  instead, and says which of the two happened. It is never a dead control and never
  a control whose label promises something the browser cannot do.
- A **web app manifest** and an **`apple-touch-icon`**, so an icon added to the home
  screen carries the tool's name and a drawn icon rather than an address and a
  screenshot.
- The home screen name **follows the language control**, like the document title
  already does: the icon a Russian reader adds is named in Russian.
- A **favicon**, which the page has never had — the same drawn mark, so a browser
  tab, a bookmark and a reading-list entry are identifiable rather than blank.
- **An instruction on the page** explaining how to add it to the home screen, in the
  reader's language. This exists because the page *cannot* do it: on iOS "Add to
  Home Screen" lives in Safari's own share menu and is not reachable from a web
  page's share sheet. Words are the only help a page can offer, so they have to be
  good ones.
- The icons and the manifest are **named in the deploy** rather than expected to
  travel on their own, and a test asserts they are, because the deploy enumerates
  what it copies and a forgotten asset ships as a silent 404.

## Capabilities

### New Capabilities

None. Every requirement here describes the same page the `web-converter` spec
already governs.

### Modified Capabilities

- `web-converter`: gains requirements for sharing the page, for the icons and
  manifest that make it installable, for the home screen name following the chosen
  language, and for the instruction that stands in for the gesture the page cannot
  perform. The existing requirement that every subresource comes from this origin
  now covers the icons too, and the existing rule that a shared link opens in the
  language it names now has a control that produces such links.

## Impact

- `web/index.html`: a Share button in the actions row, the icon and manifest links
  in the head, and the instruction in the page body.
- `web/main.ts`: the share handler, with its clipboard fallback, announced through
  the existing `role="status"` live region rather than any new mechanism; and the
  home screen name rewritten alongside the document title.
- `web/ui-strings.ts`: the new labels, the two announcements and the instruction, in
  both languages. If `move-translations-to-json` lands first, these strings belong
  in whatever store it establishes — the wording is the same either way, so this
  change does not depend on that one and does not block it.
- `web/icons/`: new image assets, served from this origin. No CDN, no icon font.
- `web/manifest.webmanifest`: new, and one per language if the name is to be
  translated at that level.
- `.github/workflows/pages.yml`: the new assets added to the enumerated copies.
- `test/`: assertions for the served document's icon and manifest links, for the
  deploy naming every asset the document references, and for the new strings being
  present in both languages.
- No change to the converter, its output, or the promise that a game never leaves
  the browser: the share control transmits the page's own address and nothing else.
