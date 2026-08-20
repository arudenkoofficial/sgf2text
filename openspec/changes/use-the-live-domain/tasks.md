## 1. Stop the live cookie loss

This one needs no code and no deploy, and it is the only item on the list that is
costing a visitor something right now. It goes first for that reason.

- [x] 1.1 Turn on **Enforce HTTPS** in the repository's Pages settings, so a plain `http` arrival cannot silently drop the `Secure` language cookie. Done. The Pages API now reports `https_enforced: true` and gives the site's address as `https://sgf.rudenko.live/`, where it previously gave `http://`. The certificate was already `approved`, so nothing had to be waited for.
- [x] 1.2 Verify with `curl -sI http://sgf.rudenko.live/` that the answer is a redirect to `https` rather than `200`, and with `curl -sI 'https://arudenkoofficial.github.io/sgf2text/?lang=ru'` that the redirect chain ends on `https` and still carries `lang=ru`. Both hold: the bare `http` address answers `301` to `https`, and the old link now runs `301 → 301 → 200` with `lang=ru` intact through every hop.

  Verified by walking the visitor's path rather than only reading headers, in a browser context with no cookie of its own: following the old `github.io` link with `?lang=ru` lands on `https`, the page comes up Russian, and the cookie is stored — where before the landing was `http` and the browser dropped it without a word. Returning afterwards to the bare `https://sgf.rudenko.live/` gives a Russian page and an address bar that regains `?lang=ru`. That is the promise the previous change made, working for the first time on the live site.

## 2. Record the published address

- [x] 2.1 Write a failing test asserting a `CNAME` file exists at the repository root and holds one bare hostname: no scheme, no path, no trailing slash, no blank second line. Done in `test/published-address.test.ts`, as two tests rather than one: existence is its own assertion, so a missing file says "CNAME exists" instead of failing a shape check on a value that was never read.
- [x] 2.2 Add `CNAME` holding `sgf.rudenko.live`. The value was not taken from the design document but read back from the Pages API, which reports `cname: sgf.rudenko.live`, `build_type: workflow`, `protected_domain_state: verified` and `https_certificate.state: approved`. So the recorded address agrees with the thing that actually routes traffic, not only with the rest of the repository.

## 3. The served document names it

Every test here reads `web/index.html` as text, the way a crawler receives it,
because nothing else watches that document: JavaScript rewrites these addresses
before a developer opens the page.

- [x] 3.1 Write a failing test asserting the canonical link in `web/index.html` names the host from `CNAME` over `https`. The failure message quotes both values, so a half-finished move names what disagrees with what.
- [x] 3.2 Write a failing test asserting `og:url` and all three `hreflang` alternates, `x-default` included, name that same host over `https` — one loop, so a fourth address added later is covered without editing the test. The addresses are gathered by pattern rather than listed, and the loop carries a non-empty guard: were the patterns to stop matching, an empty list would satisfy every assertion inside the loop and the test would go green at the moment it stopped testing anything.
- [x] 3.3 Write a failing test asserting no address anywhere in `web/index.html` names `arudenkoofficial.github.io`. A presence check passes while one forgotten literal still advertises the old host; only an absence check catches it.
- [x] 3.4 Update the five absolute addresses in `web/index.html` to the live host. All five now name `https://sgf.rudenko.live/`, and the path segment `/sgf2text/` is gone: the custom domain serves the page at the root. The three alternates fit on one line each now that the addresses are shorter, so the wrapping that existed only for the long `github.io` URLs came out with them.
- [x] 3.5 Confirm by reading `web/main.ts` that `REPOSITORY` still points at `github.com` and was not swept up: it names the source repository, not the published page. Confirmed, `web/main.ts:158` is unchanged. The absence test in 3.3 cannot catch a mistake here either way, since it reads only `web/index.html` and `REPOSITORY` names `github.com/arudenkoofficial`, not `arudenkoofficial.github.io`.

All five tests were run red before any of them was made to pass: 105 tests, 100 passing, 5 failing. The five that failed were the five just written.

### Found while implementing

- [x] 3.6 Correct the comment above the link-preview tags in `web/index.html`. It said `main.ts` rebuilds every address from `location`, "so a repository rename or a custom domain needs no edit here" — and that sentence is why these five literals spent weeks naming a host the page had already moved off. It was true for a visitor and false for the audience the literals exist for. The comment now says the runtime path corrects them for a visitor and for a visitor only, and points at `CNAME` and the test as what keeps them right on their own.
- [x] 3.7 Correct "GitHub Pages serves the page in English, and the browser translates it" in `README.md`. The browser does not translate it; the page's own script does. Read literally the old sentence credited browser auto-translation, which is the one mechanism this project deliberately refuses to depend on.

## 4. The deploy carries the address

- [x] 4.1 Copy `CNAME` into `_site` in the "Assemble the site" step of `.github/workflows/pages.yml`. The comment there states the honest limitation rather than implying the file routes traffic: the Pages API reports `build_type: workflow`, so the custom domain in repository settings is authoritative and this copy controls nothing. It keeps the artifact self-describing, and it means a switch back to branch-based publishing would not silently drop the domain.
- [x] 4.2 Confirm by reading the workflow that the published artifact holds `index.html`, `dist/` and `CNAME`, and nothing else — the sources stay in the repository rather than being served alongside it. Confirmed: the step is `mkdir -p _site`, then `cp web/index.html`, `cp CNAME`, `cp -R web/dist`. Nothing else is copied, and `npm run build:web` still emits the bundle the second of those depends on (33.5kb).

## 5. Say where the page lives

- [x] 5.1 Name the live address in `README.md`. The README describes a web page at length and never says where to find it. Both addresses are named now, at the top of the "Web page" section: the bare one, and the `?lang=ru` one with what it is for. The second is the operationally useful one, since handing someone a link is how a Russian reader gets a Russian page.

## 6. Delivery

- [x] 6.1 Run `npm test`, `npm run typecheck` and `npm run typecheck:web`. All clean: 105 tests, 105 passing, and both type programs silent. `npm run build:web` was run too, since `pages.yml` runs it and a broken bundle would fail the deploy rather than the suite.
- [x] 6.2 After the deploy, `curl` the live page and confirm the served HTML — not the inspector, which shows the DOM after script — names the live host in its canonical link, its `og:url` and every alternate. Deployed as `94d64dc` and verified: all five addresses in the served bytes name `https://sgf.rudenko.live/`, the former host appears zero times, and the set of addresses is identical to the one in `web/index.html`. `https://sgf.rudenko.live/CNAME` answers `sgf.rudenko.live`, so the file travelled with the artifact as intended.
- [x] 6.3 Load the live page with JavaScript on and confirm the runtime path still agrees with the served values rather than correcting them, which is what tells you the two have stopped disagreeing. Zero disagreements on `?lang=en`: canonical, `og:url` and all three alternates in the DOM equal the served literals character for character.

  Agreement alone would also be what a page with no script running looks like, so it was checked against a live script rather than a quiet one. Switching the language control to `ru` moved `htmlLang` from `en` to `ru`, translated the title and the tagline, and rebuilt canonical and `og:url` as `https://sgf.rudenko.live/?lang=ru`. So the runtime is computing addresses, and what it computes is the live host. Before this change the same switch would have rewritten five `github.io` literals into `sgf.rudenko.live` — the correction that told you the document and the deployment disagreed.
- [x] 6.4 Paste the live address into a messenger and look at the preview, since that is the reader this whole change is for. Checked and confirmed by hand.

  What the preview has to work with, read back from the live bytes: `og:title`, `og:description` (136 characters), `og:site_name`, `og:locale` and `og:url`, which now names `https://sgf.rudenko.live/?lang=en` and so resolves in one hop instead of bouncing through a redirect that used to end on plain `http`.

  Two things worth recording rather than leaving to be rediscovered. There is no `og:image`, so with `twitter:card` set to `summary` the card is text only; nothing here promised a thumbnail, but that is why no image appears. And `og:description` is written across three source lines, so a single-line grep for `content="…"` reports it missing — it is present. A future check of these tags needs a pattern that spans lines, or it will raise a false alarm on the one tag a preview leans on most after the title.
- [ ] 6.5 Re-send the `?lang=ru` link on the live host to the players who use the tool. Task 7.7 of `localise-page-metadata` sent a link before the deploy; if that link named the github.io host it lands on `http`, so the cookie was never stored and the choice was forgotten. This is the visit where she finds out.
