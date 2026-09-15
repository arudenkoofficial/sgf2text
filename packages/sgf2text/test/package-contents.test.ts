import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * What a consumer actually receives, as npm itself would pack it.
 *
 * Asked of npm rather than read off `files` in the manifest: which files npm adds on
 * its own, such as the manifest, the README and the licence, and which it leaves out
 * are npm's rules, and a test re-implementing them would pass while npm disagreed.
 *
 * Scripts are ignored so that packing never rebuilds `dist` underneath the other
 * test files, which run at the same time and may be reading it.
 */
const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const DESCRIPTION = ['package.json', 'README.md', 'LICENSE'];

const packed = (): string[] => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);

  const [tarball] = JSON.parse(result.stdout) as [{ files: { path: string }[] }];

  return tarball.files.map((file) => file.path);
};

test('the built library, its types and its description are packed', () => {
  const files = packed();

  for (const expected of [...DESCRIPTION, 'dist/index.js', 'dist/index.d.ts']) {
    assert.ok(files.includes(expected), `${expected} is packed`);
  }
});

test('nothing but the built output and its description is packed', () => {
  const stray = packed().filter((path) => !path.startsWith('dist/') && !DESCRIPTION.includes(path));

  assert.deepEqual(stray, []);
});

// A source map leads from built code back to the source it came from, and the
// sources are not published. A map in the tarball would lead a consumer's debugger
// or editor to a file that is not on their disk. This also catches maps left behind
// in `dist` by an earlier build, which a publish from a maintainer's machine would
// otherwise carry along.
test('no source map is packed, since the sources it would lead to are not', () => {
  const maps = packed().filter((path) => path.endsWith('.map'));

  assert.deepEqual(maps, []);
});
