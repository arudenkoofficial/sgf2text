import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Where the page says it lives, and whether the repository agrees with itself.
 *
 * The addresses baked into `web/index.html` are read by nobody who can complain: a
 * developer opening the page has them replaced from `location` before they look,
 * and the audience they exist for — a crawler, a messenger building a link preview
 * — runs no JavaScript and reports nothing. The host they name was wrong for weeks
 * and only `curl` found it.
 *
 * `CNAME` is the source of truth here because GitHub Pages already reads it as "the
 * host this site is published at". It records the address rather than controlling
 * it: the custom domain also lives in repository settings, and DNS is authoritative
 * regardless. So these assertions prove the repository is self-consistent, not that
 * the deployment is correct. That is still the difference between an invisible fact
 * and a checkable one.
 */
const path = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const CNAME = path('../CNAME');

const recorded = existsSync(CNAME) ? readFileSync(CNAME, 'utf8') : null;
const host = recorded?.trimEnd() ?? null;

const html = readFileSync(path('../web/index.html'), 'utf8');

/** The host the page was published at before it had a domain of its own. */
const FORMER_HOST = 'arudenkoofficial.github.io';

const attribute = (pattern: RegExp): string | null => pattern.exec(html)?.[1] ?? null;

/**
 * Every absolute address the document hands to a reader who runs no JavaScript,
 * labelled by where it came from so a failure names the tag rather than the value.
 *
 * Gathered by pattern rather than listed, so a language added to the catalogue
 * later brings its alternate into these assertions without this file being edited.
 */
const declaredAddresses = (): { label: string; href: string }[] => [
  { label: 'canonical', href: attribute(/<link rel="canonical" href="([^"]+)"/) ?? '' },
  { label: 'og:url', href: attribute(/<meta property="og:url" content="([^"]*)"/) ?? '' },
  ...[...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gs)].map(
    ([, hreflang, href]) => ({ label: `hreflang="${hreflang}"`, href: href ?? '' }),
  ),
];

test('the repository records the address the page is published at', () => {
  assert.ok(
    recorded !== null,
    'CNAME exists at the repository root — the deploy reads it, and so does this suite',
  );
});

test('the recorded address is a bare hostname', () => {
  assert.ok(recorded !== null && host !== null);

  // One token and at most one trailing newline. A blank second line or a second
  // host would be a file GitHub Pages reads differently than this test does, which
  // is the one way this file can lie while still parsing.
  assert.match(recorded, /^\S+\n?$/, 'CNAME holds one hostname and nothing else');

  assert.doesNotMatch(host, /:\/\//, 'no scheme: the file names a host, not a URL');
  assert.doesNotMatch(host, /\//, 'no path and no trailing slash');
  assert.match(host, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'a lowercase dotted hostname');
});

test('the canonical address names the recorded host over https', () => {
  assert.ok(host !== null, 'CNAME is the source of truth for this assertion');

  const canonical = attribute(/<link rel="canonical" href="([^"]+)"/);

  assert.ok(canonical !== null, 'a canonical link exists');
  assert.ok(
    canonical.startsWith(`https://${host}/`),
    `canonical is "${canonical}" but CNAME records "${host}" — a canonical link pointing at a redirect gives a search engine two answers`,
  );
});

test('every declared address names the recorded host over https', () => {
  assert.ok(host !== null);

  const addresses = declaredAddresses();

  // Guards the loop itself: were the patterns to stop matching, an empty list would
  // pass every assertion below and this file would quietly stop testing anything.
  assert.ok(addresses.length >= 4, 'canonical, og:url and at least two alternates were found');

  for (const { label, href } of addresses) {
    assert.ok(
      href.startsWith(`https://${host}/`),
      `${label} is "${href}", which does not name ${host} over https`,
    );
  }
});

test('no address in the served document names the former host', () => {
  // An absence check, not a presence check. Every assertion above passes while one
  // forgotten literal still advertises an address the page only redirects from, and
  // a redirect is exactly what costs a visitor the cookie their language lives in.
  assert.ok(
    !html.includes(FORMER_HOST),
    `web/index.html still names ${FORMER_HOST}; the runtime path corrects this for a visitor, so nothing else would have failed`,
  );
});
