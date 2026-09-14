import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Whether the page is a consumer of the published package, or a neighbour reaching
 * into its sources.
 *
 * The page is the only consumer under this repository's control. If it reached into
 * `packages/sgf2text/src`, the artefact a stranger installs would go untested by
 * anything here, and a broken `exports` map or browser build would ship without a
 * failure. Both questions are put to the tools rather than to the source text:
 * TypeScript says which files the page's program is made of, following type imports
 * as well as values, and esbuild says which files the page's bundle is made of.
 */
const web = fileURLToPath(new URL('..', import.meta.url));
const tsc = fileURLToPath(new URL('../../node_modules/.bin/tsc', import.meta.url));

const LIBRARY_SOURCES = /packages\/sgf2text\/src\//;

test("no file of the page reaches into the library's sources", () => {
  const result = spawnSync(tsc, ['--listFilesOnly', '--project', web], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const reached = result.stdout.split('\n').filter((file) => LIBRARY_SOURCES.test(file));

  assert.deepEqual(reached, []);
});

test("the page's bundle takes the converter from the package's browser build", async () => {
  const result = await build({
    absWorkingDir: web,
    entryPoints: ['main.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    write: false,
    logLevel: 'silent',
  });

  const inputs = Object.keys(result.metafile.inputs);

  assert.deepEqual(inputs.filter((input) => LIBRARY_SOURCES.test(input)), []);
  assert.ok(
    inputs.some((input) => /sgf2text\/dist\/browser\/index\.js$/.test(input)),
    'the browser build is what the page bundles',
  );
});
