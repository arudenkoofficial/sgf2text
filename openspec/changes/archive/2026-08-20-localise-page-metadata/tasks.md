## 1. Resolving the language

Every test here that proves a source was consulted must expect **Russian**. English
is the fallback, so a test expecting English would pass even if the source it names
were never read.

- [x] 1.1 Write a failing test in `test/web-language.test.ts` asserting that `?lang=ru` wins over a cookie recording English, and that the returned source says `url`.
- [x] 1.2 Write a failing test asserting a cookie recording Russian is used when no `lang` parameter is present, with source `cookie`.
- [x] 1.3 Write a failing test asserting English is returned with source `fallback` when neither the URL nor the cookie names a supported language.
- [x] 1.4 Write a failing test asserting `ru-BY` resolves to `ru` from the URL parameter and from the cookie alike, since one matcher serves both.
- [x] 1.5 Write a failing test asserting an unsupported value is passed over rather than ending resolution: `?lang=de` with a Russian cookie yields Russian.
- [x] 1.6 Write a failing test asserting matching ignores case, so `?lang=RU` resolves to `ru`.
- [x] 1.7 Implement `resolveLanguage({ urlParam, cookie, supported, fallback })` in `web/language.ts` returning `{ language, source }`, with no reference to `document` or `window`.
- [x] 1.8 Confirm the function's inputs make browser sniffing impossible rather than merely unused: it takes no language list, so nobody can add `navigator.languages` to the chain without changing the signature and the tests that pin it.

## 2. The cookie as a string

- [x] 2.1 Write a failing test asserting the language is read out of a cookie header holding several cookies, in any position, and that a name which is merely a suffix of another cookie's name is not mistaken for it.
- [x] 2.2 Write a failing test asserting an absent cookie, an empty header and a bare `lang=` all yield null rather than an empty language.
- [x] 2.3 Write a failing test asserting the serialised cookie carries `Max-Age`, `Path=/`, `SameSite=Lax` and `Secure`, naming why `Lax` and not `Strict`: the cookie has to survive a cross-site top-level navigation from a link in a chat.
- [x] 2.4 Implement the read and serialise functions in `web/language.ts`.

## 3. Metadata values

- [x] 3.1 Write a failing test in `test/web-metadata.test.ts` asserting the canonical URL for a language is self-referential — it carries that language's `lang` parameter, not a shared address for both, and English gets `?lang=en` rather than the bare URL despite being the default.
- [x] 3.2 Write a failing test asserting the alternate set holds one entry per supported language plus `x-default`, and that `x-default` points at the bare URL with no `lang` parameter, since that is the address which serves the floor language.
- [x] 3.3 Write a failing test asserting canonical and alternate URLs are fully qualified, as search engines require, and are built from the base they are given rather than a hardcoded host.
- [x] 3.4 Implement the canonical and alternate assembly in `web/metadata.ts`, DOM-free.

## 4. The page's strings

- [x] 4.1 Move `UiStrings` and the `UI` table out of `web/main.ts` into `web/ui-strings.ts` unchanged, and confirm `npm run typecheck:web` and `npm run build:web` still pass — this step alters no behaviour.
- [x] 4.2 Write a failing test asserting every supported language defines the same key set, naming the language and the missing key when it fails.
- [x] 4.3 Add `description` and `ogLocale` to `UiStrings` and fill them for Russian and English. `og:title` and `og:description` reuse `title` and `description`; do not add separate keys for them.
- [x] 4.4 Change the fallback language the page resolves to from Russian to English, in one named constant rather than scattered literals, so the served document and the last resort cannot drift apart.

## 5. The served document becomes English

- [x] 5.1 Translate `web/index.html` to English: `<html lang="en">`, the title, the skip link, the tagline, every label, the button captions, the result heading, the placeholder, the privacy line and the credits. The Russian wording is not lost — it already lives in the `UI` table, which is what JavaScript applies.
- [x] 5.2 Reorder the two `<option>`s so English is first, since the control must show the language the document is actually served in rather than claiming Russian before any script runs.
- [x] 5.3 Add to `web/index.html` the tags the page currently lacks: `og:title`, `og:description`, `og:locale` (`en_US`), `og:url`, `og:type`, `og:site_name`, `twitter:card`, `link[rel=canonical]`, and a `link[rel=alternate]` per language plus `x-default`. Give each rewritten tag a stable way to be addressed from script.
- [x] 5.4 Write a failing test asserting the metadata inside `web/index.html` — title, description, `og:title`, `og:description`, `og:locale` — equals the **English** strings, by reading the file as text. Nothing else watches the served document now: a developer with a Russian browser never sees it, because JavaScript replaces it before they look.
- [x] 5.5 Write a failing test asserting `web/index.html` declares a canonical link and an alternate for every supported language plus `x-default`, so a tag added to the strings but forgotten in the HTML fails the build.
- [x] 5.6 Write a failing test asserting the `lang` attribute of `web/index.html` names the same language its metadata is written in, so the served document can never carry one language's description over another language's text.

## 6. Wiring the page

- [x] 6.1 Replace `restoreLanguageFromUrl` with a call to `resolveLanguage`, passing the URL parameter, the cookie read through `try`/`catch`, the supported set and English as the fallback. Do not read `navigator.languages` anywhere.
- [x] 6.2 Extend `applyLanguage` to rewrite `meta[name=description]`, the Open Graph tags, `og:locale`, the canonical link and every alternate `href`, rebuilding the URLs from `location.origin + location.pathname` so a rename or custom domain needs no edit.
- [x] 6.3 Write the cookie when the language is resolved from anywhere other than the cookie itself, and when the visitor changes the `<select>`. Swallow a write failure silently — a preference that could not be saved is not the visitor's problem.
- [x] 6.4 Confirm by reading the code that no path added here issues a network request or writes anything but a language tag into the cookie.

## 7. Delivery

- [x] 7.1 Run `npm test`, `npm run typecheck` and `npm run typecheck:web`; confirm the new modules typecheck without the `dom` lib, which is what proves them DOM-free.
- [x] 7.2 Run `npm run build:web` and load the page from a local HTTP server: check that `?lang=ru` shows Russian metadata in the rendered `<head>`, that switching back to English restores the English metadata rather than leaving Russian in place, and that a reload with no parameter keeps the language the cookie holds.
- [x] 7.3 Check with the browser's cookies blocked that the page still loads, resolves a language and converts a game, and says nothing to the visitor about a preference it could not store.
- [x] 7.4 View source on the deployed page — not the inspector, which shows the DOM after script — and confirm the English metadata is what is actually served. Confirmed by fetching the deployed page without executing JavaScript: `<html lang="en">`, the English title and description, `og:locale="en_US"`, the canonical link and all three `hreflang` alternates. What was promised is what is served. The fetch also turned up something the repository never records — the page is published on a custom domain, and the addresses in the served document name the old host. That is `use-the-live-domain`, not this change.
- [x] 7.5 Listen to the page once with a screen reader, opened through `?lang=ru`, to hear which title is announced on load, and record in the change whether the deferred module swaps it late enough to matter. **It is early enough, and by construction rather than by luck.** Measured on load: the `<title>` element is parsed holding English, and the module rewrites it 0.1 ms before `DOMContentLoaded`. The margin is not the point — a `<script type="module">` is deferred, and `DOMContentLoaded` does not fire until deferred scripts have run, so the swap precedes it however slowly the module arrives over the network. A screen reader would have to announce the title before the document is ready to catch the English one. Heard with VoiceOver: the page reads. Two things surfaced that were not defects — the heading and the tagline are not in the tab order, so `Tab` never reaches them and `VO`+arrow is needed; and VoiceOver's own announcements stay in the system language whatever the page says, which is the very argument for not sniffing the browser. Still unconfirmed by ear: that Russian content is spoken by a Russian voice rather than an English one reading Russian words. Milena (`ru_RU`) is installed, so the remaining variable is VoiceOver's per-language voice assignment, not the page.
- [x] 7.6 Note in the README that the language may be passed as `?lang=`, is remembered in a cookie, that the resolution order is URL then cookie then English, and that the browser's own language is deliberately not consulted.
- [ ] 7.7 Send the `?lang=ru` link to the players who use the tool, before or with the deploy rather than after it. A bare-URL visit is now English for everyone, so without the link a blind user meets a page that changed language on her with no explanation and no obvious way back.

  Left open deliberately at archive, because the deploy has already happened and this was the one task meant to precede it. Two things changed its shape since it was written. The link to send is `https://sgf.rudenko.live/?lang=ru`, on the custom domain, and not the `github.io` address: that one answers with a redirect to plain `http`, where the cookie's `Secure` attribute means the browser stores nothing, so the language opens once and is forgotten. And until **Enforce HTTPS** is on, that is true of every `http` arrival. Both belong to `use-the-live-domain`, which carries this task forward as its own 6.5. Archiving this change does not discharge it.

## 8. Found while implementing

Work the plan did not anticipate. Recorded here rather than done silently, so the
change describes what was actually built.

- [x] 8.1 Translate the credits paragraph. It was never in the `UI` table, so it stayed in whichever language the HTML happened to be written in — a defect that predates this change, but one whose victim the flip moved from an English reader to the Russian-reading player the tool exists for. It holds two links, so it arrives as the pieces between them and is rebuilt from text nodes and anchors rather than assigned as markup.
- [x] 8.2 Write the resolved language into the URL on load, not only when the control is used. Without it a visitor reading Russian on the bare URL — because their cookie says so — copies an address that opens in whatever language the recipient's cookie holds, and the canonical address disagrees with the address bar, contradicting what design.md claims.
- [x] 8.3 Move the language control out of the form and into the masthead, and rename its label from "output language" to "page language". It rewrites the title, the description, the link-preview tags and every label, so sitting among the game-input fields described it as a per-conversion setting, which it no longer is.
- [x] 8.4 Keep it a native `<select>` and give each option a `lang` attribute, so its name is read in its own voice. No flag as the indicator: a flag names a country rather than a language, and an indicator that works only visually is worth nothing to the reader this page is for. The language's own name is the indicator.
- [x] 8.5 Delete the `.row` rules left unused by the move, rather than leaving dead CSS behind.

## 9. Found in review

Defects a multi-agent review of the finished change surfaced. None broke the page
outright, which is why they survived implementation and the manual checks in §7;
each was verified in a browser after fixing, because `web/main.ts` has no unit
tests by design.

- [x] 9.1 Translate the status line. `applyLanguage` rewrote every other string, and the `change` handler re-converted only when the result was non-empty — but every error path empties the result first, so an error announced before a switch stayed in the old language under the new `lang` attribute. That is the wording a screen reader then reads with the wrong language's phonemes, and after the flip to English it is the primary user who meets it. A message is now a function of the strings rather than a finished sentence, and `reannounce()` restates the standing one without moving focus: taking focus belongs to the failure, not to a later change of language.
- [x] 9.2 Write the cookie on every visit, including the ones that resolved from the cookie. Skipping those meant the year never slid forward, so a reader who chose Russian once and afterwards always arrived on the bare URL lost it a year after that single choice, however often she came back. `web/language.ts` promised the opposite ("long enough that a player who returns seasonally is still remembered"). This also retires the one policy branch nothing could test.
- [x] 9.3 Build the canonical base with `new URL('.', location.href)` instead of `location.origin + location.pathname`. The old form gave `/sgf2text/` and `/sgf2text/index.html` a canonical address each naming itself, so the two competed as duplicates — the opposite of what the hreflang set is for. It also threw outright in a document with an opaque origin, where `origin` serialises to the string `"null"`.
- [x] 9.4 Guard `history.replaceState`, and skip the write when the parameter already names the resolved language. Unguarded it threw in the same opaque-origin document the cookie `try`/`catch` was written for, and in Safari once a page has made too many history writes — and because it ran before `applyLanguage()`, a refusal left the language control naming a language the page was not in.
- [x] 9.5 Split `applyLanguage` into the visible page first and the metadata second, with the metadata guarded. One sequence with the metadata at the front meant a single missing tag aborted the run and left every label in one language beneath metadata already rewritten into the other. A throw there is our defect rather than a condition of the visitor's browser, so unlike the cookie and the address bar it is reported — to the console, which is the only channel a page that makes no network request has.
- [x] 9.6 Pin each catalogue entry's `htmlLang` to its own key, and check the catalogue against the library's `LocaleId` rather than `Record<string, …>`. `UI.ru.htmlLang` was asserted nowhere: setting it to `'en'` passed the whole suite while making a screen reader read Russian words through an English synthesiser. The `LocaleId` half also closes the opposite gap — a language added to the page but not to the library translated the whole page and left every conversion failing with "that language is not supported", in the new language. A runtime test backs the type up, because Node strips types rather than checking them.
