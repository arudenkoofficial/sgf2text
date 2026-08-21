## Context

The page has no share control and no icons of any kind: no manifest, no
`apple-touch-icon`, no favicon. A blind player asked for both a way to forward the
page and a way to keep it as an icon on her phone, and found neither.

Three constraints from the existing spec shape every decision below. Every
subresource comes from this origin, so icons are files in the repository rather than
requests to a service. Nothing is announced through a dialog, so the share result
goes through the `role="status"` line already in the page. And the deploy enumerates
the files it copies, with a comment in `pages.yml` warning that a new kind of asset
ships only if it is named there — which is exactly the failure mode a missing icon
would take.

The awkward fact this change is built around: **the gesture she asked for cannot be
triggered from a web page.** On iOS, "Add to Home Screen" is an item in Safari's own
share menu. `navigator.share()` opens the system share sheet for a payload, and that
sheet does not carry Safari's own actions. So the page can make the icon *good* once
she adds it, and it can *tell her how*, but it cannot add it for her.

## Goals / Non-Goals

**Goals:**

- One named button in the page that forwards the address, in the language being read.
- An icon on the home screen that carries the tool's name in her language.
- An instruction that names controls the way a screen reader announces them.
- A test that fails when an asset the document or a manifest references would not be
  published.
- Messages that describe what they are about, so nothing said about the page or the
  clipboard is attached to her game record.

**Non-Goals:**

- A service worker or offline caching. The page already works offline after first
  load because nothing it needs lives elsewhere; a service worker would add a cache
  to invalidate and buy nothing.
- An install prompt (`beforeinstallprompt`). Chrome-only, and the platform this user
  is on does not have it.
- Sharing the converted text, or the game. Only the page's address travels.
- Detecting whether the page is already installed, or hiding the instruction once it
  is. A wrong guess hides the one thing she needs — and `display: browser` means the
  instruction stays true wherever it is read, so there is nothing left to hide.
- An app-like launch. `display: standalone` would take away the browser controls she
  reaches this page with, including the share control the instruction names.

## Decisions

### The share control degrades through the clipboard, chosen by outcome rather than by feature detection

`navigator.share` is not a reliable capability check on its own: it exists on some
desktop browsers that then reject the call, and it requires a secure context and a
user gesture. So the handler tries to share and decides from what happens — falling
back to the clipboard on any rejection **except** `AbortError`, which is the visitor
closing the sheet.

That exception is the accessibility-relevant part. A cancelled share resolves as a
rejection, and announcing it would tell a blind visitor that something failed at the
exact moment she deliberately backed out. The `name === 'AbortError'` branch
announces nothing at all.

Alternative considered: feature-detect with `navigator.canShare({ url })` and never
call `share` when it is false. It is a cleaner shape, but it still leaves the
rejection paths to handle, so it adds a check without removing a branch.

### The address comes from the same builder the canonical link already uses

`canonicalUrl(new URL('.', location.href), language.value)` — the function
`applyAddresses` already calls. Sharing has to hand over the language-carrying
address, and that is precisely what the canonical link is. Reusing it means the
shared link, the address bar and the canonical URL cannot drift into three answers.

Alternative considered: `location.href`. It is usually right, because
`rememberLanguageInUrl` keeps `?lang=` in the bar — but only usually: that write is
wrapped in a `try` because Safari refuses history writes after enough of them, and
the refusal is deliberately silent. So `location.href` is the one source that can
disagree with the language actually being read.

### Both sources of the home screen name carry the language

The name can be read from two places, and which one wins is the platform's decision:
`apple-mobile-web-app-title` in the document, and `short_name` in the manifest, which
WebKit began reading in Safari 16.4. So both carry the chosen language rather than one
of them being left to hold the wrong answer.

`apple-mobile-web-app-title` is a `<meta>`, rewritten by `applyHomeScreenName` from
the language catalogue. The manifest is a static file and cannot follow a control, so
there is one per language — `manifest.en.webmanifest`, `manifest.ru.webmanifest` —
and the `<link rel="manifest">` href is swapped by the same function that swaps the
meta tag.

Whether a runtime href swap is picked up at add-to-home-screen time is undocumented
and may differ by platform. That is the reason this was first written the other way,
and it turns out not to be a reason against it: if the swap is honoured the icon is
named in her language, and if it is ignored the platform reads the served manifest and
lands on exactly the name a single manifest would have given. It cannot come out worse
than the version it replaces, and the previous version could come out wrong in the one
case the requirement is about.

`applyHomeScreenName` runs last of everything — after the visible strings and after
the metadata block. It is the only place in either that has to find a tag before it
can act, while the page is complete without it, so last is the one position where its
failure costs nothing but itself. Placed at the head of `applyVisible`, as it first
was, a renamed tag would have aborted the translation of every visible label and left
the page declaring one language over labels written in the other.

The two manifests are required to differ only in `name`, `short_name`, `lang` and
`description`, and that is asserted rather than trusted: everything else in them —
icons, colours, scope — is one answer that must not be maintained twice.

### Icons are committed content, not build output

`apple-touch-icon` must be a PNG — iOS does not accept SVG there — so real raster
files have to exist. They are generated once with the tooling already on the author's
machine and committed, rather than rasterised in CI.

The alternative is a devDependency such as `sharp` plus a build step, which would put
an image pipeline into a repository whose entire build is `tsc` and one `esbuild`
command, to produce four files that change approximately never.

An SVG favicon ships alongside for browsers that take one, since it is the only
format that stays sharp at every size and costs a few hundred bytes.

### The icon opens the page in the browser

`display: browser`, not `standalone`. What was asked for was an icon on the home
screen that opens this page — not an application.

`standalone` would take the browser's frame away, and with it Safari's own share
control: the one this page's instruction tells her to find, and the one `shareFailed`
names as the last thing to try when the page itself cannot share. It would also take
the reader, the text size control and the way back. The in-page share button covers
one of those, and only for the visitor who already found it.

This also removes the need for the page to know whether it is running installed. That
was going to be a `(display-mode: standalone)` query hiding the instruction — a branch
whose only purpose was to conceal that the instruction had become untrue.

### The manifest declares one colour scheme, and says which

`theme_color` and `background_color` take the dark-scheme values (`#101215`). The
manifest format has no media queries, so it holds one scheme only, and the one it
holds is the page's own default: `:root` carries the dark palette and declares
`color-scheme: dark light`, with light applied under a preference query. Taking the
light values instead — as this first did — painted the browser UI white around a page
that renders near-black for every reader who has expressed no preference.

The document's two `theme-color` meta tags continue to do the per-scheme job for the
browser UI, which is where a reader actually sees it.

### The instruction is a disclosure in the footer, not a permanent paragraph

A `<details>` with a `<summary>` naming it, placed with the privacy and credits
lines.

This is a screen reader consideration rather than a visual one. A reader who listens
to the page linearly pays for every permanent paragraph on every visit, and this
text is needed once. Collapsed, it is a single item to skip; expanded, it is fully
readable, keyboard-operable and needs no script — `<details>` is a native disclosure
with correct semantics already.

Alternative considered: an always-visible paragraph. Better discoverability the first
time, worse every time after. Alternative considered and rejected outright: revealing
it from the share button's failure path only, which hides the instruction from
everyone whose share sheet works — including the visitor who wanted the icon rather
than the forward.

### The publication test reads the document and the manifests, not a list

The test extracts every same-origin reference out of `web/index.html` — `href`,
`src`, the manifest link, the icon links — and out of every manifest, and asserts each
one is a file the `Assemble the site` step in `pages.yml` would copy.

Deriving both sides from what exists means the test keeps working when the next asset
is added, instead of being a second list to remember to update. The existing
`published-address.test.ts` already reads the workflow and the document this way,
which is the precedent to follow.

The manifests have to be read as well as the document, and for two reasons that only
appeared once the manifest was per-language. `icon-512.png` is named by a manifest and
by nothing else, so a document-only sweep never sees it — it ships today by the luck of
a recursive directory copy. And the manifest for the language that was not served is
named by no tag at all: it is reached only when she uses the language control, which
makes it invisible to a sweep of the served HTML and perfectly visible to her.

The step's script is parsed line by line, the way YAML reads a block scalar, rather
than by one regular expression ending at the first blank line. A blank line inside a
shell script is a paragraph break, not a terminator; ending the capture there meant
grouping the copies for readability silently truncated the list, and the suite then
reported a correct deploy as a broken one — which sends whoever reads the failure to
the wrong file.

### Page messages get their own live region

`#status` is the game field's `aria-describedby`, which is what makes a parse failure
reachable: focus lands in the field and the screen reader reads the label and then the
message. That association is the reason the region exists, and it is also why nothing
else may be written into it — a description is read out every time she reaches the
field, long after the message was true.

So there are two polite regions rather than one. `#status` keeps the messages about the
record in the field; a second one beside it, `#notice`, takes the messages about the
result, the clipboard and the address. `announce` names which it means with `where`,
and `web/announcement.ts` turns that into the three consequences: which region, whether
the field is marked invalid, and whether focus moves.

Both sit beside the controls that produced them, so the requirement about a message
staying with the field it describes is unaffected: for a reader at high magnification
nothing moved. What changed is only which of the two the field claims as its own
description.

This corrects a defect older than this change. The messages about copying the result —
including "there is nothing to copy yet" — were announced as failures about the input,
which marked her game record invalid and pulled focus into it because the *result* was
empty. Sharing would have added three more messages to the same pile; the split is what
lets the axis introduced here mean something.

## Risks / Trade-offs

- **The instruction goes stale when a platform renames a control** → it names
  controls as a screen reader announces them, which changes less often than the
  icons do, and the wording lives in `ui-strings.ts` where it is a text edit rather
  than a code change.
- **The clipboard fallback can also fail**, leaving a control that did nothing → the
  final branch announces both what failed and where the browser's own share control
  is, so the visitor ends with an instruction rather than with silence.
- **The clipboard fallback runs after the share sheet has already rejected**, by which
  point the browser may no longer count the press as a user gesture, so the fallback
  can be refused for a reason unrelated to the clipboard → accepted. Copying to her
  clipboard *before* calling `share` would overwrite whatever she was holding, on every
  successful share, to insure against a rare failure. The outcome is a spoken message
  naming another way, not silence.
- **A rejection that is not a cancellation is indistinguishable from one that is** →
  accepted, and it is the one case where this page can be silent. Chrome on desktop
  Linux offers `navigator.share` and rejects with `AbortError` when no share target
  exists, which reads exactly like a dismissed sheet. Announcing a failure for every
  cancellation would be the worse trade on her platform, where iOS raises `AbortError`
  precisely when she closed the sheet on purpose. A timing heuristic — a rejection
  arriving too fast to have been read — was considered and rejected as a guess dressed
  as a fact.
- **Icons are committed binaries in a repository that has none** → four small files,
  and the alternative is an image toolchain to maintain.
- **Two manifests are one answer written twice** → all of it except the four naming
  fields is asserted identical between them, so a drift fails the suite rather than
  reaching a home screen.

## Migration Plan

Almost entirely additive: nothing that worked before stops working, so there is
nothing to migrate and nothing to roll back beyond reverting the commit.

The exception is deliberate. Three existing messages — the two about copying the
result and the one about there being nothing to copy — move from the field's own
description into the page's notice region, and the last of them stops marking the
game record invalid and stops taking focus. That is a correction of behaviour, not an
addition, and it is described under the requirement about a message describing only
what it is about.

The one ordering constraint is that the assets must be named in `pages.yml` in the
same change that references them from the document, or the first deploy publishes a
page pointing at files that are not there.

## Open Questions

- Should the page also render its own address as a visible link, so a reader has
  something to copy by hand when both sharing and the clipboard fail? It is a real
  escape hatch and it costs one line, but it puts the page's address on the page,
  which every other part of this design treats as the browser's business.
- Does the instruction need a second variant for Android and Chrome, or does naming
  the browser's share control generically cover both? Writing one text that is
  honest on both platforms is preferable to branching on user agent, if it can be
  written without becoming vague.
- If `move-translations-to-json` lands first, do the page's own strings move into
  that catalogue too? Its own design leaves this open; these strings are more of the
  same question rather than a new one.
- Does the message about a file that could not be read belong in the field's
  description? It is left where it was, deliberately: a file that failed to load has
  a plausible claim on the field, since the field is where its contents were going and
  where she can paste them instead. But it marks the record invalid on the evidence of
  a file, which is the same shape of mistake as the three messages this change moved.
  Not settled here because nothing in this change touches the file control.
