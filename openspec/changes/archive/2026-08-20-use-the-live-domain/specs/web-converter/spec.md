## ADDED Requirements

### Requirement: The served document names where the page lives

The served HTML SHALL give its canonical address, its `og:url` and every language
alternate on the host the page is published at, over `https`, so that a reader who
runs no JavaScript is handed the address that serves the page rather than one that
redirects to it.

This requirement is about the addresses baked into the document, not the ones the
page computes at runtime. A visitor running JavaScript already gets correct
addresses, rebuilt from `location`. Crawlers and messenger link previews execute
no JavaScript, so for them the baked-in values are the only values there are.

#### Scenario: A link pasted into a chat

- **WHEN** someone pastes the page's address into a messenger and the preview reads
  the served HTML without running JavaScript
- **THEN** the address it shows is the live one, so following it reaches the page
  in one hop instead of through a redirect

#### Scenario: A redirecting address is never the canonical one

- **WHEN** the served document declares a canonical address
- **THEN** that address answers with the page rather than with a redirect to
  somewhere else, because a canonical link pointing at a redirect gives a search
  engine two contradictory answers about where the page lives

#### Scenario: Every alternate names the live host

- **WHEN** the served document lists its language alternates and its `x-default`
- **THEN** each one names the live host, so no language of the page is advertised
  at an address that bounces

#### Scenario: The old address keeps resolving

- **WHEN** someone follows a link to the previous address, sent before this change
- **THEN** they still reach the page, because links already sitting in other
  people's chat histories must not stop working

### Requirement: The repository records its published address

The repository SHALL hold the address the page is published at in a file under
version control, and the deploy SHALL publish that file with the page. A test SHALL
assert the served document agrees with it.

The address is currently visible only in the hosting provider's settings, which no
test, no type check and no reviewer reading the repository can see. Recording it
turns "where does this live" from a question you answer by following a redirect
into one you answer by opening a file.

#### Scenario: Moving the page is one edit plus a failing test

- **WHEN** someone changes the recorded address without updating the served
  document
- **THEN** the test fails and names both values, so a move cannot be left
  half-finished

#### Scenario: The former address is gone from the document

- **WHEN** the served document is read after a move
- **THEN** no address in it names the previous host, so an overlooked literal
  cannot keep advertising an address the page no longer answers on

#### Scenario: The recorded address is a bare hostname

- **WHEN** the recorded address is read
- **THEN** it is a hostname with no scheme, no path and no trailing slash, so the
  file stays the single thing the hosting provider also reads it as

### Requirement: The published site is reachable only over https

The published site SHALL answer over `https`, and a plain `http` request SHALL
redirect to it, carrying any query string intact.

The language cookie is written with `Secure`, so a browser stores it only on a
secure origin. A visitor who arrives over `http` is therefore shown the language
the link names and has it forgotten by the time they return, with nothing reported
to them — the page cannot tell the difference between a cookie it failed to store
and a cookie that was never there.

#### Scenario: The remembered language survives a link from a chat

- **WHEN** a visitor follows a link naming a language, from any address the site
  answers on, including one that redirects
- **THEN** the last hop of that journey is `https`, so the cookie is stored and the
  language is still there on the next visit

#### Scenario: A redirect keeps the language it was given

- **WHEN** an address that redirects is followed with a `lang` parameter
- **THEN** the parameter survives to the destination, so the language a sender
  chose is the language the recipient sees
