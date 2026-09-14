import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Whether the licences of the code the browser build inlines reach the application
 * it ends up in.
 *
 * The browser build copies `@sabaki/sgf`, `@sabaki/go-board` and `doken` into itself,
 * and all three are MIT, which asks that their copyright and permission notice go
 * with every copy. The check is made on what a consumer's bundler produces rather
 * than on the file in `dist`, because that output is the copy that gets shipped: a
 * notice the consumer's bundler strips is a notice nobody receives.
 *
 * The three copyright lines differ by year, so each one names its own package.
 */
const resolveDir = fileURLToPath(new URL('.', import.meta.url));

const COPYRIGHTS = [
  'Copyright (c) 2018-2020 Yichuan Shen', // @sabaki/sgf
  'Copyright (c) 2019 Yichuan Shen', // @sabaki/go-board
  'Copyright (c) 2020 Yichuan Shen', // doken
];

const PERMISSION = 'The above copyright notice and this permission notice shall be included in all';

test("a consumer's browser bundle keeps the licence of every package the build inlines", async () => {
  const result = await build({
    stdin: { contents: "export { sgfToText } from 'sgf2text';", resolveDir, loader: 'js' },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });

  const [bundle] = result.outputFiles;
  assert.ok(bundle, 'the bundler produced a module');

  for (const copyright of COPYRIGHTS) {
    assert.ok(bundle.text.includes(copyright), `${copyright} is kept`);
  }

  assert.ok(bundle.text.split(PERMISSION).length - 1 >= COPYRIGHTS.length, 'each notice keeps its permission text');
});
