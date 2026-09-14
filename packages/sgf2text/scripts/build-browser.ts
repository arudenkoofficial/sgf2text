import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Builds the browser bundle: the library with its parser's Node-only dependencies
 * stubbed, prefixed by the licence of every package the bundle inlines.
 *
 * `@sabaki/sgf` is CommonJS and requires `fs`, and through `iconv-lite` also `buffer`
 * and `string_decoder`, as soon as it loads. The converter only ever calls
 * `sgf.parse` on a string, which reaches none of them, so each is replaced by an
 * empty module rather than a polyfill. `iconv-lite` and `jschardet` are optional
 * dependencies the parser already requires inside `try`/`catch` with a fallback, so
 * stubbing them takes the path the parser itself provides.
 *
 * The notices are taken from esbuild's own record of what it bundled rather than from
 * a list kept here, so a dependency added later cannot ship without its licence.
 */
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const outfile = join(packageRoot, 'dist/browser/index.js');

const STUBBED = ['fs', 'buffer', 'string_decoder', 'iconv-lite', 'jschardet'];

const result = await build({
  absWorkingDir: packageRoot,
  entryPoints: ['src/index.ts'],
  outfile,
  bundle: true,
  platform: 'browser',
  format: 'esm',
  alias: Object.fromEntries(STUBBED.map((name) => [name, './shims/node-empty.js'])),
  metafile: true,
  write: false,
  logLevel: 'warning',
});

const [bundle] = result.outputFiles;
if (bundle === undefined) {
  throw new Error('esbuild produced no browser bundle');
}

/** Every package under `node_modules` the bundle took code from, with its directory. */
const inlined = new Map<string, string>();

for (const input of Object.keys(result.metafile.inputs)) {
  const at = input.lastIndexOf('node_modules/');
  if (at === -1) {
    continue;
  }

  const [first = '', second = ''] = input.slice(at + 'node_modules/'.length).split('/');
  const name = first.startsWith('@') ? `${first}/${second}` : first;

  inlined.set(name, join(packageRoot, input.slice(0, at), 'node_modules', name));
}

const notice = (name: string, directory: string): string => {
  const file = readdirSync(directory).find((entry) => /^licen[cs]e/i.test(entry));
  if (file === undefined) {
    throw new Error(`${name} is inlined into the browser bundle but ships no licence file`);
  }

  const text = readFileSync(join(directory, file), 'utf8').trimEnd();
  if (text.includes('*/')) {
    throw new Error(`The licence of ${name} would close the comment carrying it`);
  }

  // Licences are often written with Windows line endings, all three bundled today
  // among them, and a carriage return has no business inside the shipped file.
  const lines = text.split(/\r?\n/).map((line) => (line === '' ? ' *' : ` * ${line}`));

  return [`/*! ${name}`, ' *', ...lines, ' */'].join('\n');
};

const notices = [...inlined.keys()]
  .sort()
  .map((name) => notice(name, inlined.get(name) ?? ''));

mkdirSync(dirname(outfile), { recursive: true });
writeFileSync(outfile, `${notices.join('\n')}\n${bundle.text}`);
