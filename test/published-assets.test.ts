import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { manifestAddress } from '../web/metadata.ts';
import { SUPPORTED_LANGUAGES } from '../web/ui-strings.ts';

/**
 * Whether the deploy publishes everything the document asks for.
 *
 * The `Assemble the site` step enumerates its copies, which is deliberate — but it
 * means a new kind of asset ships only if somebody remembers to name it there. The
 * failure is quiet: the page still loads, the file is simply a 404, and a missing
 * icon is exactly what the reader this page exists for cannot notice.
 *
 * Both sides are derived from what exists — the references out of the document, the
 * published paths out of the workflow — so this keeps working when the next asset is
 * added instead of being a third list to remember.
 */
const path = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const html = readFileSync(path('../web/index.html'), 'utf8');
const workflow = readFileSync(path('../.github/workflows/pages.yml'), 'utf8');

/**
 * Every subresource the document names, from wherever it names it: `href`, `src`,
 * and `url()` inside the inline stylesheet — the fonts are only reachable through
 * that last one.
 *
 * The manifests are read as well as the document, and both halves of that are needed.
 * An icon can be named by a manifest and by nothing else, so a sweep of the document
 * never sees it. And the manifest for a language that was not served is named by no
 * tag at all — it comes into force when she uses the language control, which makes it
 * invisible here and perfectly visible to her.
 */
const references = (): string[] => {
  const found = new Set<string>();

  const patterns = [
    /(?:href|src)="([^"]+)"/g,
    /url\('([^']+)'\)/g,
    /url\("([^"]+)"\)/g,
    /url\(([^'")]+)\)/g,
  ];

  const add = (reference: string): void => {
    // Absolute addresses belong to the canonical and preview tags; a fragment is
    // the skip link. Neither is a file anybody has to publish.
    if (/^(?:https?:|mailto:|data:|#)/.test(reference)) {
      return;
    }

    found.add(reference.replace(/^\.\//, ''));
  };

  for (const pattern of patterns) {
    for (const [, reference] of html.matchAll(pattern)) {
      if (reference !== undefined) {
        add(reference);
      }
    }
  }

  for (const language of SUPPORTED_LANGUAGES) {
    const address = manifestAddress(language);
    add(address);

    const manifest = readFileSync(path(`../web/${address}`), 'utf8');
    for (const { src } of (JSON.parse(manifest) as { icons?: { src: string }[] }).icons ?? []) {
      add(src);
    }
  }

  return [...found].sort();
};

const indentation = (line: string): number => (/^ */.exec(line)?.[0] ?? '').length;

/**
 * The body of the assemble step's script, read the way YAML reads a block scalar: it
 * runs to the first non-empty line indented less than the block itself.
 *
 * Line by line rather than by one regular expression, because the obvious expression
 * ends the capture at the first blank line — and a blank line inside a shell script is
 * a comment, not a terminator. Grouping the copies for readability truncated the list
 * silently, and the suite then reported a correct deploy as a broken one, which sends
 * whoever reads it to fix the wrong file.
 */
const script = (): string[] => {
  const lines = workflow.split('\n');
  const step = lines.findIndex((line) => line.includes('- name: Assemble the site'));
  assert.ok(step !== -1, 'the assemble step is where the copies live');

  const opens = lines.findIndex((line, at) => at > step && /^\s+run: \|/.test(line));
  assert.ok(opens !== -1, 'the step runs a script');

  const body = lines.slice(opens + 1);
  const margin = indentation(body.find((line) => line.trim() !== '') ?? '');
  const end = body.findIndex((line) => line.trim() !== '' && indentation(line) < margin);

  return end === -1 ? body : body.slice(0, end);
};

/**
 * What the deploy would put on the published site, read out of the `cp` lines of the
 * assemble step. A `cp -R web/fonts _site/fonts` publishes a directory, so anything
 * beneath it counts as published; a plain `cp web/index.html _site/` publishes one
 * file.
 *
 * Parsed once at load, like the two files above: it was read again for every
 * reference, which re-ran the whole sweep once per asset checked.
 */
const published = (): { files: Set<string>; directories: Set<string> } => {
  const files = new Set<string>();
  const directories = new Set<string>();

  for (const line of script()) {
    const copy = /^\s*cp\s+(-R\s+)?(\S+)\s+_site\/(\S*)\s*$/.exec(line);
    if (copy === null) {
      continue;
    }

    const [, recursive, source, destination] = copy;

    // `cp web/index.html _site/` names no destination, so the published name is the
    // source's own basename.
    const name =
      destination === undefined || destination === ''
        ? ((source ?? '').split('/').pop() ?? '')
        : destination;

    if (recursive === undefined) {
      files.add(name);
      continue;
    }

    directories.add(name.replace(/\/$/, ''));
  }

  return { files, directories };
};

const site = published();

const isPublished = (reference: string): boolean => {
  if (site.files.has(reference)) {
    return true;
  }

  return [...site.directories].some((directory) => reference.startsWith(`${directory}/`));
};

test('the document references something to check', () => {
  assert.ok(references().length > 0);
});

test('the whole copy list is read, blank lines and all', () => {
  // The guard below can only be as good as this parse: a copy it fails to see reads
  // exactly like a copy nobody wrote, and the failure it produces points at the
  // deploy rather than at the parser that misread it.
  //
  // Counted against the file rather than against a number written here, so adding a
  // copy does not fail this on its way to being checked.
  const written = (workflow.match(/^\s*cp\s/gm) ?? []).length;

  assert.equal(
    site.files.size + site.directories.size,
    written,
    'every cp line in the workflow was parsed',
  );
});

test('every file the document references exists in the sources', () => {
  for (const reference of references()) {
    // `dist/` is built rather than committed, so its absence here is a build that has
    // not been run, not a missing file.
    if (reference.startsWith('dist/')) {
      continue;
    }

    assert.ok(
      existsSync(path(`../web/${reference}`)),
      `web/${reference} exists — the document names it`,
    );
  }
});

test('every file the document references would be published', () => {
  for (const reference of references()) {
    assert.ok(
      isPublished(reference),
      `${reference} is named in the assemble step of pages.yml — the deploy copies files, not intentions`,
    );
  }
});

test('a file named only by a manifest is still required to be published', () => {
  // `icons/icon-512.png` is named by the manifests and by no tag in the document. It
  // ships today by the luck of a recursive directory copy; this is what would notice
  // if the next such file landed somewhere the deploy does not reach.
  const named = references();

  assert.ok(named.includes('icons/icon-512.png'), 'the sweep sees what only a manifest names');
  assert.doesNotMatch(html, /icon-512/, 'and the document itself does not name it');
  assert.ok(isPublished('icons/icon-512.png'));
});

test('every language’s manifest would be published', () => {
  // The one for the language that was not served is reached only through the language
  // control, so no sweep of the served document can vouch for it.
  for (const language of SUPPORTED_LANGUAGES) {
    assert.ok(
      isPublished(manifestAddress(language)),
      `${manifestAddress(language)} is named in the assemble step`,
    );
  }
});

test('the recorded host travels with the site', () => {
  // Not referenced from the document, so the reference sweep above cannot catch it.
  assert.ok(published().files.has('CNAME'), 'CNAME is published, keeping the artifact self-describing');
});
