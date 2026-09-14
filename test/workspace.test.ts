import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The layout that decides what can reach the registry.
 *
 * `npm publish --dry-run` packs a private package without complaint, so the refusal
 * that `private` buys cannot be exercised short of a real publish. What is asserted
 * here is the marking itself. Take it off the root and a publish run there ships the
 * page and every test; take it off the page and the page can be published on its own.
 */
type Manifest = { name?: string; private?: boolean; workspaces?: string[] };

const manifest = (relative: string): Manifest =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'));

test('the workspace root is private and holds the library and the page', () => {
  const root = manifest('../package.json');

  assert.equal(root.private, true);
  assert.deepEqual([...(root.workspaces ?? [])].sort(), ['packages/sgf2text', 'web']);
});

test('the library is the one package that can be published', () => {
  const library = manifest('../packages/sgf2text/package.json');

  assert.equal(library.name, 'sgf2text');
  assert.notEqual(library.private, true);
});

test('the page cannot be published', () => {
  assert.equal(manifest('../web/package.json').private, true);
});
