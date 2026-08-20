## 1. Stop the live cookie loss

This one needs no code and no deploy, and it is the only item on the list that is
costing a visitor something right now. It goes first for that reason.

- [x] 1.1 Turn on **Enforce HTTPS** in the repository's Pages settings, so a plain `http` arrival cannot silently drop the `Secure` language cookie. Done. The Pages API now reports `https_enforced: true` and gives the site's address as `https://sgf.rudenko.live/`, where it previously gave `http://`. The certificate was already `approved`, so nothing had to be waited for.
- [x] 1.2 Verify with `curl -sI http://sgf.rudenko.live/` that the answer is a redirect to `https` rather than `200`, and with `curl -sI 'https://arudenkoofficial.github.io/sgf2text/?lang=ru'` that the redirect chain ends on `https` and still carries `lang=ru`. Both hold: the bare `http` address answers `301` to `https`, and the old link now runs `301 → 301 → 200` with `lang=ru` intact through every hop.

  Verified by walking the visitor's path rather than only reading headers, in a browser context with no cookie of its own: following the old `github.io` link with `?lang=ru` lands on `https`, the page comes up Russian, and the cookie is stored — where before the landing was `http` and the browser dropped it without a word. Returning afterwards to the bare `https://sgf.rudenko.live/` gives a Russian page and an address bar that regains `?lang=ru`. That is the promise the previous change made, working for the first time on the live site.

## 2. Record the published address

- [ ] 2.1 Write a failing test asserting a `CNAME` file exists at the repository root and holds one bare hostname: no scheme, no path, no trailing slash, no blank second line.
- [ ] 2.2 Add `CNAME` holding `sgf.rudenko.live`.

## 3. The served document names it

Every test here reads `web/index.html` as text, the way a crawler receives it,
because nothing else watches that document: JavaScript rewrites these addresses
before a developer opens the page.

- [ ] 3.1 Write a failing test asserting the canonical link in `web/index.html` names the host from `CNAME` over `https`.
- [ ] 3.2 Write a failing test asserting `og:url` and all three `hreflang` alternates, `x-default` included, name that same host over `https` — one loop, so a fourth address added later is covered without editing the test.
- [ ] 3.3 Write a failing test asserting no address anywhere in `web/index.html` names `arudenkoofficial.github.io`. A presence check passes while one forgotten literal still advertises the old host; only an absence check catches it.
- [ ] 3.4 Update the five absolute addresses in `web/index.html` to the live host.
- [ ] 3.5 Confirm by reading `web/main.ts` that `REPOSITORY` still points at `github.com` and was not swept up: it names the source repository, not the published page.

## 4. The deploy carries the address

- [ ] 4.1 Copy `CNAME` into `_site` in the "Assemble the site" step of `.github/workflows/pages.yml`.
- [ ] 4.2 Confirm by reading the workflow that the published artifact holds `index.html`, `dist/` and `CNAME`, and nothing else — the sources stay in the repository rather than being served alongside it.

## 5. Say where the page lives

- [ ] 5.1 Name the live address in `README.md`. The README describes a web page at length and never says where to find it.

## 6. Delivery

- [ ] 6.1 Run `npm test`, `npm run typecheck` and `npm run typecheck:web`.
- [ ] 6.2 After the deploy, `curl` the live page and confirm the served HTML — not the inspector, which shows the DOM after script — names the live host in its canonical link, its `og:url` and every alternate.
- [ ] 6.3 Load the live page with JavaScript on and confirm the runtime path still agrees with the served values rather than correcting them, which is what tells you the two have stopped disagreeing.
- [ ] 6.4 Paste the live address into a messenger and look at the preview, since that is the reader this whole change is for.
- [ ] 6.5 Re-send the `?lang=ru` link on the live host to the players who use the tool. Task 7.7 of `localise-page-metadata` sent a link before the deploy; if that link named the github.io host it lands on `http`, so the cookie was never stored and the choice was forgotten. This is the visit where she finds out.
