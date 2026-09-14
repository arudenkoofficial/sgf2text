import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { sgfToText } from 'sgf2text';

/**
 * Whether the browser build reads a game the way the Node build does.
 *
 * The two builds differ only in how the parser's dependencies are packaged: in the
 * browser, the modules it requires for files and buffers are stubbed. If a stub ever
 * sat on a path a string goes through, a client-side application would read a game
 * differently from a server, and nothing else in the suite would notice.
 *
 * The browser side is reached as a consumer reaches it: bundled for the browser by
 * name, then loaded as the self-contained module the bundler produced.
 */
const here = fileURLToPath(new URL('.', import.meta.url));

const fixture = (name: string): string => readFileSync(`${here}fixtures/${name}`, 'utf8');

const FIXTURES = ['plain.sgf', 'capture-group.sgf', 'handicap4.sgf', 'pass-legacy.sgf', 'problem-attack.sgf'];

const browserBuild = async (): Promise<typeof sgfToText> => {
  const result = await build({
    stdin: { contents: "export { sgfToText } from 'sgf2text';", resolveDir: here, loader: 'js' },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });

  const [bundle] = result.outputFiles;
  assert.ok(bundle, 'the bundler produced a module');

  const loaded = await import(`data:text/javascript;base64,${Buffer.from(bundle.text).toString('base64')}`);

  return loaded.sgfToText;
};

test('the browser build reads every game the way the Node build does', async () => {
  const inBrowser = await browserBuild();

  for (const name of FIXTURES) {
    for (const locale of ['ru', 'en']) {
      const inNode = sgfToText(fixture(name), { locale });

      assert.notEqual(inNode, '', `${name} converts to something`);
      assert.equal(inBrowser(fixture(name), { locale }), inNode, `${name} in ${locale}`);
    }
  }
});
