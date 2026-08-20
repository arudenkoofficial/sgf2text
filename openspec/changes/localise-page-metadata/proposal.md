## Why

A blind player meets this tool before she reaches it: as a search result, or as a
link someone pasted into a chat. Her screen reader reads that snippet out first,
and today it is Russian whatever language she reads — the page's `description`
sits hard-coded in `web/index.html` and never follows the `?lang=` in the URL. So
the one part of the page that has to work before the page loads is the one part
that is not translated, and a player who does not read Russian hears a Russian
sentence spoken by an English voice at the exact moment the tool should be telling
her "this will speak to you in your language".

Which language that hard-coded floor should be is not a neutral choice. There is
exactly one other tool like this in the world, and it is Japanese. Blind Go players
looking for a way to read a game record are scattered across languages, and
whatever the served document says is what reaches every one of them who arrives
without a cookie, without a language in the link, and behind a crawler that does
not run JavaScript. English is the language most of them can recognise the tool
from. Russian then reaches everyone whose link, cookie or browser asks for it —
which is the whole of the audience the tool was built for, and none of it is lost.

Then, once she has chosen her language, the page forgets it. Every visit starts at
the `<select>`'s first option, and changing that means tabbing into the control and
listening through the options again. For a tool she opens weekly, always in the
same language, that is a toll charged on every single visit.

## What Changes

- The page's metadata follows the chosen language. `<title>` and `<html lang>`
  already do; `<meta name="description">` and the Open Graph / Twitter tags do
  not exist as translatable content yet and will.
- `web/index.html` gains the `description`, Open Graph and Twitter tags it is
  currently missing, so the served document is complete on its own rather than
  depending on JavaScript to become a describable page.
- **BREAKING for visitors, not for code: the served document becomes English.**
  Its metadata, its `<html lang>`, its visible text and the order of the language
  options all switch, and Russian becomes the translation JavaScript applies. A
  visitor arriving with no cookie and no `lang` in the URL now sees English where
  they previously always saw Russian. Nothing that has been shared breaks:
  `?lang=ru` still opens Russian.
- Only the whole document flips, never the metadata alone. English metadata over
  Russian body text would give a crawler two contradictory language signals and
  would have a screen reader read Russian words with an English synthesiser until
  JavaScript ran — worse on both counts than the single-language page we have now.
- The chain's last resort becomes English too, so the language a visitor gets when
  nothing is known matches the language the document was served in. A floor and a
  fallback that disagree would mean the page visibly flips after load, and would
  make a crawler without JavaScript and a visitor with it see different pages.
- `<link rel="canonical">` plus `<link rel="alternate" hreflang>` for each
  language and `x-default`, so a search engine reads the two versions as
  translations of one page rather than as duplicates competing with each other.
- The chosen language is stored in a cookie and restored on the next visit, so
  the language control has to be operated once rather than once per visit.
- Language resolution becomes one explicit, ordered chain:
  `?lang=` in the URL → cookie → English. The URL always wins, so a link opens in
  the language of the link even when the visitor's cookie disagrees — sending
  someone the Russian page has to actually send them the Russian page.
- **The browser's language is not consulted.** Russian is reached only by an act of
  choosing: a link that names it, the language control, or the cookie remembering
  one of those. Sniffing `navigator.languages` was considered and dropped: it was
  meant to serve the Russian-reading player, yet blind users commonly run an
  English-language system with an English screen reader, so it is unreliable for
  exactly her. What it does deliver is a page whose language can change under a
  visitor after an OS update or on a different device, through no action of hers —
  and a blind visitor navigating by memory of the page pays more for that
  unpredictability than a sighted one. A fixed floor she can rely on, plus one
  `?lang=ru` link that sticks forever, is worth more than a guess.
- Arriving with `?lang=` also writes the cookie, so a link someone sent becomes
  the remembered choice without a second action.
- The decisions above move into pure functions that take strings and return
  strings — no DOM. `web/main.ts` keeps only the wiring. This is what makes any
  of it testable under `node --test`, which is the project's only test runner.
- **Link previews in messengers are knowingly not fixed here.** Telegram,
  WhatsApp, Slack and X do not execute JavaScript, and GitHub Pages cannot vary a
  response by query string, so those crawlers keep reading the Russian
  description. Search engines that do execute JavaScript see the translated one.
  Fixing previews properly needs a static HTML file per language behind a
  path-based URL (`/en/`); that is a separate change, deliberately not this one.

## Capabilities

### New Capabilities

None. This extends the existing web page rather than introducing a new concern.

### Modified Capabilities

- `web-converter`: **Language switching** gains a defined resolution order across
  URL, cookie and default — with English as that default, replacing Russian — a
  prohibition on consulting the browser's own languages, and a defined write-back
  rule for which events persist the choice. Two requirements are added: the page's metadata following the
  chosen language, and the choice surviving between visits. Both record what the
  JavaScript-only approach does not deliver, so the crawler limitation reads as a
  known boundary rather than a defect found later, and both require the served
  document to be coherent in one language rather than metadata in one and content
  in another.

## Impact

- `web/index.html`: new `<meta name="description">`, Open Graph and Twitter tags,
  `<link rel="canonical">`, `<link rel="alternate" hreflang>` entries. Each
  carries an `id` or is addressable, since JavaScript rewrites it. Its `lang`
  attribute, every visible string it holds and the order of the two `<option>`s
  switch to English, so the document it serves is English throughout.
- The Russian wording currently living in the HTML is not lost: it already exists
  in the `UI` table in `web/main.ts`, which is what JavaScript applies. The HTML
  stops being one of the two places Russian is written down, which removes a
  duplicate rather than adding one.
- `web/main.ts`: `UiStrings` gains the metadata wording per language;
  `applyLanguage` extends to the new tags; `restoreLanguageFromUrl` is replaced by
  the resolution chain; the language `change` handler also writes the cookie.
- New module for the DOM-free decisions (resolution order, cookie read/write,
  metadata assembly) and its test file. This is the only new test surface: no
  DOM test infrastructure is added, and no dependency — the project runs
  `node --test` with no vitest and no jest, and that stays true.
- `src/` is untouched. Nothing here concerns converting a game.
- The player the tool was built for is affected on exactly one visit: her first one
  after the deploy is English, because nothing about her browser is consulted any
  more. One selection, or one `?lang=ru` link, fixes it permanently through the
  cookie. Sending her that link once is part of shipping this, not an afterthought
  — leaving a blind user to discover for herself that a page she knew in Russian is
  now in English, and to go find the control that changes it back, is the one
  genuinely user-hostile way to release this.
- Privacy: a cookie, unlike `localStorage`, is sent to the host on every request.
  It will carry a language tag and nothing else — never a game, never a filename.
  The page's promise that the game never leaves the browser is unaffected, and it
  is worth being explicit that this is the one thing on the page that now travels.
- No consent banner: a language preference is a functional cookie under GDPR's
  strictly-necessary exemption, and there is nothing else on the page to consent
  to.
- Interaction with `move-translations-to-json`: that change moves the *library's*
  locales into JSON. The page's own `UI` table is separate by design and stays
  TypeScript here. The metadata keys added by this change would move with it if
  the page's strings ever follow, which is worth knowing but changes neither
  change's scope.
