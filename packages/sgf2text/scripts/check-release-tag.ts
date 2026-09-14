import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Refuses a release whose tag does not name the version in `package.json`.
 *
 * The publishing workflow runs this before anything reaches the registry, so a
 * mistyped tag stops the release instead of publishing a version nobody named. A tag
 * may carry a leading `v`, as GitHub's release form suggests, or leave it off.
 */
const manifest = fileURLToPath(new URL('../package.json', import.meta.url));
const { version } = JSON.parse(readFileSync(manifest, 'utf8')) as { version: string };

const tag = process.argv[2] ?? '';
const named = tag.startsWith('v') ? tag.slice(1) : tag;

if (named !== version) {
  process.stderr.write(
    tag === ''
      ? `No release tag was given; package.json is at ${version}.\n`
      : `Release tag ${tag} does not name the version in package.json, which is ${version}.\n`,
  );
  process.exitCode = 1;
}
