## Why

The converter is published at `sgf.rudenko.live`, but the page it serves still
tells everyone it lives at `arudenkoofficial.github.io/sgf2text/`. The old address
answers with a 301 to the new one, so nothing looks broken, and that is what makes
it worth fixing now rather than later: the damage falls on the one visitor who
cannot see the address bar.

Send her the tool in a chat and the preview names the old address. Follow it and
the redirect lands on **plain `http://`**, where the language cookie carries
`Secure` and so is never stored. The page opens in Russian because the link says
so, and then forgets. Her next visit on the bare address is English again, and the
promise the last change made her — open `?lang=ru` once and it is remembered — is
false on precisely the link most likely to reach her.

Crawlers and messenger previews run no JavaScript, so for them the addresses baked
into the served HTML are not a floor beneath a better runtime value. They are the
only value there is.

## What Changes

- The repository records the address it is published at, in a file under version
  control, so nobody has to infer it from a redirect. Today the domain exists only
  in GitHub's settings, which is why five reviewers and a hundred checks never saw
  it.
- The served `web/index.html` names the live host in its canonical link, its
  `og:url` and all three language alternates.
- A test reads the recorded address and the served document and asserts they
  agree, so moving the page can no longer half-happen.
- The deploy publishes the recorded address alongside the page.
- The published site answers over `https` and redirects a plain `http` request to
  it, so arriving from an old link cannot silently drop the remembered language.
  This one is a repository setting rather than code, and it is the highest-value
  item here.

Nothing changes for a visitor who runs JavaScript: the page already rebuilds every
address from `location`, and that was verified on the live domain.

Not breaking. The old address keeps working, because links already sent to people
must not stop resolving.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-converter`: adds requirements covering which address the served document
  names, how the repository records it, and that the published site is reachable
  over `https`. The delta only ADDs requirements, so it composes with the
  still-active `localise-page-metadata` delta whichever archives first.

## Impact

- `web/index.html`: five absolute addresses in the head.
- New `CNAME` at the repository root, and one more `cp` in
  `.github/workflows/pages.yml`.
- New test asserting the served document and the recorded address agree, and that
  the old host appears nowhere.
- `README.md`: names where the page lives, which it currently never says.
- Repository settings: **Enforce HTTPS**. No test can see this, so it stays a task
  with a person's name on it.
- `REPOSITORY` in `web/main.ts` keeps pointing at `github.com` — that is the
  source repository, a different thing from the published site, and it should not
  be swept up in the rename.

The primary user is affected twice: once by the preview she is sent, and once by
the visit after it. Re-sending the `?lang=ru` link on the live host is part of
shipping this, not an afterthought — the earlier link, if it named the old host,
lands on `http` and forgets her choice.
