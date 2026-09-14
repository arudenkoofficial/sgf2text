import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Whether a client-side project can build against the package at all.
 *
 * The consumer is esbuild bundling for the browser and resolving `sgf2text` by name,
 * as an application's bundler would. The parser underneath is CommonJS and requires
 * `fs`, `iconv-lite` and `jschardet` when it loads, none of which a browser bundle
 * can resolve. Without a browser build of its own the package fails to bundle before
 * a line of it runs, and the failure names modules the consumer never asked for.
 */
const resolveDir = fileURLToPath(new URL('.', import.meta.url));

test('a browser bundle importing the package resolves every module', async () => {
  const unresolved = await build({
    stdin: {
      contents: "import { sgfToText } from 'sgf2text'; export const text = sgfToText('(;GM[1]SZ[9];B[ee])');",
      resolveDir,
      loader: 'js',
    },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  }).then(
    () => [],
    (failure: { errors: { text: string }[] }) => failure.errors.map((error) => error.text),
  );

  assert.deepEqual(unresolved, []);
});
