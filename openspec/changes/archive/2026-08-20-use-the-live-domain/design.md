## Context

`localise-page-metadata` gave the served document a full set of absolute addresses
— canonical, `og:url`, and one alternate per language plus `x-default` — as the
floor for a crawler that runs no JavaScript. It wrote them as
`https://arudenkoofficial.github.io/sgf2text/…` and left a comment saying a
repository rename or a custom domain "needs no edit here", because `main.ts`
rebuilds every address from `location`.

The comment was half right, and the half that was wrong is the half that matters.
A review of that change flagged the sentence as false for the audience it names:
messenger previews and crawlers run no JavaScript, so for them the literals are the
only value. At the time it was a hypothetical. It is not one now — the page is
published at `sgf.rudenko.live`, and the github.io address answers with a 301.

Two facts found by asking the running system rather than the repository:

- `https://arudenkoofficial.github.io/sgf2text/?lang=ru` → `301` →
  `http://sgf.rudenko.live/?lang=ru`. The query survives. The scheme does not.
- `http://sgf.rudenko.live/` answers `200` rather than redirecting to `https`, so
  **Enforce HTTPS** is off.

The second is what turns an address-hygiene problem into a broken promise. The
cookie carries `Secure`, so on an `http` origin the browser drops it silently.

Constraints:

- `web/index.html` is hand-written and served as-is. There is no HTML build step,
  and `esbuild` only bundles the JavaScript.
- `og:url` and `canonical` have to be absolute. A relative canonical would work;
  `og:url` would not, and it is the one previews read.
- The custom domain lives in the hosting provider's settings. Nothing that runs in
  CI can see it.

## Goals / Non-Goals

Goals:

- The served document names the live host, so a preview and a crawler get an
  address that answers.
- The repository states where it is published, so the next person does not have to
  follow a redirect to find out.
- A half-finished move fails the build rather than shipping quietly.
- Arriving over `http` stops costing a visitor their remembered language.

Non-Goals:

- Changing the runtime address logic. `applyAddresses` already rebuilds everything
  from `location`, and that was verified against the live domain: canonical,
  `og:url` and all three alternates came back as `https://sgf.rudenko.live/…`, and
  the cookie stored. It needs nothing.
- Retiring the old address. Links already sent to people must keep resolving.
- Templating `index.html`. Introducing a build step for the page to fix five
  literals costs more than a test that checks them.
- Teaching CI about DNS. It cannot see the provider's settings and should not
  pretend to.

## Decisions

### The address goes in `CNAME`, not a file of our own invention

GitHub Pages already reads `CNAME` as "the host this site is published at", so
putting the address there gives it one meaning rather than two. A bespoke
`origin.txt` would be a second source of truth, free to disagree with the thing
that actually routes traffic.

Honest limitation: with the Actions-based deployment the custom domain also lives
in repository settings, and DNS is authoritative regardless. `CNAME` does not
*control* where the page is published so much as *record* it, and the test keeps
the repository self-consistent rather than proving the deployment correct. That is
still worth having: it converts an invisible fact into a checkable one.

Alternative considered: derive the address from `package.json` `homepage`. Rejected
— npm consumers read that field, and overloading it with the page's address means
one value serving two audiences.

### The literals stay absolute and hand-written, with a test holding them together

Same shape as the anti-drift guard `localise-page-metadata` built for the strings:
one file is the source of truth, the served document restates it, and a test reads
both as text and compares. The reasoning transfers exactly — after the flip nobody
looks at the served HTML by accident, and now nobody looks at the addresses in it
either, because JavaScript replaces them before a developer opens the page.

The test also asserts the *absence* of the old host. Presence checks catch a value
that was never written; only an absence check catches the fifth literal somebody
forgot to update.

### `REPOSITORY` in `main.ts` is left alone

`web/main.ts` hardcodes `https://github.com/arudenkoofficial/sgf2text` for the
credits link. That is the source repository, not the published page, and the two
are different things that happen to share an owner. Saying so here so that a future
search-and-replace across "arudenkoofficial" does not sweep it up.

### The `https` requirement is specified even though no test can enforce it

A spec describes the deployed system, not only the parts CI can reach. Writing the
requirement down and pointing the task at a person is better than omitting it
because it is unenforceable — the failure it prevents is silent, and silent
failures need a written record most.

The verification is a `curl` in the delivery step: `http://<host>/` must answer a
redirect to `https`, and the redirect must carry a query string through.

### This delta only ADDs

`localise-page-metadata` is still active, so its requirements are not in
`openspec/specs/web-converter/spec.md` yet. Adding rather than modifying means the
two deltas compose whichever order they archive in. Nothing here needs to restate a
requirement that is not canonical.

## Risks / Trade-offs

**A test that reads `CNAME` proves only self-consistency, not that the page is
reachable** → Accepted, and stated in the decision above. The delivery step curls
the live site, which is the part that can actually fail in production.

**Enforce HTTPS is a setting, so it can be turned off again with nothing failing**
→ The delivery task verifies it with `curl` after deploy. If it regresses, the
symptom is a forgotten language rather than an error, so this is the risk worth
re-checking on any hosting change.

**Someone moves the domain in settings and forgets `CNAME`** → Then the repository
and reality disagree with no failure, because CI cannot see settings. Mitigated
only by the delivery step. Worth knowing rather than papering over.

**The old address will keep redirecting to `http` until Enforce HTTPS is on** →
Which is why that task comes before re-sending any link, and why the link that gets
sent names the live host directly.

## Migration Plan

1. Turn on Enforce HTTPS. It fixes the live cookie loss immediately and needs no
   deploy.
2. Land the address change and let the deploy publish it.
3. `curl` the live page and confirm the served literals name the live host.
4. Re-send the `?lang=ru` link on the live host to the players who were sent the
   github.io one. Task 7.7 of the previous change told us to send a link before the
   deploy; if the link that went out named the old host, it lands on `http` and
   forgets the choice, so it has to go out again.

Rollback: reverting the commit restores the github.io literals. The runtime path is
untouched either way, so a rollback costs crawlers and previews their correct
address and costs a visitor nothing.

## Open Questions

- Should the github.io address be retired once the players have the new link, or
  kept redirecting forever? Keeping it costs nothing and protects links in chat
  histories, which argues for forever.
- Should the README name the live address? It currently never says where the page
  is, which is a strange gap for a tool whose whole point is a web page. Included
  here as a task, on the assumption the answer is yes.
- Is one `CNAME` enough, or should the deploy also assert the artifact contains it?
  Left as a read-the-workflow confirmation rather than a test, since the workflow
  is four lines of `cp`.
