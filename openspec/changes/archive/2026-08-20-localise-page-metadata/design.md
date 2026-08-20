## Context

`web/main.ts` already localises two things when the language changes: the document
title and `documentElement.lang`. Everything else describing the page is frozen
Russian in `web/index.html` — `<meta name="description">` — and the Open Graph and
Twitter tags do not exist at all. The language is read from `?lang=` once at
startup (`restoreLanguageFromUrl`) and written back on change
(`rememberLanguageInUrl`), but never persisted, so every visit starts at the
`<select>`'s first option.

The served document also flips from Russian to English as part of this change, so
English becomes the floor everyone reaches without a cookie, a link or a matching
browser, and Russian becomes a translation JavaScript applies. That decision has
consequences well beyond the `description` tag, and most of what follows is
downstream of it.

Constraints that shape everything below:

- **Static hosting.** GitHub Pages serves files by path. It cannot vary a response
  by query string, so a per-language document is impossible while the language
  lives in `?lang=`. This was decided knowingly: previews in messengers stay
  Russian, and the fix (static file per language behind `/en/`) is a later change.
- **No test infrastructure for the DOM, and none wanted.** The project runs
  `node --test` against TypeScript sources, with no vitest and no jest. Adding
  jsdom to test a language switch would be a larger change than the feature.
- **Root `tsconfig.json` compiles `["src", "test", "types", "cli.ts"]` with
  `"lib": ["es2024"]` — no `dom`.** A module in `web/` that a test imports is
  pulled into that program and typechecked without DOM types.
- **Erasable syntax only**, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`.
- The page makes no network request, by design, so nothing here may introduce one.

## Goals / Non-Goals

**Goals:**

- Every piece of metadata describing the page follows the resolved language, and
  changes with it, without a reload.
- One ordered, single-source-of-truth resolution chain: URL → cookie → English,
  with the served document in that same last-resort language.
- A language other than English is reached only by choosing it, so the page a
  visitor gets never changes without an action of theirs.
- The choice survives between visits, so the language control is operated once.
- The logic is unit-testable under `node --test` with no browser and no new
  dependency.
- The metadata baked into `web/index.html` cannot silently drift away from the
  translated strings.

**Non-Goals:**

- Correct link previews in messengers. Out of reach on this hosting with a query
  parameter; recorded in the spec so it is not later mistaken for a bug.
- `og:image`. There is no image asset, the page deliberately fetches nothing, and
  designing one is its own piece of work.
- Path-based language URLs (`/ru/`, `/en/`), and any redirect between forms.
- Moving the page's strings into JSON. Adjacent to `move-translations-to-json`,
  but that change is about the library's locales, not the page's labels.
- Detecting the language from `navigator.languages`. Considered and rejected; see
  the decision below.
- `localStorage`. A cookie was asked for; see the trade-off below.
- A consent banner. A language preference is a functional cookie, and there is
  nothing else on this page to consent to.
- Adding languages. Russian and English stay the supported set.

## Decisions

### English is the floor, and the whole document flips — not the metadata alone

`web/index.html` becomes English throughout: its metadata, its `lang` attribute,
its visible strings, and the order of the two `<option>`s so the control shows the
language the page is actually in.

*Why not just the metadata?* Because English metadata over Russian body text is a
worse page than the Russian one we have. A crawler would be handed two
contradictory language signals — `og:locale` saying one thing and the prose saying
another — and a screen reader would read Russian words through an English
synthesiser for the interval before the module runs. The document has to be
coherent in whichever language it is served in; only which language that is was in
question.

*Why English as the floor?* It reaches the most people who arrive with nothing
known about them: no cookie, no language in the link, or a crawler that runs no
JavaScript. Russian still reaches every visitor whose link, cookie or browser asks
for it, which is the whole of the audience the tool was built for.

### The floor and the last resort are the same language

The chain ends in English because the document is served in English. Had the chain
kept ending in Russian, a visitor with no cookie and no parameter would have watched
an English page turn Russian after load, and a crawler without JavaScript would
have been indexing a language no such visitor ever sees. Tying the two together
removes both without a special case.

The consequence for testing is not cosmetic: **every scenario proving a source was
consulted has to assert Russian.** English is the fallback, so a test expecting
English passes whether or not the cookie was ever read. Russian is the only value
that cannot arrive by accident. The spec states this so the next person to add a
scenario does not write a green test that checks nothing.

### The decisions leave the DOM, so they can be tested

Two new modules, both free of `document` and `window`:

- `web/language.ts` — the resolution chain and the cookie string handling.
  `resolveLanguage({ urlParam, cookie, supported, fallback })` returns
  `{ language, source }` where source is `url`, `cookie` or `fallback`. Reporting
  the source is not decoration: it lets the caller skip a pointless cookie write
  when the value came from the cookie, and it makes every scenario in the spec a
  one-line assertion.
- `web/metadata.ts` — assembling the canonical and alternate URLs for a language
  from a base `URL`, plus the per-language wording table.

`web/main.ts` keeps only wiring: read `location`, read `document.cookie`, call the
pure functions, assign the results to nodes.

*Why not test the real page with jsdom?* It would add a dependency the project has
explicitly refused twice over (no vitest, no jest), to test glue code that a pure
function makes trivial. The interesting logic is all decision-making, and none of
it needs a DOM to be exercised.

*Why not put these in `src/`?* `src/` is the published npm package
(`tsconfig.build.json` has `rootDir: "src"`, `files: ["dist"]`). Page concerns do
not belong in the library's API.

*Why is DOM-freedom enforced rather than asked for?* Because the test lives in
`test/`, the new modules join the root program, which has no `dom` lib. A stray
`document` fails `npm run typecheck`. `npm run typecheck:web` still checks
`main.ts` with `dom` available. Both commands are already in CI, so neither the
workflow nor the scripts change.

### The page's strings move to `web/ui-strings.ts`

`UiStrings` and the `UI` table move out of `main.ts` unchanged, then gain the
metadata keys. The move is what makes the anti-drift test possible: a test can
import the strings without importing the DOM wiring.

*Alternative considered:* leaving them in `main.ts` and duplicating the metadata
wording into the test. That is the drift it is meant to prevent.

### The browser's language is not consulted

The chain is URL → cookie → English, and nothing reads `navigator.languages`.

*Why not?* Sniffing was there to serve the Russian-reading player without making her
do anything. It fails at that specific job: blind users commonly run an
English-language system with an English screen reader, so her browser is likely to
ask for English even though she reads Russian. So the feature's intended
beneficiary is the person it is least reliable for.

What it does deliver is a page whose language can change under a visitor with no
action of hers — after an OS update, on a borrowed machine, on a phone configured
differently from her laptop. A sighted visitor notices and shrugs. A blind visitor
navigating by memory of where the controls are, and by which voice reads them, pays
considerably more for that. A fixed floor plus one `?lang=ru` link that sticks
through the cookie is both simpler and steadier.

*Cost, stated plainly:* every Russian speaker's first visit is now English, the
primary user included. It is one action, once, and the cookie holds it.

*Alternative considered:* keeping the browser as a third source below the cookie.
Rejected for the reasons above, and it is worth noting the removal also deletes a
whole class of test — an ordered list to walk, region subtags arriving from a
different shape of input, and a source that cannot be controlled from a test
without faking a browser global.

### One matcher for both sources, primary subtag included

`ru-BY` selects `ru`: exact match first, then match on the subtag before the first
`-`, case-insensitively. The same matcher runs over the URL parameter and the
cookie, so a region subtag is handled identically wherever it arrives from rather
than being a separate rule per source.

An unsupported value is passed over, not fatal — the next source gets its turn.
`?lang=de` with a Russian cookie yields Russian, which is more useful than dropping
to English and cannot be mistaken for an error state.

### Cookie shape

`lang=<tag>; Max-Age=31536000; Path=/; SameSite=Lax; Secure`

- **Name `lang`**, matching the query parameter: one name for one concept.
- **`SameSite=Lax`, and this one is load-bearing.** `Strict` withholds the cookie
  on a cross-site top-level navigation, which is precisely how someone arrives —
  a link in a chat or an email. Under `Strict` the remembered language would be
  missed on exactly the visit it matters for. `Lax` sends it on top-level GET
  navigations.
- **`Max-Age` one year**, so it outlives the session as the spec requires. Refreshed
  on each visit that writes it.
- **`Secure`**: the site is HTTPS, and `http://localhost` counts as a secure
  context, so local development is unaffected.
- Not `HttpOnly` — JavaScript has to read it.
- **The value is a language tag and nothing else.** The page promises a game never
  leaves the browser; this is the only thing on the page that now travels, and it
  should stay boring enough to say so in one sentence.

Reading goes through `try`/`catch`: `document.cookie` throws `SecurityError` in a
sandboxed iframe, and writes silently no-op when cookies are blocked. Either way
resolution falls through to the next source and the page works in full. Nothing is
reported to the visitor — a preference that could not be saved is not their problem
to solve.

### Which tags, and which are static

Rewritten per language: `<title>`, `documentElement.lang`,
`meta[name=description]`, `og:title`, `og:description`, `og:locale`, `og:url`,
`link[rel=canonical]`, and the `href` of each `link[rel=alternate][hreflang]`.

Static, written once in HTML: `og:type` (`website`), `og:site_name` (`sgf2text`),
`twitter:card` (`summary`). The translatable ones ship with their English values,
`og:locale` among them as `en_US`, since English is what the document is served in.

- **`og:title` reuses `title`; `og:description` reuses `description`.** Separate
  keys would be two chances to drift for no gain.
- **No `twitter:title` or `twitter:description`.** X falls back to the Open Graph
  values when they are absent, so adding them creates synchronisation work and
  nothing else.
- **`og:locale` gets its own key** (`ru_RU`, `en_US`): the territory is not
  derivable from the language tag, and inventing one in code would be worse than
  writing it down per language.

### Self-canonical per language, with hreflang alternates

Each language's canonical points at itself (`…/?lang=ru` for Russian,
`…/?lang=en` for English). A shared canonical would collapse the two versions into
one and make hreflang pointless. Alternates list `en`, `ru`, and `x-default` → the
bare URL with no parameter, which is the address that serves the floor language to
anyone the other alternates do not cover. Since the chain also ends in English, what
`x-default` promises and what that URL actually delivers are the same thing by
construction rather than by coincidence.

Both languages therefore keep an explicit `?lang=` address, English included, even
though the bare URL already serves English. One uniform rule beats a special case:
the address bar always matches the canonical, and the forcing behaviour holds
symmetrically — `?lang=en` guarantees English to a visitor whose cookie says
Russian, which the bare URL by definition cannot. A crawler landing on the bare URL
reads a canonical pointing at `?lang=en`, which is coherent: the bare address
negotiates, the parameterised one is the English page.

*Alternative considered:* making the bare URL English's canonical, so there is one
address for English instead of two. Tidier for link equity, but it makes the
canonical English address one that does not actually force English, and it splits
the rule in two — one language canonicalising to a parameter, the other to its
absence. Recorded as an open question rather than adopted.

Google requires fully-qualified hreflang URLs, so the HTML carries absolute ones.
At runtime they are rebuilt from `location.origin + location.pathname`, so a repo
rename or a custom domain self-heals for every visitor with JavaScript, and the
hardcoded values remain only as the no-JavaScript floor.

### Arriving with `?lang=` writes the cookie

The invariant is "the cookie holds the last language you actually saw", which is
one sentence and needs no case analysis.

*The trade-off:* someone sends a Russian-reading player an English link, and her
stored preference becomes English. The alternative invariant — only an explicit
`<select>` change writes the cookie — protects a deliberate choice from a link she
did not choose, at the cost of a page whose remembered language and last-seen
language can disagree indefinitely. Both are defensible; this is one line of code
either way, and it is worth revisiting if a real visitor trips on it.

### Anti-drift test against the served HTML

A test reads `web/index.html` as a file and asserts that the metadata inside it
equals the **English** strings. No DOM: the file is text, and the assertions are on
extracted attribute values. This is what stops the served document from quietly
reverting to a stale sentence that only JavaScript-less crawlers ever see — the one
audience nobody looking at the page in a browser can notice is being served the
wrong thing.

The flip makes this test matter more than it would have. While Russian was both the
served language and the language the developer sees on every local reload, drift in
the HTML was visible by accident. Now the served language is the one a
Russian-speaking developer with a Russian browser never sees — JavaScript replaces
it before they look — so nothing but this test is watching it.

## Risks / Trade-offs

- **Messenger previews stay Russian** → Accepted, and written into the spec as a
  scenario so it reads as a known boundary rather than an oversight. The escape is
  documented: a static file per language behind a path URL.
- **`web/index.html` drifting from the translated strings** → The anti-drift test
  above fails the build.
- **The English title may be announced before the module runs.** `<script
  type="module">` is deferred, so the swap happens after parsing. A screen reader
  announcing the document title on load could catch the pre-swap value → Not
  pre-empted with an inline blocking script, because that would duplicate the
  resolution logic in the `<head>` to fix a problem not yet observed. Measure with
  VoiceOver and NVDA first; the inline script stays available if it turns out to be
  real. The flip raises the stakes here: the visitor most likely to be reading
  Russian is now the one whose title arrives in the wrong language, where before
  she was the one it arrived correct for.
- **Every Russian speaker's first visit is English, the primary user included.**
  Nothing about the visitor is consulted, so a page she knew in Russian arrives in
  English → The cookie makes it a one-time cost, and a `?lang=ru` link sent once
  settles it permanently. This is a release step, not a footnote: a blind user left
  to work out on her own that the page changed language, and to go find the control
  that changes it back, is the one genuinely user-hostile way to ship this. No
  signal exists that would distinguish her from an English reader, so no cleverness
  in the chain substitutes for the link.
- **A green test that checks nothing.** With English as the fallback, any scenario
  asserting English passes even when the source it names is never read → Every
  source-proving scenario asserts Russian, and the spec says why, so the next
  person adding one does not reintroduce the hole.
- **A visitor's stored preference overwritten by a link they were sent** → See the
  trade-off above; the language control is always present and one change corrects
  it.
- **Malformed hreflang can make the two versions look like duplicate content to a
  search engine** → Both alternates plus `x-default` are emitted, and the result is
  worth checking once against a rich-results test after the first deploy.
- **`Secure` on the cookie breaks a plain-`http://` non-localhost preview host** →
  Resolution falls through to the browser language and the page still works; no
  such host is used.

## Migration Plan

No data to migrate, no schema, no stored state to convert. Existing `?lang=ru` and
`?lang=en` links keep behaving exactly as before, so nothing that has been shared
breaks.

What does change for people already using the page is the language they get from a
bare URL: English now, always. Anyone who has been opening the site without a
parameter and expecting Russian needs one visit through `?lang=ru` or one use of the
language control, after which the cookie holds. Sending that link to the players who
use the tool is the deploy step that matters more than the deploy itself.

Deployment is the existing `pages.yml` workflow — it copies `web/index.html` and
`web/dist`, and the file list does not change. Rollback is reverting the commit;
the cookie left in a visitor's browser afterwards holds a language tag the old code
ignores, so a revert needs no cleanup.

After the first deploy, check one language's rendered `<head>` and run a
rich-results check to confirm the hreflang set is read as translations.

## Open Questions

- Should arriving via `?lang=` overwrite a deliberately chosen cookie? Implemented
  as yes; recorded above as the one decision most likely to want reversing after a
  real visitor uses it.
- Is the deferred title swap audible on VoiceOver and NVDA? Needs a listen, not an
  argument. If it is, an inline pre-paint script for `lang` and `title` is the
  answer.
- Should the bare URL be English's canonical instead of `?lang=en`, collapsing two
  English addresses into one? Tidier for search engines, at the cost of a canonical
  that cannot force its own language and a rule that differs per language. Left as
  `?lang=en` for now; cheap to revisit once there is any traffic to reason about.
- Does the README, which is currently the project's only prose, need its own
  language decision now that the page has one? Out of scope here, but the two
  answers should probably agree.
